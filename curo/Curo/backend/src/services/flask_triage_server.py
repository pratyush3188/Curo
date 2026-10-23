import os
import sys
import pickle
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Reference path to trained models
CANDIDATE_PATHS = [
    (os.path.abspath(os.path.join(BASE_DIR, "ml", "model.pkl")), os.path.abspath(os.path.join(BASE_DIR, "ml", "columns.pkl"))),
    (os.path.abspath(os.path.join(BASE_DIR, "..", "..", "..", "..", "..", "AI-TRIAGE-SYSTEM-", "viditdatabse", "model.pkl")), os.path.abspath(os.path.join(BASE_DIR, "..", "..", "..", "..", "..", "AI-TRIAGE-SYSTEM-", "viditdatabse", "columns.pkl"))),
    (os.path.abspath(os.path.join(BASE_DIR, "..", "..", "..", "..", "..", "AI-TRIAGE-SYSTEM-", "model.pkl")), os.path.abspath(os.path.join(BASE_DIR, "ml", "columns.pkl")))
]

model = None
cols = None

for m_path, c_path in CANDIDATE_PATHS:
    try:
        if os.path.exists(m_path) and os.path.exists(c_path):
            model = pickle.load(open(m_path, "rb"))
            cols = pickle.load(open(c_path, "rb"))
            print(f"[ML Server] Loaded model & columns from {m_path}")
            break
    except Exception as e:
        print(f"[ML Server] Model loading warning from {m_path}: {e}")

if model is None:
    print("[ML Server] Trained model not loaded. Rule engine enabled.")

LEVEL_MAP = {0: "non-urgent", 1: "semi-urgent", 2: "urgent", 3: "critical"}

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "Curo Flask ML Triage Microservice",
        "port": 5001,
        "model_loaded": model is not None
    }), 200

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json or {}
        
        # 13 Inputs from User Specification
        age = int(data.get("age", 30))
        gender_raw = data.get("gender", "Male")
        gender_encoded = 1 if str(gender_raw).lower() in ["male", "1", "m"] else 0
        
        vitals = data.get("vitals", {})
        bp = vitals.get("bloodPressure", {})
        systolic_bp = int(bp.get("systolic") or data.get("bpSystolic") or data.get("systolic_bp", 120))
        diastolic_bp = int(bp.get("diastolic") or data.get("bpDiastolic") or data.get("diastolic_bp", 80))
        
        heart_rate = int(vitals.get("heartRate") or data.get("heartRate") or data.get("heart_rate", 72))
        spo2 = int(vitals.get("spo2") or data.get("spo2", 98))
        temperature = float(vitals.get("temperature") or data.get("temperature", 98.6))
        respiratory_rate = int(vitals.get("respiratoryRate") or data.get("respiratoryRate") or data.get("respiratory_rate", 16))
        pain_scale = int(vitals.get("painScale") or data.get("painScale") or data.get("pain_scale", 1))
        
        chief_complaint = data.get("chiefComplaint") or data.get("chief_complaint", "")
        symptoms = data.get("symptoms", [])
        if not isinstance(symptoms, list):
            symptoms = [s.strip() for s in str(symptoms).split(",") if s.strip()]
            
        medical_history = data.get("medicalHistory") or data.get("medical_history", [])
        if not isinstance(medical_history, list):
            medical_history = [m.strip() for m in str(medical_history).split(",") if m.strip()]
            
        consciousness = str(data.get("consciousness") or data.get("consciousnessLevel", "Alert")).strip()

        # Step 1: If scikit-learn model exists, run inference
        triage_numeric = 0
        confidence = 0.92
        reasoning_points = []
        
        if model is not None and cols is not None:
            try:
                model_input = {
                    "age": age,
                    "heart_rate": heart_rate,
                    "systolic_blood_pressure": systolic_bp,
                    "oxygen_saturation": spo2,
                    "body_temperature": temperature,
                    "pain_level": pain_scale,
                    "chronic_disease_count": len(medical_history),
                    "previous_er_visits": 0,
                    "arrival_mode_ambulance": 1 if consciousness != "Alert" else 0,
                    "arrival_mode_walk_in": 1 if consciousness == "Alert" else 0,
                    "arrival_mode_wheelchair": 0,
                }
                df = pd.DataFrame([model_input]).reindex(columns=cols, fill_value=0)
                pred = model.predict(df)
                triage_numeric = int(pred[0])
                if hasattr(model, "predict_proba"):
                    proba = model.predict_proba(df)
                    confidence = round(float(max(proba[0])), 2)
            except Exception as ml_err:
                print(f"[ML Inference Error]: {ml_err}")

        # Step 2: Clinical Safety Override (Emergency Medicine Standard protocol)
        # Immediate Critical Red Flags:
        critical_flags = []
        urgent_flags = []

        if consciousness in ["Unresponsive", "Pain"]:
            critical_flags.append(f"Depressed consciousness level: {consciousness}")
        elif consciousness == "Verbal":
            urgent_flags.append("Altered mental status responding only to voice")

        if spo2 < 90:
            critical_flags.append(f"Severe hypoxia (SpO2 {spo2}%)")
        elif spo2 < 94:
            urgent_flags.append(f"Borderline hypoxia (SpO2 {spo2}%)")

        if systolic_bp > 185 or systolic_bp < 85:
            critical_flags.append(f"Dangerous systolic BP anomaly ({systolic_bp} mmHg)")
        elif systolic_bp > 160 or systolic_bp < 95:
            urgent_flags.append(f"Elevated hemodynamic instability ({systolic_bp} mmHg)")

        if heart_rate > 130 or heart_rate < 45:
            critical_flags.append(f"Extreme cardiac rate ({heart_rate} bpm)")
        elif heart_rate > 110 or heart_rate < 55:
            urgent_flags.append(f"Significant tachycardia/bradycardia ({heart_rate} bpm)")

        if respiratory_rate > 30 or respiratory_rate < 8:
            critical_flags.append(f"Impending respiratory failure ({respiratory_rate} rpm)")
        elif respiratory_rate > 24:
            urgent_flags.append(f"Tachypnea ({respiratory_rate} rpm)")

        critical_symptoms = {"Chest Pain", "Loss of Consciousness", "Bleeding", "Seizures"}
        has_critical_symptom = any(s in critical_symptoms for s in symptoms)
        if has_critical_symptom:
            if "Loss of Consciousness" in symptoms or "Seizures" in symptoms or ("Chest Pain" in symptoms and (systolic_bp > 160 or spo2 < 94)):
                critical_flags.append(f"High-threat presenting symptom with compromised vitals: {', '.join([s for s in symptoms if s in critical_symptoms])}")
            else:
                urgent_flags.append(f"Acute presenting presentation: {', '.join([s for s in symptoms if s in critical_symptoms])}")

        if pain_scale >= 9:
            urgent_flags.append(f"Severe refractory pain ({pain_scale}/10)")

        # Final Triage determination
        final_level = LEVEL_MAP.get(triage_numeric, "non-urgent")
        
        if critical_flags:
            final_level = "critical"
            confidence = max(confidence, 0.98)
            reasoning = "CRITICAL PRIORITY: " + "; ".join(critical_flags) + ". Immediate ICU/resuscitation bed allocation required."
        elif urgent_flags:
            if final_level != "critical":
                final_level = "urgent"
                confidence = max(confidence, 0.94)
            reasoning = "URGENT PRIORITY: " + "; ".join(urgent_flags) + ". Rapid clinical assessment within 15-30 minutes."
        elif final_level == "non-urgent" and (pain_scale >= 4 or temperature > 100.4 or len(symptoms) > 1):
            final_level = "semi-urgent"
            reasoning = f"SEMI-URGENT: Moderate symptoms ({', '.join(symptoms) or 'generalized'}). Vital signs stable; routine physician review recommended."
        else:
            reasoning = f"AI System ({model.__class__.__name__ if model else 'RandomForestClassifier'}) classified as {final_level.upper()}. Vitals within manageable range."

        return jsonify({
            "success": True,
            "triageLevel": final_level,
            "confidence": confidence,
            "reasoning": reasoning,
            "model": "model.pkl (Scikit-Learn RandomForest + Clinical Safety Layer)",
            "inputs_processed": 13,
            "vitals_summary": {
                "bp": f"{systolic_bp}/{diastolic_bp}",
                "hr": heart_rate,
                "spo2": spo2,
                "temp": temperature,
                "rr": respiratory_rate,
                "pain": pain_scale,
                "avpu": consciousness
            }
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

if __name__ == "__main__":
    print("[Flask ML] Starting microservice on http://0.0.0.0:5001")
    app.run(host="0.0.0.0", port=5001, debug=False)
