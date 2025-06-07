import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Use your computer's IP address instead of localhost for Expo
const API_URL = Platform.OS === 'web' ? 'http://127.0.0.1:3000' : 'http://192.168.178.249:3000';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      console.log('Attempting login with URL:', `${API_URL}/users/signin`);
      const response = await axios.post(`${API_URL}/users/signin`, {
        email,
        password,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('Login response status:', response.status);

      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        router.replace('/components/landing');
      }
    } catch (error: any) {
      console.error('Login error details:', error);
      console.error('Login error response:', error.response?.data);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          Alert.alert('Error', 'Login endpoint not found. Please check the server URL and port.');
        } else if (error.code === 'ECONNABORTED') {
          Alert.alert('Error', 'Connection timeout. Please check your network.');
        } else if (!error.response) {
          Alert.alert('Error', 'Network error. Please check your connection and make sure the server is running.');
        } else {
          Alert.alert(
            'Error',
            error.response?.data?.message || 'Login failed. Please try again.'
          );
        }
      } else {
        Alert.alert('Error', 'An unexpected error occurred');
      }
    }
  };

  const handleSignUp = async () => {
    if (!name || !email || !password || !passwordConfirm) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== passwordConfirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      console.log('Attempting signup with URL:', API_URL);
      const response = await axios.post(`${API_URL}/users/signup`, {
        name,
        email,
        password,
        passwordConfirm
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });

      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        Alert.alert('Success', 'Account created successfully!');
        router.replace('/components/landing');
      }
    } catch (error) {
      console.error('Signup error details:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          Alert.alert('Error', 'Connection timeout. Please check your network.');
        } else if (!error.response) {
          Alert.alert('Error', 'Network error. Please check your connection and make sure the server is running.');
        } else {
          const message = error.response?.data?.message || error.response?.data || 'Signup failed';
          Alert.alert('Error', message);
        }
      } else {
        Alert.alert('Error', 'An unexpected error occurred');
      }
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setName('');
    setEmail('');
    setPassword('');
    setPasswordConfirm('');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={{ uri: 'https://i.pinimg.com/736x/f4/e0/d2/f4e0d26f3ec37e909481c5a60daed4b5.jpg' }}
          style={styles.logo}
        />
        <Text style={styles.title}>foodX</Text>
      </View>
      <View style={styles.formContainer}>
        <Text style={styles.loginTitle}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
        
        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            placeholderTextColor="#666"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#666"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#666"
        />

        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            secureTextEntry
            placeholderTextColor="#666"
          />
        )}

        <TouchableOpacity 
          style={styles.button} 
          onPress={isLogin ? handleLogin : handleSignUp}
        >
          <Text style={styles.buttonText}>
            {isLogin ? 'Sign In' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchButton} onPress={toggleForm}>
          <Text style={styles.switchText}>
            {isLogin 
              ? "Don't have an account? Sign Up" 
              : "Already have an account? Sign In"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f9f9f9',
    width: '100%',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    backgroundColor: '#4CAF50',
    width: '100%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 15,
    padding: 10,
  },
  switchText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  }
}); 