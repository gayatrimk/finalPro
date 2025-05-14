from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load API key from .env
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize Gemini client
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
model = "learnlm-2.0-flash-experimental"

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_input = data.get("message", "")

    if not user_input:
        return jsonify({"reply": "No message received"}), 400

    try:
        # Chat context
        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(
                    text="""Act like a chatbot for my project Packaged Food Analysis & Recommendation System. With features of:
1. Reading packaged labels and extracting nutrients and harmful ingredients.
2. Suggesting users products based on their health preferences.
3. Guiding them to create awareness about food gimmicks."""
                )]
            ),
            types.Content(
                role="model",
                parts=[types.Part.from_text(
                    text="""Ready to assist with nutrition extraction, harmful ingredient identification, product suggestions, and user education on food gimmicks."""
                )]
            ),
            types.Content(
        role="user",
        parts=[
            types.Part.from_text(text="Please keep your responses short and concise (1-2 sentences)."),
        ],
    ),
    types.Content(
    role="model",
    parts=[
        types.Part.from_text(text="""Please answer the user’s questions directly and concisely without excesive use of punctuation marks/symbols."""),  # More focused instruction
    ],
),
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=user_input)]
            ),
        ]

        config = types.GenerateContentConfig(response_mime_type="text/plain")

        reply = ""
        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=config
        ):
            reply += chunk.text

        return jsonify({"reply": reply.strip()})

    except Exception as e:
        return jsonify({"reply": f"Error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(port=5000)
