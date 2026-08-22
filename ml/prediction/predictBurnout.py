import numpy as np
from api.modelLoader import models

REQUIRED_FIELDS = [
    "tasks_completed", "tasks_pending", "focus_hours",
    "break_hours", "sleep_hours", "stress_level",
]


def predict_burnout(data):
    model = models.get("burnout")
    if model is None:
        raise ValueError("Burnout model is not loaded")

    missing = [f for f in REQUIRED_FIELDS if f not in data]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")

    try:
        values = np.array([[float(data[f]) for f in REQUIRED_FIELDS]])
    except (TypeError, ValueError):
        raise ValueError("All fields must be numeric")

    prediction = model.predict(values)[0]
    return round(float(prediction), 2)