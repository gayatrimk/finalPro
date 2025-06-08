import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Image,
  Platform,
  Alert,
  Animated,
  Dimensions,
  useWindowDimensions,
} from "react-native";
import axios from "axios";

const SEARCH_API_URL = Platform.OS === 'web' ? 'http://127.0.0.1:3000' : 'http://192.168.88.249:3000';
const API_TIMEOUT = 5000;

const getCategoryColor = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'ok':
      return '#006400'; // Dark green
    case 'safe':
      return '#4CAF50'; // Green
    case 'harmful':
      return '#FF6B6B'; // Light red
    case 'very harmful':
      return '#8B0000'; // Dark red
    default:
      return '#666666'; // Default gray
  }
};

const CategoryIndicator = ({ category }: { category: string }) => {
  const color = getCategoryColor(category);
  const [isPressed, setIsPressed] = useState(false);

  return (
    <View style={[styles.categoryBanner, { backgroundColor: color + '20' }]}>
      <Text style={[styles.categoryText, { color }]}>
        {category?.toUpperCase() ?? "N/A"}
      </Text>
    </View>
  );
};

const SearchComponent = () => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Calculate responsive sizes
  const isTablet = windowWidth >= 768;
  const isMobile = windowWidth < 768;
  const cardPadding = isTablet ? 24 : 16;
  const imageSize = isMobile 
    ? Math.min(windowWidth * 0.8, 300)  // 80% of screen width on mobile
    : isTablet 
      ? Math.min(windowWidth * 0.3, 400) 
      : Math.min(windowWidth * 0.4, 320);
  const isLandscape = windowWidth > windowHeight;

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearchLoading(true);
    setSearchResults([]);
    try {
      //console.log('Making search request to:', ${SEARCH_API_URL}/products/search);
      const response = await axios.post(`${SEARCH_API_URL}/products/search`,{ query },
        {timeout: API_TIMEOUT,
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

  return (
    <Animated.View style={styles.tabContent}>
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput, 
            { 
              fontSize: isTablet ? 18 : 16,
              height: isMobile ? 48 : 56
            }
          ]}
          placeholder="Search for a food item..."
          value={query}
          onChangeText={setQuery}
          placeholderTextColor="#888"
        />
        <TouchableOpacity
          style={[
            styles.searchButton, 
            { 
              paddingHorizontal: isTablet ? 24 : 16,
              height: isMobile ? 48 : 56
            }
          ]}
          onPress={handleSearch}
          disabled={searchLoading}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, { fontSize: isTablet ? 18 : 16 }]}>
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
            const itemOpacity = new Animated.Value(0);
            const itemTranslateY = new Animated.Value(50);
            const categoryColor = getCategoryColor(item["Category"]);
            
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
                    borderLeftWidth: 8,
                    borderLeftColor: categoryColor,
                    padding: cardPadding,
                  }
                ]}
              >
                <CategoryIndicator category={item["Category"]} />
                
                <View style={[
                  styles.cardContent,
                  isLandscape && styles.landscapeLayout,
                  isMobile && styles.mobileLayout
                ]}>
                  {isMobile ? (
                    // Mobile layout: Image first, then details
                    <>
                      <View style={styles.mobileImageContainer}>
                        {item["img"] ? (
                          <Image
                            source={{ uri: item["img"] }}
                            style={[
                              styles.image,
                              {
                                width: imageSize,
                                height: imageSize,
                              }
                            ]}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={[styles.nutrient, { fontSize: isTablet ? 16 : 14 }]}>Image: N/A</Text>
                        )}
                      </View>
                      <View style={styles.mobileDetailsContainer}>
                        <Text style={[styles.brandName, { fontSize: isTablet ? 22 : 18 }]}>
                          {item["Brand Name"] ?? "Unknown Brand"}
                        </Text>
                        <View style={styles.divider} />
                        <View style={styles.mobileNutrientGrid}>
                          <View style={styles.nutrientItem}>
                            <Text style={[styles.nutrientLabel, { fontSize: isTablet ? 16 : 14 }]}>Energy</Text>
                            <Text style={[styles.nutrientValue, { fontSize: isTablet ? 18 : 16 }]}>{item["ENERGY(kcal)"] ?? "N/A"} kcal</Text>
                          </View>
                          <View style={styles.nutrientItem}>
                            <Text style={[styles.nutrientLabel, { fontSize: isTablet ? 16 : 14 }]}>Protein</Text>
                            <Text style={[styles.nutrientValue, { fontSize: isTablet ? 18 : 16 }]}>{item["PROTEIN"] ?? "N/A"} g</Text>
                          </View>
                          <View style={styles.nutrientItem}>
                            <Text style={[styles.nutrientLabel, { fontSize: isTablet ? 16 : 14 }]}>Carbs</Text>
                            <Text style={[styles.nutrientValue, { fontSize: isTablet ? 18 : 16 }]}>{item["CARBOHYDRATE"] ?? "N/A"} g</Text>
                          </View>
                          <View style={styles.nutrientItem}>
                            <Text style={[styles.nutrientLabel, { fontSize: isTablet ? 16 : 14 }]}>Total Fat</Text>
                            <Text style={[styles.nutrientValue, { fontSize: isTablet ? 18 : 16 }]}>{item["TOTAL FAT"] ?? "N/A"} g</Text>
                          </View>
                          <View style={styles.nutrientItem}>
                            <Text style={[styles.nutrientLabel, { fontSize: isTablet ? 16 : 14 }]}>Total Sugars</Text>
                            <Text style={[styles.nutrientValue, { fontSize: isTablet ? 18 : 16 }]}>{item["TOTAL SUGARS"] ?? "N/A"} g</Text>
                          </View>
                          <View style={styles.nutrientItem}>
                            <Text style={[styles.nutrientLabel, { fontSize: isTablet ? 16 : 14 }]}>Sodium</Text>
                            <Text style={[styles.nutrientValue, { fontSize: isTablet ? 18 : 16 }]}>{item["SODIUM(mg)"] ?? "N/A"} mg</Text>
                          </View>
                        </View>
                      </View>
                    </>
                  ) : (
                    // Tablet/Desktop layout: Side by side
                    <View style={[
                      styles.mainContent,
                      isLandscape && styles.landscapeMainContent
                    ]}>
                      <View style={[
                        styles.detailsContainer,
                        { flex: isLandscape ? 1.2 : 0.8 }
                      ]}>
                        <Text style={[styles.brandName, { fontSize: isTablet ? 22 : 18 }]}>
                          {item["Brand Name"] ?? "Unknown Brand"}
                        </Text>
                        <View style={styles.divider} />
                        <View style={[
                          styles.nutrientGrid,
                          { gap: isTablet ? 16 : 8 }
                        ]}>
                          <View style={styles.nutrientItem}>
                            <Text style={[styles.nutrientLabel, { fontSize: isTablet ? 16 : 14 }]}>Energy</Text>
                            <Text style={[styles.nutrientValue, { fontSize: isTablet ? 18 : 16 }]}>{item["ENERGY(kcal)"] ?? "N/A"} kcal</Text>
                          </View>
                          <View style={styles.nutrientItem}>
                            <Text style={[styles.nutrientLabel, { fontSize: isTablet ? 16 : 14 }]}>Protein</Text>
                            <Text style={[styles.nutrientValue, { fontSize: isTablet ? 18 : 16 }]}>{item["PROTEIN"] ?? "N/A"} g</Text>
                          </View>
                          <View style={styles.nutrientItem}>
                            <Text style={[styles.nutrientLabel, { fontSize: isTablet ? 16 : 14 }]}>Carbs</Text>
                            <Text style={[styles.nutrientValue, { fontSize: isTablet ? 18 : 16 }]}>{item["CARBOHYDRATE"] ?? "N/A"} g</Text>
                          </View>
                          <View style={styles.nutrientItem}>
                            <Text style={[styles.nutrientLabel, { fontSize: isTablet ? 16 : 14 }]}>Total Fat</Text>
                            <Text style={[styles.nutrientValue, { fontSize: isTablet ? 18 : 16 }]}>{item["TOTAL FAT"] ?? "N/A"} g</Text>
                          </View>
                          <View style={styles.nutrientItem}>
                            <Text style={[styles.nutrientLabel, { fontSize: isTablet ? 16 : 14 }]}>Total Sugars</Text>
                            <Text style={[styles.nutrientValue, { fontSize: isTablet ? 18 : 16 }]}>{item["TOTAL SUGARS"] ?? "N/A"} g</Text>
                          </View>
                          <View style={styles.nutrientItem}>
                            <Text style={[styles.nutrientLabel, { fontSize: isTablet ? 16 : 14 }]}>Sodium</Text>
                            <Text style={[styles.nutrientValue, { fontSize: isTablet ? 18 : 16 }]}>{item["SODIUM(mg)"] ?? "N/A"} mg</Text>
                          </View>
                        </View>
                      </View>
                      <View style={[
                        styles.imageContainer,
                        { flex: isLandscape ? 0.8 : 1.2 }
                      ]}>
                        {item["img"] ? (
                          <Image
                            source={{ uri: item["img"] }}
                            style={[
                              styles.image,
                              {
                                width: imageSize,
                                height: imageSize,
                              }
                            ]}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={[styles.nutrient, { fontSize: isTablet ? 16 : 14 }]}>Image: N/A</Text>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              </Animated.View>
            );
          }}
          ListEmptyComponent={
            query.trim() ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { fontSize: isTablet ? 18 : 16 }]}>No results found</Text>
              </View>
            ) : null
          }
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
    paddingHorizontal: 4,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
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
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  resultCard: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  brandName: {
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
    color: "#666",
  },
  nutrientValue: {
    fontWeight: "500",
    color: "#333",
  },
  nutrient: {
    color: "#666",
    marginBottom: 4,
  },
  image: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
  },
  categoryBanner: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  categoryText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cardContent: {
    padding: 16,
  },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  landscapeLayout: {
    padding: 8,
  },
  landscapeMainContent: {
    gap: 24,
  },
  detailsContainer: {
    paddingRight: 16,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  mobileLayout: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  mobileImageContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileDetailsContainer: {
    width: '100%',
  },
  mobileNutrientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});

export default SearchComponent;