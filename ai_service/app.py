"""
CampusFix AI Service - Flask API
Exposes the classifier as an HTTP endpoint for the Node.js backend.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from classifier import classify
import logging

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "CampusFix AI Classifier"})

@app.route("/classify", methods=["POST"])
def classify_complaint():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    text = data.get("text", "").strip()
    location = data.get("location", "").strip()

    if not text:
        return jsonify({"error": "text field is required"}), 400
    if len(text) > 2000:
        return jsonify({"error": "text too long (max 2000 chars)"}), 400

    result = classify(text, location)
    logging.info(f"Classified: {text[:60]!r} → {result['category']} ({result['priority']})")
    return jsonify(result)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
