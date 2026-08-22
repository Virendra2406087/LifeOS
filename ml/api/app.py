import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, request, jsonify
from flask_cors import CORS

from prediction.predictScheduler import predict_scheduler
from prediction.predictProductivity import predict_productivity
from prediction.predictBurnout import predict_burnout
from prediction.predictHabits import predict_habit
from prediction.predictPriority import predict_priority
from prediction.predictDuration import predict_duration

app = Flask(__name__)
CORS(app)


def handle_predict(predict_fn):
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"success": False, "message": "Request body must be JSON"}), 400

    try:
        result = predict_fn(data)
        return jsonify({"success": True, "prediction": result})
    except ValueError as e:
        return jsonify({"success": False, "message": str(e)}), 400
    except Exception:
        app.logger.exception("Prediction failed")
        return jsonify({"success": False, "message": "Internal prediction error"}), 500


@app.route("/predict/scheduler", methods=["POST"])
def scheduler_route():
    return handle_predict(predict_scheduler)


@app.route("/predict/productivity", methods=["POST"])
def productivity_route():
    return handle_predict(predict_productivity)


@app.route("/predict/duration", methods=["POST"])
def duration_route():
    return handle_predict(predict_duration)


@app.route("/predict/burnout", methods=["POST"])
def burnout_route():
    return handle_predict(predict_burnout)


@app.route("/predict/habits", methods=["POST"])
def habits_route():
    return handle_predict(predict_habit)


@app.route("/predict/priority", methods=["POST"])
def priority_route():
    return handle_predict(predict_priority)


@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ML API running"})


if __name__ == "__main__":
    # FLASK_DEBUG defaults to "false" — safe default for any environment
    # that runs this file directly instead of through gunicorn.
    # Locally: set FLASK_DEBUG=true if you want the debugger + auto-reload back.
    # On Render: gunicorn imports `app` directly and never hits this block at all,
    # so this only matters if app.py is ever run standalone.
    debug_mode = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=debug_mode)