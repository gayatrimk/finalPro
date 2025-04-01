import React, { useState } from "react";
import { View, Button, Image, Alert, StyleSheet, ActivityIndicator, Text } from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";

const ImageUploadScreen = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Pick Image Function
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "You need to grant permission to access images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // ✅ Corrected mediaTypes
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // Upload Image Function
  const uploadImage = async () => {
    if (!selectedImage) {
      Alert.alert("No Image Selected", "Please pick an image first.");
      return;
    }

    setLoading(true);
    try {
        const formData = new FormData();
        const filename = selectedImage.split('/').pop();
        const fileExt = selectedImage.split('.').pop();
        const mimeType = fileExt ? `image/${fileExt}` : "image/jpeg";
    
        // Ensure the file is properly structured for React Native
        formData.append("image", {
          uri: selectedImage,
          name: filename || "upload.jpg",
          type: mimeType,
        } as any);
    console.log("✅ Selected Image URI:");
    console.log("✅ FormData before sending:", formData);

      const response = await axios.post("http://127.0.0.1:3000/products/scan", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("✅ Request backend la geliy");

      if (response.status === 200) {
        Alert.alert("Upload Successful", "Your image has been uploaded.");
        fun1(); // ✅ Call fun1 after successful upload
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Upload Failed", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Function to Run After Successful Upload
  const fun1 = () => {
    Alert.alert("Function Triggered", "fun1() executed successfully!");
  };

  return (
    <View style={styles.container}>
      {!selectedImage && <Button title="Pick an Image" onPress={pickImage} />}

      {selectedImage && (
        <>
          <Image source={{ uri: selectedImage }} style={styles.image} />
          <Button title="Upload Image" onPress={uploadImage} color="#1E90FF" />
        </>
      )}

      {loading && <ActivityIndicator size="large" color="#1E90FF" style={styles.loader} />}
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
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
});

export default ImageUploadScreen;
