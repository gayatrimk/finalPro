import { useState } from "react";
import { View, Text, TextInput, Button, ActivityIndicator, FlatList, StyleSheet } from "react-native";
import axios from "axios";

const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const handleSearch = async () => {
    //if (!query) return;
    if (!query.trim()) return;
    setLoading(true);
    try {
        //const data = await axios.post(`127.0.0.1:3000/products/search`,{ query });
        const data = await axios.post(`http://192.168.0.102:3000/products/search`, { query });
      console.log(data.data);
      setResults(data.data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to fetch data. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput 
          style={styles.input} 
          placeholder="Search for a food item..." 
          value={query} 
          onChangeText={setQuery} 
        />
        <Button title={loading ? "Searching..." : "Search"} onPress={handleSearch} disabled={loading} />
      </View>
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      <FlatList 
        data={results} 
        // keyExtractor={(index) => index.toString()} 
        keyExtractor={(item, index) => `${item["Brand Name"]}_${index}`} 


        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.nutrient}>Brand: {item["Brand Name"] ?? "N/A"}</Text>
            <Text style={styles.nutrient}>Energy: {item["ENERGY(kcal)"] ?? "N/A"} kcal</Text>
            <Text style={styles.nutrient}>Protein: {item["PROTEIN"] ?? "N/A"} g</Text>
            <Text style={styles.nutrient}>Carbohydrates: {item["CARBOHYDRATE"] ?? "N/A"} g</Text>
            <Text style={styles.nutrient}>Added Sugars: {item["ADDED SUGARS"] ?? "N/A"} g</Text>
            <Text style={styles.nutrient}>Total Sugars: {item["TOTAL SUGARS"] ?? "N/A"} g</Text>
            <Text style={styles.nutrient}>Total Fat: {item["TOTAL FAT"] ?? "N/A"} g</Text>
            <Text style={styles.nutrient}>Saturated Fat: {item["SATURATED FAT"] ?? "N/A"} g</Text>
            <Text style={styles.nutrient}>Trans Fat: {item["TRANS FAT"] ?? "N/A"} g</Text>
            <Text style={styles.nutrient}>Cholesterol: {item["CHOLESTEROL(mg)"] ?? "N/A"} mg</Text>
            <Text style={styles.nutrient}>Sodium: {item["SODIUM(mg)"] ?? "N/A"} mg</Text>
          </View>
        )} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginRight: 8,
    borderRadius: 5,
  },
  card: {
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  nutrient: {
    fontSize: 14,
    color: "#666",
  },
});

export default Search;