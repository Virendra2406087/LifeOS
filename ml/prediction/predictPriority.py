import pandas as pd
from api.modelLoader import models

FEATURES = ["importance", "deadline_hours", "duration", "category"]


def predict_priority(data):
    model = models.get("priority")
    if model is None:
        raise ValueError("Priority model is not loaded")

    values = data.get("values")
    if not values or not isinstance(values, list):
        raise ValueError("'values' must be a non-empty list")

    if len(values) != len(FEATURES):
        raise ValueError(f"Expected {len(FEATURES)} values ({', '.join(FEATURES)}), got {len(values)}")

    try:
        values = [float(v) for v in values]
    except (TypeError, ValueError):
        raise ValueError("All values must be numeric")

    row = dict(zip(FEATURES, values))
    X = pd.DataFrame([row], columns=FEATURES)

    prediction = model.predict(X)[0]

    # classes_ are string labels (e.g. "Low"/"Medium"/"High") — pass through safely
    if hasattr(prediction, "item"):
        prediction = prediction.item()

    return prediction