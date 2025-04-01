import { useState } from "react";
import { View, Text, TextInput, Button, ActivityIndicator, FlatList, StyleSheet } from "react-native";
import axios from "axios";

const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ name: string; nutrients: { carbohydrates?: number; protein?: number } }[]>([]);
  const [loading, setLoading] = useState(false);
  
  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
        const data = await axios.post(`127.0.0.1:3000/products/search`,{ query });
        
      console.log(data);
      setResults(data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
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
        keyExtractor={(index) => index.toString()} 
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.nutrient}>Carbs: {item.nutrients?.carbohydrates ?? "N/A"}g</Text>
            <Text style={styles.nutrient}>Protein: {item.nutrients?.protein ?? "N/A"}g</Text>
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