import pandas as pd
from api.modelLoader import models

FEATURES = ["sleep_hours", "exercise_minutes", "study_hours", "screen_time", "water_intake"]


def predict_habit(data):
    model = models.get("habits")
    if model is None:
        raise ValueError("Habits model is not loaded")

    missing = [f for f in FEATURES if f not in data]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")

    try:
        row = {f: float(data[f]) for f in FEATURES}
    except (TypeError, ValueError):
        raise ValueError("All fields must be numeric")

    X = pd.DataFrame([row], columns=FEATURES)
    prediction = model.predict(X)[0]

    if hasattr(prediction, "item"):
        prediction = prediction.item()

    return prediction