from flask import Flask, request, jsonify
from flask_cors import CORS
import re
from google.cloud import vision

app = Flask(__name__)
CORS(app)

client = vision.ImageAnnotatorClient.from_service_account_file('acc.json')

nutrition_keys = [
    "Energy", "Calories", "Protein", "Carbohydrate", "Of which Sugar", "Total Carbohydrate",
    "Fat", "Total Fat", "Saturated Fat", "Trans Fat", "Cholesterol", "Sodium",
    "Sugars", "Added Sugars", "Dietary Fiber", "Fiber",
    "Monounsaturated fatty acids", "Polyunsaturated fatty acids"
]

@app.route('/ocr', methods=['POST'])
def ocr_endpoint():
    print("Request Files:", request.files)  # Added this line for debugging

    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    image_file = request.files['image']
    image_bytes = image_file.read()

    image = vision.Image(content=image_bytes)
    response = client.document_text_detection(image=image)

    if response.error.message:
        return jsonify({'error': response.error.message}), 500

    full_text = response.full_text_annotation.text
    cleaned_text = re.sub(r'[\s]{2,}', ' ', full_text).strip()

    nutrition_data = {}
    for key in nutrition_keys:
        pattern = rf'{key}[^\d]*([\d.]+)\s*(kcal|g|mg|kJ|%)?'
        match = re.search(pattern, cleaned_text, re.IGNORECASE)
        if match:
            value = match.group(1) + (f" {match.group(2)}" if match.group(2) else '')
            nutrition_data[key] = value

    return jsonify({
        'text': cleaned_text,
        'nutrition': nutrition_data
    })
    
if __name__ == '__main__':
    app.run(port=5001)