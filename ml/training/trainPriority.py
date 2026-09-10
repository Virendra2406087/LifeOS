import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pandas as pd

import joblib
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

FEATURES = ["importance", "deadline_hours", "duration", "category"]
TARGET = "priority"

DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'priority.csv')
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'priority.pkl')


def train_priority_model():
    print(f"Loading data from {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)

    X = df[FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print("Training priority model...")
    model = DecisionTreeClassifier(random_state=42)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    acc = accuracy_score(y_test, preds)
    print(f"Validation accuracy: {acc:.2%}")

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        joblib.dump(model, MODEL_PATH)

    print(f"Saved trained model to {MODEL_PATH}")


if __name__ == "__main__":
    train_priority_model()