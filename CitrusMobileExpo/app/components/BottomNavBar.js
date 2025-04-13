import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';

/**
 * BottomNavBar component that provides navigation between main app screens.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.activeScreen - Currently active screen name
 * @returns {JSX.Element} Rendered bottom navigation bar
 */
export default function BottomNavBar({ activeScreen }) {
  const navigation = useNavigation();

  /**
   * Handles navigation to the Scan screen
   * 
   * @returns {void}
   */
  const handleScanPress = () => {
    navigation.navigate('ScanScreen');
  };

  /**
   * Handles navigation to the Library screen
   * If already on Library screen, resets to root
   * 
   * @returns {void}
   */
  const handleLibraryPress = () => {
    if (activeScreen === 'Library') {
      // If already on Library screen, reset to root
      navigation.reset({
        index: 0,
        routes: [{ name: 'Library' }],
      });
    } else {
      // If on another screen, navigate to Library
      navigation.navigate('Library');
    }
  };

  /**
   * Handles navigation to the Favorites screen
   * If already on Favorites screen, refreshes the page
   * 
   * @returns {void}
   */
  const handleFavoritePress = () => {
    if (activeScreen === 'FavoriteScreen') {
      // If already on favorites screen, refresh the page
      navigation.reset({
        index: 0,
        routes: [{ name: 'FavoriteScreen' }],
      });
    } else {
      navigation.navigate('FavoriteScreen');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.tab} 
        onPress={handleFavoritePress}
      >
        <MaterialIcons 
          name="star" 
          size={24} 
          color={activeScreen === 'FavoriteScreen' ? '#FFFFFF' : colors.text.secondary} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.tab} 
        onPress={handleLibraryPress}
      >
        <MaterialIcons 
          name="folder" 
          size={24} 
          color={activeScreen === 'Library' ? '#FFFFFF' : colors.text.secondary} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.tab} 
        onPress={handleScanPress}
      >
        <MaterialIcons 
          name="qr-code-scanner" 
          size={24} 
          color={activeScreen === 'ScanScreen' ? '#FFFFFF' : colors.text.secondary} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // container is the bottom navigation bar
    flexDirection: 'row',
    height: 80,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingBottom: 12,
    paddingTop: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tab: {
    // tabs are navigation buttons
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '33.33%',
  },
}); 