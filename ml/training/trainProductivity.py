import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

# Load dataset
data = pd.read_csv("../data/productivity.csv")

# Features
X = data[
    [
        "tasks_completed",
        "tasks_pending",
        "focus_hours",
        "breaks",
        "meetings"
    ]
]

# Target
y = data["productivity"]

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# Train model
model = RandomForestRegressor(
    n_estimators=100,
    random_state=42
)

model.fit(X_train, y_train)

# Predictions
predictions = model.predict(X_test)

# Accuracy
print("R2 Score :", r2_score(y_test, predictions))
print("MAE :", mean_absolute_error(y_test, predictions))

# Save model
joblib.dump(model, "../models/productivity.pkl")

print("✅ productivity.pkl created successfully")