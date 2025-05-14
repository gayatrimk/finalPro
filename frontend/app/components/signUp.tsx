// import React, { useState } from "react";
// import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";

// import axios, { AxiosError } from "axios";

// const SignUp = () => {
//   console.log("🔹 SignUp Component Loaded");
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [passwordConfirm, setPasswordConfirm] = useState("");

//   const handleSignUp = async () => {
//     console.log("🔹 SignUp Button Clicked!");

//     // Check if passwords match before sending request
//     if (password !== passwordConfirm) {
//       Alert.alert("Error", "Passwords do not match.");
//       return;
//     }

//     try {
//       console.log("Sending sign-up request to backend...");
//       const response = await axios.post("http://127.0.0.1:3000/users/signup", {
//         name,
//         email,
//         password,
//         passwordConfirm
//       });

//       console.log("Response received:", response.data);

//       // Check for token in response to trigger success alert
//       if (response.data.token) {
//         Alert.alert("Success", "Account Created Successfully!");
//       } else {
//         Alert.alert("Error", "Unexpected response from server.");
//       }
//     } catch (error: unknown) { // Specify error type as 'unknown'
//       if (axios.isAxiosError(error)) {  // Type guard to check if it's an AxiosError
//         console.error("Axios error during registration:", error.response?.data);
//         Alert.alert("Error", `Registration Failed! ${error.response?.data.message || 'Please try again.'}`);
//       } else {
//         console.error("Unknown error:", error);
//         Alert.alert("Error", "An unknown error occurred.");
//       }
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Sign Up</Text>

//       <Text style={styles.label}>Name:</Text>
//       <TextInput
//         style={styles.input}
//         value={name}
//         onChangeText={setName}
//         placeholder="Enter your Name"
//         placeholderTextColor="#888"
//       />

//       <Text style={styles.label}>Email:</Text>
//       <TextInput
//         style={styles.input}
//         value={email}
//         onChangeText={setEmail}
//         placeholder="Enter your email"
//         placeholderTextColor="#888"
//       />

//       <Text style={styles.label}>Password:</Text>
//       <TextInput
//         style={styles.input}
//         value={password}
//         onChangeText={setPassword}
//         secureTextEntry
//         placeholder="Enter your password"
//         placeholderTextColor="#888"
//       />

//       <Text style={styles.label}>Password Confirm:</Text>
//       <TextInput
//         style={styles.input}
//         value={passwordConfirm}
//         onChangeText={setPasswordConfirm}
//         secureTextEntry
//         placeholder="Confirm your password"
//         placeholderTextColor="#888"
//       />

//       <View style={styles.buttonContainer}>
//         <Button title="REGISTER" onPress={handleSignUp} color="#28a745" />
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#f5f5f5",
//     padding: 20,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: "bold",
//     marginBottom: 20,
//     color: "#333",
//   },
//   label: {
//     alignSelf: "flex-start",
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#444",
//     marginBottom: 5,
//   },
//   input: {
//     width: "100%",
//     height: 50,
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 10,
//     paddingHorizontal: 15,
//     fontSize: 16,
//     backgroundColor: "#fff",
//     marginBottom: 15,
//   },
//   buttonContainer: {
//     width: "100%",
//     marginTop: 10,
//   },
// });

// export default SignUp;

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const handleSignUp = async () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Name is mandatory");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Validation Error", "Email Address is mandatory");
      return;
    }
    if (!password) {
      Alert.alert("Validation Error", "Password is mandatory");
      return;
    }
    if (!passwordConfirm) {
      Alert.alert("Validation Error", "Confirm Password is mandatory");
      return;
    }
    if (password !== passwordConfirm) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:3000/users/signup", {
        name,
        email,
        password,
        passwordConfirm,
      });

      if (response.data.token) {
        Alert.alert("Success", "Account Created Successfully!");
        navigate("/landing");
      } else {
        Alert.alert("Error", "Unexpected response from server.");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Alert.alert("Error", `Registration Failed! ${error.response?.data.message || 'Please try again.'}`);
      } else {
        Alert.alert("Error", "An unknown error occurred.");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor="#aaa"
        />

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="e.g. user@example.com"
          placeholderTextColor="#aaa"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Enter your password"
          placeholderTextColor="#aaa"
        />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
          secureTextEntry
          placeholder="Confirm your password"
          placeholderTextColor="#aaa"
          onSubmitEditing={handleSignUp}
        />

        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigate("/")}>
          <Text style={{ color: "#1E90FF", textAlign: "center", marginTop: 15 }}>
            Back to Home Page
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F0FE",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1E90FF",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F1F1F1",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    backgroundColor: "#1E90FF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});

export default SignUp;

