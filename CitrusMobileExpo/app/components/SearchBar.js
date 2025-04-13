import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';

/**
 * SearchBar component that provides search functionality for the Library screen.
 * Includes a search input field with a search icon and a clear button.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.searchQuery - Current search query value
 * @param {Function} props.setSearchQuery - Function to update the search query
 * @param {Object} props.searchInputRef - Reference to the search input field
 * @param {Function} props.clearSearch - Function to clear the search query
 * @returns {JSX.Element} Rendered search bar
 */
const SearchBar = ({ searchQuery, setSearchQuery, searchInputRef, clearSearch }) => {
  return (
    <View style={styles.searchContainer}>
      <MaterialIcons name="search" size={24} color={colors.text.secondary} style={styles.searchIcon} />
      <TextInput
        ref={searchInputRef}
        style={styles.searchInput}
        placeholder="Search your library..."
        placeholderTextColor={colors.text.secondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
        returnKeyType="search"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
          <MaterialIcons name="close" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * Styles for the SearchBar component
 * @type {Object}
 */
const styles = StyleSheet.create({
  /**
   * Main search container
   */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    padding: spacing.sm,
    paddingLeft: spacing.md,
    margin: spacing.md,
    shadowColor: colors.primary.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  /**
   * Style for search icon
   */
  searchIcon: {
    marginRight: spacing.sm,
  },

  /**
   * Style for search input field
   */
  searchInput: {
    flex: 1,
    height: 40,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.medium,
    fontWeight: typography.fontWeight.bold,
    paddingHorizontal: spacing.sm,
  },

  /**
   * Style for clear button
   */
  clearButton: {
    padding: spacing.xs,
  },
});

export default SearchBar; 