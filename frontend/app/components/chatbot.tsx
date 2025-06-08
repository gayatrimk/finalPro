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
      const res = await fetch('http://127.0.0.1:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend }),
      });

      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: 'assistant', content: 'Error connecting to the server.' }]);
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
      style={styles.container}
    >
      <View style={styles.chatContainer}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatHeaderText}>Food Label Analysis Assistant</Text>
          <Text style={styles.chatSubHeaderText}>Ask about ingredients, nutrition & health advice</Text>
        </View>

        <View style={styles.sampleQuestionsContainer}>
          {sampleQuestions.map((question, index) => (
            <TouchableOpacity
              key={index}
              style={styles.sampleQuestionButton}
              onPress={() => handleSampleQuestion(question)}
            >
              <Text style={styles.sampleQuestionText}>{question}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          onContentSizeChange={scrollToBottom}
        >
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
      backgroundColor: "#f5f5f5",
      paddingTop: Platform.OS === 'ios' ? StatusBar.currentHeight : 0,
    },
    chatContainer: {
      flex: 1,
      paddingHorizontal: 12,
      paddingBottom: 8,
    },
    chatHeader: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
      backgroundColor: '#f8f9fa',
    },
    chatHeaderText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#2c3e50',
      textAlign: 'center',
    },
    chatSubHeaderText: {
      fontSize: 14,
      color: '#999',
      textAlign: 'center',
    },
    messagesContainer: {
      flex: 1,
      marginBottom: 8,
    },
    messageWrapper: {
      maxWidth: '75%',
      marginVertical: 3,
      padding: 10,
      borderRadius: 12,
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
      fontSize: 14,
      color: '#333',
    },
    userMessageText: {
      color: '#fff',
    },
    assistantMessageText: {
      color: '#333',
    },
    loadingContainer: {
      padding: 6,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 14,
      color: '#999',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: '#e0e0e0',
      paddingTop: 6,
      paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    input: {
      flex: 1,
      minHeight: 36,
      maxHeight: 80,
      backgroundColor: '#f5f5f5',
      borderRadius: 18,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 6,
      fontSize: 14,
    },
    sendButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
    },
    sampleQuestionsContainer: {
      padding: 10,
      gap: 8,
    },
    sampleQuestionButton: {
      backgroundColor: '#f0f0f0',
      padding: 10,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: '#e0e0e0',
    },
    sampleQuestionText: {
      fontSize: 14,
      color: '#666',
      textAlign: 'left',
    },
});

export default Chatbot;
