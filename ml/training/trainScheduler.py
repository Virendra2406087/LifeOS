import pandas as pd
import joblib

from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

data = pd.read_csv("../data/scheduler.csv")

X = data[
    [
        "priority",
        "energy_level",
        "deadline_hours",
        "duration"
    ]
]

y = data["best_hour"]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

model = RandomForestRegressor(
    n_estimators=200,
    random_state=42
)

model.fit(X_train, y_train)

prediction = model.predict(X_test)

print("MAE:", mean_absolute_error(y_test, prediction))

joblib.dump(
    model,
    "../models/scheduler.pkl"
)

print("✅ scheduler.pkl created successfully")