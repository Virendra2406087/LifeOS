import pandas as pd
from api.modelLoader import models

REQUIRED_FIELDS = ["tasks_completed", "tasks_pending", "focus_hours", "breaks", "meetings"]


def predict_productivity(data):
    model = models.get("productivity")
    if model is None:
        raise ValueError("Productivity model is not loaded")

    missing = [f for f in REQUIRED_FIELDS if f not in data]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")

    try:
        row = {f: float(data[f]) for f in REQUIRED_FIELDS}
    except (TypeError, ValueError):
        raise ValueError("All fields must be numeric")

    values = pd.DataFrame([row], columns=REQUIRED_FIELDS)
    prediction = model.predict(values)[0]
    return round(float(prediction), 2)