import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../constants/theme';
import * as ImagePicker from 'expo-image-picker';

/**
 * Screen component for scanning and creating PDFs from images
 * 
 * @component
 * @returns {JSX.Element} Rendered scan screen
 */
export default function ScanScreen() {
  const navigation = useNavigation();
  const [selectedImages, setSelectedImages] = useState([]);

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
                // TODO: Implement opening device settings
                console.log('Open settings');
              },
            },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled) {
        // Add new images in the order they were selected
        const newImages = result.assets.map(asset => ({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
        }));
        setSelectedImages(prevImages => [...prevImages, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to select images. Please try again.');
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
  const handleGeneratePDF = () => {
    if (selectedImages.length === 0) {
      Alert.alert('No Images', 'Please select at least one image to generate PDF.');
      return;
    }

    // TODO: Implement Python integration
    // 1. Send selectedImages to Python backend
    // 2. Python function should:
    //    - Process images (resize, enhance, etc.)
    //    - Combine images into a single PDF
    //    - Return the PDF file
    // 3. Handle the returned PDF:
    //    - Save to device
    //    - Show success message
    //    - Option to open/share the PDF

    Alert.alert(
      'PDF Generation',
      'This feature is under development. The selected images will be processed by a Python function to generate a PDF.',
      [
        {
          text: 'OK',
          onPress: () => console.log('Selected images:', selectedImages),
        },
      ]
    );
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
          style={[styles.actionButton, styles.generateButton]}
          onPress={handleGeneratePDF}
        >
          <MaterialIcons name="picture-as-pdf" size={24} color="white" />
          <Text style={styles.buttonText}>Generate PDF</Text>
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
}); 