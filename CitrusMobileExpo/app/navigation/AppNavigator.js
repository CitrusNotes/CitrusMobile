import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screen components
import WelcomeScreen from '../screens/WelcomeScreen';
import LibraryScreen from '../screens/LibraryScreen';
import FavoriteScreen from '../screens/FavoriteScreen';
import CameraScreen from '../screens/CameraScreen';
import ScanScreen from '../screens/ScanScreen';

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
      <Stack.Navigator 
        initialRouteName="Welcome" 
        screenOptions={{ 
          headerShown: false,
          animation: 'none'
        }}
      >
        {/* Welcome Screen - Initial landing page */}
        <Stack.Screen 
          name="Welcome" 
          component={WelcomeScreen}
        />

        {/* Library Screen - Main file management interface */}
        <Stack.Screen 
          name="Library" 
          component={LibraryScreen}
          options={{ title: 'My Library' }}
        />

        {/* Favorites Screen - Displays starred/favorite items */}
        <Stack.Screen 
          name="FavoriteScreen" 
          component={FavoriteScreen}
          options={{ title: 'Favorites' }}
        />

        {/* Camera Screen - Modal for capturing photos */}
        <Stack.Screen 
          name="CameraScreen" 
          component={CameraScreen}
          options={{ 
            title: 'Camera',
            presentation: 'modal',
            animation: 'slide_from_bottom'
          }}
        />

        {/* Scan Screen - Modal for document scanning */}
        <Stack.Screen 
          name="ScanScreen" 
          component={ScanScreen}
          options={{ 
            title: 'Scan',
            presentation: 'modal',
            animation: 'slide_from_bottom'
          }}
        />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
} 