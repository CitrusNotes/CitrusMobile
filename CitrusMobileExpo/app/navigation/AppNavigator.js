import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import LibraryScreen from '../screens/LibraryScreen';
import FavoriteScreen from '../screens/FavoriteScreen';
import CameraScreen from '../screens/CameraScreen';
import ScanScreen from '../screens/ScanScreen';
import { colors } from '../constants/theme';

/**
 * Creates a stack navigator instance
 * @type {Object}
 */
const Stack = createNativeStackNavigator();

/**
 * AppNavigator component that defines the main navigation structure of the application
 * Uses React Navigation's Stack Navigator to manage screen transitions and navigation
 * 
 * @component
 * @returns {JSX.Element} The main navigation container with configured screens
 */
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome">
        {/* Welcome Screen - Initial landing page */}
        <Stack.Screen 
          name="Welcome" 
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />

        {/* Sign In Screen - Modal for signing in */}
        <Stack.Screen 
          name="SignIn" 
          component={SignInScreen}
          options={{ headerShown: false }}
        />

        {/* Sign Up Screen - Modal for creating account */}
        <Stack.Screen 
          name="SignUp" 
          component={SignUpScreen}
          options={{ headerShown: false }}
        />

        {/* Library Screen - Main file management interface */}
        <Stack.Screen 
          name="Library" 
          component={LibraryScreen}
          options={{ headerShown: false }}
        />

        {/* Favorites Screen - Displays starred/favorite items */}
        <Stack.Screen 
          name="FavoriteScreen" 
          component={FavoriteScreen}
          options={{ 
            title: 'Favorites',
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerShown: false 
          }}
        />

        {/* Camera Screen - Modal for capturing photos */}
        <Stack.Screen 
          name="Camera" 
          component={CameraScreen}
          options={{ 
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerShown: false
          }}
        />

        {/* Scan Screen - Modal for document scanning */}
        <Stack.Screen 
          name="ScanScreen" 
          component={ScanScreen}
          options={{ 
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerShown: false
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 