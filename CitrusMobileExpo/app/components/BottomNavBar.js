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
   * Handles Library button press
   * Sets parent_id to null to return to root directory
   * 
   * @returns {void}
   */
  const handleLibraryPress = () => {
    if (activeScreen === 'Library') {
      // If on Library screen, refresh the root directory
      navigation.setParams({ parent_id: null, refresh: true });
    } else {
      // If on another screen, navigate to Library at root; Redundant but kept for clarity
      navigation.navigate('Library', { parent_id: null });
    }
  };

  /**
   * Handles navigation to the Favorites screen
   * 
   * @returns {void}
   */
  const handleFavoritePress = () => {
    navigation.navigate('FavoriteScreen');
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