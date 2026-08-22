from flask import Blueprint, request, jsonify
import numpy as np

from modelLoader import models


api = Blueprint("api", __name__)


@api.post("/predict/<model_name>")
def predict(model_name):

    # Check model
    if model_name not in models:
        return jsonify({
            "success": False,
            "message": "Model not found"
        }), 404


    # Get request body
    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is required"
        }), 400


    # Get values
    values = data.get("values")

    if values is None:
        return jsonify({
            "success": False,
            "message": "values field is required"
        }), 400


    # Validate values
    if not isinstance(values, list):
        return jsonify({
            "success": False,
            "message": "values must be an array"
        }), 400


    try:

        prediction = models[model_name].predict(
            np.array([values])
        )[0]


        return jsonify({
            "success": True,
            "model": model_name,
            "prediction": float(prediction)
        })


    except Exception as error:

        return jsonify({
            "success": False,
            "message": "Prediction failed",
            "error": str(error)
        }), 500