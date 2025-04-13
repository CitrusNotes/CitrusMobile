import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';

/**
 * Determines the appropriate MaterialIcons icon name based on the file's content type
 * 
 * @param {string} contentType - The MIME type of the file
 * @returns {string} The name of the MaterialIcons icon to use
 */
const getFileIcon = (contentType) => {
  switch (contentType) {
    case 'application/pdf':
      return 'picture-as-pdf';
    case 'image/jpeg':
    case 'image/png':
    case 'image/gif':
      return 'image';
    case 'text/plain':
      return 'description';
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'description';
    default:
      return 'insert-drive-file';
  }
};

/**
 * GridItem component for displaying items in a grid layout
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.item - The item to display
 * @param {Function} props.onPress - Function to handle item press
 * @param {Function} props.onLongPress - Function to handle item long press
 * @param {Function} props.onMenuPress - Function to handle menu press
 * @param {Function} props.onMenuOpen - Function to handle menu open
 * @param {Function} props.onMenuClose - Function to handle menu close
 * @param {Function} props.handleDelete - Function to handle item deletion
 * @param {Function} props.handleShowDetail - Function to show item details
 * @param {Function} props.setSelectedItem - Function to set the selected item
 * @param {Function} props.setIsTagModalVisible - Function to show/hide tag modal
 * @param {Function} props.formatDate - Function to format dates
 * @param {Function} props.formatFileSize - Function to format file sizes
 * @returns {JSX.Element} Rendered grid item
 */
export const GridItem = ({ item, onPress, onLongPress, onMenuPress, onMenuOpen, onMenuClose, handleDelete, handleShowDetail, setSelectedItem, setIsTagModalVisible, formatDate, formatFileSize }) => {
  const handleMenuPress = (event) => {
    event.stopPropagation();
    const { pageX, pageY } = event.nativeEvent;
    onMenuOpen(item, { x: pageX, y: pageY });
  };

  const handleDownload = () => {
    onMenuClose();
    onPress(item);
  };

  const handleMove = () => {
    onMenuClose();
    // TODO: Implement move functionality
  };

  const handleFavorite = async () => {
    onMenuClose();
    try {
      const currentIsStarred = item.is_starred || false;
      await api.updateFileSystemItem(item._id, { is_starred: !currentIsStarred });
      await fetchItems();
      Alert.alert('Success', !currentIsStarred ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      console.error('Error in handleFavorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const handleAddTagPress = () => {
    onMenuClose();
    setSelectedItem(item);
    setIsTagModalVisible(true);
  };

  const handleDeletePress = () => {
    onMenuClose();
    handleDelete(item);
  };

  return (
    <TouchableOpacity 
      key={item._id} 
      style={styles.gridItem}
      onPress={handleDownload}
      onLongPress={() => onLongPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.gridItemHeader}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={handleMenuPress}
          activeOpacity={0.7}
        >
          <MaterialIcons name="more-vert" size={24} color={colors.accent} />
        </TouchableOpacity>
        <MaterialIcons 
          name={item.is_folder ? "folder" : getFileIcon(item.fileMetadata?.content_type)} 
          size={56} 
          color={colors.primary.main} 
        />
      </View>

      <Text style={[
        styles.itemName,
        item.is_folder && styles.folderName
      ]}>{item.name}</Text>

      <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>

      {!item.is_folder && item.fileMetadata && (
        <Text style={styles.sizeText}>
          {formatFileSize(item.fileMetadata.length)}
        </Text>
      )}
    </TouchableOpacity>
  );
};

/**
 * ListItem component for displaying items in a list layout
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.item - The item to display
 * @param {Function} props.onPress - Function to handle item press
 * @param {Function} props.onLongPress - Function to handle item long press
 * @param {Function} props.onMenuPress - Function to handle menu press
 * @param {Function} props.onMenuOpen - Function to handle menu open
 * @param {Function} props.onMenuClose - Function to handle menu close
 * @param {Function} props.handleDelete - Function to handle item deletion
 * @param {Function} props.handleShowDetail - Function to show item details
 * @param {Function} props.setSelectedItem - Function to set the selected item
 * @param {Function} props.setIsTagModalVisible - Function to show/hide tag modal
 * @param {Function} props.formatDate - Function to format dates
 * @param {Function} props.formatFileSize - Function to format file sizes
 * @returns {JSX.Element} Rendered list item
 */
export const ListItem = ({ item, onPress, onLongPress, onMenuPress, onMenuOpen, onMenuClose, handleDelete, handleShowDetail, setSelectedItem, setIsTagModalVisible, formatDate, formatFileSize }) => {
  const menuButtonRef = useRef(null);

  const handleMenuPress = (event) => {
    event.stopPropagation();
    const { pageX, pageY } = event.nativeEvent;
    onMenuOpen(item, { x: pageX, y: pageY });
  };

  const handleDownload = () => {
    onMenuClose();
    onPress(item);
  };

  const handleMove = () => {
    onMenuClose();
    // TODO: Implement move functionality
  };

  const handleFavorite = async () => {
    onMenuClose();
    try {
      const currentIsStarred = item.is_starred || false;
      await api.updateFileSystemItem(item._id, { is_starred: !currentIsStarred });
      await fetchItems();
      Alert.alert('Success', !currentIsStarred ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      console.error('Error in handleFavorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const handleAddTagPress = () => {
    onMenuClose();
    setSelectedItem(item);
    setIsTagModalVisible(true);
  };

  const handleDeletePress = () => {
    onMenuClose();
    handleDelete(item);
  };

  return (
    <TouchableOpacity 
      key={item._id} 
      style={styles.listItem}
      onPress={handleDownload}
      onLongPress={() => onLongPress(item)}
      activeOpacity={0.7}
    >
      <MaterialIcons 
        name={item.is_folder ? "folder" : getFileIcon(item.fileMetadata?.content_type)} 
        size={24} 
        color={colors.primary.main} 
        style={styles.itemIcon} 
      />

      <View style={styles.itemContent}>
        <Text style={styles.itemName}>{item.name}</Text>

        {!item.is_folder && item.fileMetadata && (
          <Text style={styles.sizeText}>
            {formatFileSize(item.fileMetadata.length)}
          </Text>
        )}
      </View>

      {item.is_folder ? (
        <MaterialIcons name="chevron-right" size={24} color={colors.text.secondary} />
      ) : (
        <TouchableOpacity 
          ref={menuButtonRef}
          style={styles.menuButton}
          onPress={handleMenuPress}
          activeOpacity={0.7}
        >
          <MaterialIcons name="more-vert" size={24} color={colors.accent} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

/**
 * Styles for the LibraryItems components
 * @type {Object}
 */
const styles = StyleSheet.create({
  /**
   * Style for grid items
   */
  gridItem: {
    backgroundColor: colors.background.secondary,
    width: '31%',
    aspectRatio: 0.9,
    marginBottom: spacing.sm,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    shadowColor: colors.primary.dark,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
    overflow: 'hidden',
  },

  /**
   * Style for grid item header
   */
  gridItemHeader: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },

  /**
   * Style for menu button
   */
  menuButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /**
   * Style for centered menu
   */
  centeredMenuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /**
   * Style for menu container
   */
  menuContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 2,
  },

  /**
   * Style for menu items
   */
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    minWidth: 120,
  },

  /**
   * Style for menu item text
   */
  menuItemText: {
    marginLeft: 8,
    fontSize: typography.fontSize.medium,
    color: colors.text.primary,
  },

  /**
   * Style for item name
   */
  itemName: {
    color: colors.text.primaryDark,
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.small,
    textAlign: 'center',
    paddingHorizontal: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: 0,
  },

  /**
   * Style for folder name
   */
  folderName: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
  },

  /**
   * Style for date text
   */
  dateText: {
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.small,
    marginBottom: 0,
  },

  /**
   * Style for size text
   */
  sizeText: {
    color: colors.text.secondary,
    fontSize: 12,
    marginBottom: 0,
  },

  /**
   * Style for list items
   */
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    marginBottom: spacing.xs,
    borderWidth: 0.5,
    borderColor: colors.primary.main,
    height: 80,
    overflow: 'hidden',
  },

  /**
   * Style for item icon
   */
  itemIcon: {
    marginRight: spacing.md,
  },

  /**
   * Style for item content
   */
  itemContent: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },

  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
  },

  overlayTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 