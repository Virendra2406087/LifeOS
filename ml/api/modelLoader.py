import os
import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

MODEL_FILES = {
    "scheduler": "scheduler.pkl",
    "productivity": "productivity.pkl",
    "burnout": "burnout.pkl",
    "habits": "habits.pkl",
    "priority": "priority.pkl",
    "duration": "duration.pkl",
}

models = {}


def load_models():
    for name, filename in MODEL_FILES.items():
        path = os.path.join(MODELS_DIR, filename)
        try:
            models[name] = joblib.load(path)
            print(f"Loaded model: {name} ({path})")
        except FileNotFoundError:
            print(f"Model file not found: {path}")
            models[name] = None
        except Exception as e:
            print(f"Failed to load model '{name}': {e}")
            models[name] = None


load_models()