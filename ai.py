from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)

load_dotenv()
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    app.logger.error("GEMINI_API_KEY not found in .env. Copy .env.example to .env and add your key.")
    raise ValueError("GEMINI_API_KEY required in .env file")

genai.configure(api_key=GEMINI_API_KEY)

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.json
        message = data.get("message", "")
        feature = data.get("feature", "chat")

        app.logger.info(f"/chat received message={message!r}, feature={feature!r}")

        if not message:
            return jsonify({"reply": "Please send a message."})

        model = genai.GenerativeModel("gemini-2.5-flash")
        # Feature-specific prompts
        if feature == "symptom":
            prompt = f"Analyze these symptoms for possible conditions and precautions (not diagnosis): {message}. Respond concisely with conditions list and precautions."
        elif feature == "diet":
            prompt = f"Provide diet recommendation based on: {message}. Calculate BMI if numbers given. Concise advice only."
        elif feature == "medcheck":
            prompt = f"Verify medicine '{message}'. Provide authenticity info, usage, warnings if known (general knowledge)."
        else:  # chat, mental health
            prompt = f" provide simple response based on: {message}. Be empathetic. Note: Use emojis if needed and Not medical advice."

        response = model.generate_content(prompt)
        reply = response.text.strip()

        return jsonify({
            "reply": reply + "\n\n(Note: AI generated. Consult healthcare professional.)"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/")
def home():
    return "Gemini HealthCare API is running (.env key loaded)! POST /chat with JSON: {message: str, feature: 'chat|symptom|diet|medcheck'}"

if __name__ == "__main__":
    app.run(debug=True)
