import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../constants/theme';

/**
 * Welcome screen component that serves as the entry point of the application
 * Displays a welcome message and allows users to navigate to the Library screen
 * 
 * @component
 * @returns {JSX.Element} Rendered welcome screen
 */
export default function WelcomeScreen() {
  const navigation = useNavigation();

  return (
    <TouchableOpacity 
      style={styles.welcomeScreen}
      activeOpacity={1}
      onPress={() => navigation.replace('Library')}
    >
      <Text style={styles.mainHeading}>Welcome to Citrus!</Text>
      <View style={styles.emojiContainer}>
        <Text style={styles.emojiText}>🍊🍋🍈🍋🍊</Text>
      </View>
      <Text style={styles.description}>Scan, organize, and edit your documents effortlessly</Text>
      <View style={styles.emojiContainer}>
        <Text style={styles.emojiText}>📒📓📝📓📒</Text>
      </View>
      <Text style={styles.cta}>tap to get started</Text>
    </TouchableOpacity>
  );
}

/**
 * Styles for the WelcomeScreen component
 * @type {Object}
 */
const styles = StyleSheet.create({
  /**
   * Main container style for the welcome screen
   */
  welcomeScreen: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
    padding: 16,
  },
  
  /**
   * Style for the main heading text
   */
  mainHeading: {
    fontSize: 40,
    paddingHorizontal: 30,
    fontFamily: typography.fontFamily.primary,
    color: 'white',
    textAlign: 'center',
  },

  /**
   * Container style for emoji text
   */
  emojiContainer: {
    marginVertical: 10,
  },

  /**
   * Style for emoji text
   */
  emojiText: {
    fontSize: 24,
    color: 'white',
    textAlign: 'center',
  },

  /**
   * Style for the description text
   */
  description: {
    fontSize: 40,
    fontFamily: typography.fontFamily.primary,
    fontWeight: 'bold',
    marginTop: 5,
    color: 'white',
    textAlign: 'center',
  },

  /**
   * Style for the call-to-action text
   */
  cta: {
    fontSize: 25,
    fontFamily: typography.fontFamily.primary,
    fontWeight: 'bold',
    marginTop: 125,
    marginBottom: 16,
    color: 'white',
  },
});