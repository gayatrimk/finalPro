# -*- coding: utf-8 -*-
"""Trial Dataset.ipynb

Automatically generated by Colab.

Original file is located at
    https://colab.research.google.com/drive/1BDSwtbplJVh42xqb6hDzgYV7-haXxpgt
"""
import os
import pandas as pd
import numpy as np
def loaddata():
    csv_path=os.path.join('C:/Users/DELL/Desktop/Final Project/finalPro/python','Biscuits_sample.csv')
    df=pd.read_csv(csv_path)
    return df

data=loaddata()
data_c = data.replace(np.nan, 0)
print(data_c)

import pandas as pd

# Safe recommended levels per 100g
safe_limits_per_100g = {
    "ENERGY(kcal)": 250,   # kcal
    "PROTEIN": 5,          # g (below this is harmful)
    "TOTAL SUGARS": 10,    # g
    "TOTAL FAT": 17,       # g
    "SODIUM(mg)": 600,     # mg
}

# Function to classify based on per 100g safe limits
def classify_food(row):
    harmful_factors = 0  # Count harmful elements

    # Normalize per 100g if necessary (Assumption: Input is already per 100g)
    sodium_ratio = row["SODIUM(mg)"] / safe_limits_per_100g["SODIUM(mg)"]
    fat_ratio = row["TOTAL FAT"] / safe_limits_per_100g["TOTAL FAT"]
    sugar_ratio = row["TOTAL SUGARS"] / safe_limits_per_100g["TOTAL SUGARS"]

    # 1️⃣ Check for Very Harmful (Any value > 3× safe limit)
    if sodium_ratio > 3 or fat_ratio > 3 or sugar_ratio > 3:
        return "Very Harmful"

    # 2️⃣ Count how many values exceed 2× safe limit
    if sodium_ratio > 2:
        harmful_factors += 1
    if fat_ratio > 2:
        harmful_factors += 1
    if sugar_ratio > 2:
        harmful_factors += 1

    # 3️⃣ Harmful: If 2 or more exceed 2× the safe limit
    if harmful_factors >= 2:
        return "Harmful"

    # 4️⃣ OK: If only 1 exceeds the safe limit
    if harmful_factors == 1:
        return "OK"

    # 5️⃣ Safe: Everything is within limits
    return "Safe"


# Apply classification function
data_c["Category"] = data_c.apply(classify_food, axis=1)

# Print results
print(data_c)

data_c

"""## **New Trial with Explanation**"""

import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow import keras
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder

# Safe recommended levels per 100g
safe_limits_per_100g = {
    "ENERGY(kcal)": 250,   # kcal
    "PROTEIN": 5,          # g (below this is harmful)
    "TOTAL SUGARS": 10,    # g
    "TOTAL FAT": 17,       # g
    "SODIUM(mg)": 600,     # mg
}

# Function to classify based on per 100g safe limits
def classify_food(row):
    harmful_factors = 0
    sodium_ratio = row[2] / safe_limits_per_100g["SODIUM(mg)"]
    fat_ratio = row[1] / safe_limits_per_100g["TOTAL FAT"]
    sugar_ratio = row[0] / safe_limits_per_100g["TOTAL SUGARS"]

    print(f"Ratios: sodium_ratio={sodium_ratio:.2f}, fat_ratio={fat_ratio:.2f}, sugar_ratio={sugar_ratio:.2f}")

    # Identify which nutrients contribute to harmful classification
    harmful_nutrients = []

    if sodium_ratio > 3 or fat_ratio > 3 or sugar_ratio > 3:
        harmful_nutrients.append("excessive amounts of sodium, fat, or sugar")
        return "Very Harmful", harmful_nutrients

    if sodium_ratio > 2:
        harmful_factors += 1
        harmful_nutrients.append("high sodium")
    if fat_ratio > 2:
        harmful_factors += 1
        harmful_nutrients.append("high fat")
    if sugar_ratio > 2:
        harmful_factors += 1
        harmful_nutrients.append("high sugar")

    print(f"Ratios:sodium_ratio{sodium_ratio},fat_ratio{fat_ratio},sugar_ratio{sugar_ratio}")


    if harmful_factors >= 2:
        return "Harmful", harmful_nutrients

    if harmful_factors == 1:
        return "OK", harmful_nutrients

    return "Safe", []

# Features and Labels
X = data_c[["TOTAL SUGARS", "TOTAL FAT", "SODIUM(mg)"]].values
y = data_c["Category"].values

# Encode labels
encoder = OneHotEncoder(sparse_output=False)
y_encoded = encoder.fit_transform(y.reshape(-1, 1))

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42)

# Normalize features
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# ANN Model
model = keras.Sequential([
    keras.layers.Dense(8, activation="relu", input_shape=(3,)),
    keras.layers.Dense(4, activation="relu"),
    keras.layers.Dense(4, activation="softmax")
])

# Compile Model
model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])

# Train Model
model.fit(X_train, y_train, epochs=30, batch_size=4, validation_data=(X_test, y_test))

# Evaluate Model
loss, accuracy = model.evaluate(X_test, y_test)
print(f"Test Accuracy: {accuracy:.2f}")

# Predict new data
new_data = np.array([[29, 36.2, 130]])
new_data_scaled = scaler.transform(new_data)
prediction = model.predict(new_data_scaled)

# Get predicted category
predicted_label = encoder.inverse_transform(prediction)[0]

# Use classification logic to explain why
category, reasons = classify_food(new_data[0])
explanation = f" As the product contains {' and '.join(reasons)}." if reasons else " The product is within safe limits."

# Display result
print(f"Predicted Category: {predicted_label}{explanation}")

# """## **Trial 2**"""

# import pandas as pd
# import numpy as np
# import tensorflow as tf
# from tensorflow import keras
# from sklearn.model_selection import train_test_split
# from sklearn.preprocessing import StandardScaler, OneHotEncoder

# # Safe recommended levels per 100g
# safe_limits_per_100g = {
#     "ENERGY(kcal)": 250,   # kcal
#     "PROTEIN": 5,          # g (below this is harmful)
#     "TOTAL SUGARS": 10,    # g
#     "TOTAL FAT": 17,       # g
#     "SODIUM(mg)": 600,     # mg
# }

# # Function to classify based on per 100g safe limits
# def classify_food(row):
#     harmful_factors = 0
#     sugar = row["TOTAL SUGARS"]
#     fat = row["TOTAL FAT"]
#     sodium = row["SODIUM(mg)"]

#     sodium_ratio = sodium / safe_limits_per_100g["SODIUM(mg)"]
#     fat_ratio = fat / safe_limits_per_100g["TOTAL FAT"]
#     sugar_ratio = sugar / safe_limits_per_100g["TOTAL SUGARS"]

#     print(f"Ratios:sodium_ratio {sodium_ratio},fat_ratio {fat_ratio},sugar_ratio {sugar_ratio}")

#     harmful_nutrients = []

#     if sodium_ratio > 3 or fat_ratio > 3 or sugar_ratio > 3:
#         harmful_nutrients.append("excessive amounts of sodium, fat, or sugar")
#         return "Very Harmful", harmful_nutrients

#     if sodium_ratio > 2:
#         harmful_factors += 1
#         harmful_nutrients.append("high sodium")
#     if fat_ratio > 2:
#         harmful_factors += 1
#         harmful_nutrients.append("high fat")
#     if sugar_ratio > 2:
#         harmful_factors += 1
#         harmful_nutrients.append("high sugar")

#     if harmful_factors >= 2:
#         return "Harmful", harmful_nutrients

#     if harmful_factors == 1:
#         return "OK", harmful_nutrients

#     return "Safe", []



# # Generate labels using the classification logic
# data_c["Category"], data_c["Reasons"] = zip(*data_c.apply(classify_food, axis=1))

# # Features and Labels
# X = data_c[["TOTAL SUGARS", "TOTAL FAT", "SODIUM(mg)"]].values
# y = data_c["Category"].values

# # Encode labels
# encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore') # handle_unknown='ignore' added
# y_encoded = encoder.fit_transform(y.reshape(-1, 1))

# # Split dataset
# X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42)

# # Normalize features
# scaler = StandardScaler()
# X_train = scaler.fit_transform(X_train)
# X_test = scaler.transform(X_test)

# # ANN Model (deeper for better learning)
# model = keras.Sequential([
#     keras.layers.Dense(16, activation="relu", input_shape=(3,)),
#     keras.layers.Dense(8, activation="relu"),
#     keras.layers.Dense(y_encoded.shape[1], activation="softmax") # Output layer matches encoded categories
# ])

# # Compile Model
# model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])

# # Train Model
# model.fit(X_train, y_train, epochs=20, batch_size=4, validation_data=(X_test, y_test))

# # Evaluate Model
# loss, accuracy = model.evaluate(X_test, y_test)
# print(f"\nTest Accuracy: {accuracy:.2f}\n")

# # Predict new data
# new_data = np.array([[9, 38, 100]])
# new_data_scaled = scaler.transform(new_data)
# prediction = model.predict(new_data_scaled)

# # Get predicted category from ANN
# predicted_label = encoder.inverse_transform(prediction)[0]

# # Get explanation from rule-based logic
# temp_df = pd.DataFrame(new_data, columns=["TOTAL SUGARS", "TOTAL FAT", "SODIUM(mg)"])
# category, reasons = classify_food(temp_df.iloc[0])
# explanation = f" As the product contains {' and '.join(reasons)}." if reasons else " The product is within safe limits."

# # Display result
# print(f"ANN Predicted Category: {predicted_label[0]}{explanation}")
# print(f"Rule-Based Category: {category}{explanation}")

# data_c

# import pandas as pd
# import numpy as np
# import tensorflow as tf
# from tensorflow import keras
# from sklearn.model_selection import train_test_split
# from sklearn.preprocessing import StandardScaler, OneHotEncoder

# # Features and Labels (Remove Protein & Energy)
# X = data_c[["TOTAL SUGARS", "TOTAL FAT", "SODIUM(mg)"]].values
# y = data_c["Category"].values  # Categorical labels: Safe, OK, Harmful, Very Harmful

# # Encode labels (One-Hot Encoding)
# encoder = OneHotEncoder(sparse_output=False)
# y_encoded = encoder.fit_transform(y.reshape(-1, 1))

# # Split dataset
# X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42)

# # Normalize features (Standardization)
# scaler = StandardScaler()
# X_train = scaler.fit_transform(X_train)
# X_test = scaler.transform(X_test)

# # ANN Model (Now with only 3 input neurons)
# model = keras.Sequential([
#     keras.layers.Dense(8, activation="relu", input_shape=(3,)),  # 3 input features
#     keras.layers.Dense(4, activation="relu"),  # Hidden layer
#     keras.layers.Dense(4, activation="softmax")  # 4 output categories
# ])

# # Compile Model
# model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])

# # Train Model
# model.fit(X_train, y_train, epochs=30, batch_size=4, validation_data=(X_test, y_test))

# # Evaluate Model
# loss, accuracy = model.evaluate(X_test, y_test)
# print(f"Test Accuracy: {accuracy:.2f}")

# # Predict new data
# new_data = np.array([[40, 60, 1500]])  # Example input (Only 3 features now)
# new_data_scaled = scaler.transform(new_data)
# prediction = model.predict(new_data_scaled)
# predicted_label = encoder.inverse_transform(prediction)
# print("Predicted Category:", predicted_label[0])

# #Without Scaling
# # prediction = model.predict(new_data)  # Directly predict without scaling
# # predicted_label = encoder.inverse_transform(prediction)
# # print("Predicted Category:", predicted_label[0])



# """## **Old Trials**"""

# thresholds = {
#     "ENERGY(kcal)": 500,   # kcal
#     "PROTEIN": 2,          # g (below this is harmful)
#     #"ADDED SUGARS": 25,    # g
#     "TOTAL SUGARS": 50,    # g
#     "TOTAL FAT": 70,       # g
#     "SODIUM(mg)": 2000,    # mg
# }

# # Function to classify as Harmful or Not Harmful
# def classify_harmful(row):
#     harmful = False  # Assume Not Harmful initially

#     # Check each nutrient against the threshold
#     if row["ENERGY(kcal)"] > thresholds["ENERGY(kcal)"]:
#         harmful = True
#     if row["PROTEIN"] < thresholds["PROTEIN"]:  # Low protein is harmful
#         harmful = True
#     #if row["ADDED SUGARS"] > thresholds["ADDED SUGARS"]:
#     #    harmful = True
#     if row["TOTAL SUGARS"] > thresholds["TOTAL SUGARS"]:
#         harmful = True
#     if row["TOTAL FAT"] > thresholds["TOTAL FAT"]:
#         harmful = True
#     if row["SODIUM(mg)"] > thresholds["SODIUM(mg)"]:
#         harmful = True

#     return "Harmful" if harmful else "Not Harmful"

# # Apply classification function
# data_c["Harmful"] = data_c.apply(classify_harmful, axis=1)

# data_c

# data_c["Harmful"] = data_c["Harmful"].map({"Harmful": 1, "Not Harmful": 0})

# data_c

# from sklearn.model_selection import train_test_split
# from sklearn.preprocessing import StandardScaler
# from sklearn.linear_model import LogisticRegression
# from sklearn.metrics import accuracy_score, classification_report

# features = ["ENERGY(kcal)", "PROTEIN", "ADDED SUGARS", "TOTAL SUGARS", "TOTAL FAT", "SODIUM(mg)"]
# target = "Harmful"  # Column should have values 1 (Harmful) and 0 (Not Harmful)

# X = data_c[features]  # Selecting nutrient columns
# y = data_c[target]    # Harmful or Not

# # Step 3: Split Data into Training and Testing Sets
# X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# # Step 4: Normalize the Data (Optional but Recommended for Logistic Regression)
# scaler = StandardScaler()
# X_train_scaled = scaler.fit_transform(X_train)
# X_test_scaled = scaler.transform(X_test)

# # Step 5: Train Logistic Regression Model
# model = LogisticRegression()
# model.fit(X_train_scaled, y_train)
# # model.fit(X_train, y_train)

# # Step 6: Evaluate the Model
# y_pred = model.predict(X_test_scaled)
# # y_pred = model.predict(X_test)
# print("Accuracy:", accuracy_score(y_test, y_pred))
# print(classification_report(y_test, y_pred))

# # Step 7: Predict for a New Food Item
# new_food_item = np.array([[518, 4.4, 30.2, 31.5, 25.8, 192]])  # Example nutrient values
# #new_food_item_scaled = scaler.transform(new_food_item)  # Scale new input
# prediction = model.predict(new_food_item)

# # Step 8: Display Prediction
# if prediction[0] == 1:
#     print("The food item is Harmful")
# else:
#     print("The food item is Not Harmful")

# new_food_item = np.array([[454, 6.9, 25, 25.5, 13, 296]])  # Example nutrient values
# new_food_item_scaled = scaler.transform(new_food_item)  # Scale new input
# prediction = model.predict(new_food_item_scaled)

# # Step 8: Display Prediction
# if prediction[0] == 1:
#     print("The food item is Harmful")
# else:
#     print("The food item is Not Harmful")

# new_food_item = np.array([[505, 7,12.2, 12.7,23.2,509]])  # Example nutrient values
# new_food_item_scaled = scaler.transform(new_food_item)  # Scale new input
# prediction = model.predict(new_food_item_scaled)

# # Step 8: Display Prediction
# if prediction[0] == 1:
#     print("The food item is Harmful")
# else:
#     print("The food item is Not Harmful")

# new_food_item = np.array([[494, 8,7.6, 8.2,21.1,943]])  # Example nutrient values
# new_food_item_scaled = scaler.transform(new_food_item)  # Scale new input
# prediction = model.predict(new_food_item_scaled)

# # Step 8: Display Prediction
# if prediction[0] == 1:
#     print("The food item is Harmful")
# else:
#     print("The food item is Not Harmful")

# print("Predicted Label:", prediction[0])
# print("Probability of Being Harmful:", model.predict_proba(new_food_item_scaled)[0][1])

# import tensorflow as tf
# from tensorflow import keras
# from sklearn.model_selection import train_test_split
# from sklearn.preprocessing import StandardScaler, LabelEncoder

# # Select features (nutrients used for classification)
# features = ["ENERGY(kcal)", "PROTEIN", "ADDED SUGARS", "TOTAL SUGARS", "TOTAL FAT", "SODIUM(mg)"]
# X = data_c[features]

# # Convert target labels into numerical values
# label_encoder = LabelEncoder()
# data_c["Harmfulness_Level"] = label_encoder.fit_transform(data_c["Harmful"])  # Assuming it has multiple levels like 0, 1, 2, 3

# # Target variable
# y = data_c["Harmfulness_Level"]

# # Normalize the feature values (scaling)
# scaler = StandardScaler()
# X_scaled = scaler.fit_transform(X)

# # Split dataset into training and testing sets (80-20 split)
# X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

# # Define ANN model
# model = keras.Sequential([
#     keras.layers.Dense(64, activation='relu', input_shape=(X_train.shape[1],)),  # Hidden Layer 1
#     keras.layers.Dense(32, activation='relu'),  # Hidden Layer 2
#     keras.layers.Dense(16, activation='relu'),  # Hidden Layer 3
#     keras.layers.Dense(len(data_c["Harmfulness_Level"].unique()), activation='softmax')  # Output Layer (Multi-class)
# ])

# # Compile model
# model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

# # Train model
# model.fit(X_train, y_train, epochs=50, batch_size=8, validation_data=(X_test, y_test))

# # Example new food item
# new_food_item = np.array([[494, 8, 7.6, 8.2, 21.1, 943]])  # Sample nutrient values

# # Scale input using the same scaler
# new_food_item_scaled = scaler.transform(new_food_item)

# # Get prediction
# prediction = model.predict(new_food_item_scaled)
# predicted_class = np.argmax(prediction)  # Get the class with the highest probability

# # Convert prediction back to label
# predicted_label = label_encoder.inverse_transform([predicted_class])[0]

# # Display result
# print(f"Predicted Harmfulness Level: {predicted_label}")

# new_food_item = np.array([[494, 8, 7.6, 8.2, 21.1, 943]])  # Sample nutrient values

# # Scale input using the same scaler
# new_food_item_scaled = scaler.transform(new_food_item)

# # Get prediction
# prediction = model.predict(new_food_item_scaled)
# predicted_class = np.argmax(prediction)  # Get the class with the highest probability

# # Convert prediction back to label
# predicted_label = label_encoder.inverse_transform([predicted_class])[0]

# # Display result
# print(f"Predicted Harmfulness Level: {predicted_label}")

# new_food_item = np.array([[5120, 800, 1200, 300, 350, 2000]])  # Sample nutrient values

# # Scale input using the same scaler
# new_food_item_scaled = scaler.transform(new_food_item)

# # Get prediction
# prediction = model.predict(new_food_item_scaled)
# predicted_class = np.argmax(prediction)  # Get the class with the highest probability

# # Convert prediction back to label
# predicted_label = label_encoder.inverse_transform([predicted_class])[0]

# # Display result
# print(f"Predicted Harmfulness Level: {predicted_label}")

# X = data_c["TOTAL SUGARS"]  # Selecting nutrient columns
# y = data_c[target]    # Harmful or Not

# # Step 3: Split Data into Training and Testing Sets
# X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# # Step 4: Normalize the Data (Optional but Recommended for Logistic Regression)
# # scaler = StandardScaler()
# # X_train_scaled = scaler.fit_transform(X_train)
# # X_test_scaled = scaler.transform(X_test)

# # Step 5: Train Logistic Regression Model
# model = LogisticRegression()
# model.fit(X_train_scaled, y_train)

# # Step 6: Evaluate the Model
# y_pred = model.predict(X_test_scaled)
# print("Accuracy:", accuracy_score(y_test, y_pred))
# print(classification_report(y_test, y_pred))

# # Step 7: Predict for a New Food Item
# new_food_item = np.array([[450, 6, 20, 30, 10, 500]])  # Example nutrient values
# # new_food_item_scaled = scaler.transform(new_food_item)  # Scale new input
# prediction = model.predict(new_food_item_scaled)

# # Step 8: Display Prediction
# if prediction[0] == 1:
#     print("The food item is Harmful")
# else:
#     print("The food item is Not Harmful")

# from sklearn.model_selection import train_test_split
# from sklearn.preprocessing import StandardScaler
# from sklearn.ensemble import RandomForestClassifier
# from sklearn.metrics import accuracy_score

# features = ["ENERGY(kcal)", "PROTEIN", "ADDED SUGARS", "TOTAL SUGARS", "TOTAL FAT", "SODIUM(mg)"]
# target = "Harmful"  # Column should have values 1 (Harmful) and 0 (Not Harmful)

# X = data_c[features]  # Selecting nutrient columns
# y = data_c[target]    # Harmful or Not

# scaler = StandardScaler()
# X_scaled = scaler.fit_transform(X)

# # Split into training/testing
# X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

# # Train Random Forest
# model = RandomForestClassifier(n_estimators=100, random_state=42)
# model.fit(X_train, y_train)

# # Predictions
# y_pred = model.predict(X_test)

# # Accuracy
# print("Accuracy:", accuracy_score(y_test, y_pred))

# scaler = StandardScaler()
# X_scaled = scaler.fit_transform(X)

# # Split into training/testing
# X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

# # Train Random Forest
# model = LogisticRegression()
# model.fit(X_train_scaled, y_train)

# # Predictions
# y_pred = model.predict(X_test)

# # Accuracy
# print("Accuracy:", accuracy_score(y_test, y_pred))

# new_food_item = np.array([[512, 4.5, 39.6, 39.8, 22.3, 142]])  # Example nutrient values
# new_food_item_scaled = scaler.transform(new_food_item)  # Scale new input
# prediction = model.predict(new_food_item_scaled)

# # Step 8: Display Prediction
# if prediction[0] == 1:
#     print("The food item is Harmful")
# else:
#     print("The food item is Not Harmful")

# new_food_item = np.array([[518, 4.4, 30.2, 31.5, 25.8, 192]])  # Example nutrient values
# new_food_item_scaled = scaler.transform(new_food_item)  # Scale new input
# prediction = model.predict(new_food_item_scaled)

# # Step 8: Display Prediction
# if prediction[0] == 1:
#     print("The food item is Harmful")
# else:
#     print("The food item is Not Harmful")

# new_food_item = np.array([[496, 6.3, 0, 28.9, 21.4,0 ]])  # Example nutrient values
# new_food_item_scaled = scaler.transform(new_food_item)  # Scale new input
# prediction = model.predict(new_food_item_scaled)

# # Step 8: Display Prediction
# if prediction[0] == 1:
#     print("The food item is Harmful")
# else:
#     print("The food item is Not Harmful")

# new_food_item = np.array([[503, 7.8, 6, 22.8, 22.9,230 ]])  # Example nutrient values
# new_food_item_scaled = scaler.transform(new_food_item)  # Scale new input
# prediction = model.predict(new_food_item_scaled)

# # Step 8: Display Prediction
# if prediction[0] == 1:
#     print("The food item is Harmful")
# else:
#     print("The food item is Not Harmful")

# print(model.coef_)  # See feature importance

# from sklearn.preprocessing import StandardScaler
# scaler = StandardScaler()
# X_train_scaled = scaler.fit_transform(X_train)
# X_test_scaled = scaler.transform(X_test)

# print(model.coef_)

# # Split dataset into training and testing
# X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# # Scale features
# scaler = StandardScaler()
# X_train_scaled = scaler.fit_transform(X_train)
# X_test_scaled = scaler.transform(X_test)

# # Train Random Forest Classifier
# rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
# rf_model.fit(X_train_scaled, y_train)

# # Make predictions
# y_pred = rf_model.predict(X_test_scaled)

# # Evaluate model performance
# print("Accuracy:", accuracy_score(y_test, y_pred))
# print("Classification Report:\n", classification_report(y_test, y_pred))

# # Predict new food item
# new_food_item = np.array([[400, 30, 15, 30, 20, 1200]])  # Example input
# new_food_item_scaled = scaler.transform(new_food_item)  # Scale input
# prediction = rf_model.predict(new_food_item_scaled)

# # Interpret prediction
# categories = {0: "Safe", 1: "Harmful"}
# print("Predicted Category:", categories[prediction[0]])

# import xgboost as xgb
# scaler = StandardScaler()
# X_scaled = scaler.fit_transform(X)

# # Step 6: Split Data (80% Train, 20% Test)
# X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

# # Step 7: Train XGBoost Classifier
# xgb_model = xgb.XGBClassifier(objective="binary:logistic", eval_metric="logloss", use_label_encoder=False)
# xgb_model.fit(X_train, y_train)

# # Step 8: Make Predictions
# y_pred = xgb_model.predict(X_test)

# # Step 9: Evaluate Model
# accuracy = accuracy_score(y_test, y_pred)
# print(f"Model Accuracy: {accuracy:.2f}")
# print("\nClassification Report:\n", classification_report(y_test, y_pred))

# # Step 10: Predict for a New Food Item
# new_food_item = np.array([[518, 4.4, 30.2, 31.5, 25.8, 192]])  # Example nutrient values
# new_food_item_scaled = scaler.transform(new_food_item)
# prediction = xgb_model.predict(new_food_item_scaled)

# # Step 11: Display Prediction
# if prediction[0] == 1:
#     print("The food item is Harmful ❌")
# else:
#     print("The food item is Safe ✅")

# from sklearn.tree import DecisionTreeClassifier
# # Step 5: Scale Features (Optional, but improves performance)
# scaler = StandardScaler()
# X_scaled = scaler.fit_transform(X)

# # Step 6: Split Data (80% Train, 20% Test)
# X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

# # Step 7: Train Decision Tree Classifier
# dt_model = DecisionTreeClassifier(criterion="gini", max_depth=5, random_state=42)
# dt_model.fit(X_train, y_train)

# # Step 8: Make Predictions
# y_pred = dt_model.predict(X_test)

# # Step 9: Evaluate Model
# accuracy = accuracy_score(y_test, y_pred)
# print(f"Model Accuracy: {accuracy:.2f}")
# print("\nClassification Report:\n", classification_report(y_test, y_pred))

# # Step 10: Predict for a New Food Item
# new_food_item = np.array([[518, 4.4, 30.2, 31.5, 25.8, 192]])  # Example nutrient values
# new_food_item_scaled = scaler.transform(new_food_item)
# prediction = dt_model.predict(new_food_item_scaled)

# # Step 11: Display Prediction
# if prediction[0] == 1:
#     print("The food item is Harmful ❌")
# else:
#     print("The food item is Safe ✅")

# from sklearn.tree import DecisionTreeClassifier
# # Step 5: Scale Features (Optional, but improves performance)
# scaler = StandardScaler()
# X_scaled = scaler.fit_transform(X)

# # Step 6: Split Data (80% Train, 20% Test)
# X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

# # Step 7: Train Decision Tree Classifier
# dt_model = DecisionTreeClassifier(criterion="gini", max_depth=5, random_state=42)
# dt_model.fit(X_train, y_train)

# # Step 8: Make Predictions
# y_pred = dt_model.predict(X_test)

# # Step 9: Evaluate Model
# accuracy = accuracy_score(y_test, y_pred)
# print(f"Model Accuracy: {accuracy:.2f}")
# print("\nClassification Report:\n", classification_report(y_test, y_pred))

# # Step 10: Predict for a New Food Item
# new_food_item = np.array([[490, 4.4, 11.2, 21.5, 20.8, 120]])  # Example nutrient values
# new_food_item_scaled = scaler.transform(new_food_item)
# prediction = dt_model.predict(new_food_item_scaled)

# # Step 11: Display Prediction
# if prediction[0] == 1:
#     print("The food item is Harmful ❌")
# else:
#     print("The food item is Safe ✅")