import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  Platform,
  TextInput,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
} from "react-native";
import axios from "axios";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import GenerateBlogButton from './GenerateBlogButton';

const width = Dimensions.get('window').width;

// Add API URL configuration
const API_URL = Platform.OS === 'web' ? 'http://127.0.0.1:5002' : 'http://192.168.178.249:5002';
const API_TIMEOUT = 5000;

const BlogComponent = () => {
  const [blogs, setBlogs] = useState<Array<{
    id: string;
    date: string;
    title: string;
    snippet: string;
    content: string;
    image: string;
    likes: number;
    comments: Array<{
      id: number;
      text: string;
      date: string;
    }>;
  }>>([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [blogsError, setBlogsError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const fetchBlogs = async () => {
    console.log('Starting to fetch blogs...');
    setBlogsLoading(true);
    setBlogsError(null);
    try {
      console.log('Making API request to:', `${API_URL}/blogs`);
      const response = await axios.get(`${API_URL}/blogs`, {
        timeout: API_TIMEOUT,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      if (Array.isArray(response.data)) {
        setBlogs(response.data);
      } else {
        console.error('Invalid blog data format:', response.data);
        setBlogsError('Received invalid data format from server');
      }
    } catch (error: any) {
      console.error('Error fetching blogs:', error);
      console.error('Error details:', error.response || error.message);
      let errorMessage = 'Failed to load blogs. ';
      if (error.code === 'ECONNABORTED') {
        errorMessage += 'Request timed out. ';
      } else if (error.response) {
        errorMessage += `Server error: ${error.response.status}. `;
      } else if (error.request) {
        errorMessage += 'No response from server. ';
      } else {
        errorMessage += error.message;
      }
      setBlogsError(errorMessage + 'Please try again.');
    } finally {
      setBlogsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleLikeBlog = async (blogId: string) => {
    try {
      const response = await axios.post(`${API_URL}/blogs/${blogId}/like`);
      setBlogs(blogs.map(blog => 
        blog.id === blogId 
          ? { ...blog, likes: response.data.likes }
          : blog
      ));
    } catch (error) {
      console.error('Error liking blog:', error);
      Alert.alert('Error', 'Failed to like the blog post.');
    }
  };

  const handleAddComment = async (blogId: string) => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment.');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/blogs/${blogId}/comment`, {
        comment: newComment
      });
      
      setBlogs(blogs.map(blog => 
        blog.id === blogId 
          ? { ...blog, comments: [...blog.comments, response.data] }
          : blog
      ));
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment.');
    }
  };

  const handleGenerateBlog = async () => {
    setIsGenerating(true);
    try {
      await axios.post(`${API_URL}/blogs/generate`);
      await fetchBlogs();
    } catch (error) {
      console.error('Error generating blog:', error);
      Alert.alert('Error', 'Failed to generate new blog post.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to get the selected blog
  const getSelectedBlog = () => {
    return blogs.find(blog => blog.id === selected);
  };

  if (blogsLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loaderText}>Loading blogs...</Text>
      </View>
    );
  }

  if (blogsError) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={24} color="#D32F2F" />
        <Text style={styles.errorText}>{blogsError}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={fetchBlogs}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const selectedBlog = getSelectedBlog();

  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.blogHeader}>📰 Health Insights Blog</Text>
        <Text style={styles.blogSubheader}>Read, Learn, and Eat Smart</Text>
        <GenerateBlogButton onGenerate={handleGenerateBlog} isGenerating={isGenerating} />
      </View>

      {selected && selectedBlog ? (
        <ScrollView style={styles.blogDetail}>
          <TouchableOpacity onPress={() => setSelected(null)} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back to articles</Text>
          </TouchableOpacity>
          <Text style={styles.blogDate}>{selectedBlog.date}</Text>
          <Text style={styles.blogTitle}>{selectedBlog.title}</Text>
          <Image
            source={{ uri: selectedBlog.image }}
            style={styles.blogImageLarge}
            resizeMode="cover"
          />
          <View style={styles.blogContentContainer}>
            {selectedBlog.content.split('\n\n').map((paragraph: string, index: number) => (
              <Text key={index} style={styles.blogContent}>
                {paragraph.replace(/\n/g, ' ')}
              </Text>
            ))}
          </View>

          <View style={styles.interactionSection}>
            <TouchableOpacity 
              style={styles.likeButton} 
              onPress={() => handleLikeBlog(selected)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name="heart" 
                size={24} 
                color="#4CAF50" 
              />
              <Text style={styles.likeCount}>{selectedBlog.likes} likes</Text>
            </TouchableOpacity>

            <View style={styles.commentSection}>
              <Text style={styles.commentHeader}>Comments</Text>
              <View style={styles.commentInput}>
                <TextInput
                  style={styles.commentTextInput}
                  value={newComment}
                  onChangeText={setNewComment}
                  placeholder="Add a comment..."
                  multiline
                />
                <TouchableOpacity 
                  style={styles.commentButton}
                  onPress={() => handleAddComment(selected)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.commentButtonText}>Post</Text>
                </TouchableOpacity>
              </View>

              {selectedBlog.comments.map((comment: { id: number; text: string; date: string }) => (
                <View key={comment.id} style={styles.commentItem}>
                  <Text style={styles.commentDate}>{comment.date}</Text>
                  <Text style={styles.commentText}>{comment.text}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.blogList}>
          {blogs.map((article) => {
            const fadeAnim = new Animated.Value(0);
            const translateY = new Animated.Value(50);

            Animated.parallel([
              Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                delay: parseInt(article.id) * 100,
                useNativeDriver: true,
              }),
              Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                delay: parseInt(article.id) * 100,
                useNativeDriver: true,
              }),
            ]).start();

            return (
              <Animated.View
                key={article.id}
                style={[
                  styles.blogCard,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY }],
                  },
                ]}
              >
                <TouchableOpacity onPress={() => setSelected(article.id)} activeOpacity={0.8}>
                  <View style={styles.blogNumberContainer}>
                    <Text style={styles.blogNumber}>#{article.id}</Text>
                  </View>
                  <Image source={{ uri: article.image }} style={styles.blogImage} />
                  <View style={styles.blogTextContent}>
                    <Text style={styles.blogTitleSmall}>{article.title}</Text>
                    <Text style={styles.blogSnippet}>{article.snippet}</Text>
                    <View style={styles.blogMetrics}>
                      <View style={styles.metricItem}>
                        <MaterialCommunityIcons name="heart" size={16} color="#4CAF50" />
                        <Text style={styles.metricText}>{article.likes}</Text>
                      </View>
                      <View style={styles.metricItem}>
                        <MaterialCommunityIcons name="comment" size={16} color="#4CAF50" />
                        <Text style={styles.metricText}>{article.comments.length}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerBox: {
    padding: Platform.OS === 'web' ? 15 : 12,
    marginBottom: Platform.OS === 'web' ? 10 : 8,
    position: 'relative',
    minHeight: Platform.OS === 'web' ? 80 : 70,
  },
  blogHeader: {
    fontSize: Platform.OS === 'web' ? 22 : 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginTop: Platform.OS === 'web' ? 10 : 8,
  },
  blogSubheader: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    color: "#666",
    textAlign: "center",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#D32F2F",
    marginLeft: 8,
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  blogList: {
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  blogCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: Platform.OS === 'web' ? '60%' : '90%',
    alignSelf: 'center',
  },
  blogNumberContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    padding: 8,
    zIndex: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  blogNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  blogImage: {
    width: '100%',
    height: Platform.OS === 'web' ? 180 : 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  blogTextContent: {
    gap: 8,
    width: '100%',
  },
  blogTitleSmall: {
    fontSize: Platform.OS === 'web' ? 20 : 18,
    fontWeight: "600",
    color: '#333333',
    marginBottom: 8,
    lineHeight: Platform.OS === 'web' ? 24 : 22,
    textAlign: 'left',
  },
  blogSnippet: {
    fontSize: Platform.OS === 'web' ? 14 : 13,
    color: '#666666',
    lineHeight: Platform.OS === 'web' ? 20 : 18,
    textAlign: 'left',
    paddingHorizontal: 4,
  },
  blogMetrics: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: Platform.OS === 'web' ? 14 : 12,
    color: '#666666',
    fontWeight: '500',
  },
  blogDetail: {
    flex: 1,
    padding: Platform.OS === 'web' ? 24 : 16,
    backgroundColor: '#F7FAFC',
  },
  backButton: {
    marginBottom: 20,
    padding: Platform.OS === 'web' ? 12 : 8,
    backgroundColor: '#EDF2F7',
    borderRadius: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: Platform.OS === 'web' ? 14 : 12,
    color: '#2D3748',
    fontWeight: '600',
  },
  blogDate: {
    fontSize: Platform.OS === 'web' ? 14 : 12,
    color: '#718096',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  blogTitle: {
    fontSize: Platform.OS === 'web' ? 32 : 24,
    fontWeight: 'bold',
    color: '#1A365D',
    marginBottom: 16,
    textAlign: 'center',
    width: Platform.OS === 'web' ? '70%' : '90%',
    alignSelf: 'center',
    letterSpacing: 0.5,
    lineHeight: Platform.OS === 'web' ? 40 : 32,
  },
  blogImageLarge: {
    width: Platform.OS === 'web' ? '60%' : '90%',
    height: Platform.OS === 'web' ? width * 0.2 : width * 0.5,
    borderRadius: 16,
    marginBottom: 24,
    alignSelf: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  blogContentContainer: {
    marginTop: 20,
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: Platform.OS === 'web' ? 24 : 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  blogContent: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    lineHeight: Platform.OS === 'web' ? 26 : 22,
    color: '#2C3E50',
    marginBottom: 16,
    textAlign: 'left',
    paddingHorizontal: Platform.OS === 'web' ? 16 : 12,
    flexWrap: 'wrap',
    width: Platform.OS === 'web' ? '60%' : '90%',
    alignSelf: 'center',
    letterSpacing: 0.3,
  },
  interactionSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    width: Platform.OS === 'web' ? '60%' : '90%',
    alignSelf: 'center',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 10 : 8,
  },
  likeCount: {
    marginLeft: 8,
    color: '#666',
    fontSize: Platform.OS === 'web' ? 16 : 14,
  },
  commentSection: {
    marginTop: 20,
    width: Platform.OS === 'web' ? '60%' : '90%',
    alignSelf: 'center',
  },
  commentHeader: {
    fontSize: Platform.OS === 'web' ? 18 : 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  commentInput: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
    width: '100%',
  },
  commentTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: Platform.OS === 'web' ? 12 : 8,
    marginRight: 8,
    minHeight: 40,
    fontSize: Platform.OS === 'web' ? 14 : 13,
  },
  commentButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: Platform.OS === 'web' ? 12 : 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: Platform.OS === 'web' ? 80 : 60,
  },
  commentButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: Platform.OS === 'web' ? 14 : 12,
  },
  commentItem: {
    backgroundColor: '#f5f5f5',
    padding: Platform.OS === 'web' ? 12 : 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentDate: {
    fontSize: Platform.OS === 'web' ? 12 : 10,
    color: '#666',
    marginBottom: 4,
  },
  commentText: {
    fontSize: Platform.OS === 'web' ? 14 : 13,
    color: '#333',
  },
});

export default BlogComponent; 