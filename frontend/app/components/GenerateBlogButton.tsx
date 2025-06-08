import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';

interface GenerateBlogButtonProps {
  onGenerate: () => void;
  isGenerating: boolean;
}

const GenerateBlogButton: React.FC<GenerateBlogButtonProps> = ({
  onGenerate,
  isGenerating
}) => {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onGenerate}
      disabled={isGenerating}
      activeOpacity={0.8}
    >
      {isGenerating ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={styles.buttonText}>+ New Blog</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4CAF50',
    padding: Platform.OS === 'web' ? 10 : 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: Platform.OS === 'web' ? 10 : 8,
    right: Platform.OS === 'web' ? 10 : 8,
    minWidth: Platform.OS === 'web' ? 100 : 80,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: Platform.OS === 'web' ? 14 : 12,
    fontWeight: '600',
  },
});

export default GenerateBlogButton; 