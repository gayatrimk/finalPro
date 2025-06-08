import React, { useState } from 'react';
import '../../css/chatbot.css';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from 'expo-router';
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
    ViewStyle,
    TextStyle,
  } from "react-native";

const API_URL = Platform.OS === 'android' ? 'http://192.168.1.42:5000' : 'http://127.0.0.1:5000';

const Chatbot = () => {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const sampleQuestions = [
    "How to read nutrition labels on food packages?",
    "What are common harmful ingredients in biscuits?",
    "What do food certification labels mean?"
  ];

  const handleSampleQuestion = (question: string) => {
    setInput(question);
    sendMessage(question);
  };

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  // Add initial message
  React.useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: 'Hi! I can help you analyze food labels, understand nutritional information, and provide health-conscious food recommendations. What would you like to know about your packaged food?'
      }
    ]);
  }, []);

  // Auto scroll when messages change
  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    const newMessages = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMessages);
    setLoading(true);
    setInput('');

    try {
      console.log('Sending request to:', `${API_URL}/chat`);
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: textToSend }),
      });

      console.log('Response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      //console.log('Response data:', data);
      
      if (data.reply) {
        setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
      } else {
        throw new Error('No reply in response data');
      }
    } catch (error: any) {
      console.error('Detailed error:', error);
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Error connecting to the server. ';
      if (error.message.includes('Network request failed')) {
        errorMessage += 'Network connection failed. Please check your internet connection.';
      } else if (error.message.includes('HTTP error')) {
        errorMessage += 'Server returned an error. Please try again.';
      } else if (error.message.includes('No reply')) {
        errorMessage += 'Invalid response from server.';
      } else {
        errorMessage += 'Please check your connection and try again.';
      }

      Alert.alert(
        'Connection Error',
        errorMessage,
        [{ text: 'OK', onPress: () => console.log('Alert closed') }]
      );

      setMessages([...newMessages, { role: 'assistant', content: errorMessage }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container as ViewStyle}
    >
      <View style={styles.chatContainer as ViewStyle}>
        <View style={styles.chatHeader as ViewStyle}>
          <Text style={styles.chatHeaderText as TextStyle}>Food Label Analysis Assistant</Text>
          <Text style={styles.chatSubHeaderText as TextStyle}>Ask about ingredients, nutrition & health advice</Text>
        </View>

        <View style={styles.sampleQuestionsContainer as ViewStyle}>
          {sampleQuestions.map((question, index) => (
            <TouchableOpacity
              key={index}
              style={styles.sampleQuestionButton as ViewStyle}
              onPress={() => handleSampleQuestion(question)}
            >
              <Text style={styles.sampleQuestionText as TextStyle}>{question}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer as ViewStyle}
          onContentSizeChange={scrollToBottom}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg, index) => (
            <View 
              key={index} 
              style={[
                styles.messageWrapper as ViewStyle,
                msg.role === 'user' ? styles.userMessage as ViewStyle : styles.assistantMessage as ViewStyle
              ]}
            >
              <Text style={[
                styles.messageText as TextStyle,
                msg.role === 'user' ? styles.userMessageText as TextStyle : styles.assistantMessageText as TextStyle
              ]}>
                {msg.content}
              </Text>
            </View>
          ))}
          {loading && (
            <View style={styles.loadingContainer as ViewStyle}>
              <Text style={styles.loadingText as TextStyle}>...</Text>
            </View>
          )}
        </ScrollView>
        
        <View style={styles.inputContainer as ViewStyle}>
          <TextInput
            style={styles.input as TextStyle}
            value={input}
            onChangeText={setInput}
            placeholder="Type your message..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton as ViewStyle, loading && styles.sendButtonDisabled as ViewStyle]} 
            onPress={() => sendMessage()}
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
    backgroundColor: '#f5f5f5',
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'web' ? 24 : 0,
  },
  chatContainer: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 420 : '100%',
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  chatHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  chatHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 2,
  },
  chatSubHeaderText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  messageWrapper: {
    maxWidth: '85%',
    marginVertical: 4,
    padding: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 1,
    elevation: 1,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4CAF50',
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f8f9fa',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  userMessageText: {
    color: '#fff',
  },
  assistantMessageText: {
    color: '#333',
  },
  loadingContainer: {
    padding: 3,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'web' ? 10 : 8,
    width: '100%',
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 80,
    backgroundColor: '#f8f9fa',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sampleQuestionsContainer: {
    padding: 10,
    gap: 8,
    width: '100%',
    flexDirection: 'column',
  },
  sampleQuestionButton: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: '100%',
    marginBottom: 6,
  },
  sampleQuestionText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'left',
    lineHeight: 18,
  },
});

export default Chatbot;