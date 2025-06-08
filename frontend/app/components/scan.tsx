import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  Platform,
  Alert,
  ScrollView,
  Animated,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Add API URL configuration
const API_URL = Platform.OS === 'web' ? 'http://127.0.0.1:5001' : 'http://192.168.88.249:5001';
const API_TIMEOUT = 10000; // Increased timeout to 10 seconds

interface NutritionValue {
  value: number | null;
  unit: string | null;
}

interface PredictionResult {
  message: string;
  explanation: string;
  nutrition_data?: { [key: string]: NutritionValue };
  alternatives?: Array<{
    "Brand Name": string;
    "ENERGY(kcal)": string | number;
    "PROTEIN": string | number;
    "CARBOHYDRATE": string | number;
    "TOTAL SUGARS": string | number;
    "TOTAL FAT": string | number;
    "SODIUM(mg)": string | number;
    "Category": string;
    "img": string | null;
  }>;
}

// Add a function to test the API connection
const testApiConnection = async () => {
  try {
    const response = await axios.get(`${API_URL}/ocr`, { timeout: API_TIMEOUT });
    console.log('🟢 API connection successful:', response.data.message);
    return true;
  } catch (error: any) {
    console.log('🔴 API connection failed:', error.message);
    return false;
  }
};

const ScanComponent = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Image picker functionality
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
      setPredictionResult(null);
      setError(null);
    }
  };

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

  // Image upload and analysis
  const uploadImage = async () => {
    if (!selectedImage) {
      Alert.alert("No Image Selected", "Please pick an image first.");
      return;
    }

    setImageLoading(true);
    setError(null);
    setPredictionResult(null);

    try {
      // Test API connection first
      console.log(`📡 Attempting to connect to API at: ${API_URL}`);
      
      const formData = new FormData();
      
      if (Platform.OS === 'web' && selectedImage.startsWith('data:')) {
        // Handle web platform
        const contentTypeMatch = selectedImage.match(/^data:(.*?);/);
        const contentType = contentTypeMatch ? contentTypeMatch[1] : 'image/jpeg';
        const base64Data = selectedImage;
        const fileBlob = base64toBlob(base64Data, contentType);
        formData.append('image', fileBlob, 'upload.jpg');
      } else {
        // Handle mobile platforms (Expo Go)
        const localUri = selectedImage;
        const filename = localUri.split('/').pop();
        
        // Infer the type of the image
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        // Create the file object for Expo Go
        const file = {
          uri: localUri,
          name: filename || 'upload.jpg',
          type: type,
        } as any; // Type assertion needed for React Native FormData
        
        formData.append('image', file);
      }

      console.log("📱 Platform:", Platform.OS);
      console.log("🌐 API URL:", API_URL);
      console.log("📸 Selected Image URI:", selectedImage);
      console.log("📦 FormData prepared for upload");

      const response = await axios.post(`${API_URL}/ocr`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        timeout: API_TIMEOUT,
      });

      console.log("✅ Request sent to backend");
      console.log("✅ API Response:", response.data);
      
      if (response.status === 200) {
        setPredictionResult(response.data);
        Alert.alert("Upload Successful", "Image processed successfully!");
      } else {
        setError("Failed to process image. Please try again.");
      }
    } catch (error: any) {
      console.error("Upload error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
      });
      
      let errorMessage = "Upload failed: ";
      if (error.message === "Network Error") {
        errorMessage += "Could not connect to the server. Please check:\n\n" +
                       "1. Your backend server is running (python ocr.py)\n" +
                       "2. Your phone and computer are on the same WiFi network\n" +
                       "3. The IP address is correct (currently: " + API_URL + ")\n" +
                       "4. Your computer's firewall isn't blocking the connection\n\n" +
                       "Try opening " + API_URL + " in your computer's browser to test the connection.";
      } else if (error.response) {
        errorMessage += error.response.data?.error || error.response.data?.message || error.message;
      } else if (error.request) {
        errorMessage += "No response from server. Please check your connection.";
      } else {
        errorMessage += error.message;
      }
      setError(errorMessage);
      Alert.alert("Upload Failed", errorMessage);
    } finally {
      setImageLoading(false);
    }
  };

  return (
    <Animated.ScrollView style={styles.tabContent} contentContainerStyle={styles.imageTabContainer}>
      <Text style={styles.imageTabTitle}>Food Nutrition Classifier</Text>
      <Text style={styles.imageTabSubtitle}>
        Upload a food package image to analyze its nutritional content
      </Text>

      {!selectedImage ? (
        <TouchableOpacity 
          style={styles.uploadButton} 
          onPress={pickImage}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="image-plus" size={40} color="#fff" />
          <Text style={styles.uploadButtonText}>Select Image</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.imagePreviewContainer}>
          <View style={styles.imageWrapper}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          </View>
          <View style={styles.imageActionButtons}>
            <TouchableOpacity 
              style={styles.changeImageButton} 
              onPress={pickImage}
              activeOpacity={0.7}
            >
              <Text style={styles.changeImageText}>Change</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.analyzeButton} 
              onPress={uploadImage}
              disabled={imageLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.analyzeButtonText}>
                {imageLoading ? "Analyzing..." : "Analyze"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {imageLoading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loaderText}>Analyzing image...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={24} color="#D32F2F" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {predictionResult && (
        <View style={styles.predictionContainer}>
          <View style={styles.predictionHeader}>
            <MaterialCommunityIcons 
              name={predictionResult.message.toLowerCase().includes("safe") ? "check-circle" : "alert-circle"} 
              size={28} 
              color={predictionResult.message.toLowerCase().includes("safe") ? "#4CAF50" : "#FF9800"} 
            />
            <Text style={[
              styles.predictionTitle,
              {color: predictionResult.message.toLowerCase().includes("safe") ? "#4CAF50" : "#FF9800"}
            ]}>
              {predictionResult.message}
            </Text>
          </View>
          
          <Text style={styles.explanationText}>{predictionResult.explanation}</Text>
          
          {predictionResult.nutrition_data && Object.keys(predictionResult.nutrition_data).length > 0 && (
            <>
              <Text style={styles.nutritionDataTitle}>Extracted Nutrition Data:</Text>
              <View style={styles.nutritionDataGrid}>
                {Object.entries(predictionResult.nutrition_data).map(([key, value], index) => (
                  <View key={key} style={styles.nutritionDataItem}>
                    <Text style={styles.nutritionDataLabel}>{key}</Text>
                    <Text style={styles.nutritionDataValue}>
                      {value.value} {value.unit}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {predictionResult.alternatives && predictionResult.alternatives.length > 0 && (
            <View style={styles.alternativesContainer}>
              <Text style={styles.alternativesTitle}>Healthier Alternatives:</Text>
              {predictionResult.alternatives.map((alternative, index) => (
                <View key={index} style={styles.alternativeCard}>
                  <View style={styles.alternativeHeader}>
                    <Text style={styles.alternativeBrand}>{alternative["Brand Name"]}</Text>
                    <View style={[
                      styles.categoryBadge,
                      {backgroundColor: alternative.Category.toLowerCase().includes('safe') ? '#4CAF50' : '#FF9800'}
                    ]}>
                      <Text style={styles.categoryText}>{alternative.Category}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.nutrientGrid}>
                    <View style={styles.nutrientItem}>
                      <Text style={styles.nutrientLabel}>Energy</Text>
                      <Text style={styles.nutrientValue}>{alternative["ENERGY(kcal)"]} kcal</Text>
                    </View>
                    <View style={styles.nutrientItem}>
                      <Text style={styles.nutrientLabel}>Protein</Text>
                      <Text style={styles.nutrientValue}>{alternative["PROTEIN"]} g</Text>
                    </View>
                    <View style={styles.nutrientItem}>
                      <Text style={styles.nutrientLabel}>Carbs</Text>
                      <Text style={styles.nutrientValue}>{alternative["CARBOHYDRATE"]} g</Text>
                    </View>
                    <View style={styles.nutrientItem}>
                      <Text style={styles.nutrientLabel}>Total Fat</Text>
                      <Text style={styles.nutrientValue}>{alternative["TOTAL FAT"]} g</Text>
                    </View>
                    <View style={styles.nutrientItem}>
                      <Text style={styles.nutrientLabel}>Total Sugars</Text>
                      <Text style={styles.nutrientValue}>{alternative["TOTAL SUGARS"]} g</Text>
                    </View>
                    <View style={styles.nutrientItem}>
                      <Text style={styles.nutrientLabel}>Sodium</Text>
                      <Text style={styles.nutrientValue}>{alternative["SODIUM(mg)"]} mg</Text>
                    </View>
                  </View>

                  {alternative.img && (
                    <Image 
                      source={{ uri: alternative.img }} 
                      style={styles.alternativeImage}
                      resizeMode="cover"
                    />
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </Animated.ScrollView>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
    padding: 16,
  },
  imageTabContainer: {
    alignItems: "center",
    paddingBottom: 24,
  },
  imageTabTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  imageTabSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  uploadButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    width: 200,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  uploadButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    marginTop: 12,
  },
  imagePreviewContainer: {
    alignItems: "center",
    width: "100%",
    marginVertical: 20,
  },
  imageWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderRadius: 12,
  },
  previewImage: {
    width: 280,
    height: 280,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  imageActionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginTop: 16,
  },
  changeImageButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  changeImageText: {
    color: "#4CAF50",
    fontWeight: "bold",
    fontSize: 16,
  },
  analyzeButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  analyzeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
    width: "90%",
  },
  errorText: {
    color: "#D32F2F",
    marginLeft: 8,
    flex: 1,
  },
  predictionContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  predictionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  predictionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 8,
  },
  explanationText: {
    fontSize: 16,
    color: "#555",
    lineHeight: 24,
    marginBottom: 16,
  },
  nutritionDataTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
    marginBottom: 12,
  },
  nutritionDataGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  nutritionDataItem: {
    width: "50%",
    paddingVertical: 8,
    paddingRight: 8,
  },
  nutritionDataLabel: {
    fontSize: 14,
    color: "#666",
  },
  nutritionDataValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  alternativesContainer: {
    marginTop: 24,
    width: "100%",
  },
  alternativesTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  alternativeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alternativeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  alternativeBrand: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  nutrientGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  nutrientItem: {
    width: "50%",
    paddingVertical: 6,
    paddingRight: 8,
  },
  nutrientLabel: {
    fontSize: 14,
    color: "#666",
  },
  nutrientValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  alternativeImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginTop: 12,
  },
});

export default ScanComponent;
