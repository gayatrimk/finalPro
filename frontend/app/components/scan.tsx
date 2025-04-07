import React, { useState, useEffect } from "react"; // Import useEffect
import { View, Button, Image, Alert, StyleSheet, ActivityIndicator, Text, Platform } from "react-native"; // Import Platform
import * as ImagePicker from "expo-image-picker";
import axios from "axios";

const ImageUploadScreen = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

      console.log("✅ Selected Image URI (before FormData log):",selectedImage);
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

      console.log("✅ Request backend la geliy");
      console.log("✅ API Response:", response);
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