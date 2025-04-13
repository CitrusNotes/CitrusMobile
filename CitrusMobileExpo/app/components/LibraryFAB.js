import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';

/**
 * LibraryFAB (Floating Action Button) component that provides quick access to common actions
 * in the Library screen. It displays a menu with options to add folders, upload files,
 * upload images, and access the camera.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.isMenuOpen - Whether the FAB menu is currently open
 * @param {Function} props.setIsMenuOpen - Function to toggle the menu open/closed state
 * @param {Function} props.setIsFolderModalVisible - Function to show/hide the folder creation modal
 * @param {Function} props.handleUploadPress - Function to handle file upload
 * @param {Function} props.handleImageUploadPress - Function to handle image upload
 * @param {Object} props.navigation - React Navigation object for screen navigation
 * @returns {JSX.Element} Rendered floating action button with menu
 */
const LibraryFAB = ({ 
  isMenuOpen, 
  setIsMenuOpen, 
  setIsFolderModalVisible, 
  handleUploadPress, 
  handleImageUploadPress, 
  navigation 
}) => {
  return (
    <>
      {isMenuOpen && (
        <TouchableOpacity 
          style={styles.fullScreenOverlay}
          activeOpacity={1}
          onPress={() => setIsMenuOpen(false)}
        />
      )}
      <View style={styles.fabContainer}>
        {isMenuOpen ? (
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setIsMenuOpen(false);
                setIsFolderModalVisible(true);
              }}
            >
              <MaterialIcons name="create-new-folder" size={24} color={colors.text.primary} />
              <Text style={styles.menuItemText}>Add Folder</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setIsMenuOpen(false);
                handleUploadPress();
              }}
            >
              <MaterialIcons name="file-upload" size={24} color={colors.text.primary} />
              <Text style={styles.menuItemText}>Upload File</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setIsMenuOpen(false);
                handleImageUploadPress();
              }}
            >
              <MaterialIcons name="image" size={24} color={colors.text.primary} />
              <Text style={styles.menuItemText}>Upload Image</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setIsMenuOpen(false);
                navigation.navigate('CameraScreen');
              }}
            >
              <MaterialIcons name="camera-alt" size={24} color={colors.text.primary} />
              <Text style={styles.menuItemText}>Camera</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.fabButton}
            onPress={() => setIsMenuOpen(true)}
          >
            <MaterialIcons 
              name="add" 
              size={32} 
              color={colors.text.primary} 
            />
          </TouchableOpacity>
        )}
      </View>
    </>
  );
};

/**
 * Styles for the LibraryFAB component
 * @type {Object}
 */
const styles = StyleSheet.create({
  /**
   * Container for the FAB and its menu
   */
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    right: spacing.lg,
    alignItems: 'flex-end',
    zIndex: 10,
  },

  /**
   * Overlay that appears behind the menu when it's open
   */
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 9,
  },

  /**
   * FAB button style
   */
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 2,
  },

  /**
   * Container for the menu items
   */
  menuContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 2,
  },

  /**
   * Style for each menu item
   */
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    minWidth: 120,
  },

  /**
   * Style for menu item text
   */
  menuItemText: {
    marginLeft: 8,
    fontSize: typography.fontSize.medium,
    color: colors.text.primary,
  },
});

export default LibraryFAB; 