import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import axios from "axios";
// import { Link } from "react-router-native";
import { useNavigate } from "react-router-dom";

const SignIn = () => {
  console.log("process started");  // First log

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [redirect, setRedirect] = useState(false);

  const handleSignIn = async () => {
    console.log("🔹 Button Clicked!");

    try {
      console.log("Sending request to backend...");
      const response = await axios.post("http://127.0.0.1:3000/users/signin", { email, password });

      console.log("Response received:", response.data);

      if (response.status === 200) {
        Alert.alert("Success", "Login Successful!");
        setRedirect(true);
        console.log("yeeeeeeeeeeeeeeeeeeeeeeeeeeee");
        navigate("/search"); 
      } else {
        Alert.alert("Error", "Unexpected response from server.");
      }

      console.log("Token:", response.data.token);
    } catch (error) {
      Alert.alert("Error", "Invalid Credentials or Server Issue.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>

      <Text style={styles.label}>Email:</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>Password:</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Enter your password"
        placeholderTextColor="#888"
      />

      <View style={styles.buttonContainer}>
        <Button title="SUBMIT" onPress={handleSignIn} color="#1E90FF" />
      </View>

    </View>
  );
};

console.log("🔹 App Loaded!");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  label: {
    alignSelf: "flex-start",
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
    marginBottom: 5,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 15,
  },
  buttonContainer: {
    width: "100%",
    marginTop: 10,
  },
  linkText: {
    marginTop: 20,
    fontSize: 16,
    color: "#1E90FF",
    fontWeight: "bold",
  },
});

export default SignIn;
