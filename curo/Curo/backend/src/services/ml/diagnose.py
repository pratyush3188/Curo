"""Test adding a patient via the triage API and verify it reaches Google Sheets."""
import requests
import json
import time
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(BASE_DIR, ".env"), override=True)

results = {}

# Step 1: Check health
print("1. Checking API health...")
try:
    r = requests.get("http://127.0.0.1:5000/health", timeout=5)
    health = r.json()
    results["health"] = health
    print(f"   Storage: {health.get('storage')}")
    print(f"   Patients: {health.get('patients_count')}")
except Exception as e:
    results["health_error"] = str(e)
    print(f"   ERROR: {e}")

# Step 2: Add a test patient
print("\n2. Adding test patient via /api/triage...")
test_patient = {
    "name": "GSheets Test Patient",
    "age": 28,
    "gender": "Female",
    "vitals": {
        "bpSystolic": 125,
        "bpDiastolic": 82,
        "heartRate": 78,
        "spo2": 97,
        "temperature": 98.8,
        "respiratoryRate": 16
    },
    "chiefComplaint": "Testing Google Sheets sync",
    "symptoms": ["headache"],
    "painScale": 3,
    "medicalHistory": []
}

try:
    r = requests.post("http://127.0.0.1:5000/api/triage", json=test_patient, timeout=15)
    triage_result = r.json()
    results["triage_response"] = triage_result
    results["triage_status_code"] = r.status_code
    
    patient_id = triage_result.get("patient", {}).get("id", "unknown")
    storage = triage_result.get("storage", "unknown")
    print(f"   Status code: {r.status_code}")
    print(f"   Patient ID: {patient_id}")
    print(f"   Triage level: {triage_result.get('patient', {}).get('triage', {}).get('level', '?')}")
    print(f"   Storage: {storage}")
except Exception as e:
    results["triage_error"] = str(e)
    print(f"   ERROR: {e}")
    patient_id = None

# Step 3: Wait and verify in Google Sheets
if patient_id:
    print(f"\n3. Verifying patient {patient_id} in Google Sheets...")
    time.sleep(3)  # Give time for Sheets to update
    
    try:
        import gspread
        from google.oauth2.service_account import Credentials
        
        SCOPES = ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]
        sa_file = os.path.join(BASE_DIR, "service-account.json")
        creds = Credentials.from_service_account_file(sa_file, scopes=SCOPES)
        gc = gspread.authorize(creds)
        spreadsheet = gc.open_by_key(os.getenv("GOOGLE_SHEET_ID"))
        
        ps = spreadsheet.worksheet("Patients")
        rows = ps.get_all_values()
        
        found = False
        for row in rows:
            if row[0] == patient_id:
                found = True
                results["found_in_sheets"] = True
                results["sheet_row"] = {"id": row[0], "name": row[1], "age": row[2]}
                print(f"   FOUND in Google Sheets!")
                print(f"   ID: {row[0]}, Name: {row[1]}, Age: {row[2]}")
                break
        
        if not found:
            results["found_in_sheets"] = False
            print(f"   NOT FOUND in Google Sheets!")
            print(f"   Sheet has {len(rows)} rows. IDs: {[r[0] for r in rows[1:]]}")
            
    except Exception as e:
        results["verify_error"] = str(e)
        print(f"   Verify error: {e}")

# Step 4: Check db-status endpoint
print("\n4. Checking /api/debug/db-status...")
try:
    r = requests.get("http://127.0.0.1:5000/api/debug/db-status", timeout=10)
    db_status = r.json()
    results["db_status"] = db_status
    print(f"   {json.dumps(db_status, indent=2)}")
except Exception as e:
    results["db_status_error"] = str(e)
    print(f"   ERROR: {e}")

# Save results
with open(os.path.join(BASE_DIR, "test_result.json"), "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print("\n=== TEST COMPLETE ===")
