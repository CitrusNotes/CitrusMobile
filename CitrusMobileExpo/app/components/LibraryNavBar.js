import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';

/**
 * LibraryNavBar component that provides navigation controls for the Library screen.
 * Includes a back button, current folder path display, and view mode toggle.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object|null} props.currentFolder - The current folder object or null if at root
 * @param {Function} props.handleBackClick - Function to handle back button press
 * @param {string} props.viewMode - Current view mode ('grid' or 'list')
 * @param {Function} props.setViewMode - Function to toggle between grid and list views
 * @param {Function} props.getCurrentFolderPath - Function to get the current folder path
 * @returns {JSX.Element} Rendered navigation bar
 */
const LibraryNavBar = ({ currentFolder, handleBackClick, viewMode, setViewMode }) => {
  const navigation = useNavigation();

  /**
   * Handles user sign out
   * Navigates back to the sign-in screen
   */
  const handleSignOut = () => {
    navigation.replace('SignIn');
  };

  return (
    <View style={styles.navBar}>
      <View style={styles.controlsContainer}>
        {/* Left control section - Back button or Sign out */}
        <View style={styles.leftControl}>
          {currentFolder !== null ? (
            <TouchableOpacity onPress={handleBackClick} style={styles.controlButton}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleSignOut} style={styles.controlButton}>
              <MaterialIcons name="logout" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Center section - Current folder name */}
        <View style={styles.centerControl}>
          <Text style={styles.navTitle} numberOfLines={1} ellipsizeMode="tail">
            {currentFolder ? currentFolder.name : 'Library'}
          </Text>
        </View>

        {/* Right control section - View mode toggle */}
        <View style={styles.rightControl}>
          <TouchableOpacity 
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} 
            style={styles.controlButton}
          >
            <MaterialIcons 
              name={viewMode === 'grid' ? 'view-list' : 'grid-view'} 
              size={24} 
              color={colors.text.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

/**
 * Styles for the LibraryNavBar component
 * @type {Object}
 */
const styles = StyleSheet.create({
  /**
   * Main navigation bar container
   */
  navBar: {
    height: '12%',
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    justifyContent: 'flex-end',
    paddingBottom: spacing.sm,
  },

  /**
   * Style for controls container
   */
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },

  /**
   * Style for left control
   */
  leftControl: {
    flex: 1,
    alignItems: 'flex-start',
  },

  /**
   * Style for center control
   */
  centerControl: {
    flex: 2,
    alignItems: 'center',
  },

  /**
   * Style for right control
   */
  rightControl: {
    flex: 1,
    alignItems: 'flex-end',
  },

  /**
   * Style for navigation title
   */
  navTitle: {
    fontSize: typography.fontSize.xlarge,
    color: '#FFFFFF',
    fontFamily: typography.fontFamily.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  /**
   * Style for control button
   */
  controlButton: {
    padding: spacing.sm,
  },
});

export default LibraryNavBar; 