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
import { useRouter } from "expo-router";
import Chatbot from './chatbot';

const width = Dimensions.get('window').width;
const tabWidth = width / 3;

// Add API URL configuration
const API_URL = Platform.OS === 'web' ? 'http://127.0.0.1:5001' : 'http://192.168.178.249:5001';
const SEARCH_API_URL = 'http://192.168.178.249:3000';
const API_TIMEOUT = 5000; // 5 seconds timeout

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

const LandingPage = () => {
  // Add sidebar animation value
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarAnimation = useState(new Animated.Value(500))[0];
  
  // Tab state
  const [activeTab, setActiveTab] = useState('search');
  
  // Animation values using standard Animated API
  const tabIndicatorPosition = useState(new Animated.Value(0))[0];
  const searchOpacity = useState(new Animated.Value(1))[0];
  const scanOpacity = useState(new Animated.Value(0))[0];
  const blogOpacity = useState(new Animated.Value(0))[0];
  
  // Search functionality states
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Image upload functionality states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Add state for blogs
  const [blogs, setBlogs] = useState<Array<{
    id: string;
    date: string;
    title: string;
    snippet: string;
    content: string;
    image: string;
    likes: number;
    comments: Array<{
      id: number;
      text: string;
      date: string;
    }>;
  }>>([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [blogsError, setBlogsError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  const router = useRouter();

  // Toggle sidebar function with animation
  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? 500 : 0;
    Animated.spring(sidebarAnimation, {
      toValue,
      useNativeDriver: true,
    }).start();
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Switch tabs with animation
  const switchTab = (tab: string) => {
    if (tab === activeTab) return;

    let toValue = 0;
    if (tab === 'scan') toValue = tabWidth;
    else if (tab === 'blog') toValue = tabWidth * 2;
    
    Animated.parallel([
      Animated.timing(tabIndicatorPosition, {
        toValue,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(searchOpacity, {
        toValue: tab === 'search' ? 1 : 0,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(scanOpacity, {
        toValue: tab === 'scan' ? 1 : 0,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(blogOpacity, {
        toValue: tab === 'blog' ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
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
    setSearchResults([]);
    try {
      console.log('Making search request to:', `${SEARCH_API_URL}/products/search`);
      const response = await axios.post(
        `${SEARCH_API_URL}/products/search`, 
        { query },
        {
          timeout: API_TIMEOUT,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.data) {
        console.log('Search results count:', response.data.data.length);
        setSearchResults(response.data.data);
      } else {
        console.error('Invalid search response format:', response.data);
        Alert.alert(
          "Search Error", 
          "Received invalid data format from server. Please try again."
        );
      }
    } catch (error: any) {
      console.error("Search error:", error);
      let errorMessage = 'Failed to fetch search results. ';
      if (error.code === 'ECONNABORTED') {
        errorMessage += 'Request timed out. ';
      } else if (error.response) {
        errorMessage += `Server error: ${error.response.status}. `;
      } else if (error.request) {
        errorMessage += 'No response from server. ';
      } else {
        errorMessage += error.message;
      }
      Alert.alert("Search Failed", errorMessage + "Please try again.");
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
      
      if (Platform.OS === 'web' && selectedImage.startsWith('data:')) {
        // Handle web platform
        const contentTypeMatch = selectedImage.match(/^data:(.*?);/);
        const contentType = contentTypeMatch ? contentTypeMatch[1] : 'image/jpeg';
        const base64Data = selectedImage;
        const fileBlob = base64toBlob(base64Data, contentType);
        formData.append('image', fileBlob, 'upload.jpg');
      } else {
        // Handle mobile platforms
        const localUri = selectedImage;
        const filename = localUri.split('/').pop();
        
        // Infer the type of the image
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('image', {
          uri: localUri,
          name: filename || 'upload.jpg',
          type,
        } as any);
      }

      console.log("✅ Selected Image URI:", selectedImage);
      console.log("✅ FormData prepared for upload");

      const response = await axios.post(`${API_URL}/ocr`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        transformRequest: (data, headers) => {
          return formData;
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
      console.error("Upload error:", error);
      let errorMessage = "Upload failed: ";
      if (error.response) {
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

  const handleReadBlog = () => {
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      router.replace("/(auth)/login");
    } catch (e) {
      console.error("Failed to logout:", e);
    }
  };
  
  const fetchBlogs = async () => {
    console.log('Starting to fetch blogs...');
    setBlogsLoading(true);
    setBlogsError(null);
    try {
      console.log('Making API request to:', `${API_URL}/blogs`);
      const response = await axios.get(`${API_URL}/blogs`, {
        timeout: API_TIMEOUT,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      //console.log('Received blog data:', response.data);
      if (Array.isArray(response.data)) {
        setBlogs(response.data);
      } else {
        console.error('Invalid blog data format:', response.data);
        setBlogsError('Received invalid data format from server');
      }
    } catch (error: any) {
      console.error('Error fetching blogs:', error);
      console.error('Error details:', error.response || error.message);
      let errorMessage = 'Failed to load blogs. ';
      if (error.code === 'ECONNABORTED') {
        errorMessage += 'Request timed out. ';
      } else if (error.response) {
        errorMessage += `Server error: ${error.response.status}. `;
      } else if (error.request) {
        errorMessage += 'No response from server. ';
      } else {
        errorMessage += error.message;
      }
      setBlogsError(errorMessage + 'Please try again.');
    } finally {
      setBlogsLoading(false);
    }
  };

  // Add useEffect to fetch blogs
  useEffect(() => {
    if (activeTab === 'blog') {
      console.log('Blog tab active, fetching blogs...');
      fetchBlogs();
    }
  }, [activeTab]);

  const handleLikeBlog = async (blogId: string) => {
    try {
      const response = await axios.post(`${API_URL}/blogs/${blogId}/like`);
      setBlogs(blogs.map(blog => 
        blog.id === blogId 
          ? { ...blog, likes: response.data.likes }
          : blog
      ));
    } catch (error) {
      console.error('Error liking blog:', error);
      Alert.alert('Error', 'Failed to like the blog post.');
    }
  };

  const handleAddComment = async (blogId: string) => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment.');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/blogs/${blogId}/comment`, {
        comment: newComment
      });
      
      setBlogs(blogs.map(blog => 
        blog.id === blogId 
          ? { ...blog, comments: [...blog.comments, response.data] }
          : blog
      ));
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment.');
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
              <View 
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
              </View>
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

  const renderBlogTab = () => {
    const [selected, setSelected] = useState<string | null>(null);
  
    // Helper function to get the selected blog
    const getSelectedBlog = () => {
      return blogs.find(blog => blog.id === selected);
    };

    if (blogsLoading) {
      console.log('Showing loading state...');
      return (
        <Animated.View
          style={[
            styles.tabContent,
            { opacity: blogOpacity, display: activeTab === 'blog' ? 'flex' : 'none' }
          ]}
        >
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loaderText}>Loading blogs...</Text>
          </View>
        </Animated.View>
      );
    }

    if (blogsError) {
      console.log('Showing error state:', blogsError);
      return (
        <Animated.View
          style={[
            styles.tabContent,
            { opacity: blogOpacity, display: activeTab === 'blog' ? 'flex' : 'none' }
          ]}
        >
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={24} color="#D32F2F" />
            <Text style={styles.errorText}>{blogsError}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => {
                console.log('Retrying blog fetch...');
                if (activeTab === 'blog') {
                  setBlogsLoading(true);
                  setBlogsError(null);
                  fetchBlogs();
                }
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      );
    }
  
    const selectedBlog = getSelectedBlog();

    return (
      <Animated.View
        style={[
          styles.tabContent,
          { opacity: blogOpacity, display: activeTab === 'blog' ? 'flex' : 'none' }
        ]}
      >
        <View style={styles.headerBox}>
          <Text style={styles.blogHeader}>📰 Health Insights Blog</Text>
          <Text style={styles.blogSubheader}>Read, Learn, and Eat Smart</Text>
        </View>
  
        {selected && selectedBlog ? (
          <ScrollView style={styles.blogDetail}>
            <Text style={styles.blogDate}>{selectedBlog.date}</Text>
            <Text style={styles.blogTitle}>{selectedBlog.title}</Text>
            <Image
              source={{ uri: selectedBlog.image }}
              style={styles.blogImageLarge}
              resizeMode="cover"
            />
            <View style={styles.blogContentContainer}>
              {selectedBlog.content.split('\n\n').map((paragraph: string, index: number) => (
                <Text key={index} style={styles.blogContent}>
                  {paragraph.replace(/\n/g, ' ')}
                </Text>
              ))}
            </View>

            <View style={styles.interactionSection}>
              <TouchableOpacity 
                style={styles.likeButton} 
                onPress={() => handleLikeBlog(selected)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons 
                  name="heart" 
                  size={24} 
                  color="#4CAF50" 
                />
                <Text style={styles.likeCount}>{selectedBlog.likes} likes</Text>
              </TouchableOpacity>

              <View style={styles.commentSection}>
                <Text style={styles.commentHeader}>Comments</Text>
                <View style={styles.commentInput}>
                  <TextInput
                    style={styles.commentTextInput}
                    value={newComment}
                    onChangeText={setNewComment}
                    placeholder="Add a comment..."
                    multiline
                  />
                  <TouchableOpacity 
                    style={styles.commentButton}
                    onPress={() => handleAddComment(selected)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.commentButtonText}>Post</Text>
                  </TouchableOpacity>
                </View>

                {selectedBlog.comments.map((comment: { id: number; text: string; date: string }) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <Text style={styles.commentDate}>{comment.date}</Text>
                    <Text style={styles.commentText}>{comment.text}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity onPress={() => setSelected(null)} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back to articles</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.blogList}>
            {blogs.map((article) => {
              const fadeAnim = new Animated.Value(0);
              const translateY = new Animated.Value(50);
  
              Animated.parallel([
                Animated.timing(fadeAnim, {
                  toValue: 1,
                  duration: 300,
                  delay: parseInt(article.id) * 100,
                  useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                  toValue: 0,
                  duration: 300,
                  delay: parseInt(article.id) * 100,
                  useNativeDriver: true,
                }),
              ]).start();
  
              return (
                <Animated.View
                  key={article.id}
                  style={[
                    styles.blogCard,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY }],
                    },
                  ]}
                >
                  <TouchableOpacity onPress={() => setSelected(article.id)} activeOpacity={0.8}>
                    <Image source={{ uri: article.image }} style={styles.blogImage} />
                    <View style={styles.blogTextContent}>
                      <Text style={styles.blogTitleSmall}>{article.title}</Text>
                      <Text style={styles.blogSnippet}>{article.snippet}</Text>
                      <View style={styles.blogMetrics}>
                        <View style={styles.metricItem}>
                          <MaterialCommunityIcons name="heart" size={16} color="#4CAF50" />
                          <Text style={styles.metricText}>{article.likes}</Text>
                        </View>
                        <View style={styles.metricItem}>
                          <MaterialCommunityIcons name="comment" size={16} color="#4CAF50" />
                          <Text style={styles.metricText}>{article.comments.length}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </ScrollView>
        )}
      </Animated.View>
    );
  };

  return (
    
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FoodX</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.chatButton}>
            <MaterialCommunityIcons name="chat" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Add Sidebar */}
      <Animated.View style={[
        styles.sidebar,
        {
          transform: [{
            translateX: sidebarAnimation
          }]
        }
      ]}>
        <View style={styles.sidebarHeader}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.closeSidebar}>
            <MaterialCommunityIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <Chatbot />
      </Animated.View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, { width: tabWidth }]} 
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
          style={[styles.tab, { width: tabWidth }]} 
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

        <TouchableOpacity 
          style={[styles.tab, { width: tabWidth }]} 
          onPress={() => switchTab('blog')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name="receipt" 
            size={24} 
            color={activeTab === 'blog' ? "#4CAF50" : "#757575"} 
          />
          <Text style={activeTab === 'blog' ? styles.activeTabText : styles.tabText}>
            Read Blog
          </Text>
        </TouchableOpacity>
        
        <Animated.View 
          style={[
            styles.tabIndicator, 
            { 
              transform: [{ translateX: tabIndicatorPosition }],
              width: tabWidth
            }
          ]} 
        />
      </View>
      
      {renderSearchTab()}
      {renderImageTab()}
      {renderBlogTab()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  
  interactionSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    width: Platform.OS === 'web' ? '60%' : '90%',
    alignSelf: 'center',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 10 : 8,
  },
  likeCount: {
    marginLeft: 8,
    color: '#666',
    fontSize: Platform.OS === 'web' ? 16 : 14,
  },
  commentSection: {
    marginTop: 20,
    width: Platform.OS === 'web' ? '60%' : '90%',
    alignSelf: 'center',
  },
  commentHeader: {
    fontSize: Platform.OS === 'web' ? 18 : 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  commentInput: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
    width: '100%',
  },
  commentTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: Platform.OS === 'web' ? 12 : 8,
    marginRight: 8,
    minHeight: 40,
    fontSize: Platform.OS === 'web' ? 14 : 13,
  },
  commentButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: Platform.OS === 'web' ? 12 : 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: Platform.OS === 'web' ? 80 : 60,
  },
  commentButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: Platform.OS === 'web' ? 14 : 12,
  },
  commentItem: {
    backgroundColor: '#f5f5f5',
    padding: Platform.OS === 'web' ? 12 : 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentDate: {
    fontSize: Platform.OS === 'web' ? 12 : 10,
    color: '#666',
    marginBottom: 4,
  },
  commentText: {
    fontSize: Platform.OS === 'web' ? 14 : 13,
    color: '#333',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  chatButton: {
    padding: 8,
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
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    flexDirection: "row",
    gap: 8,
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
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

  blogHeader: {
    fontSize: Platform.OS === 'web' ? 22 : 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginTop: Platform.OS === 'web' ? 10 : 8,
  },

  blogSubheader: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    color: "#666",
    textAlign: "center",
    
  },
  blogList: {
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  blogCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: Platform.OS === 'web' ? '60%' : '90%',
    alignSelf: 'center',
  },
  blogImage: {
    width: '100%',
    height: Platform.OS === 'web' ? 180 : 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  blogTextContent: {
    gap: 8,
    width: '100%',
  },
  blogTitleSmall: {
    fontSize: Platform.OS === 'web' ? 20 : 18,
    fontWeight: "600",
    color: '#333333',
    marginBottom: 8,
    lineHeight: Platform.OS === 'web' ? 24 : 22,
    textAlign: 'left',
  },
  blogSnippet: {
    fontSize: Platform.OS === 'web' ? 14 : 13,
    color: '#666666',
    lineHeight: Platform.OS === 'web' ? 20 : 18,
    textAlign: 'left',
    paddingHorizontal: 4,
  },
  blogDetail: {
    flex: 1,
    padding: Platform.OS === 'web' ? 24 : 16,
    backgroundColor: '#F7FAFC',
  },
  blogDate: {
    fontSize: Platform.OS === 'web' ? 14 : 12,
    color: '#718096',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  blogTitle: {
    fontSize: Platform.OS === 'web' ? 32 : 24,
    fontWeight: 'bold',
    color: '#1A365D',
    marginBottom: 16,
    textAlign: 'center',
    width: Platform.OS === 'web' ? '70%' : '90%',
    alignSelf: 'center',
    letterSpacing: 0.5,
    lineHeight: Platform.OS === 'web' ? 40 : 32,
  },
  blogImageLarge: {
    width: Platform.OS === 'web' ? '60%' : '90%',
    height: Platform.OS === 'web' ? width * 0.2 : width * 0.5,
    borderRadius: 16,
    marginBottom: 24,
    alignSelf: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  blogContent: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    lineHeight: Platform.OS === 'web' ? 26 : 22,
    color: '#2C3E50',
    marginBottom: 16,
    textAlign: 'left',
    paddingHorizontal: Platform.OS === 'web' ? 16 : 12,
    flexWrap: 'wrap',
    width: Platform.OS === 'web' ? '60%' : '90%',
    alignSelf: 'center',
    letterSpacing: 0.3,
  },
  blogContentContainer: {
    marginTop: 20,
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: Platform.OS === 'web' ? 24 : 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  
  backButton: {
    marginTop: 32,
    marginBottom: 24,
    padding: Platform.OS === 'web' ? 16 : 12,
    backgroundColor: '#EDF2F7',
    borderRadius: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    color: '#2D3748',
    fontWeight: '600',
  },
  
  sidebar: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 500,
    height: '100%',
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  sidebarHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeSidebar: {
    padding: 8,
  },
  headerBox: {
    padding: Platform.OS === 'web' ? 15 : 12,
    marginBottom: Platform.OS === 'web' ? 10 : 8,
  },
  blogMetrics: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: Platform.OS === 'web' ? 14 : 12,
    color: '#666666',
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  alternativesContainer: {
    marginTop: 24,
    width: '100%',
  },
  alternativesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  alternativeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alternativeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alternativeBrand: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  alternativeImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 12,
  },
});

export default LandingPage;