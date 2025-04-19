import React, { useState, useEffect } from "react";
import { View, Button, Image, Alert, StyleSheet, ActivityIndicator, Text, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";

interface NutritionValue {
  value: number | null;
  unit: string | null;
}

interface PredictionResult {
  message: string;
  explanation: string;
  nutrition_data?: { [key: string]: NutritionValue }; // Explicitly define the structure
}

const ImageUploadScreen = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null); // Explicitly type the state
  const [error, setError] = useState<string | null>(null);

  // Function to convert base64 to Blob (for web)
  const base64toBlob = (base64Data: string, contentType = 'image/jpeg') => {
    const byteCharacters = atob(base64Data.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  };

  // Pick Image Function
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "You need to grant permission to access images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
      setPredictionResult(null); // Clear previous result
      setError(null);
      console.log("✅ Selected Image URI:", result.assets[0].uri);
    }
  };

  // Upload Image Function
  const uploadImage = async () => {
    if (!selectedImage) {
      Alert.alert("No Image Selected", "Please pick an image first.");
      return;
    }

    setLoading(true);
    setError(null);
    setPredictionResult(null);

    try {
      const formData = new FormData();
      const filename = selectedImage.split('/').pop() || 'upload.jpg';
      let fileBlob;

      if (Platform.OS === 'web' && selectedImage.startsWith('data:')) {
        const contentTypeMatch = selectedImage.match(/^data:(.*?);/);
        const contentType = contentTypeMatch ? contentTypeMatch[1] : 'image/jpeg';
        const base64Data = selectedImage;
        fileBlob = base64toBlob(base64Data, contentType);
        formData.append('image', fileBlob, filename); // Append Blob with filename
      } else {
        const fileExt = selectedImage.split('.').pop();
        const mimeType = fileExt ? `image/${fileExt}` : "image/jpeg";
        const photo: any = {
          uri: selectedImage,
          type: mimeType,
          name: filename,
        };
        formData.append('image', photo); // For native platforms
      }

      console.log("✅ Selected Image URI (before FormData log):", selectedImage);
      console.log("✅ FormData before sending:");
      for (let pair of formData.entries()) {
        console.log(`${pair[0]}:`, pair[1]);
      }

      const response = await axios.post("http://127.0.0.1:5001/ocr", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Accept: "application/json",
        },
      });

      console.log("✅ Request sent to backend");
      console.log("✅ API Response:", response.data);
      if (response.status === 200) {
        setPredictionResult(response.data);
        Alert.alert("Upload Successful", "Image processed successfully!");
      } else {
        setError("Failed to process image. Please try again.");}
    } catch (error: any) {
      console.error("Upload error:", error.message);
      setError("Upload failed: " + error.message);
      Alert.alert("Upload Failed", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Food Nutrition Classifier</Text>
      {!selectedImage && <Button title="Pick an Image" onPress={pickImage} />}

      {selectedImage && (
        <>
          <Image source={{ uri: selectedImage }} style={styles.image} />
          <Button title="Analyze Image" onPress={uploadImage} color="#1E90FF" />
        </>
      )}

      {loading && <ActivityIndicator size="large" color="#1E90FF" style={styles.loader} />}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {predictionResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Analysis Result:</Text>
          <Text style={styles.resultText}>Prediction: {predictionResult.message}</Text>
          <Text style={styles.resultText}>Explanation: {predictionResult.explanation}</Text>
          {predictionResult.nutrition_data && Object.keys(predictionResult.nutrition_data).length > 0 && (
            <>
              <Text style={styles.nutritionTitle}>Extracted Nutrition Data:</Text>
              {Object.entries(predictionResult.nutrition_data).map(([key, value]) => (
                <Text key={key} style={styles.nutritionText}>
                  {key}: {value.value} {value.unit}
                </Text>
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  image: {
    width: 200,
    height: 200,
    marginVertical: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
  },
  loader: {
    marginTop: 10,
  },
  errorContainer: {
    marginTop: 20,
    backgroundColor: "#ffe0e0",
    padding: 15,
    borderRadius: 5,
    borderColor: "#ffc0c0",
    borderWidth: 1,
  },
  errorText: {
    color: "#d32f2f",
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    borderRadius: 5,
    backgroundColor: "#e0f7fa",
    borderColor: "#b2ebf2",
    borderWidth: 1,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#0277bd",
  },
  resultText: {
    fontSize: 16,
    marginBottom: 5,
    color: "#1976d2",
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    color: "#388e3c",
  },
  nutritionText: {
    fontSize: 14,
    color: "#43a047",
  },
});

export default ImageUploadScreen;