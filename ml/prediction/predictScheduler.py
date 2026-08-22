import pandas as pd
from api.modelLoader import models

FEATURES = ["priority", "energy_level", "deadline_hours", "duration"]


def predict_scheduler(data):
    model = models.get("scheduler")
    if model is None:
        raise ValueError("Scheduler model is not loaded")

    missing = [f for f in FEATURES if f not in data]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")

    try:
        row = {f: float(data[f]) for f in FEATURES}
    except (TypeError, ValueError):
        raise ValueError("All fields must be numeric")

    X = pd.DataFrame([row], columns=FEATURES)
    prediction = model.predict(X)[0]

    best_hour = round(float(prediction))
    return max(0, min(23, best_hour))  # clamp to a valid hour