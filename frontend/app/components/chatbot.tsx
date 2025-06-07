import React, { useState } from 'react';
import '../../css/chatbot.css';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Image,
    ScrollView,
    SafeAreaView,
    Platform,
    Alert,
    StatusBar,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
  } from "react-native";

const Chatbot = () => {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: 'assistant', content: 'Error connecting to the server.' }]);
    } finally {
      setInput('');
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.chatContainer}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatHeaderText}>How can I help you today?</Text>
        </View>
        <ScrollView style={styles.messagesContainer}>
          {messages.map((msg, index) => (
            <View 
              key={index} 
              style={[
                styles.messageWrapper,
                msg.role === 'user' ? styles.userMessage : styles.assistantMessage
              ]}
            >
              <Text style={[
                styles.messageText,
                msg.role === 'user' ? styles.userMessageText : styles.assistantMessageText
              ]}>
                {msg.content}
              </Text>
            </View>
          ))}
          {loading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>...</Text>
            </View>
          )}
        </ScrollView>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type your message..."
            placeholderTextColor="#999"
            multiline
          />
          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={sendMessage}
            disabled={loading}
          >
            <MaterialCommunityIcons 
              name="send" 
              size={24} 
              color={loading ? "#ccc" : "#4CAF50"} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#f5f5f5",
    },
    chatContainer: {
      flex: 1,
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    chatHeader: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
      backgroundColor: '#f8f9fa',
    },
    chatHeaderText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#2c3e50',
      textAlign: 'center',
    },
    messagesContainer: {
      flex: 1,
      marginBottom: 16,
    },
    messageWrapper: {
      maxWidth: '80%',
      marginVertical: 4,
      padding: 12,
      borderRadius: 16,
    },
    userMessage: {
      alignSelf: 'flex-end',
      backgroundColor: '#4CAF50',
    },
    assistantMessage: {
      alignSelf: 'flex-start',
      backgroundColor: '#f0f0f0',
    },
    messageText: {
      fontSize: 16,
      color: '#333',
    },
    userMessageText: {
      color: '#fff',
    },
    assistantMessageText: {
      color: '#333',
    },
    loadingContainer: {
      padding: 8,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: '#999',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: '#e0e0e0',
      paddingTop: 8,
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 100,
      backgroundColor: '#f5f5f5',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginRight: 8,
      fontSize: 16,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
    },
});

export default Chatbot;
