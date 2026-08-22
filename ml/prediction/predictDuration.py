import pandas as pd
from api.modelLoader import models

FEATURES = ["importance", "task_length", "category", "deadline_hours"]


def predict_duration(data):
    model = models.get("duration")
    if model is None:
        raise ValueError("Duration model is not loaded")

    missing = [f for f in FEATURES if f not in data]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")

    try:
        row = {f: float(data[f]) for f in FEATURES}
    except (TypeError, ValueError):
        raise ValueError("All fields must be numeric")

    X = pd.DataFrame([row], columns=FEATURES)
    prediction = model.predict(X)[0]

    return round(float(prediction), 2)