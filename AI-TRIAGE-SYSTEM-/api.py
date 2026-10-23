import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import pandas as pd
import json
import os
from datetime import datetime
from uuid import uuid4
import random

# Base directory (where api.py lives) for resolving relative paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
from openai import OpenAI
from dotenv import load_dotenv
import threading

# WhatsApp alert feature
try:
    from whatsapp_alert import send_all_alerts
except ImportError as exc:
    send_all_alerts = None
    print(f"[WARN] WhatsApp alerts unavailable: {exc}")

# Load environment variables from .env (explicitly from the viditdatabse directory)
load_dotenv(dotenv_path=os.path.join(BASE_DIR, ".env"), override=True)


app = Flask(__name__)
CORS(app)

# Initialize OpenAI client
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY:
    client = OpenAI(api_key=OPENAI_API_KEY)
    print("[OK] OpenAI API configured successfully")
else:
    client = None
    print("[WARN]  WARNING: OPENAI_API_KEY not found in environment variables")

# Load ML models
model = pickle.load(open(os.path.join(BASE_DIR, "model.pkl"), "rb"))
cols = pickle.load(open(os.path.join(BASE_DIR, "columns.pkl"), "rb"))

# ==================== GOOGLE SHEETS INTEGRATION ====================

USE_GOOGLE_SHEETS = False
patients_sheet = None
alerts_sheet = None

try:
    import gspread
    from google.oauth2.service_account import Credentials

    SCOPES = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
    ]

    GOOGLE_SHEET_ID = os.getenv("GOOGLE_SHEET_ID", "")

    # Support credentials from file or environment variable
    SERVICE_ACCOUNT_FILE = os.getenv(
        "GOOGLE_SERVICE_ACCOUNT_FILE",
        os.path.join(BASE_DIR, "service-account.json"),
    )
    SERVICE_ACCOUNT_JSON = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "")

    creds = None

    if SERVICE_ACCOUNT_JSON:
        # Credentials from env var (for cloud deployment)
        import json as json_mod
        creds_info = json_mod.loads(SERVICE_ACCOUNT_JSON)
        creds = Credentials.from_service_account_info(creds_info, scopes=SCOPES)
        print(" Using service account credentials from environment variable")
    elif os.path.exists(SERVICE_ACCOUNT_FILE):
        # Credentials from file (for local development)
        creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
        print(f" Using service account credentials from file: {SERVICE_ACCOUNT_FILE}")

    if creds and GOOGLE_SHEET_ID:
        gc = gspread.authorize(creds)
        spreadsheet = gc.open_by_key(GOOGLE_SHEET_ID)
        print(f"[OK] Connected to Google Sheet: {spreadsheet.title}")

        # Get or create Patients worksheet
        try:
            patients_sheet = spreadsheet.worksheet("Patients")
        except gspread.WorksheetNotFound:
            patients_sheet = spreadsheet.add_worksheet(
                title="Patients", rows=1000, cols=19
            )
            patients_sheet.update(
                range_name="A1",
                values=[
                    [
                        "Patient ID", "Name", "Age", "Gender", "Triage Level", 
                        "Chief Complaint", "Pain Scale", "BP", "HR", "SpO2", 
                        "Temperature", "Respiratory Rate", "Timestamp", 
                        "vitals_json_backup", "symptoms_json_backup", 
                        "medicalHistory_json_backup", "triage_json_backup", "doctorReferral_json_backup", "status"
                    ]
                ],
            )
            print(" Created 'Patients' worksheet with headers")

        # Get or create Alerts worksheet
        try:
            alerts_sheet = spreadsheet.worksheet("Alerts")
        except gspread.WorksheetNotFound:
            alerts_sheet = spreadsheet.add_worksheet(
                title="Alerts", rows=1000, cols=8
            )
            alerts_sheet.update(
                range_name="A1",
                values=[
                    [
                        "id", "patientId", "patientName", "reason",
                        "timestamp", "acknowledged",
                    ]
                ],
            )
            print(" Created 'Alerts' worksheet with headers")

        USE_GOOGLE_SHEETS = True
        print("[OK] Google Sheets integration active  data persists in the cloud")
    else:
        if not GOOGLE_SHEET_ID:
            print("[INFO]  GOOGLE_SHEET_ID not set  using local JSON storage")
        if not creds:
            print("[INFO]  Service account credentials not found  using local JSON storage")

except ImportError:
    print("[INFO]  gspread not installed  using local JSON storage (pip install gspread google-auth)")
except Exception as e:
    print(f"[WARN]  Google Sheets connection failed: {e}")
    print("   Falling back to local JSON storage")


# ==================== DATA STORAGE LAYER ====================

# In-memory cache
patients_db = {}
alerts_db = {}
DATA_FILE = os.path.join(BASE_DIR, "patients_data.json")


def _sheets_row_to_patient(row):
    """Convert a Google Sheets row to a patient dict."""
    if len(row) < 18:
        row.extend([""] * (18 - len(row)))
        
    # Check if this is old format or new format by verifying if the backup JSON exists
    if "{" in row[4] and "}" in row[4]:
        # Old format fallback (vitals_json was in col 4)
        return {
            "id": row[0],
            "name": row[1],
            "age": int(row[2]) if row[2] else 0,
            "gender": row[3],
            "vitals": json.loads(row[4]) if row[4] else {},
            "chiefComplaint": row[5],
            "symptoms": json.loads(row[6]) if row[6] else [],
            "painScale": int(row[7]) if row[7] else 0,
            "medicalHistory": json.loads(row[8]) if row[8] else [],
            "doctorReferral": [],
            "triage": json.loads(row[9]) if row[9] else {},
            "admittedAt": row[10],
            "status": row[11] if len(row)>11 else "Waiting",
        }
    else:
        # New format with requested flat columns + json backups at the end
        return {
            "id": row[0],
            "name": row[1],
            "age": int(row[2]) if row[2] else 0,
            "gender": row[3],
            "chiefComplaint": row[5],
            "painScale": int(row[6]) if row[6] else 0,
            "admittedAt": row[12],
            "vitals": json.loads(row[13]) if row[13] else {},
            "symptoms": json.loads(row[14]) if row[14] else [],
            "medicalHistory": json.loads(row[15]) if row[15] else [],
            "triage": json.loads(row[16]) if row[16] else {},
            "doctorReferral": json.loads(row[17]) if len(row)>17 and row[17] else [],
            "status": row[18] if len(row)>18 else "Waiting",
            "bedNo": row[19] if len(row)>19 else "",
        }


def _patient_to_sheets_row(patient):
    """Convert a patient dict to a Google Sheets row."""
    vitals = patient.get("vitals", {})
    triage = patient.get("triage", {})
    bp = f"{vitals.get('bpSystolic', '')}/{vitals.get('bpDiastolic', '')}"
    
    return [
        patient.get("id", ""),
        patient.get("name", ""),
        str(patient.get("age", 0)),
        patient.get("gender", ""),
        triage.get("level", ""),
        patient.get("chiefComplaint", ""),
        str(patient.get("painScale", 0)),
        bp,
        str(vitals.get("heartRate", "")),
        str(vitals.get("spo2", "")),
        str(vitals.get("temperature", "")),
        str(vitals.get("respiratoryRate", "")),
        patient.get("admittedAt", ""),
        json.dumps(vitals),
        json.dumps(patient.get("symptoms", [])),
        json.dumps(patient.get("medicalHistory", [])),
        json.dumps(triage),
        json.dumps(patient.get("doctorReferral", [])),
        patient.get("status", ""),
        patient.get("bedNo", ""),
    ]


def _sheets_row_to_alert(row):
    """Convert a Google Sheets row to an alert dict."""
    if len(row) < 6:
        row.extend([""] * (6 - len(row)))
    return {
        "id": row[0],
        "patientId": row[1],
        "patientName": row[2],
        "reason": row[3],
        "timestamp": row[4],
        "acknowledged": row[5].lower() == "true" if row[5] else False,
    }


def _alert_to_sheets_row(alert):
    """Convert an alert dict to a Google Sheets row."""
    return [
        alert.get("id", ""),
        alert.get("patientId", ""),
        alert.get("patientName", ""),
        alert.get("reason", ""),
        alert.get("timestamp", ""),
        str(alert.get("acknowledged", False)),
    ]


def load_data():
    """Load data from Google Sheets (primary) or local JSON (fallback)."""
    global patients_db, alerts_db

    if USE_GOOGLE_SHEETS:
        try:
            # Load patients from Google Sheets
            rows = patients_sheet.get_all_values()
            patients_db = {}
            for row in rows[1:]:  # Skip header
                if row[0]:  # Has an ID
                    patient = _sheets_row_to_patient(row)
                    patients_db[patient["id"]] = patient

            # Load alerts from Google Sheets
            rows = alerts_sheet.get_all_values()
            alerts_db = {}
            for row in rows[1:]:  # Skip header
                if row[0]:  # Has an ID
                    alert = _sheets_row_to_alert(row)
                    alerts_db[alert["id"]] = alert

            print(f"[OK] Loaded {len(patients_db)} patients, {len(alerts_db)} alerts from Google Sheets")
        except Exception as e:
            print(f"[WARN] Error loading from Google Sheets: {e}")
            _load_from_json()
    else:
        _load_from_json()


def _load_from_json():
    """Load data from local JSON file."""
    global patients_db, alerts_db
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r") as f:
                data = json.load(f)
                patients_db = data.get("patients", {})
                alerts_db = data.get("alerts", {})
        except Exception:
            patients_db = {}
            alerts_db = {}
    else:
        patients_db = {}
        alerts_db = {}


def save_data():
    """Save data to Google Sheets and/or local JSON."""
    # Always save to local JSON as backup
    _save_to_json()

    if USE_GOOGLE_SHEETS:
        try:
            _sync_to_sheets()
        except Exception as e:
            print(f"[WARN]  Error syncing to Google Sheets: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()


def _save_to_json():
    """Save data to local JSON file."""
    with open(DATA_FILE, "w") as f:
        json.dump({"patients": patients_db, "alerts": alerts_db}, f, indent=2)


def _sync_to_sheets():
    """Sync in-memory data to Google Sheets."""
    import time

    # Rebuild patients sheet
    patient_rows = [
        [
            "Patient ID", "Name", "Age", "Gender", "Triage Level", 
            "Chief Complaint", "Pain Scale", "BP", "HR", "SpO2", 
            "Temperature", "Respiratory Rate", "Timestamp", 
            "vitals_json_backup", "symptoms_json_backup", 
            "medicalHistory_json_backup", "triage_json_backup", "doctorReferral_json_backup", "status", "bedNo"
        ]
    ]
    for patient in patients_db.values():
        patient_rows.append(_patient_to_sheets_row(patient))

    patients_sheet.clear()
    time.sleep(1)  # Avoid Google Sheets rate limit
    if patient_rows:
        patients_sheet.update(range_name="A1", values=patient_rows)

    time.sleep(1)  # Avoid Google Sheets rate limit

    # Rebuild alerts sheet
    alert_rows = [
        [
            "id", "patientId", "patientName", "reason",
            "timestamp", "acknowledged",
        ]
    ]
    for alert in alerts_db.values():
        alert_rows.append(_alert_to_sheets_row(alert))

    alerts_sheet.clear()
    time.sleep(1)  # Avoid Google Sheets rate limit
    if alert_rows:
        alerts_sheet.update(range_name="A1", values=alert_rows)

    print(f"[CLOUD]  Synced {len(patients_db)} patients, {len(alerts_db)} alerts to Google Sheets")


def save_patient_to_sheets(patient):
    """Append a single patient to Google Sheets (more efficient than full sync)."""
    if USE_GOOGLE_SHEETS:
        try:
            row = _patient_to_sheets_row(patient)
            print(f"[SHEETS] Appending patient {patient.get('id', '?')} ({patient.get('name', '?')}) to Sheets...")
            patients_sheet.append_row(
                row,
                value_input_option="RAW",
            )
            print(f"[SHEETS] Patient {patient.get('id', '?')} saved to Google Sheets successfully")
        except Exception as e:
            print(f"[WARN]  Error appending patient to Sheets: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
    else:
        print(f"[INFO] Google Sheets disabled - patient saved to local JSON only")


def save_alert_to_sheets(alert):
    """Append a single alert to Google Sheets."""
    if USE_GOOGLE_SHEETS:
        try:
            row = _alert_to_sheets_row(alert)
            print(f"[SHEETS] Appending alert {alert.get('id', '?')} to Sheets...")
            alerts_sheet.append_row(
                row,
                value_input_option="RAW",
            )
            print(f"[SHEETS] Alert {alert.get('id', '?')} saved to Google Sheets successfully")
        except Exception as e:
            print(f"[WARN]  Error appending alert to Sheets: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
    else:
        print(f"[INFO] Google Sheets disabled - alert saved to local JSON only")


# ==================== ML & AI FUNCTIONS ====================

def run_ml_prediction(vitals, patient_data=None):
    """
    Run your custom-trained ML model on patient vitals
    Uses model.pkl trained on your personalized dataset
    """
    try:
        model_input = {
            "age": patient_data.get("age", 30) if patient_data else 30,
            "heart_rate": vitals.get("heartRate", 72),
            "systolic_blood_pressure": vitals.get("bpSystolic", 120),
            "oxygen_saturation": vitals.get("spo2", 98),
            "body_temperature": vitals.get("temperature", 98.6),
            "pain_level": patient_data.get("painScale", 1) if patient_data else 1,
            "chronic_disease_count": len(patient_data.get("medicalHistory", [])) if patient_data else 0,
            "previous_er_visits": 0,
            "arrival_mode_ambulance": 0,
            "arrival_mode_walk_in": 1,
            "arrival_mode_wheelchair": 0,
        }

        df = pd.DataFrame([model_input])
        df = df.reindex(columns=cols, fill_value=0)
        prediction = model.predict(df)
        triage_level = int(prediction[0])
        triage_level = max(0, min(3, triage_level))

        print(
            f"[OK] ML Prediction: Age {model_input['age']}, HR {model_input['heart_rate']}, "
            f"BP {model_input['systolic_blood_pressure']}/{vitals.get('bpDiastolic', 80)}, "
            f"SpO2 {model_input['oxygen_saturation']}%  Triage Level {triage_level}"
        )
        return triage_level

    except Exception as e:
        print(f"[ERROR] ML Prediction Error: {e}")
        return 0


def get_enhanced_triage_analysis(patient_data, triage_level):
    """Use GPT to generate enhanced clinical reasoning and insights."""
    if not client:
        return None

    try:
        vitals = patient_data.get("vitals", {})
        symptoms = patient_data.get("symptoms", [])
        pain_scale = patient_data.get("painScale", 0)
        age = patient_data.get("age", 0)
        medical_history = patient_data.get("medicalHistory", [])

        symptom_str = ", ".join(symptoms) if symptoms else "None reported"
        history_str = ", ".join(medical_history) if medical_history else "None reported"

        prompt = f"""You are an expert emergency medicine physician. Analyze this patient and provide enhanced clinical insights:

Patient Information:
- Age: {age} years
- Vital Signs: BP {vitals.get('bpSystolic', 120)}/{vitals.get('bpDiastolic', 80)}, HR {vitals.get('heartRate', 72)} bpm, SpO2 {vitals.get('spo2', 98)}%, Temp {vitals.get('temperature', 98.6)}F, RR {vitals.get('respiratoryRate', 16)}/min
- Pain Scale: {pain_scale}/10
- Symptoms: {symptom_str}
- Medical History: {history_str}
- Triage Level: {triage_level}

Provide:
1. Key clinical findings (2-3 sentences)
2. Differential diagnoses to consider
3. Immediate risk factors
4. Additional assessments needed

Format as a structured clinical assessment."""

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400,
        )

        return response.choices[0].message.content
    except Exception as e:
        print(f"Error in enhanced triage analysis: {e}")
        return None


def generate_patient_notes(patient_data, triage_result):
    """Auto-generate detailed clinical notes from patient data."""
    if not client:
        return None

    try:
        vitals = patient_data.get("vitals", {})
        symptoms = patient_data.get("symptoms", [])
        pain_scale = patient_data.get("painScale", 0)

        symptom_str = ", ".join(symptoms) if symptoms else "None"

        prompt = f"""Generate a professional clinical note for an emergency department patient:

Chief Complaint: {patient_data.get('chiefComplaint', 'Not specified')}
Vital Signs: BP {vitals.get('bpSystolic', 120)}/{vitals.get('bpDiastolic', 80)}, HR {vitals.get('heartRate', 72)}, SpO2 {vitals.get('spo2', 98)}%, Temp {vitals.get('temperature', 98.6)}F, RR {vitals.get('respiratoryRate', 16)}/min
Pain Level: {pain_scale}/10
Symptoms: {symptom_str}
Triage Level: {triage_result.get('level', 'SEMI-URGENT')}

Create a structured clinical note with:
- HPI (History of Present Illness)
- Vital Signs Assessment
- Physical Exam Focus
- Preliminary Assessment
Format in medical record style."""

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
        )

        return response.choices[0].message.content
    except Exception as e:
        print(f"Error generating patient notes: {e}")
        return None


def analyze_symptoms_and_actions(symptoms, vitals, age, medical_history):
    """Analyze symptoms and provide detailed recommended actions."""
    if not client:
        return None

    try:
        symptom_str = ", ".join(symptoms) if symptoms else "No specific symptoms"
        history_str = ", ".join(medical_history) if medical_history else "No known medical history"

        prompt = f"""As an emergency medicine expert, provide specific clinical actions and interventions:

Patient Symptoms: {symptom_str}
Age: {age}
Vital Signs: BP {vitals.get('bpSystolic', 120)}/{vitals.get('bpDiastolic', 80)}, HR {vitals.get('heartRate', 72)}, SpO2 {vitals.get('spo2', 98)}%
Medical History: {history_str}

Provide:
1. Initial Stabilization Measures (if needed)
2. Diagnostic Tests (Lab work, imaging)
3. Specialist Consultations to consider
4. Continuous Monitoring Parameters
5. Patient Education/Safety Measures

Be specific and actionable. Format as a numbered checklist."""

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400,
        )

        return response.choices[0].message.content
    except Exception as e:
        print(f"Error analyzing symptoms: {e}")
        return None


def generate_triage_result(vitals, symptoms, pain_scale, age, medical_history, ml_level):
    """Generate a full triage result using the trained ML model."""
    level_map = {0: "NON-URGENT", 1: "SEMI-URGENT", 2: "URGENT", 3: "CRITICAL"}
    level = level_map.get(ml_level, "NON-URGENT")

    reasoning = [
        f"AI System classified patient as {level} (Priority {ml_level}/3)",
        f"Input features  Age: {age}, HR: {vitals.get('heartRate', 'N/A')}, "
        f"BP: {vitals.get('bpSystolic', 'N/A')}/{vitals.get('bpDiastolic', 'N/A')}, "
        f"SpO2: {vitals.get('spo2', 'N/A')}%, Temp: {vitals.get('temperature', 'N/A')}F, "
        f"Pain: {pain_scale}/10",
    ]

    if isinstance(symptoms, list) and symptoms:
        reasoning.append(f"Reported symptoms: {', '.join(symptoms)}")

    if isinstance(medical_history, list) and medical_history:
        reasoning.append(f"Medical history: {', '.join(medical_history)}")

    # Calculate real confidence from model probability if available
    try:
        prob_input = {
            "age": age,
            "heart_rate": vitals.get("heartRate", 72),
            "systolic_blood_pressure": vitals.get("bpSystolic", 120),
            "oxygen_saturation": vitals.get("spo2", 98),
            "body_temperature": vitals.get("temperature", 98.6),
            "pain_level": pain_scale,
            "chronic_disease_count": len(medical_history) if isinstance(medical_history, list) else 0,
            "previous_er_visits": 0,
            "arrival_mode_ambulance": 0,
            "arrival_mode_walk_in": 1,
            "arrival_mode_wheelchair": 0,
        }
        prob_df = pd.DataFrame([prob_input]).reindex(columns=cols, fill_value=0)
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(prob_df)
            confidence = round(float(max(proba[0])) * 100, 1)
        else:
            confidence = 85  # Default for models without predict_proba
    except Exception:
        confidence = 85

    wait_times = {
        "CRITICAL": "13-30 mins",
        "URGENT": "13-30 mins",
        "SEMI-URGENT": "30 mins",
        "NON-URGENT": "30 mins",
    }

    return {
        "level": level,
        "confidence": confidence,
        "reasoning": reasoning,
        "actions": [],
        "waitTime": wait_times.get(level, "1-2 hours"),
    }


# Load data on startup and sync local data to Sheets if needed
def _startup_sync():
    """On startup, merge local JSON data with Google Sheets."""
    global patients_db, alerts_db

    # First load from local JSON to get any offline data
    local_patients = {}
    local_alerts = {}
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r") as f:
                data = json.load(f)
                local_patients = data.get("patients", {})
                local_alerts = data.get("alerts", {})
            print(f"[STARTUP] Local JSON: {len(local_patients)} patients, {len(local_alerts)} alerts")
        except Exception as e:
            print(f"[STARTUP] Error reading local JSON: {e}")

    # Then load from Google Sheets
    load_data()
    print(f"[STARTUP] After load_data: {len(patients_db)} patients, {len(alerts_db)} alerts")
    print(f"[STARTUP] USE_GOOGLE_SHEETS = {USE_GOOGLE_SHEETS}")

    # Merge: add any local-only records to the in-memory DB
    merged_count = 0
    for pid, patient in local_patients.items():
        if pid not in patients_db:
            patients_db[pid] = patient
            merged_count += 1
    for aid, alert in local_alerts.items():
        if aid not in alerts_db:
            alerts_db[aid] = alert

    if merged_count > 0:
        print(f"[STARTUP] Merged {merged_count} local-only patients into database")

    # If Sheets is connected, do a full sync to push everything up
    if USE_GOOGLE_SHEETS and (merged_count > 0 or len(patients_db) > 0):
        try:
            _sync_to_sheets()
            print(f"[STARTUP] Full sync to Google Sheets complete")
        except Exception as e:
            print(f"[STARTUP] Sync to Sheets failed: {type(e).__name__}: {e}")

    # Bed No Assignment for Mock Data
    occupied_beds = {p.get("bedNo") for p in patients_db.values() if p.get("bedNo")}
    all_beds = {str(i) for i in range(1, 21)}
    
    for pid, p in patients_db.items():
        if not p.get("bedNo"):
            available_beds = list(all_beds - occupied_beds)
            if available_beds:
                assigned = random.choice(available_beds)
                p["bedNo"] = assigned
                occupied_beds.add(assigned)

    # Always save local backup
    _save_to_json()
    print(f"[STARTUP] Ready with {len(patients_db)} patients, {len(alerts_db)} alerts")


_startup_sync()


# ==================== HEALTH CHECK ====================
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "viditdatabase-api",
        "storage": "Google Sheets" if USE_GOOGLE_SHEETS else "Local JSON",
        "patients_count": len(patients_db),
        "alerts_count": len(alerts_db),
    }), 200


@app.route("/api/debug/db-status", methods=["GET"])
def db_status():
    """Debug endpoint: shows database connection status and record counts."""
    sheets_info = {}
    if USE_GOOGLE_SHEETS:
        try:
            p_rows = patients_sheet.get_all_values()
            a_rows = alerts_sheet.get_all_values()
            sheets_info = {
                "connected": True,
                "patients_in_sheets": len(p_rows) - 1,  # minus header
                "alerts_in_sheets": len(a_rows) - 1,
            }
        except Exception as e:
            sheets_info = {"connected": False, "error": str(e)}
    else:
        sheets_info = {"connected": False, "reason": "USE_GOOGLE_SHEETS is False"}

    return jsonify({
        "google_sheets": sheets_info,
        "in_memory": {
            "patients": len(patients_db),
            "alerts": len(alerts_db),
        },
        "local_json_exists": os.path.exists(DATA_FILE),
    }), 200


# ==================== PATIENTS ENDPOINTS ====================
@app.route("/api/patients", methods=["GET"])
def get_patients():
    """Get all patients and apply time-based automatic status routing"""
    changed = False
    from datetime import datetime
    for p in patients_db.values():
        if p.get("status") == "Waiting" and "admittedAt" in p:
            try:
                admitted = datetime.fromisoformat(p["admittedAt"])
                diff = (datetime.now() - admitted).total_seconds() / 60
                t_level = p.get("triage", {}).get("level", "")
                if t_level in ("CRITICAL", "URGENT") and diff >= 13:
                    p["status"] = "Emergency"
                    changed = True
                elif t_level in ("SEMI-URGENT", "NON-URGENT") and diff >= 30:
                    p["status"] = "Health Care"
                    changed = True
            except Exception:
                pass
                
        # Dynamically scrub legacy 'RandomForest' string from old DB entries
        if "triage" in p and "reasoning" in p["triage"]:
            for i, r in enumerate(p["triage"]["reasoning"]):
                if "RandomForest" in r:
                    p["triage"]["reasoning"][i] = r.replace("ML Model (RandomForest) classified", "AI System classified").replace("(level ", "(Priority ")
                    changed = True
    
    if changed:
        save_data()
        
    patients_list = list(patients_db.values())
    return jsonify(patients_list), 200


@app.route("/api/patients", methods=["DELETE"])
def clear_all_patients():
    """Clear all patients and alerts."""
    global patients_db, alerts_db
    patients_db.clear()
    alerts_db.clear()
    save_data()
    return jsonify({"success": True, "message": "All patients cleared."}), 200


@app.route("/api/patients/<patient_id>", methods=["GET"])
def get_patient(patient_id):
    """Get specific patient"""
    if patient_id in patients_db:
        p = patients_db[patient_id]
        if "triage" in p and "reasoning" in p["triage"]:
            for i, r in enumerate(p["triage"]["reasoning"]):
                if "RandomForest" in r:
                    p["triage"]["reasoning"][i] = r.replace("ML Model (RandomForest) classified", "AI System classified").replace("(level ", "(Priority ")
                    save_data()
        return jsonify(p), 200
    return jsonify({"error": "Patient not found"}), 404


# ==================== TRIAGE ENDPOINT ====================
@app.route("/api/triage", methods=["POST"])
def add_patient_triage():
    """Add patient and run triage using the trained ML model"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        patient_id = str(uuid4())[:8]

        # Validate required fields
        name = data.get("name", "").strip()
        if not name:
            return jsonify({"error": "Patient name is required"}), 400

        vitals = data.get("vitals", {})
        symptoms = data.get("symptoms", [])
        pain_scale = data.get("painScale", 1)
        age = data.get("age", 0)
        medical_history = data.get("medicalHistory", [])
        doctor_referral = data.get("doctorReferral", [])

        # Validate vitals ranges
        if vitals:
            hr = vitals.get("heartRate", 72)
            if not (20 <= hr <= 300):
                vitals["heartRate"] = max(20, min(300, hr))
            spo2 = vitals.get("spo2", 98)
            if not (0 <= spo2 <= 100):
                vitals["spo2"] = max(0, min(100, spo2))
            temp = vitals.get("temperature", 98.6)
            if not (85 <= temp <= 115):
                vitals["temperature"] = max(85, min(115, temp))

        print(f"\n{'='*50}")
        print(f"[TRIAGE] Processing patient: {name} (age {age})")
        print(f"[TRIAGE] Google Sheets enabled: {USE_GOOGLE_SHEETS}")

        ml_level = run_ml_prediction(vitals, data)

        triage = generate_triage_result(
            vitals, symptoms, pain_scale, age, medical_history, ml_level
        )

        status_val = "Waiting"

        patient = {
            "id": patient_id,
            "name": name,
            "age": age,
            "gender": data.get("gender", ""),
            "vitals": {
                "bpSystolic": vitals.get("bpSystolic", 120),
                "bpDiastolic": vitals.get("bpDiastolic", 80),
                "heartRate": vitals.get("heartRate", 72),
                "spo2": vitals.get("spo2", 98),
                "temperature": vitals.get("temperature", 98.6),
                "respiratoryRate": vitals.get("respiratoryRate", 16),
            },
            "chiefComplaint": data.get("chiefComplaint", ""),
            "symptoms": symptoms,
            "painScale": pain_scale,
            "medicalHistory": medical_history,
            "doctorReferral": doctor_referral,
            "triage": triage,
            "admittedAt": datetime.now().isoformat(),
            "status": status_val,
            "bedNo": str(data.get("bedNo", "")),
        }

        patients_db[patient_id] = patient
        
        # ── Start WhatsApp background thread immediately for instant alerts ──
        if send_all_alerts:
            threading.Thread(target=send_all_alerts, args=(patient,), daemon=True).start()
        
        save_patient_to_sheets(patient)

        # Create alert if critical or urgent
        if triage["level"] in ("CRITICAL", "URGENT"):
            alert = {
                "id": str(uuid4())[:8],
                "patientId": patient_id,
                "patientName": patient["name"],
                "reason": f"{triage['level']} - {', '.join(triage['reasoning'][:2])}",
                "timestamp": datetime.now().isoformat(),
                "acknowledged": False,
            }
            alerts_db[alert["id"]] = alert
            save_alert_to_sheets(alert)

        # Only save back up to local JSON instead of full resync 
        _save_to_json()

        print(f"[TRIAGE] Patient {patient_id} triaged as {triage['level']}")
        print(f"[TRIAGE] Saved to: {'Google Sheets + ' if USE_GOOGLE_SHEETS else ''}Local JSON")
        print(f"{'='*50}\n")

        return jsonify({
            "success": True,
            "patient": patient,
            "message": f"Patient triaged as {triage['level']}",
            "storage": "Google Sheets" if USE_GOOGLE_SHEETS else "Local JSON",
        }), 201

    except Exception as e:
        print(f"[ERROR] Triage error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 400


@app.route("/api/patients/<patient_id>/status", methods=["PUT"])
def update_patient_status(patient_id):
    """Manually update a patient's status"""
    if patient_id in patients_db:
        data = request.json
        if "status" in data:
            patients_db[patient_id]["status"] = data["status"]
            save_data()
            return jsonify({"success": True}), 200
        return jsonify({"error": "No status provided"}), 400
    return jsonify({"error": "Patient not found"}), 404


# ==================== ALERTS ENDPOINTS ====================
@app.route("/api/alerts", methods=["GET"])
def get_alerts():
    """Get all unacknowledged alerts"""
    alerts_list = [a for a in alerts_db.values() if not a.get("acknowledged", False)]
    return jsonify(alerts_list), 200


@app.route("/api/alerts/<alert_id>/acknowledge", methods=["POST"])
def acknowledge_alert(alert_id):
    """Acknowledge an alert"""
    if alert_id in alerts_db:
        alerts_db[alert_id]["acknowledged"] = True
        save_data()
        return jsonify({"success": True}), 200
    return jsonify({"error": "Alert not found"}), 404


# ==================== STATS ENDPOINT ====================
@app.route("/api/stats", methods=["GET"])
def get_stats():
    """Get system statistics"""
    total = len(patients_db)

    counts = {"CRITICAL": 0, "URGENT": 0, "SEMI-URGENT": 0, "NON-URGENT": 0}
    total_wait_mins = 0
    waiting_count = 0

    for patient in patients_db.values():
        triage = patient.get("triage", {})
        level = triage.get("level", "NON-URGENT")
        if level in counts:
            counts[level] += 1

        if patient.get("status") == "Waiting":
            admitted = patient.get("admittedAt", "")
            if admitted:
                try:
                    diff = (datetime.now() - datetime.fromisoformat(admitted)).total_seconds() / 60
                    total_wait_mins += diff
                    waiting_count += 1
                except Exception:
                    pass

    avg_wait = f"{int(total_wait_mins / waiting_count)} mins" if waiting_count > 0 else "0 mins"

    return jsonify({
        "total": total,
        "counts": counts,
        "avgWait": avg_wait,
    }), 200


# ==================== ML PREDICTION ENDPOINT ====================
@app.route("/predict", methods=["POST"])
def predict():
    """Direct ML prediction endpoint"""
    try:
        data = request.json
        df = pd.DataFrame([data])
        df = pd.get_dummies(df)
        df = df.reindex(columns=cols, fill_value=0)
        prediction = model.predict(df)
        return jsonify({"prediction": int(prediction[0])}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ==================== AI-POWERED ENDPOINTS ====================

@app.route("/api/ai/enhanced-analysis", methods=["POST"])
def enhanced_analysis():
    """Enhanced Triage Analysis using GPT"""
    try:
        data = request.json
        patient_data = data.get("patientData")
        triage_level = data.get("triageLevel", "SEMI-URGENT")

        if not patient_data:
            return jsonify({"error": "patientData required"}), 400

        if not client:
            return jsonify({"error": "OpenAI API not configured"}), 503

        analysis = get_enhanced_triage_analysis(patient_data, triage_level)

        return jsonify({"success": True, "analysis": analysis}), 200
    except Exception as e:
        print(f"Error in enhanced analysis: {e}")
        return jsonify({"error": str(e)}), 400


@app.route("/api/ai/generate-notes", methods=["POST"])
def generate_notes():
    """Auto-generate Clinical Notes"""
    try:
        data = request.json
        patient_data = data.get("patientData")
        triage_result = data.get("triageResult")

        if not patient_data or not triage_result:
            return jsonify({"error": "patientData and triageResult required"}), 400

        if not client:
            return jsonify({"error": "OpenAI API not configured"}), 503

        notes = generate_patient_notes(patient_data, triage_result)

        return jsonify({"success": True, "notes": notes}), 200
    except Exception as e:
        print(f"Error generating notes: {e}")
        return jsonify({"error": str(e)}), 400


@app.route("/api/ai/symptom-analysis", methods=["POST"])
def symptom_analysis():
    """Symptom Analysis and Recommended Actions"""
    try:
        data = request.json
        symptoms = data.get("symptoms", [])
        vitals = data.get("vitals", {})
        age = data.get("age", 0)
        medical_history = data.get("medicalHistory", [])

        if not client:
            return jsonify({"error": "OpenAI API not configured"}), 503

        actions = analyze_symptoms_and_actions(symptoms, vitals, age, medical_history)

        return jsonify({"success": True, "recommendations": actions}), 200
    except Exception as e:
        print(f"Error in symptom analysis: {e}")
        return jsonify({"error": str(e)}), 400


@app.route("/api/ai/status", methods=["GET"])
def ai_status():
    """Check if OpenAI API is configured and available"""
    if client:
        return jsonify({
            "available": True,
            "service": "OpenAI GPT-4",
            "features": [
                "Enhanced Triage Analysis",
                "Patient Notes Generation",
                "Symptom Analysis",
            ],
        }), 200
    else:
        return jsonify({
            "available": False,
            "message": "OpenAI API key not configured",
        }), 503


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
