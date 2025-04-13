import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';

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
  return (
    <View style={styles.navBar}>
      {currentFolder !== null && (
        <TouchableOpacity onPress={handleBackClick} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      )}
      <Text style={styles.navTitle} numberOfLines={1} ellipsizeMode="tail">
        {currentFolder ? currentFolder.name : 'Library'}
      </Text>
      <TouchableOpacity 
        onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} 
        style={styles.viewToggleButton}
      >
        <MaterialIcons 
          name={viewMode === 'grid' ? 'view-list' : 'grid-view'} 
          size={24} 
          color={colors.text.primary} 
        />
      </TouchableOpacity>
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingBottom: 8,
  },

  /**
   * Style for navigation title showing current path
   */
  navTitle: {
    fontSize: typography.fontSize.xlarge,
    color: '#FFFFFF',
    fontFamily: typography.fontFamily.primary,
    fontWeight: 'bold',
  },

  /**
   * Style for back button
   */
  backButton: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.sm,
  },
  
  /**
   * Style for view mode toggle button
   */
  viewToggleButton: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.sm,
  },
});

export default LibraryNavBar; 