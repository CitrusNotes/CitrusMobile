import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../constants/theme';
import { auth } from '../services/auth';

/**
 * SignUpScreen component that handles new user registration
 * Provides a form for users to create a new account
 * Includes validation for email format and password requirements
 * 
 * @component
 * @returns {JSX.Element} Rendered sign-up form
 */
export default function SignUpScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handles the sign-up process
   * Validates input fields and attempts to create a new user account
   * Shows appropriate error messages on failure
   */
  const handleSignUp = async () => {
    // Basic validation for required fields
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Email format validation using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Password length validation
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    // Password confirmation validation
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      // Attempt to create new user account
      await auth.signUp(email, password);
      Alert.alert(
        'Success',
        'Account created successfully! Please sign in.',
        [{ text: 'OK', onPress: () => navigation.replace('SignIn') }]
      );
    } catch (error) {
      console.error('Sign up error:', error);
      Alert.alert(
        'Sign Up Failed',
        error.message || 'Failed to create account. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      {/* Email input field */}
      <TextInput
        style={[styles.input, { color: colors.accent }]}
        placeholder="Email"
        placeholderTextColor={colors.text.primaryDark}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      {/* Password input field */}
      <TextInput
        style={[styles.input, { color: colors.accent }]}
        placeholder="Password"
        placeholderTextColor={colors.text.primaryDark}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Confirm password input field */}
      <TextInput
        style={[styles.input, { color: colors.accent }]}
        placeholder="Confirm Password"
        placeholderTextColor={colors.text.primaryDark}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      
      {/* Sign up button */}
      <TouchableOpacity 
        style={styles.button}
        onPress={handleSignUp}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </Text>
      </TouchableOpacity>

      {/* Link to sign in screen */}
      <TouchableOpacity 
        style={styles.linkContainer}
        onPress={() => navigation.navigate('SignIn')}
      >
        <Text style={styles.linkText}>
          Already have an account? Sign In
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Styles for the SignUpScreen component
 * @type {Object}
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background.primary,
  },

  /**
   * Title style
   */
  title: {
    fontSize: typography.fontSize.xlarge,
    color: colors.text.primary,
    marginBottom: spacing.xl,
    fontFamily: typography.fontFamily.primary,
  },

  /**
   * Input style
   */
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.background.secondary,
    color: colors.text.primary,
  },

  /**
   * Button style
   */
  button: {
    width: '100%',
    height: 50,
    backgroundColor: colors.primary.main,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary.dark,
  },

  /**
   * Button text style
   */
  buttonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.medium,
    fontFamily: typography.fontFamily.primary,
  },

  /**
   * Link container style
   */
  linkContainer: {
    marginTop: spacing.md,
  },

  /**
   * Link text style
   */ 
  linkText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.medium,
    fontFamily: typography.fontFamily.primary,
    textDecorationLine: 'underline',
  },
}); 