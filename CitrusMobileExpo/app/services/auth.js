import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXPO_API_URL } from '@env';

const AUTH_STORAGE_KEY = '@citrus_user_id';

export const auth = {
  /**
   * Authenticate user with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<Object>} User data if successful
   */
  signIn: async (email, password) => {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      const response = await fetch(`${EXPO_API_URL}/users/login`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 401) {
          throw new Error('Invalid email or password');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(error.detail || 'Failed to sign in');
        }
      }

      const userData = await response.json();
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, userData._id);
      return userData;
    } catch (error) {
      // Only log unexpected errors, not validation errors
      if (!error.message.includes('Invalid email or password')) {
        console.error('Unexpected sign in error:', error);
      }
      throw error;
    }
  },

  /**
   * Register a new user with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<Object>} Created user data
   */
  signUp: async (email, password) => {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      const response = await fetch(`${EXPO_API_URL}/users/`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 422) {
          throw new Error('Invalid email or password format');
        } else if (response.status === 400 && data.detail?.includes('already registered')) {
          throw new Error('Email is already registered');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(data.detail || 'Failed to create account');
        }
      }

      return data;
    } catch (error) {
      if (error.message === '[object Object]') {
        // If we get a malformed error, provide a better message
        throw new Error('Failed to create account. Please try again.');
      }
      throw error;
    }
  },

  /**
   * Get the current user's ID
   * @returns {Promise<string|null>} User ID if logged in, null otherwise
   */
  getCurrentUserId: async () => {
    try {
      return await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  },

  /**
   * Sign out the current user
   */
  signOut: async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  },
}; 