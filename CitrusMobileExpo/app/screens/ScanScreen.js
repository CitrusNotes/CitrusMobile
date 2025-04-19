import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, TextInput, Modal, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../constants/theme';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { auth } from '../services/auth';
import { api } from '../services/api';
import { EXPO_API_URL } from '@env';

// Debug logging
console.log('API URL from env:', EXPO_API_URL);

/**
 * Screen component for scanning and creating PDFs from images
 * 
 * @component
 * @returns {JSX.Element} Rendered scan screen
 */
export default function ScanScreen() {
  const navigation = useNavigation();
  const [selectedImages, setSelectedImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfNameModalVisible, setPdfNameModalVisible] = useState(false);
  const [pdfName, setPdfName] = useState('');
  const [userId, setUserId] = useState(null);

  // Add useEffect to get userId
  useEffect(() => {
    const loadUserId = async () => {
      const id = await auth.getCurrentUserId();
      setUserId(id);
    };
    loadUserId();
  }, []);

  /**
   * Handles back button press
   * Navigates back to previous screen
   */
  const handleBack = () => {
    navigation.goBack();
  };

  /**
   * Opens image picker to select multiple images
   * Handles permissions and image selection
   */
  const pickImages = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant photo library access to select images.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open Settings',
              onPress: () => {
                Linking.openSettings();
              },
            },
          ]
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 1,
        aspect: [4, 3],
        base64: false,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets) {
        // Add new images in the order they were selected
        const newImages = result.assets.map(asset => ({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
        }));
        
        console.log('New images:', newImages);
        
        setSelectedImages(prevImages => {
          const updatedImages = [...prevImages, ...newImages];
          console.log('Updated images array:', updatedImages);
          return updatedImages;
        });
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert(
        'Error',
        'Failed to select images. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Removes an image from the selected images array
   * @param {number} index - Index of the image to remove
   */
  const removeImage = (index) => {
    const newImages = [...selectedImages];
    newImages.splice(index, 1);
    setSelectedImages(newImages);
  };

  /**
   * Handles PDF generation from selected images
   * Shows alert if no images are selected
   */
  const handleGeneratePDF = async () => {
    if (selectedImages.length === 0) {
      Alert.alert('No Images', 'Please select at least one image to generate PDF.');
      return;
    }

    if (!pdfName.trim()) {
      setPdfNameModalVisible(true);
      return;
    }

    try {
      setIsProcessing(true);
      console.log('Starting PDF generation process');
      console.log('Number of images:', selectedImages.length);

      // Convert images to base64
      console.log('Converting images to base64');
      const imageDataList = await Promise.all(
        selectedImages.map(async (image, index) => {
          try {
            console.log(`Processing image ${index + 1}:`, image.uri);
            const response = await fetch(image.uri);
            if (!response.ok) {
              throw new Error(`Failed to fetch image ${index + 1}: ${response.status} ${response.statusText}`);
            }
            
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                // Get base64 string without the data:image/jpeg;base64, prefix
                const base64String = reader.result.split(',')[1];
                console.log(`Image ${index + 1} converted to base64`);
                resolve(base64String);
              };
              reader.onerror = (error) => {
                console.error(`Error reading image ${index + 1}:`, error);
                reject(error);
              };
              reader.readAsDataURL(blob);
            });
          } catch (error) {
            console.error(`Error processing image ${index + 1}:`, error);
            throw error;
          }
        })
      );

      console.log('All images converted to base64');
      console.log('Sending request to server');

      // Call the API endpoint
      const response = await fetch(`${EXPO_API_URL}/process-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: imageDataList,
          filename: `${pdfName}.pdf`,
          user_id: userId,
        }),
      });

      console.log('Server response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || 'Unknown error occurred';
        } catch {
          errorMessage = errorText;
        }
        console.error('Server error response:', errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('PDF creation result:', result);

      if (!result.success) {
        throw new Error(result.message || 'Failed to create PDF');
      }

      // Show success message
      Alert.alert(
        'Success',
        'PDF created successfully! You can find it in your library.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear the form and navigate back
              setSelectedImages([]);
              setPdfName('');
              navigation.navigate('Library', { refresh: true });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error generating PDF:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      Alert.alert(
        'Error',
        `Failed to generate PDF: ${error.message}. Please try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
      setPdfNameModalVisible(false);
    }
  };

  const handleCameraPress = () => {
    setIsMenuOpen(false);
    navigation.navigate('Camera');
  };

  return (
    <View style={styles.container}>
      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name='arrow-back' size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Scan</Text>
      </View>

      {/* Content Area */}
      <ScrollView style={styles.content}>
        <View style={styles.imageGrid}>
          {selectedImages.map((image, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri: image.uri }} style={styles.image} />
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removeImage(index)}
              >
                <MaterialIcons name="close" size={20} color="white" />
              </TouchableOpacity>
              <View style={styles.imageNumber}>
                <Text style={styles.imageNumberText}>{index + 1}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* PDF Name Modal */}
      <Modal
        visible={pdfNameModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPdfNameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Name your PDF</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter PDF name"
              value={pdfName}
              onChangeText={setPdfName}
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setPdfNameModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleGeneratePDF}
              >
                <Text style={styles.buttonText}>Create PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={pickImages}
        >
          <MaterialIcons name="add-photo-alternate" size={24} color="white" />
          <Text style={styles.buttonText}>
            Add Photos ({selectedImages.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.actionButton, 
            styles.generateButton,
            isProcessing && styles.disabledButton
          ]}
          onPress={() => handleGeneratePDF()}
          disabled={isProcessing}
        >
          <MaterialIcons name="picture-as-pdf" size={24} color="white" />
          <Text style={styles.buttonText}>
            {isProcessing ? 'Processing...' : 'Generate PDF'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Styles for the ScanScreen component
 * @type {Object}
 */
const styles = StyleSheet.create({
  /**
   * Main container style
   */
  container: {
    flex: 1,
    backgroundColor: 'white',
  },

  /**
   * Navigation bar style
   */
  navBar: {
    height: 60,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },

  /**
   * Navigation title style
   */
  navTitle: {
    fontSize: typography.fontSize.xlarge,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.primary,
    fontWeight: 'bold',
  },

  /**
   * Back button style
   */
  backButton: {
    position: 'absolute',
    left: spacing.md,
    height: '100%',
    justifyContent: 'center',
  },

  /**
   * Content area style
   */
  content: {
    flex: 1,
    padding: spacing.md,
    paddingBottom: 80,
  },

  /**
   * Image grid container style
   */
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: spacing.sm,
  },

  /**
   * Image container style
   */
  imageContainer: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },

  /**
   * Image style
   */
  image: {
    width: '100%',
    height: '100%',
  },

  /**
   * Remove button style
   */
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /**
   * Button container style
   */
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingBottom: 35,
  },

  /**
   * Action button style
   */
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    padding: spacing.sm,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: spacing.sm,
    justifyContent: 'center',
  },

  /**
   * Generate PDF button style
   */
  generateButton: {
    backgroundColor: colors.accent,
  },

  /**
   * Button text style
   */
  buttonText: {
    color: 'white',
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.medium,
    fontWeight: typography.fontWeight.bold,
  },

  /**
   * Image number container style
   */
  imageNumber: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  /**
   * Image number text style
   */
  imageNumberText: {
    color: 'white',
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
  },

  /**
   * Modal overlay style
   */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /**
   * Modal content style
   */
  modalContent: {
    backgroundColor: 'white',
    padding: spacing.lg,
    borderRadius: 10,
    width: '80%',
  },

  /**
   * Modal title style
   */
  modalTitle: {
    fontSize: typography.fontSize.large,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },

  /**
   * Input style
   */
  input: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  /**
   * Modal buttons style
   */
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  /**
   * Modal button style
   */
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    marginHorizontal: spacing.sm,
    alignItems: 'center',
  },

  /**
   * Cancel button style
   */
  cancelButton: {
    backgroundColor: colors.error,
  },

  /**
   * Confirm button style
   */
  confirmButton: {
    backgroundColor: colors.primary.main,
  },

  /**
   * Disabled button style
   */
  disabledButton: {
    opacity: 0.5,
  },
}); 