import { CameraView, Camera } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import * as MediaLibrary from 'expo-media-library';
import { colors, typography, spacing } from '../constants/theme';

/**
 * CameraScreen component that provides camera functionality for capturing photos
 * Includes camera controls for flash, camera flip, and photo capture
 * 
 * @component
 * @returns {JSX.Element} Rendered camera interface
 */
export default function CameraScreen() {
  const navigation = useNavigation();
  const [cameraPermission, setCameraPermission] = useState(null);
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState(null);
  const [facing, setFacing] = useState('back');
  const [flashMode, setFlashMode] = useState('off');
  const cameraRef = useRef(null);

  /**
   * Requests camera and media library permissions on component mount
   */
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      setCameraPermission(cameraStatus === "granted");
      setMediaLibraryPermission(mediaStatus === "granted");
    })();
  }, []);

  /**
   * Handles navigation back to previous screen
   */
  const handleBack = () => {
    navigation.goBack();
  };

  /**
   * Toggles between front and back camera
   */
  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  /**
   * Toggles flash mode between on and off
   */
  const toggleFlash = () => {
    setFlashMode((current) => (current === "off" ? "on" : "off"));
  };

  /**
   * Captures a photo using the camera
   * Saves the photo to media library if permission is granted
   */
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          base64: true,
          exif: true,
        });
        
        if (mediaLibraryPermission) {
          await MediaLibrary.saveToLibraryAsync(photo.uri);
          Alert.alert('Success', 'Photo saved to library!');
        } else {
          Alert.alert('Success', 'Photo captured!');
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  // Show loading state while requesting permissions
  if (cameraPermission === null || mediaLibraryPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.text}>Requesting permissions...</Text>
      </View>
    );
  }

  // Show error state if camera permission is denied
  if (!cameraPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
        <TouchableOpacity style={styles.button} onPress={handleBack}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
        flash={flashMode}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>

          <View style={styles.controlsContainer}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={toggleFlash}
            >
              <MaterialIcons 
                name={flashMode === "off" ? "flash-off" : "flash-on"} 
                size={24} 
                color={colors.text.primary} 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.captureButton}
              onPress={takePicture}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.controlButton}
              onPress={toggleCameraFacing}
            >
              <MaterialIcons 
                name="flip-camera-ios" 
                size={24} 
                color={colors.text.primary} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

/**
 * Styles for the CameraScreen component
 * @type {Object}
 */
const styles = StyleSheet.create({
  /**
   * Main container style
   */
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  /**
   * Camera view style
   */
  camera: {
    flex: 1,
  },

  /**
   * Container for camera control buttons
   */
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 20,
  },

  /**
   * Container for camera controls (flash, capture, flip)
   */
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 'auto',
    marginBottom: 60,
  },

  /**
   * Style for back button
   */
  backButton: {
    padding: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },

  /**
   * Style for control buttons (flash and flip)
   */
  controlButton: {
    padding: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },

  /**
   * Style for capture button
   */
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.text.primary,
  },

  /**
   * Style for capture button inner circle
   */
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.text.primary,
  },

  /**
   * Style for text elements
   */
  text: {
    color: colors.text.primary,
    fontSize: typography.fontSize.large,
    textAlign: 'center',
    marginTop: spacing.xl,
  },

  /**
   * Style for action buttons
   */
  button: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primary.main,
    borderRadius: 8,
  },
  
  /**
   * Style for button text
   */
  buttonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.medium,
    fontWeight: typography.fontWeight.bold,
  },
}); 