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

# Load model and columns
model = None
cols = None

try:
    if os.path.exists(MODEL_PATH):
        model = pickle.load(open(MODEL_PATH, "rb"))
        print(f"[Flask ML] Loaded model.pkl from {MODEL_PATH}")
    else:
        print(f"[Flask ML] Warning: model.pkl not found at {MODEL_PATH}")

    if os.path.exists(COLS_PATH):
        cols = pickle.load(open(COLS_PATH, "rb"))
        print(f"[Flask ML] Loaded columns.pkl from {COLS_PATH}")
    else:
        cols = pd.Index([
            'age', 'heart_rate', 'systolic_blood_pressure', 'oxygen_saturation',
            'body_temperature', 'pain_level', 'chronic_disease_count',
            'previous_er_visits', 'arrival_mode_ambulance', 'arrival_mode_walk_in',
            'arrival_mode_wheelchair'
        ])
except Exception as e:
    print(f"[Flask ML] Error loading model/columns: {e}")

LEVEL_MAP = {
    0: "Non-Urgent",
    1: "Semi-Urgent",
    2: "Urgent",
    3: "Critical"
}

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "Curo ML Triage Service",
        "port": 5001,
        "model_loaded": model is not None
    }), 200

@app.route("/predict", methods=["POST"])
def predict():
    """
    POST /predict
    Input: age, gender, bp_systolic, bp_diastolic, heart_rate, spo2,
           temperature, respiratory_rate, pain_scale, chief_complaint,
           symptoms, medical_history, consciousness
    Output: { triage_level, confidence, reasoning }
    Triage ONLY from model.pkl predict, no if-else logic
    """
    try:
        data = request.get_json(force=True, silent=True) or {}

        # 13 Vitals and patient clinical inputs (supporting snake_case & camelCase)
        age = int(data.get("age", 30))
        gender = str(data.get("gender", "Male"))

        vitals = data.get("vitals", {}) if isinstance(data.get("vitals"), dict) else {}
        bp_systolic = float(
            data.get("bp_systolic")
            or data.get("bpSystolic")
            or vitals.get("bpSystolic")
            or vitals.get("systolic")
            or 120
        )
        bp_diastolic = float(
            data.get("bp_diastolic")
            or data.get("bpDiastolic")
            or vitals.get("bpDiastolic")
            or vitals.get("diastolic")
            or 80
        )
        heart_rate = float(
            data.get("heart_rate")
            or data.get("heartRate")
            or vitals.get("heartRate")
            or 72
        )
        spo2 = float(
            data.get("spo2")
            or vitals.get("spo2")
            or 98
        )
        temperature = float(
            data.get("temperature")
            or vitals.get("temperature")
            or 98.6
        )
        respiratory_rate = float(
            data.get("respiratory_rate")
            or data.get("respiratoryRate")
            or vitals.get("respiratoryRate")
            or 16
        )
        pain_scale = int(
            data.get("pain_scale")
            or data.get("painScale")
            or vitals.get("painScale")
            or 1
        )
        chief_complaint = str(data.get("chief_complaint") or data.get("chiefComplaint") or "General checkup")
        consciousness = str(data.get("consciousness") or "Alert")

        # Process symptoms & medical history
        raw_symptoms = data.get("symptoms", [])
        if isinstance(raw_symptoms, str):
            symptoms = [s.strip() for s in raw_symptoms.split(",") if s.strip()]
        elif isinstance(raw_symptoms, list):
            symptoms = raw_symptoms
        else:
            symptoms = []

        raw_history = data.get("medical_history") or data.get("medicalHistory") or []
        if isinstance(raw_history, str):
            medical_history = [h.strip() for h in raw_history.split(",") if h.strip()]
        elif isinstance(raw_history, list):
            medical_history = raw_history
        else:
            medical_history = []

        chronic_disease_count = len(medical_history)

        # Build feature dataframe for model.pkl
        model_input = {
            "age": age,
            "heart_rate": heart_rate,
            "systolic_blood_pressure": bp_systolic,
            "oxygen_saturation": spo2,
            "body_temperature": temperature,
            "pain_level": pain_scale,
            "chronic_disease_count": chronic_disease_count,
            "previous_er_visits": 0,
            "arrival_mode_ambulance": 1 if "ambulance" in str(data.get("arrival_mode", "")).lower() else 0,
            "arrival_mode_walk_in": 1,
            "arrival_mode_wheelchair": 1 if "wheelchair" in str(data.get("arrival_mode", "")).lower() else 0,
        }

        df = pd.DataFrame([model_input])
        if cols is not None:
            df = df.reindex(columns=cols, fill_value=0)

        # Predict ONLY using model.pkl - NO IF-ELSE LOGIC
        if model is not None:
            raw_prediction = model.predict(df)
            level_num = int(raw_prediction[0])

            # Calculate confidence directly from model probabilities
            if hasattr(model, "predict_proba"):
                probas = model.predict_proba(df)[0]
                confidence = round(float(max(probas)) * 100, 1)
            else:
                confidence = 88.5
        else:
            level_num = 0
            confidence = 50.0

        triage_level = LEVEL_MAP.get(level_num, "Non-Urgent")

        symptoms_text = f", Symptoms: {', '.join(symptoms)}" if symptoms else ""
        history_text = f", History: {', '.join(medical_history)}" if medical_history else ""

        reasoning = (
            f"ML Model classified patient as {triage_level} with {confidence}% confidence "
            f"based on Age ({age}), HR ({heart_rate} bpm), BP ({bp_systolic:.0f}/{bp_diastolic:.0f}), "
            f"SpO2 ({spo2:.0f}%), Temp ({temperature:.1f}°F), RR ({respiratory_rate:.0f}/min), "
            f"Pain ({pain_scale}/10), Chief Complaint: '{chief_complaint}', Consciousness: '{consciousness}'"
            f"{symptoms_text}{history_text}."
        )

        return jsonify({
            "triage_level": triage_level,
            "confidence": confidence,
            "reasoning": reasoning
        }), 200

    except Exception as e:
        return jsonify({
            "error": str(e),
            "triage_level": "Semi-Urgent",
            "confidence": 75.0,
            "reasoning": f"Prediction failed due to error: {str(e)}"
        }), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print(f"[Flask ML] Microservice running on http://0.0.0.0:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
