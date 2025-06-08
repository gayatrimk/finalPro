import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Chatbot from './chatbot';
import SearchComponent from './search';
import ScanComponent from './scan';
import BlogComponent from './blog';

const width = Dimensions.get('window').width;
const tabWidth = width / 3;

const LandingPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarAnimation = useState(new Animated.Value(500))[0];
  const [activeTab, setActiveTab] = useState('search');
  
  // Animation values
  const tabIndicatorPosition = useState(new Animated.Value(0))[0];
  const searchOpacity = useState(new Animated.Value(1))[0];
  const scanOpacity = useState(new Animated.Value(0))[0];
  const blogOpacity = useState(new Animated.Value(0))[0];

  const router = useRouter();

  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? 500 : 0;
    Animated.spring(sidebarAnimation, {
      toValue,
      useNativeDriver: true,
    }).start();
    setIsSidebarOpen(!isSidebarOpen);
  };

  const switchTab = (tab: string) => {
    if (tab === activeTab) return;

    let toValue = 0;
    if (tab === 'scan') toValue = tabWidth;
    else if (tab === 'blog') toValue = tabWidth * 2;
    
    Animated.parallel([
      Animated.timing(tabIndicatorPosition, {
        toValue,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(searchOpacity, {
        toValue: tab === 'search' ? 1 : 0,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(scanOpacity, {
        toValue: tab === 'scan' ? 1 : 0,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(blogOpacity, {
        toValue: tab === 'blog' ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    setActiveTab(tab);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      router.replace("/(auth)/login");
    } catch (e) {
      console.error("Failed to logout:", e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FoodX</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.chatButton}>
            <MaterialCommunityIcons name="chat" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      
      <Animated.View style={[
        styles.sidebar,
        {
          transform: [{
            translateX: sidebarAnimation
          }]
        }
      ]}>
        <View style={styles.sidebarHeader}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.closeSidebar}>
            <MaterialCommunityIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <Chatbot />
      </Animated.View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, { width: tabWidth }]} 
          onPress={() => switchTab('search')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name="magnify" 
            size={24} 
            color={activeTab === 'search' ? "#4CAF50" : "#757575"} 
          />
          <Text style={activeTab === 'search' ? styles.activeTabText : styles.tabText}>
            Search
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, { width: tabWidth }]} 
          onPress={() => switchTab('scan')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name="camera" 
            size={24} 
            color={activeTab === 'scan' ? "#4CAF50" : "#757575"} 
          />
          <Text style={activeTab === 'scan' ? styles.activeTabText : styles.tabText}>
            Scan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, { width: tabWidth }]} 
          onPress={() => switchTab('blog')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name="receipt" 
            size={24} 
            color={activeTab === 'blog' ? "#4CAF50" : "#757575"} 
          />
          <Text style={activeTab === 'blog' ? styles.activeTabText : styles.tabText}>
            Read Blog
          </Text>
        </TouchableOpacity>
        
        <Animated.View 
          style={[
            styles.tabIndicator, 
            { 
              transform: [{ translateX: tabIndicatorPosition }],
              width: tabWidth
            }
          ]} 
        />
      </View>
      
      <Animated.View 
        style={[
          styles.tabContent, 
          { opacity: searchOpacity, display: activeTab === 'search' ? 'flex' : 'none' }
        ]}
      >
        <SearchComponent />
      </Animated.View>

      <Animated.View 
        style={[
          styles.tabContent, 
          { opacity: scanOpacity, display: activeTab === 'scan' ? 'flex' : 'none' }
        ]}
      >
        <ScanComponent />
      </Animated.View>

      <Animated.View
        style={[
          styles.tabContent,
          { opacity: blogOpacity, display: activeTab === 'blog' ? 'flex' : 'none' }
        ]}
      >
        <BlogComponent />
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  chatButton: {
    padding: 8,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    position: "relative",
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    flexDirection: "row",
    gap: 8,
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    height: 3,
    backgroundColor: "#4CAF50",
  },
  tabText: {
    color: "#757575",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  tabContent: {
    flex: 1,
  },
  sidebar: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 500,
    height: '100%',
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  sidebarHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeSidebar: {
    padding: 8,
  },
});

export default LandingPage;