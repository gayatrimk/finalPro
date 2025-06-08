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
} from "react-native";
import axios from "axios";

const SEARCH_API_URL = 'http://192.168.178.249:3000';
const API_TIMEOUT = 5000;

const SearchComponent = () => {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

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

  return (
    <Animated.View style={styles.tabContent}>
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
            const itemOpacity = new Animated.Value(0);
            const itemTranslateY = new Animated.Value(50);
            
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
                    flexDirection: "row",
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
                    <View style={styles.nutrientItem}>
                      <Text style={styles.nutrientLabel}>Category</Text>
                      <Text style={styles.nutrientValue}>{item["Category"] ?? "N/A"}</Text>
                    </View>
                  </View>
                </View>

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
};

const styles = StyleSheet.create({
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
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
});

export default SearchComponent;
