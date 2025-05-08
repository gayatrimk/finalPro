import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Image,
  ScrollView,
  SafeAreaView,
  Platform,
  Alert,
  StatusBar,
  Animated,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigate } from "react-router-dom";

const { width } = Dimensions.get('window');

interface NutritionValue {
  value: number | null;
  unit: string | null;
}


interface PredictionResult {
  message: string;
  explanation: string;
  nutrition_data?: { [key: string]: NutritionValue };
}

const LandingPage = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('search');
  
  // Animation values using standard Animated API
  const tabIndicatorPosition = useState(new Animated.Value(0))[0];
  const searchOpacity = useState(new Animated.Value(1))[0];
  const scanOpacity = useState(new Animated.Value(0))[0];
  
  // Search functionality states
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Image upload functionality states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Switch tabs with animation
  const switchTab = (tab: string) => {
    if (tab === activeTab) return;
    
    if (tab === 'search') {
      Animated.parallel([
        Animated.timing(tabIndicatorPosition, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(searchOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(scanOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(tabIndicatorPosition, {
          toValue: width / 2,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(searchOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(scanOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    }
    
    setActiveTab(tab);
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

  // Search functionality
  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearchLoading(true);
    try {
      const data = await axios.post(`http://192.168.31.101:3000/products/search`, { query });
      console.log(data.data);
      setSearchResults(data.data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Search Failed", "Failed to fetch data. Please check your internet connection.");
    } finally {
      setSearchLoading(false);
    }
  };

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
      const formData = new FormData();
      const filename = selectedImage.split('/').pop() || 'upload.jpg';
      let fileBlob;

      if (Platform.OS === 'web' && selectedImage.startsWith('data:')) {
        const contentTypeMatch = selectedImage.match(/^data:(.*?);/);
        const contentType = contentTypeMatch ? contentTypeMatch[1] : 'image/jpeg';
        const base64Data = selectedImage;
        fileBlob = base64toBlob(base64Data, contentType);
        formData.append('image', fileBlob, filename);
      } else {
        const fileExt = selectedImage.split('.').pop();
        const mimeType = fileExt ? `image/${fileExt}` : "image/jpeg";
        const photo: any = {
          uri: selectedImage,
          type: mimeType,
          name: filename,
        };
        formData.append('image', photo);
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
        setError("Failed to process image. Please try again.");
      }
    } catch (error: any) {
      console.error("Upload error:", error.message);
      setError("Upload failed: " + error.message);
      Alert.alert("Upload Failed", "Something went wrong.");
    } finally {
      setImageLoading(false);
    }
  };

  const navigation = useNavigate();

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      navigation("/"); // or navigate depending on your stack
    } catch (e) {
      console.error("Failed to logout:", e);
    }
  };
  

  // Render search tab content
  const renderSearchTab = () => (
    <Animated.View 
      style={[
        styles.tabContent, 
        { opacity: searchOpacity, display: activeTab === 'search' ? 'flex' : 'none' }
      ]}
    >
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a food item..."
          value={query}
          onChangeText={setQuery}
          placeholderTextColor="#888"
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={searchLoading}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>
            {searchLoading ? "Searching..." : "Search"}
          </Text>
        </TouchableOpacity>
      </View>

      {searchLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item, index) => `${item["Brand Name"] || "item"}_${index}`}
          renderItem={({ item, index }) => {
            // Create a new Animated.Value for each item
            const itemOpacity = new Animated.Value(0);
            const itemTranslateY = new Animated.Value(50);
            
            // Start the animation after a delay based on the item's index
            Animated.parallel([
              Animated.timing(itemOpacity, {
                toValue: 1,
                duration: 300,
                delay: index * 100,
                useNativeDriver: true
              }),
              Animated.timing(itemTranslateY, {
                toValue: 0,
                duration: 300,
                delay: index * 100,
                useNativeDriver: true
              })
            ]).start();
            
            return (
              <Animated.View 
                style={[
                  styles.resultCard, 
                  { 
                    opacity: itemOpacity,
                    transform: [{ translateY: itemTranslateY }],
                    flexDirection: "row",  // Add row layout
                    justifyContent: "space-between",
                  }
                ]}
              >
                <View style={{ flex: 2, paddingRight: 10 }}>
                  <Text style={styles.brandName}>{item["Brand Name"] ?? "Unknown Brand"}</Text>
                  <View style={styles.divider} />

                  <View style={styles.nutrientGrid}>
                    <View style={styles.nutrientItem}>
                      <Text style={styles.nutrientLabel}>Energy</Text>
                      <Text style={styles.nutrientValue}>{item["ENERGY(kcal)"] ?? "N/A"} kcal</Text>
                    </View>
                    <View style={styles.nutrientItem}>
                      <Text style={styles.nutrientLabel}>Protein</Text>
                      <Text style={styles.nutrientValue}>{item["PROTEIN"] ?? "N/A"} g</Text>
                    </View>
                    <View style={styles.nutrientItem}>
                      <Text style={styles.nutrientLabel}>Carbs</Text>
                      <Text style={styles.nutrientValue}>{item["CARBOHYDRATE"] ?? "N/A"} g</Text>
                    </View>
                    <View style={styles.nutrientItem}>
                      <Text style={styles.nutrientLabel}>Total Fat</Text>
                      <Text style={styles.nutrientValue}>{item["TOTAL FAT"] ?? "N/A"} g</Text>
                    </View>
                    <View style={styles.nutrientItem}>
                      <Text style={styles.nutrientLabel}>Total Sugars</Text>
                      <Text style={styles.nutrientValue}>{item["TOTAL SUGARS"] ?? "N/A"} g</Text>
                    </View>
                    <View style={styles.nutrientItem}>
                      <Text style={styles.nutrientLabel}>Sodium</Text>
                      <Text style={styles.nutrientValue}>{item["SODIUM(mg)"] ?? "N/A"} mg</Text>
                    </View>
                  </View>
                </View>

                {/* Right Column: Image */}
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                  {item["img"] ? (
                    <Image
                      source={{ uri: item["img"] }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.nutrient}>Image: N/A</Text>
                  )}
                </View>
                {/* <TouchableOpacity style={styles.viewMoreButton} activeOpacity={0.7}>
                  <Text style={styles.viewMoreText}>View Details</Text>
                </TouchableOpacity> */}
              </Animated.View>
            );
          }}
          ListEmptyComponent={
            query.trim() ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No results found</Text>
              </View>
            ) : null
          }
        />
      )}
    </Animated.View>
  );

  // Render image analysis tab content
  const renderImageTab = () => (
    <Animated.ScrollView 
      style={[
        styles.tabContent, 
        { opacity: scanOpacity, display: activeTab === 'scan' ? 'flex' : 'none' }
      ]} 
      contentContainerStyle={styles.imageTabContainer}
    >
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
        </View>
      )}
    </Animated.ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FoodX</Text>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <MaterialCommunityIcons name="logout" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={styles.tab} 
          onPress={() => switchTab('search')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name="magnify" 
            size={24} 
            color={activeTab === 'search' ? "#4CAF50" : "#757575"} 
          />
          <Text style={activeTab === 'search' ? styles.activeTabText : styles.tabText}>
            Search
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tab} 
          onPress={() => switchTab('scan')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name="camera" 
            size={24} 
            color={activeTab === 'scan' ? "#4CAF50" : "#757575"} 
          />
          <Text style={activeTab === 'scan' ? styles.activeTabText : styles.tabText}>
            Scan
          </Text>
        </TouchableOpacity>
        
        <Animated.View 
          style={[
            styles.tabIndicator, 
            { transform: [{ translateX: tabIndicatorPosition }] }
          ]} 
        />
      </View>
      
      {renderSearchTab()}
      {renderImageTab()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    position: "relative",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    width: width / 2,
    height: 3,
    backgroundColor: "#4CAF50",
  },
  tabText: {
    color: "#757575",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
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
  resultCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  brandName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 8,
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
  viewMoreButton: {
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  viewMoreText: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  // Image tab styles
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
  nutrient: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  image: {
    width: 300,
    height: 300,
    borderRadius: 8,
  },
  
  
});

export default LandingPage;