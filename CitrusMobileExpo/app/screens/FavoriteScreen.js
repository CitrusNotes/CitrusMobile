import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import BottomNavBar from '../components/BottomNavBar';
import { api } from '../services/api';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Temporary user ID - TODO: Replace with actual user authentication
const TEMP_USER_ID = '67f7454e9f6072baae1702c1';

/**
 * Recursive component for rendering folder and file items in a tree structure
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.item - The folder or file item to render
 * @param {number} [props.level=0] - The nesting level of the item
 * @param {Array} props.expandedFolders - Array of expanded folder IDs
 * @param {Function} props.toggleFolder - Function to toggle folder expansion
 * @param {Function} props.onStarPress - Function to handle star button press
 * @returns {JSX.Element} Rendered folder or file item
 */
const FolderItem = ({ item, level = 0, expandedFolders, toggleFolder, onStarPress }) => {
  const isExpanded = expandedFolders.includes(item._id);
  const indent = level * spacing.lg;
  const isChild = level > 0;
  const isGrandchild = level > 1;

  console.log('Rendering FolderItem:', {
    name: item.name,
    id: item._id,
    isExpanded,
    level,
    hasChildren: item.children?.length > 0,
    childrenCount: item.children?.length || 0,
    children: item.children?.map(c => ({ name: c.name, id: c._id }))
  });

  /**
   * Handles file click event, downloads and shares the file
   * @param {Object} file - The file to handle
   */
  const handleFileClick = async (file) => {
    try {
      // Get file metadata if not already available
      if (!file.fileMetadata) {
        console.log('Getting file metadata for:', file.gridfs_id);
        const metadata = await api.getFileMetadata(file.gridfs_id);
        console.log('File metadata:', metadata);
        file.fileMetadata = metadata;
      }

      // If it's a PDF, handle it directly
      if (file.content_type === 'application/pdf') {
        console.log('Opening PDF:', file.name, 'with ID:', file.gridfs_id);
        
        // Download the file
        const base64Data = await api.downloadFile(file.gridfs_id);
        if (!base64Data) {
          throw new Error('No PDF data received');
        }

        // Create a temporary file path
        const tempDir = FileSystem.cacheDirectory;
        const tempFilePath = `${tempDir}${file.name}`;
        
        // Save the PDF to a temporary file
        console.log('Saving PDF to temporary file:', tempFilePath);
        await FileSystem.writeAsStringAsync(tempFilePath, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Open the PDF using sharing
        await Sharing.shareAsync(tempFilePath, {
          mimeType: 'application/pdf',
          dialogTitle: `Open ${file.name}`,
          UTI: 'application/pdf'
        });

        // Clean up the temporary file
        try {
          await FileSystem.deleteAsync(tempFilePath);
          console.log('Temporary file deleted');
        } catch (cleanupError) {
          console.warn('Error cleaning up temporary file:', cleanupError);
        }
      } else {
        // For other file types, download and share
        console.log('Downloading file:', file.name);
        const response = await api.downloadFile(file.gridfs_id);
        
        // Create a blob from the response
        const blob = new Blob([response], { type: file.content_type || 'application/octet-stream' });
        
        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        
        reader.onloadend = async () => {
          const base64Data = reader.result.split(',')[1];
          
          try {
            // Create a temporary file with a unique name
            const tempDir = FileSystem.cacheDirectory;
            const uniqueFileName = `${Date.now()}-${file.name}`;
            const tempFile = `${tempDir}${uniqueFileName}`;
            
            // Save the file temporarily
            await FileSystem.writeAsStringAsync(tempFile, base64Data, {
              encoding: FileSystem.EncodingType.Base64,
            });
            
            // Share the file (this will open the system's share sheet)
            await Sharing.shareAsync(tempFile, {
              mimeType: file.content_type || 'application/octet-stream',
              dialogTitle: `Save ${file.name}`,
              UTI: file.content_type || 'public.data'
            });
            
            // Clean up the temporary file after sharing
            try {
              const fileInfo = await FileSystem.getInfoAsync(tempFile);
              if (fileInfo.exists) {
                await FileSystem.deleteAsync(tempFile);
              }
            } catch (cleanupError) {
              console.warn('Error cleaning up temporary file:', cleanupError);
            }
            
          } catch (error) {
            console.error('Error saving file:', error);
            Alert.alert(
              'Error',
              `Failed to save file: ${error.message}`
            );
          }
        };
      }
    } catch (error) {
      console.error('Error handling file:', error);
      Alert.alert(
        'Error',
        `Failed to handle file: ${error.message}\n\nPlease try again later.`
      );
    }
  };

  return (
    <View>
      <TouchableOpacity 
        style={[
          item.is_folder ? styles.folderItem : styles.fileItem,
          isChild && { marginLeft: spacing.lg * level },
        ]}
        onPress={() => {
          console.log('Folder clicked:', {
            name: item.name,
            id: item._id,
            currentExpandedState: isExpanded,
            currentExpandedFolders: expandedFolders
          });
          if (item.is_folder) {
            toggleFolder(item._id);
          } else {
            handleFileClick(item);
          }
        }}
      >
        {item.is_folder && (
          <MaterialIcons 
            name={isExpanded ? "keyboard-arrow-down" : "keyboard-arrow-right"} 
            size={24} 
            color={colors.text.secondary} 
            style={styles.arrowIcon}
          />
        )}
        <MaterialIcons 
          name={item.is_folder ? "folder" : "insert-drive-file"} 
          size={24} 
          color={colors.primary.main} 
          style={styles.itemIcon} 
        />
        <View style={styles.itemContent}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDate}>{formatDate(item.created_at)}</Text>
        </View>
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            console.log('Star button clicked for:', {
              name: item.name,
              id: item._id,
              currentStarred: item.is_starred
            });
            onStarPress(item);
          }}
          style={styles.starButton}
        >
          <MaterialIcons 
            name={item.is_starred ? "star" : "star-border"} 
            size={24} 
            color={colors.primary.main} 
          />
        </TouchableOpacity>
      </TouchableOpacity>

      {isExpanded && item.children && item.children.length > 0 && (
        <View style={styles.childrenContainer}>
          {console.log('Rendering children for folder:', {
            name: item.name,
            id: item._id,
            childrenCount: item.children.length,
            children: item.children.map(c => ({ name: c.name, id: c._id }))
          })}
          {item.children.map(child => (
            <FolderItem 
              key={child._id}
              item={child}
              level={level + 1}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              onStarPress={onStarPress}
            />
          ))}
        </View>
      )}
    </View>
  );
};

/**
 * Formats a date string into a localized date format
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string
 */
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

/**
 * Main component for displaying and managing favorite items
 * 
 * @component
 * @returns {JSX.Element} Rendered favorites screen
 */
export default function FolderListView() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchInputRef = useRef(null);

  /**
   * Fetches favorite items from the API on component mount
   */
  useEffect(() => {
    fetchItems();
  }, []);

  /**
   * Fetches all favorite items and their contents
   * Handles both directly favorited items and items within favorited folders
   */
  const fetchItems = async () => {
    try {
      setLoading(true);
      
      // First, fetch root items
      const rootData = await api.getFileSystemItems(TEMP_USER_ID);
      console.log('Root items:', rootData.map(item => ({ name: item.name, id: item._id })));
      
      // Ensure all items have is_starred property
      const normalizedData = rootData.map(item => ({
        ...item,
        is_starred: item.is_starred || false
      }));
      
      // Get all favorited items
      const favoritedItems = normalizedData.filter(item => item.is_starred);
      
      // Get IDs of favorited folders
      const favoritedFolderIds = favoritedItems
        .filter(item => item.is_folder)
        .map(folder => folder._id);
      
      /**
       * Recursively fetches all contents of a folder
       * @param {string} folderId - The ID of the folder to fetch contents for
       * @returns {Promise<Array>} Array of folder contents
       */
      const fetchFolderContents = async (folderId) => {
        const contents = await api.getFileSystemItems(TEMP_USER_ID, folderId);
        const normalizedContents = contents.map(item => ({
          ...item,
          is_starred: item.is_starred || false
        }));
        
        // For each folder in the contents, fetch its contents recursively
        const folderPromises = normalizedContents
          .filter(item => item.is_folder)
          .map(folder => fetchFolderContents(folder._id));
        
        const nestedContents = await Promise.all(folderPromises);
        
        return [
          ...normalizedContents,
          ...nestedContents.flat()
        ];
      };
      
      // Fetch contents of all favorited folders recursively
      const folderContentsPromises = favoritedFolderIds.map(folderId => 
        fetchFolderContents(folderId)
      );
      const folderContents = await Promise.all(folderContentsPromises);
      
      // Combine all items
      const allItems = [
        ...normalizedData,
        ...folderContents.flat()
      ];
      
      // Get all items that are either:
      // 1. Directly favorited (regardless of parent), or
      // 2. Inside a favorited folder (regardless of their star status)
      const allItemsToShow = allItems.filter(item => {
        // If the item itself is favorited, always show it
        if (item.is_starred) return true;
        
        // If the item is inside a favorited folder, show it
        if (item.parent_id && favoritedFolderIds.includes(item.parent_id)) return true;
        
        // If the item is inside a folder that's inside a favorited folder, show it
        const isInsideFavoritedFolder = (itemId) => {
          const item = allItems.find(i => i._id === itemId);
          if (!item) return false;
          if (favoritedFolderIds.includes(item.parent_id)) return true;
          return isInsideFavoritedFolder(item.parent_id);
        };
        
        if (item.parent_id && isInsideFavoritedFolder(item.parent_id)) return true;
        
        return false;
      });
      
      // Create a map of all items for quick lookup
      const itemMap = {};
      allItemsToShow.forEach(item => {
        itemMap[item._id] = { ...item, children: [] };
      });

      // Find all items that should be root items in the favorites view
      // These are only items that are directly favorited
      const rootItems = allItemsToShow.filter(item => item.is_starred);

      /**
       * Recursively builds the folder hierarchy
       * @param {Object} currentItem - The current item to build hierarchy for
       * @returns {Object} Item with its children hierarchy
       */
      const buildHierarchy = (currentItem) => {
        const itemWithChildren = { ...currentItem, children: [] };
        
        // Find all children of this item
        const children = allItemsToShow.filter(child => 
          child.parent_id === currentItem._id
        );
        
        // Recursively build hierarchy for each child
        itemWithChildren.children = children.map(child => buildHierarchy(child));
        
        // Log folder information
        if (currentItem.is_folder) {
          console.log('Folder:', {
            name: currentItem.name,
            id: currentItem._id,
            isStarred: currentItem.is_starred,
            childrenCount: children.length,
            children: children.map(c => ({ name: c.name, id: c._id }))
          });
        }
        
        return itemWithChildren;
      };

      const organizedItems = rootItems.map(item => buildHierarchy(item));
      setItems(organizedItems);
    } catch (error) {
      console.error('Error fetching items:', error);
      Alert.alert('Error', 'Failed to load starred items');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clears the search input and removes focus
   */
  const clearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.blur();
  };

  /**
   * Toggles the expansion state of a folder
   * @param {string} folderId - The ID of the folder to toggle
   */
  const toggleFolder = (folderId) => {
    console.log('Toggling folder:', {
      folderId,
      currentExpandedFolders: expandedFolders,
      action: expandedFolders.includes(folderId) ? 'collapsing' : 'expanding'
    });
    
    setExpandedFolders(prev => {
      if (prev.includes(folderId)) {
        // Remove this folder and all its children from expanded state
        return prev.filter(id => id !== folderId);
      } else {
        // Add this folder to expanded state
        return [...prev, folderId];
      }
    });
  };

  /**
   * Handles toggling the star status of an item
   * @param {Object} item - The item to toggle star status for
   */
  const handleStarPress = async (item) => {
    try {
      setLoading(true);
      // Toggle the star status
      await api.updateFileSystemItem(item._id, { is_starred: !item.is_starred });
      // Refresh the favorites page
      await fetchItems();
      Alert.alert('Success', item.is_starred ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      console.error('Error toggling star status:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    } finally {
      setLoading(false);
    }
  };

  // Filter items based on search query
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <Text style={styles.navTitle}>Favorites</Text>
      </View>

      {/* Fixed Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color={colors.text.secondary} style={styles.searchIcon} />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Search favorites..."
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

      {/* Scrollable Content */}
      <ScrollView style={styles.contentScroll}>
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading favorites...</Text>
            </View>
          ) : filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <FolderItem 
                key={item._id}
                item={item}
                level={0}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                onStarPress={handleStarPress}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="star-border" size={48} color={colors.text.secondary} />
              <Text style={styles.emptyText}>No favorites yet</Text>
              <Text style={styles.emptySubtext}>Star items to add them to favorites</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <BottomNavBar activeScreen="FavoriteScreen" />
    </View>
  );
}

/**
 * Styles for the FavoriteScreen component
 * @type {Object}
 */
const styles = StyleSheet.create({
  /**
   * Main container style
   */
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /**
   * Navigation bar style
   */
  navBar: {
    height: '12%',
    backgroundColor: colors.background.primary,
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingBottom: 8,
  },

  /**
   * Navigation title style
   */
  navTitle: {
    fontSize: typography.fontSize.xlarge,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.primary,
    fontWeight: 'bold',
  },

  /**
   * Search container style
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
   * Search icon style
   */
  searchIcon: {
    marginRight: spacing.sm,
  },

  /**
   * Search input style
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
   * Clear button style
   */
  clearButton: {
    padding: spacing.xs,
  },

  /**
   * Content scroll view style
   */
  contentScroll: {
    flex: 1,
    marginBottom: 80,
  },

  /**
   * Content container style
   */
  content: {
    padding: spacing.md,
  },

  /**
   * Folder item style
   */
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: spacing.xs,
    borderWidth: 0.5,
    borderColor: colors.primary.dark,
  },

  /**
   * File item style
   */
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: spacing.xs,
    borderWidth: 0.5,
    borderColor: colors.primary.dark,
  },

  /**
   * Item icon style
   */
  itemIcon: {
    marginRight: spacing.md,
  },

  /**
   * Item content container style
   */
  itemContent: {
    flex: 1,
  },

  /**
   * Item name text style
   */
  itemName: {
    fontSize: typography.fontSize.medium,
    color: colors.text.primaryDark,
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },

  /**
   * Item date text style
   */
  itemDate: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.primary,
  },

  /**
   * Star button style
   */
  starButton: {
    padding: spacing.sm,
  },

  /**
   * Loading container style
   */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },

  /**
   * Loading text style
   */
  loadingText: {
    fontSize: typography.fontSize.medium,
    color: colors.text.secondary,
  },
  
  /**
   * Empty container style
   */
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  
  /**
   * Empty text style
   */
  emptyText: {
    fontSize: typography.fontSize.large,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  
  /**
   * Empty subtext style
   */
  emptySubtext: {
    fontSize: typography.fontSize.medium,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  
  /**
   * Arrow icon style
   */
  arrowIcon: {
    marginRight: spacing.sm,
  },
  
  /**
   * Children container style
   */
  childrenContainer: {
    marginLeft: spacing.md,
  },
}); 