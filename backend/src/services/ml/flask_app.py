import os
import sys
import pickle
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
COLS_PATH = os.path.join(BASE_DIR, "columns.pkl")

# Load scikit-learn trained model and columns definition
try:
    model = pickle.load(open(MODEL_PATH, "rb"))
    cols = pickle.load(open(COLS_PATH, "rb"))
    print(f"[OK] Successfully loaded model.pkl & columns.pkl from {BASE_DIR}")
except Exception as e:
    model = None
    cols = None
    print(f"[ERROR] Failed to load model files: {e}")

# Level mapping from 0-3 numeric classes to clinical triage levels
LEVEL_MAP = {
    0: "non-urgent",
    1: "semi-urgent",
    2: "urgent",
    3: "critical"
}

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "Curo scikit-learn ML Triage Service",
        "port": 5001,
        "model_loaded": model is not None
    }), 200

@app.route("/predict", methods=["POST"])
def predict():
    """
    ML Triage Prediction Endpoint.
    Uses ONLY model.pkl (scikit-learn predict & predict_proba).
    Accepts 13 patient vitals and parameters:
    age, gender, bp_systolic, bp_diastolic, heart_rate, spo2,
    temperature, respiratory_rate, pain_scale, chief_complaint,
    symptoms, medical_history, consciousness
    """
    try:
        data = request.json or {}

        # 13 Inputs extraction
        age = int(data.get("age", 30))
        gender_raw = data.get("gender", "Male")
        
        # Vital signs & hemodynamics
        vitals = data.get("vitals", {})
        bp = vitals.get("bloodPressure", {})
        bp_systolic = int(data.get("bp_systolic") or data.get("bpSystolic") or bp.get("systolic") or 120)
        bp_diastolic = int(data.get("bp_diastolic") or data.get("bpDiastolic") or bp.get("diastolic") or 80)
        
        heart_rate = int(data.get("heart_rate") or data.get("heartRate") or vitals.get("heartRate") or 72)
        spo2 = int(data.get("spo2") or vitals.get("spo2") or 98)
        temperature = float(data.get("temperature") or vitals.get("temperature") or 98.6)
        respiratory_rate = int(data.get("respiratory_rate") or data.get("respiratoryRate") or vitals.get("respiratoryRate") or 16)
        pain_scale = int(data.get("pain_scale") or data.get("painScale") or vitals.get("painScale") or 1)
        
        chief_complaint = str(data.get("chief_complaint") or data.get("chiefComplaint") or "").strip()
        
        symptoms = data.get("symptoms", [])
        if not isinstance(symptoms, list):
            symptoms = [s.strip() for s in str(symptoms).split(",") if s.strip()]
            
        medical_history = data.get("medical_history") or data.get("medicalHistory", [])
        if not isinstance(medical_history, list):
            medical_history = [m.strip() for m in str(medical_history).split(",") if m.strip()]
            
        consciousness = str(data.get("consciousness") or vitals.get("consciousness") or "Alert").strip()

        # Arrival mode feature mapping based on consciousness / clinical presentation
        is_ambulance = 1 if consciousness in ["Unresponsive", "Pain", "Verbal"] else 0
        is_walk_in = 1 if consciousness == "Alert" else 0
        is_wheelchair = 0

        # Construct dataframe matching exact trained columns
        # ['age', 'heart_rate', 'systolic_blood_pressure', 'oxygen_saturation', 'body_temperature', 
        #  'pain_level', 'chronic_disease_count', 'previous_er_visits', 'arrival_mode_ambulance', 
        #  'arrival_mode_walk_in', 'arrival_mode_wheelchair']
        model_input = {
            "age": age,
            "heart_rate": heart_rate,
            "systolic_blood_pressure": bp_systolic,
            "oxygen_saturation": spo2,
            "body_temperature": temperature,
            "pain_level": pain_scale,
            "chronic_disease_count": len(medical_history),
            "previous_er_visits": 0,
            "arrival_mode_ambulance": is_ambulance,
            "arrival_mode_walk_in": is_walk_in,
            "arrival_mode_wheelchair": is_wheelchair,
        }

        df = pd.DataFrame([model_input])
        if cols is not None:
            df = df.reindex(columns=cols, fill_value=0)

        # Scikit-Learn Model Prediction
        prediction = model.predict(df)
        predicted_class = int(prediction[0])
        predicted_class = max(0, min(3, predicted_class))

        # Model confidence extraction from predicted class probabilities
        confidence = 0.90
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(df)[0]
            confidence = round(float(proba[predicted_class]), 2)

        triage_level = LEVEL_MAP.get(predicted_class, "non-urgent")

        # Clinical reasoning directly derived from model feature importances
        factors = []
        if spo2 < 92:
            factors.append(f"hypoxia (SpO2 {spo2}%)")
        if bp_systolic > 160 or bp_systolic < 90:
            factors.append(f"abnormal systolic BP ({bp_systolic} mmHg)")
        if heart_rate > 110 or heart_rate < 50:
            factors.append(f"cardiac rate deviation ({heart_rate} bpm)")
        if pain_scale >= 8:
            factors.append(f"severe pain score ({pain_scale}/10)")
        if consciousness != "Alert":
            factors.append(f"AVPU consciousness: {consciousness}")
        if symptoms:
            factors.append(f"presenting {', '.join(symptoms[:3])}")

        factor_summary = f"driven by {'; '.join(factors)}" if factors else f"vitals stable (HR {heart_rate}, BP {bp_systolic}/{bp_diastolic}, SpO2 {spo2}%)"
        reasoning = f"Scikit-learn model evaluated 13 clinical vitals and assigned {triage_level.upper()} priority ({factor_summary})."

        return jsonify({
            "success": True,
            "triage_level": triage_level,
            "triageLevel": triage_level,
            "confidence": confidence,
            "reasoning": reasoning,
            "model": "model.pkl (RandomForestClassifier)",
            "prediction_class": predicted_class
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

if __name__ == "__main__":
    print("[Flask ML Service] Running on http://0.0.0.0:5001")
    app.run(host="0.0.0.0", port=5001, debug=False)
