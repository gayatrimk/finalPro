import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import axios from "axios";

const SignUp = () => {
  console.log("🔹 SignUp Component Loaded");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const handleSignUp = async () => {
    console.log("🔹 SignUp Button Clicked!");
    try {
      console.log("Sending sign-up request to backend...");
      const response = await axios.post("http://127.0.0.1:3000/users/signup", {
        name,
        email,
        password,
        passwordConfirm
      });

      console.log("Response received:", response.data);

      if (response.data.token) {
        Alert.alert("Success", "Account Created Successfully!");
      } else {
        Alert.alert("Error", "Unexpected response from server.");
      }
    } catch (error) {
      Alert.alert("Error", "Registration Failed! Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      <Text style={styles.label}>Name:</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter your Name"
        placeholderTextColor="#888"
      />

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

<Text style={styles.label}>Password Confirm:</Text>
      <TextInput
        style={styles.input}
        value={passwordConfirm}
        onChangeText={setPasswordConfirm}
        secureTextEntry
        placeholder="Confirm your password"
        placeholderTextColor="#888"
      />

      <View style={styles.buttonContainer}>
        <Button title="REGISTER" onPress={handleSignUp} color="#28a745" />
      </View>
    </View>
  );
};

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
});

export default SignUp;
