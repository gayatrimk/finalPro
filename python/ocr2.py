import os
import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow import keras
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
import re
from flask import Flask, request, jsonify
from google.cloud import vision
from flask_cors import CORS
import joblib

app = Flask(__name__)
client = vision.ImageAnnotatorClient.from_service_account_file('acc.json')
CORS(app)

MODEL_PATH = 'food_classification_model.h5'
SCALER_PATH = 'scaler.pkl'
ENCODER_PATH = 'encoder.pkl'
CSV_PATH = os.path.join(os.path.dirname(__file__), 'mixed_data.csv')

nutrition_keys = [
    "Energy", "Calories", "Protein", "Carbohydrate", "Of which Sugar", "Total Carbohydrate",
    "Fat", "Total Fat", "Saturated Fat", "Trans Fat", "Cholesterol", "Sodium",
    "Sugars", "Added Sugars", "Dietary Fiber", "Fiber",
    "Monounsaturated fatty acids", "Polyunsaturated fatty acids"
]

safe_limits = {
    "TOTAL SUGARS": 22.5,
    "TOTAL FAT": 17,
    "SODIUM(mg)": 600
}

def load_dataset():
    df = pd.read_csv(CSV_PATH, encoding='ISO-8859-1')
    return df

def classify_food(row):
    sugar = row["TOTAL SUGARS"]
    fat = row["TOTAL FAT"]
    sodium = row["SODIUM(mg)"]

    sugar_exceed = (sugar - safe_limits["TOTAL SUGARS"]) / safe_limits["TOTAL SUGARS"] if sugar > safe_limits["TOTAL SUGARS"] else 0
    fat_exceed = (fat - safe_limits["TOTAL FAT"]) / safe_limits["TOTAL FAT"] if fat > safe_limits["TOTAL FAT"] else 0
    sodium_exceed = (sodium - safe_limits["SODIUM(mg)"]) / safe_limits["SODIUM(mg)"] if sodium > safe_limits["SODIUM(mg)"] else 0

    exceedances = [sugar_exceed, fat_exceed, sodium_exceed]
    exceed_count = sum(e > 0 for e in exceedances)
    high_exceed_count = sum(e > 0.3 for e in exceedances)

    if exceed_count == 0:
        return "Safe", []
    elif exceed_count == 1:
        return "OK", []
    elif exceed_count >= 2 and high_exceed_count < 2:
        return "Harmful", []
    elif exceed_count == 3 or high_exceed_count >= 2:
        return "Very Harmful", []

# Training logic
if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH) or not os.path.exists(ENCODER_PATH):
    data = load_dataset()
    data = data.replace(np.nan, 0)

    data["TOTAL SUGARS"] = data["TOTAL SUGARS"].astype(float)
    data["TOTAL FAT"] = data["TOTAL FAT"].astype(float)
    data["SODIUM(mg)"] = data["SODIUM(mg)"].astype(float)

    data[["Category", "_"]] = data.apply(classify_food, axis=1, result_type="expand")

    X = data[["TOTAL SUGARS", "TOTAL FAT", "SODIUM(mg)"]].values
    y = data["Category"].values

    encoder = OneHotEncoder(sparse_output=False)
    y_encoded = encoder.fit_transform(y.reshape(-1, 1))
    joblib.dump(encoder, ENCODER_PATH)

    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)
    joblib.dump(scaler, SCALER_PATH)

    model = keras.Sequential([
        keras.layers.Dense(16, activation="relu", input_shape=(3,)),
        keras.layers.Dropout(0.2),
        keras.layers.Dense(12, activation="relu"),
        keras.layers.Dense(8, activation="relu"),
        keras.layers.Dense(4, activation="softmax")
    ])

    model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])
    model.fit(X_train, y_train, epochs=50, batch_size=8, validation_data=(X_test, y_test), verbose=0)
    model.save(MODEL_PATH)
    print(f"Trained model saved to {MODEL_PATH}")
else:
    model = keras.models.load_model(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    encoder = joblib.load(ENCODER_PATH)
    print(f"Loaded trained model from {MODEL_PATH}")

@app.route("/ocr", methods=["POST"])
def newFun():
    print("Inside flask backend")
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    image_file = request.files['image']
    if image_file.filename == '':
        return jsonify({'error': 'No selected image file'}), 400

    try:
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
                value_str = match.group(1)
                try:
                    value = float(value_str)
                    unit = match.group(2) if match.group(2) else ''
                    nutrition_data[key] = {'value': value, 'unit': unit.strip()}
                except ValueError:
                    print(f"Warning: Could not convert value '{value_str}' for {key} to float.")

        print("Extracted Nutrition Data:", nutrition_data)

        sugar_info = nutrition_data.get("Sugars") or nutrition_data.get("Total Sugars") or nutrition_data.get("Of which Sugar")
        fat_info = nutrition_data.get("Total Fat") or nutrition_data.get("Fat")
        sodium_value = 0.0
        if "Sodium" in nutrition_data and isinstance(nutrition_data["Sodium"], dict) and 'value' in nutrition_data["Sodium"]:
            sodium_value = nutrition_data["Sodium"]["value"]
        elif any("sodium" in k.lower() for k in nutrition_data):
            for key, value_dict in nutrition_data.items():
                if "sodium" in key.lower() and isinstance(value_dict, dict) and 'value' in value_dict:
                    sodium_value = value_dict['value']
                    break

        sugar_value = sugar_info['value'] if sugar_info and 'value' in sugar_info else 0.0
        fat_value = fat_info['value'] if fat_info and 'value' in fat_info else 0.0

        new_data = np.array([[sugar_value, fat_value, sodium_value]])
        new_data_scaled = scaler.transform(new_data)
        prediction = model.predict(new_data_scaled)
        predicted_index = np.argmax(prediction)
        predicted_label_encoded = np.zeros_like(prediction)
        predicted_label_encoded[0][predicted_index] = 1
        predicted_label = encoder.inverse_transform(predicted_label_encoded)[0][0]

        # Load and prepare dataset
        dataset = load_dataset()
        dataset = dataset.dropna(subset=["TOTAL SUGARS", "TOTAL FAT", "SODIUM(mg)"]).copy()
        dataset["TOTAL SUGARS"] = dataset["TOTAL SUGARS"].astype(float)
        dataset["TOTAL FAT"] = dataset["TOTAL FAT"].astype(float)
        dataset["SODIUM(mg)"] = dataset["SODIUM(mg)"].astype(float)

        print("sugar",sugar_value)

        print("fat",fat_value)

        print("sodium",sodium_value)

        # Filter items with lower sugar, fat, sodium
        alternatives = []
        if predicted_label != "Safe":
            healthier_items = dataset[
                (dataset["TOTAL SUGARS"] <= sugar_value) &
                (dataset["TOTAL FAT"] <= fat_value) &
                (dataset["SODIUM(mg)"] <= sodium_value)
            ].copy()

        

            healthier_items["health_score"] = (
                healthier_items["TOTAL SUGARS"] +
                healthier_items["TOTAL FAT"] +
                (healthier_items["SODIUM(mg)"] / 100)
            )

            print("healthier_items",healthier_items)

            top_alternatives = healthier_items.sort_values(by="health_score").head(3)


            for _, row in top_alternatives.iterrows():
                temp_row = pd.Series({
                    "TOTAL SUGARS": row.get("TOTAL SUGARS", 0.0),
                    "TOTAL FAT": row.get("TOTAL FAT", 0.0),
                    "SODIUM(mg)": row.get("SODIUM(mg)", 0.0)
                })
                category, _ = classify_food(temp_row)

                alternatives.append({
                    "Brand Name": row.get("Brand Name", "Unknown"),
                    "ENERGY(kcal)": row.get("ENERGY(kcal)", "N/A"),
                    "PROTEIN": row.get("PROTEIN", "N/A"),
                    "CARBOHYDRATE": row.get("CARBOHYDRATE", "N/A"),
                    "TOTAL SUGARS": row.get("TOTAL SUGARS", "N/A"),
                    "TOTAL FAT": row.get("TOTAL FAT", "N/A"),
                    "SODIUM(mg)": row.get("SODIUM(mg)", "N/A"),
                    "Category": category,
                    "img": row.get("img", None)
                })

        print("nutrition_data",nutrition_data)
        print("alternatives",alternatives)

        return jsonify({
            "message": f"Model Prediction: {predicted_label}",
            "nutrition_data": nutrition_data,
            "alternatives": alternatives
        }), 200

    except Exception as e:
        print(f"Error processing image: {e}")
        return jsonify({'error': f'Failed to process image: {str(e)}'}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)