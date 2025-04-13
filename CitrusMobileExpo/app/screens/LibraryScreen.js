import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../constants/theme';
import BottomNavBar from '../components/BottomNavBar';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { EXPO_API_URL } from '@env';
import { api } from '../services/api';
import SearchBar from '../components/SearchBar';
import LibraryNavBar from '../components/LibraryNavBar';
import LibraryFAB from '../components/LibraryFAB';
import LibraryModals from '../components/LibraryModals';
import { GridItem, ListItem } from '../components/LibraryItems';
import { MaterialIcons } from '@expo/vector-icons';

// Debug logging
console.log('Environment variables:', {
  EXPO_API_URL,
  processEnv: process.env.EXPO_API_URL
});

// Temporary user ID - TODO: Replace with actual user authentication
const TEMP_USER_ID = '67f7454e9f6072baae1702c1';

/**
 * Main component for displaying and managing the library of files and folders
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.route - Navigation route object
 * @returns {JSX.Element} Rendered library screen
 */
export default function Library({ route }) {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFolderModalVisible, setIsFolderModalVisible] = useState(false);
  const [isTagModalVisible, setIsTagModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newTag, setNewTag] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [folderStack, setFolderStack] = useState([]);
  const [folderNames, setFolderNames] = useState({});
  const searchInputRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState(null);
  const [menuItem, setMenuItem] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [isMoveModalVisible, setIsMoveModalVisible] = useState(false);
  const [availableFolders, setAvailableFolders] = useState([]);

  /**
   * Fetches all library items and their contents
   * Handles both root items and items within folders
   */
  const fetchItems = async () => {
    try {
      setLoading(true);
      console.log('Fetching items for user:', '67f7454e9f6072baae1702c1');
      console.log('Current folder:', currentFolder?._id || 'root');
      
      const items = await api.getFileSystemItems(
        '67f7454e9f6072baae1702c1',
        currentFolder?._id || null
      );
      
      console.log('Fetched items:', items);
      
      // Filter items based on current folder
      const filteredItems = items.filter(item => 
        currentFolder ? item.parent_id === currentFolder._id : item.parent_id === null
      );
      
      setItems(filteredItems);
    } catch (error) {
      console.error('Error fetching items:', error);
      Alert.alert('Error', 'Failed to fetch items');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch and reset handling
  useEffect(() => {
    console.log('Initial fetch or reset triggered');
    if (route.params?.resetToRoot) {
      setCurrentFolder(null);
      setFolderStack([]);
      setSearchQuery('');
    }
    fetchItems();
  }, [route.params?.resetToRoot]);

  // Handle folder navigation and updates
  useEffect(() => {
    console.log('Folder navigation triggered - currentFolder:', currentFolder);
    let isMounted = true;

    const fetchItemsWithCleanup = async () => {
      try {
        setLoading(true);
        console.log('Current folder ID:', currentFolder);
        const items = await api.getFileSystemItems(
          '67f7454e9f6072baae1702c1',
          currentFolder ? currentFolder._id : null
        );
        if (isMounted) {
          console.log('Fetched items:', items);
          setItems(items);
        }
      } catch (error) {
        console.error('Error loading items:', error);
        console.error('Error details:', {
          currentFolder,
          errorCode: error.code,
          errorType: error.name,
          message: error.message,
          stack: error.stack,
          url: error.config?.url
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchItemsWithCleanup();

    return () => {
      isMounted = false;
    };
  }, [currentFolder]);

  /**
   * Handles camera button press
   * Navigates to CameraScreen
   */
  const handleCameraPress = () => {
    setIsMenuOpen(false);
    navigation.navigate('CameraScreen');
  };

  /**
   * Handles file upload process
   * Opens document picker and uploads selected file
   */
  const handleUploadPress = async () => {
    console.log('Starting file upload process...');
    toggleMenu();
    try {
      console.log('Opening document picker...');
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });

      console.log('Document picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        console.log('Document selected successfully:', selectedFile);
        
        // Show loading indicator
        setLoading(true);
        
        // Create a file object with the correct format
        const file = {
          uri: selectedFile.uri,
          type: selectedFile.mimeType || 'application/octet-stream',
          name: selectedFile.name
        };

        console.log('Prepared file object for upload:', file);
        
        console.log('Starting file upload to API...');
        // Upload the file
        const uploadedItem = await api.uploadFile(
          file,
          TEMP_USER_ID,
          currentFolder,
          []
        );

        console.log('Upload response:', uploadedItem);

        if (uploadedItem) {
          console.log('File uploaded successfully, refreshing items list...');
          // Refresh the items list
          await fetchItems();
          
          // Show success message
          Alert.alert('Success', 'File uploaded successfully');
        } else {
          console.error('No response received from API');
          Alert.alert('Error', 'No response received from server');
        }
      } else {
        console.log('Document picker was cancelled or no file selected');
      }
    } catch (error) {
      console.error('Error in file upload process:', error);
      Alert.alert('Error', 'Failed to upload file. Please try again.');
    } finally {
      console.log('Cleaning up upload process...');
      setLoading(false);
    }
  };

  /**
   * Handles multiple image upload process
   * Opens image picker and uploads selected images
   */
  const handleImageUploadPress = async () => {
    console.log('Starting multiple image upload process...');
    toggleMenu();
    try {
      console.log('Requesting media library permissions...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Permission not granted for media library');
        Alert.alert('Permission Required', 'Please grant photo library access to upload images.');
        return;
      }

      console.log('Opening image picker for multiple selection...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 0.7, // Compress images to 70% quality
        allowsEditing: false, // Disable editing for multiple selection
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log(`Selected ${result.assets.length} images`);
        
        // Show loading indicator
        setLoading(true);
        
        let successCount = 0;
        let errorCount = 0;

        // Upload each image sequentially
        for (const selectedImage of result.assets) {
          try {
            console.log('Processing image:', selectedImage.fileName);
            
            // Create a file object with the correct format
            const file = {
              uri: selectedImage.uri,
              type: selectedImage.mimeType || 'image/jpeg',
              name: selectedImage.fileName || `image_${Date.now()}.jpg`
            };

            console.log('Uploading image:', {
              name: file.name,
              type: file.type,
              size: selectedImage.fileSize
            });
            
            // Upload the image with increased timeout
            const response = await api.uploadFile(
              file,
              TEMP_USER_ID,
              currentFolder,
              [],
              { timeout: 30000 } // Increase timeout to 30 seconds
            );

            if (response) {
              console.log('Successfully uploaded:', file.name);
              successCount++;
            } else {
              console.error('Failed to upload:', file.name);
              errorCount++;
            }
          } catch (error) {
            console.error('Error uploading image:', {
              name: selectedImage.fileName,
              error: error.message
            });
            errorCount++;
          }
        }

        // Refresh the items list after all uploads
        await fetchItems();
        
        // Show summary alert
        if (errorCount === 0) {
          Alert.alert('Success', `Successfully uploaded ${successCount} image(s)`);
        } else {
          Alert.alert(
            'Upload Complete',
            `Uploaded ${successCount} image(s) successfully.\nFailed to upload ${errorCount} image(s).`
          );
        }
      } else {
        console.log('Image picker was cancelled or no images selected');
      }
    } catch (error) {
      console.error('Error in image upload process:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      Alert.alert('Error', 'Failed to upload images. Please try again.');
    } finally {
      console.log('Cleaning up image upload process...');
      setLoading(false);
    }
  };

  /**
   * Handles new PDF creation
   * Navigates to ScanScreen
   */
  const handleNewPDFPress = () => {
    toggleMenu();
    navigation.navigate('ScanScreen');
  };

  /**
   * Handles folder creation
   * Shows folder creation modal
   */
  const handleAddFolder = () => {
    setIsMenuOpen(false);
    setIsFolderModalVisible(true);
  };

  /**
   * Creates a new folder
   * Validates input and calls API to create folder
   */
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    try {
      setLoading(true);
      await api.createFolder(
        newFolderName.trim(),
        TEMP_USER_ID,
        currentFolder?._id || null,
        []
      );
      await fetchItems();
      Alert.alert('Success', 'Folder created successfully');
      setIsFolderModalVisible(false);
      setNewFolderName('');
    } catch (error) {
      console.error('Error creating folder:', error);
      Alert.alert('Error', 'Failed to create folder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggles the menu state
   */
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  /**
   * Clears the search input and removes focus
   */
  const clearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.blur();
  };

  /**
   * Handles folder click event
   * Updates folder navigation state
   * @param {Object} folder - The folder that was clicked
   */
  const handleFolderClick = (folder) => {
    console.log('Folder clicked:', folder);
    console.log('Current folder stack before update:', folderStack);
    
    // If we're at root, just set the current folder
    if (currentFolder === null) {
      setCurrentFolder(folder);
      setFolderStack([folder]);
    } else {
      // Otherwise, add the current folder to the stack
      setFolderStack([...folderStack, currentFolder]);
      setCurrentFolder(folder);
    }
    
    console.log('Updated folder stack:', [...folderStack, currentFolder]);
    setSearchQuery('');
  };

  /**
   * Handles back button click
   * Navigates to parent folder
   */
  const handleBackClick = () => {
    console.log('Back clicked - current folder:', currentFolder);
    if (currentFolder && currentFolder.parent_id === null) {
      // If we're in a root folder, go back to library home
      setCurrentFolder(null);
      setFolderStack([]);
      navigation.setParams({ resetToRoot: true });
    } else if (folderStack.length > 0) {
      // Otherwise, go back to previous folder
      const previousFolder = folderStack[folderStack.length - 1];
      setCurrentFolder(previousFolder);
      setFolderStack(folderStack.slice(0, -1));
    }
  };

  /**
   * Handles file click event
   * Opens file or navigates to folder
   * @param {Object} file - The file or folder that was clicked
   */
  const handleFileClick = async (file) => {
    console.log('File clicked:', file);
    if (file.is_folder) {
      handleFolderClick(file);
    } else {
      try {
        setIsDownloading(true);
        setDownloadProgress(0);

        // If it's a PDF, handle it directly
        if (file.content_type === 'application/pdf') {
          console.log('Opening PDF:', file.name, 'with ID:', file.gridfs_id);
          
          // Download the file using the correct endpoint
          setDownloadProgress(0.3);
          const response = await api.downloadFile(file.gridfs_id);
          if (!response) {
            throw new Error('No PDF data received');
          }

          setDownloadProgress(0.6);
          // Create a temporary file path
          const tempDir = FileSystem.cacheDirectory;
          const tempFilePath = `${tempDir}${file.name}`;
          
          // Save the PDF to a temporary file
          console.log('Saving PDF to temporary file:', tempFilePath);
          await FileSystem.writeAsStringAsync(tempFilePath, response, {
            encoding: FileSystem.EncodingType.Base64,
          });

          setDownloadProgress(0.9);
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
          setDownloadProgress(0.3);
          const response = await api.downloadFile(file.gridfs_id);
          
          setDownloadProgress(0.6);
          // Create a temporary file with a unique name
          const tempDir = FileSystem.cacheDirectory;
          const uniqueFileName = `${Date.now()}-${file.name}`;
          const tempFilePath = `${tempDir}${uniqueFileName}`;
          
          // Save the file temporarily
          await FileSystem.writeAsStringAsync(tempFilePath, response, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          setDownloadProgress(0.9);
          // Share the file (this will open the system's share sheet)
          await Sharing.shareAsync(tempFilePath, {
            mimeType: file.content_type || 'application/octet-stream',
            dialogTitle: `Save ${file.name}`,
            UTI: file.content_type || 'public.data'
          });
          
          // Clean up the temporary file after sharing
          try {
            const fileInfo = await FileSystem.getInfoAsync(tempFilePath);
            if (fileInfo.exists) {
              await FileSystem.deleteAsync(tempFilePath);
            }
          } catch (cleanupError) {
            console.warn('Error cleaning up temporary file:', cleanupError);
          }
        }
      } catch (error) {
        console.error('Error handling file:', error);
        Alert.alert(
          'Error',
          `Failed to handle file: ${error.message}\n\nPlease try again later.`
        );
      } finally {
        // Ensure we reset all states
        setIsDownloading(false);
        setDownloadProgress(0);
        setLoading(false);
        setIsMenuOpen(false);
      }
    }
  };

  /**
   * Handles item deletion
   * Shows confirmation dialog and deletes item
   * @param {Object} item - The item to delete
   */
  const handleDelete = async (item) => {
    try {
      // Show confirmation dialog
      Alert.alert(
        'Delete Item',
        `Are you sure you want to delete ${item.is_folder ? 'folder' : 'file'} "${item.name}"?${item.is_folder ? '\n\nNote: This will also delete all contents inside the folder.' : ''}`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                setLoading(true);
                console.log(`Deleting ${item.is_folder ? 'folder' : 'file'}:`, item.name);
                
                await api.deleteFileSystemItem(item._id, item.is_folder);
                
                console.log('Item deleted successfully');
                await fetchItems(); // Refresh the list
                
                Alert.alert('Success', `${item.is_folder ? 'Folder' : 'File'} deleted successfully`);
              } catch (error) {
                console.error('Error deleting item:', error);
                Alert.alert(
                  'Error',
                  `Failed to delete ${item.is_folder ? 'folder' : 'file'}. Please try again.`
                );
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error in delete confirmation:', error);
    }
  };

  /**
   * Handles pull-to-refresh functionality
   * Refreshes the items list
   */
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchItems();
  }, []);

  // Filter items based on search query
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = item.tags?.some(tag => 
      tag.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesSearch || matchesTags;
  });

  // Separate folders and files
  const folders = filteredItems.filter(item => item.is_folder);
  const files = filteredItems.filter(item => !item.is_folder);

  /**
   * Formats a file size in bytes to a human-readable string
   * @param {number} bytes - The file size in bytes
   * @returns {string} Formatted file size string
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
   * Gets the current folder path for display
   * @returns {string} Current folder path
   */
  const getCurrentFolderPath = () => {
    if (!currentFolder) return 'Library';
    return currentFolder.name;
  };

  /**
   * Gets the appropriate icon for a file type
   * @param {string} contentType - The MIME type of the file
   * @returns {string} MaterialIcons name for the file type
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
   * Handles adding a tag to an item
   * @param {Object} item - The item to add the tag to
   */
  const handleAddTag = async (item) => {
    if (!newTag.trim()) {
      Alert.alert('Error', 'Please enter a tag');
      return;
    }

    try {
      setLoading(true);
      const updatedTags = [...(item.tags || []), newTag.trim()];
      await api.updateFileSystemItem(item._id, { tags: updatedTags });
      await fetchItems();
      Alert.alert('Success', 'Tag added successfully');
      setIsTagModalVisible(false);
      setNewTag('');
    } catch (error) {
      console.error('Error adding tag:', error);
      Alert.alert('Error', 'Failed to add tag');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles showing item details
   * @param {Object} item - The item to show details for
   * @param {Function} [setShowMenu] - Optional function to close menu
   */
  const handleShowDetail = (item, setShowMenu) => {
    if (setShowMenu) {
      setShowMenu(false);
    }
    console.log('Selected item for detail:', item);
    setSelectedItemForDetail(item);
    setIsDetailModalVisible(true);
  };

  /**
   * Handles closing the detail modal
   */
  const handleDetailModalClose = () => {
    setIsDetailModalVisible(false);
    setSelectedItemForDetail(null);
  };

  const handleMenuOpen = (item, position = null) => {
    setMenuItem(item);
    if (position) {
      setMenuPosition(position);
    }
  };

  const handleMenuClose = () => {
    setMenuItem(null);
  };

  const handleMenuAction = (action) => {
    if (!menuItem) {
      console.error('No menu item selected');
      return;
    }

    setSelectedItem(menuItem);
    
    switch (action) {
      case 'move':
        // Filter folders that have the same parent_id as the current item
        const siblingFolders = items.filter(item => 
          item.is_folder && 
          item._id !== menuItem._id && 
          item.parent_id === menuItem.parent_id
        );
        setAvailableFolders(siblingFolders);
        setIsMoveModalVisible(true);
        handleMenuClose(); // Close the menu
        break;
      case 'favorite':
        handleFavorite(menuItem);
        handleMenuClose(); // Close the menu
        break;
      case 'tag':
        setIsTagModalVisible(true);
        handleMenuClose(); // Close the menu
        break;
      case 'detail':
        handleShowDetail(menuItem);
        handleMenuClose(); // Close the menu
        break;
      case 'delete':
        handleDelete(menuItem);
        handleMenuClose(); // Close the menu
        break;
      default:
        console.error('Unknown menu action:', action);
        handleMenuClose(); // Close the menu
    }
  };

  const handleRename = async () => {
    try {
      console.log('Attempting to rename item:', {
        selectedItem,
        newName,
        isRenameModalVisible
      });

      if (!selectedItem) {
        console.error('No item selected for renaming');
        Alert.alert('Error', 'No item selected for renaming');
        return;
      }

      if (!newName || newName.trim() === '') {
        console.error('Invalid name provided');
        Alert.alert('Error', 'Please enter a valid name');
        return;
      }

      setLoading(true);
      
      try {
        // Use the API service to rename the item
        const updatedItem = await api.updateFileSystemItem(selectedItem._id, {
          name: newName.trim()
        });

        console.log('Item renamed successfully:', updatedItem);

        // Refresh the items list
        await fetchItems();

        // Show success message
        Alert.alert('Success', `${selectedItem.is_folder ? 'Folder' : 'File'} renamed successfully`);

        // Reset state
        setNewName('');
        setIsRenameModalVisible(false);
        setSelectedItem(null);
      } catch (error) {
        console.error('Error in handleRename:', error);
        // Check if the error is a 500 but the rename actually succeeded
        if (error.response?.status === 500) {
          // Try to refresh the items list to confirm
          await fetchItems();
          const items = await api.getFileSystemItems('67f7454e9f6072baae1702c1', currentFolder?._id || null);
          const renamedItem = items.find(item => item._id === selectedItem._id);
          if (renamedItem && renamedItem.name === newName.trim()) {
            // The rename actually succeeded despite the 500 error
            Alert.alert('Success', `${selectedItem.is_folder ? 'Folder' : 'File'} renamed successfully`);
            setNewName('');
            setIsRenameModalVisible(false);
            setSelectedItem(null);
            return;
          }
        }
        // If we get here, the rename actually failed
        Alert.alert('Error', `Failed to rename ${selectedItem.is_folder ? 'folder' : 'file'}: ${error.message}`);
      }
    } catch (error) {
      console.error('Unexpected error in handleRename:', error);
      Alert.alert('Error', 'An unexpected error occurred while renaming the item');
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async (targetFolderId) => {
    try {
      console.log('Moving item to:', {
        currentFolder,
        targetFolderId,
        selectedItem
      });

      // First remove the parent_id field
      await api.updateFileSystemItem(selectedItem._id, {
        parent_id: undefined
      });

      // Then add the new parent_id
      if (targetFolderId === null) {
        // Moving to parent folder
        if (currentFolder && currentFolder.parent_id) {
          // If current folder has a parent, move to that parent
          await api.updateFileSystemItem(selectedItem._id, {
            parent_id: currentFolder.parent_id
          });
        }
        // If current folder has no parent (is root), we don't need to set parent_id
        // as it's already removed in the first step
      } else {
        // Moving to a specific folder
        await api.updateFileSystemItem(selectedItem._id, {
          parent_id: targetFolderId
        });
      }

      // Refresh the items list
      await fetchItems();
      
      // Close the move modal
      setIsMoveModalVisible(false);
      
      Alert.alert('Success', 'Item moved successfully');
    } catch (error) {
      console.error('Error moving item:', error);
      Alert.alert('Error', 'Failed to move item');
    }
  };

  const handleFavorite = async (item) => {
    try {
      console.log('Toggling favorite status for item:', item);
      
      // Toggle the is_starred status
      const newStarredStatus = !item.is_starred;
      
      // Update the item
      await api.updateFileSystemItem(item._id, {
        is_starred: newStarredStatus
      });
      
      // Refresh the items list
      await fetchItems();
      
      Alert.alert('Success', newStarredStatus ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      console.error('Error toggling favorite status:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.overlay}>
          <View style={styles.loadingSquare}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Download Overlay */}
      {isDownloading && (
        <View style={styles.overlay}>
          <View style={styles.downloadContainer}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.downloadText}>Downloading file...</Text>
            <Text style={styles.downloadProgress}>
              {Math.round(downloadProgress * 100)}%
            </Text>
          </View>
        </View>
      )}

      {/* Navigation Bar */}
      <LibraryNavBar
        currentFolder={currentFolder}
        handleBackClick={handleBackClick}
        viewMode={viewMode}
        setViewMode={setViewMode}
        getCurrentFolderPath={getCurrentFolderPath}
      />

      {/* Search Bar */}
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchInputRef={searchInputRef}
        clearSearch={clearSearch}
      />

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.contentScroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary.main}
            title="Pull to refresh"
            titleColor={colors.text.secondary}
          />
        }
      >
        <View style={styles.content}>
          {viewMode === 'grid' ? (
            <>
              {folders.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Folders</Text>
                  <View style={styles.grid}>
                    {folders.map(folder => (
                      <GridItem 
                        key={folder._id} 
                        item={folder} 
                        onPress={handleFileClick}
                        onLongPress={() => {}}
                        onMenuPress={() => {}}
                        onMenuOpen={handleMenuOpen}
                        onMenuClose={handleMenuClose}
                        handleDelete={handleDelete}
                        handleShowDetail={handleShowDetail}
                        setSelectedItem={setSelectedItem}
                        setIsTagModalVisible={setIsTagModalVisible}
                        formatDate={formatDate}
                        formatFileSize={formatFileSize}
                      />
                    ))}
                  </View>
                </View>
              )}
              {files.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Files</Text>
                  <View style={styles.grid}>
                    {files.map(file => (
                      <GridItem 
                        key={file._id} 
                        item={file} 
                        onPress={handleFileClick}
                        onLongPress={() => {}}
                        onMenuPress={() => {}}
                        onMenuOpen={handleMenuOpen}
                        onMenuClose={handleMenuClose}
                        handleDelete={handleDelete}
                        handleShowDetail={handleShowDetail}
                        setSelectedItem={setSelectedItem}
                        setIsTagModalVisible={setIsTagModalVisible}
                        formatDate={formatDate}
                        formatFileSize={formatFileSize}
                      />
                    ))}
                  </View>
                </View>
              )}
            </>
          ) : (
            <>
              {folders.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Folders</Text>
                  {folders.map(folder => (
                    <ListItem 
                      key={folder._id} 
                      item={folder} 
                      onPress={handleFileClick}
                      onLongPress={() => {}}
                      onMenuPress={() => {}}
                      onMenuOpen={handleMenuOpen}
                      onMenuClose={handleMenuClose}
                      handleDelete={handleDelete}
                      handleShowDetail={handleShowDetail}
                      setSelectedItem={setSelectedItem}
                      setIsTagModalVisible={setIsTagModalVisible}
                      formatDate={formatDate}
                      formatFileSize={formatFileSize}
                    />
                  ))}
                </View>
              )}
              {files.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Files</Text>
                  {files.map(file => (
                    <ListItem 
                      key={file._id} 
                      item={file} 
                      onPress={handleFileClick}
                      onLongPress={() => {}}
                      onMenuPress={() => {}}
                      onMenuOpen={handleMenuOpen}
                      onMenuClose={handleMenuClose}
                      handleDelete={handleDelete}
                      handleShowDetail={handleShowDetail}
                      setSelectedItem={setSelectedItem}
                      setIsTagModalVisible={setIsTagModalVisible}
                      formatDate={formatDate}
                      formatFileSize={formatFileSize}
                    />
                  ))}
                </View>
              )}
            </>
          )}

          {folders.length === 0 && files.length === 0 && (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No items found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <BottomNavBar activeScreen="Library" />

      {/* Modals/Dialogs for Library Screen (Inputs, etc.) */}
      <LibraryModals
        isFolderModalVisible={isFolderModalVisible}
        setIsFolderModalVisible={setIsFolderModalVisible}
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        handleCreateFolder={handleCreateFolder}
        isTagModalVisible={isTagModalVisible}
        setIsTagModalVisible={setIsTagModalVisible}
        newTag={newTag}
        setNewTag={setNewTag}
        selectedItem={selectedItem}
        handleAddTag={handleAddTag}
        isDetailModalVisible={isDetailModalVisible}
        setIsDetailModalVisible={setIsDetailModalVisible}
        selectedItemForDetail={selectedItemForDetail}
        formatFileSize={formatFileSize}
        formatDate={formatDate}
        isRenameModalVisible={isRenameModalVisible}
        setIsRenameModalVisible={setIsRenameModalVisible}
        newName={newName}
        setNewName={setNewName}
        handleRename={handleRename}
        isMoveModalVisible={isMoveModalVisible}
        setIsMoveModalVisible={setIsMoveModalVisible}
        availableFolders={availableFolders}
        handleMove={handleMove}
        currentFolder={currentFolder}
        handleFavorite={handleFavorite}
      />

      {/* Floating Action Button */}
      <LibraryFAB
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        setIsFolderModalVisible={setIsFolderModalVisible}
        handleUploadPress={handleUploadPress}
        handleImageUploadPress={handleImageUploadPress}
        navigation={navigation}
      />

      {/* Menu Overlay */}
      {menuItem && (
        <View style={styles.menuOverlay}>
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={handleMenuClose}
          >
            <View style={[
              styles.menuContainer,
              menuPosition && {
                position: 'absolute',
                top: menuPosition.y + 30,
                left: menuPosition.x - 100,
              }
            ]}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleMenuAction('move')}
              >
                <MaterialIcons name="drive-file-move" size={20} color={colors.text.primary} />
                <Text style={styles.menuItemText}>Move</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleMenuAction('favorite')}
              >
                <MaterialIcons 
                  name={menuItem.is_starred ? "star" : "star-border"} 
                  size={20} 
                  color="white" 
                />
                <Text style={styles.menuItemText}>
                  {menuItem.is_starred ? "Remove from Favorites" : "Add to Favorites"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleMenuAction('addTag')}
              >
                <MaterialIcons name="local-offer" size={20} color={colors.text.primary} />
                <Text style={styles.menuItemText}>Add Tag</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleMenuAction('rename')}
              >
                <MaterialIcons name="edit" size={20} color={colors.text.primary} />
                <Text style={styles.menuItemText}>Rename</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleMenuAction('showDetail')}
              >
                <MaterialIcons name="info" size={20} color={colors.text.primary} />
                <Text style={styles.menuItemText}>Show Detail</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleMenuAction('delete')}
              >
                <MaterialIcons name="delete" size={20} color={colors.error} />
                <Text style={[styles.menuItemText, { color: colors.error }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/**
 * Styles for the LibraryScreen component
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
   * Overlay style for loading and download states
   */
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  /**
   * Loading square style
   */
  loadingSquare: {
    backgroundColor: colors.primary.main,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
    minHeight: 150,
  },

  /**
   * Loading text style
   */
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
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
    backgroundColor: '#FFFFFF',
  },

  /**
   * Section container style
   */
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },

  /**
   * Section title style
   */
  sectionTitle: {
    fontSize: typography.fontSize.large,
    color: colors.accent,
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.lg,
  },

  /**
   * No results container style
   */
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },

  /**
   * No results text style
   */
  noResultsText: {
    fontSize: typography.fontSize.large,
    color: '#666666',
    fontFamily: typography.fontFamily.primary,
  },

  /**
   * Grid container style
   */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: spacing.sm,
  },

  /**
   * Download container style
   */
  downloadContainer: {
    backgroundColor: colors.primary.main,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
  },

  /**
   * Download text style
   */
  downloadText: {
    color: 'white',
    fontSize: typography.fontSize.medium,
    marginTop: 16,
    marginBottom: 8,
  },

  /**
   * Download progress text style
   */
  downloadProgress: {
    color: 'white',
    fontSize: typography.fontSize.small,
  },

  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },

  overlayTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

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

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    minWidth: 120,
  },

  menuItemText: {
    marginLeft: 8,
    fontSize: typography.fontSize.medium,
    color: colors.text.primary,
  },
});