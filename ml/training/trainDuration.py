import pandas as pd
import joblib

from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

data = pd.read_csv("../data/duration.csv")

X = data[
    [
        "importance",
        "task_length",
        "category",
        "deadline_hours"
    ]
]

y = data["duration"]

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
    "../models/duration.pkl"
)

print("duration.pkl created successfully")