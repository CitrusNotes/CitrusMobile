import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../constants/theme';
import { auth } from '../services/auth';

/**
 * SignInScreen component that handles user authentication
 * Provides a form for users to enter their email and password
 * Handles validation and error states
 * 
 * @component
 * @returns {JSX.Element} Rendered sign-in form
 */
export default function SignInScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handles the sign-in process
   * Validates input fields and attempts to authenticate the user
   * Shows appropriate error messages on failure
   */
  const handleSignIn = async () => {
    // Validate required fields
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      // Attempt to sign in using auth service
      await auth.signIn(email, password);
      // Navigate to Library screen on success
      navigation.replace('Library');
    } catch (error) {
      // Only log unexpected errors, not validation errors
      if (!error.message.includes('Invalid email or password')) {
        console.error('Sign in error:', error);
      }
      Alert.alert(
        'Sign In Failed',
        error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      
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
      
      {/* Sign in button */}
      <TouchableOpacity 
        style={styles.button}
        onPress={handleSignIn}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Text>
      </TouchableOpacity>

      {/* Link to registration screen */}
      <TouchableOpacity 
        style={styles.linkContainer}
        onPress={() => navigation.navigate('SignUp')}
      >
        <Text style={styles.linkText}>
          New? Click here to Register
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Styles for the SignInScreen component
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