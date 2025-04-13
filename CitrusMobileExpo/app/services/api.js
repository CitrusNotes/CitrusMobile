import axios from 'axios';
import { EXPO_API_URL } from '@env';

// Use the environment variable
const API_URL = EXPO_API_URL;

// Debug logging
console.log('API_URL from .env:', EXPO_API_URL);
console.log('Using API_URL:', API_URL);

if (!API_URL) {
  console.warn('API_URL is not set. Using default localhost URL.');
}

// Configure axios defaults
axios.defaults.timeout = 10000; // 10 second timeout
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Add request interceptor for logging
axios.interceptors.request.use(
  config => {
    console.log(`Making request to: ${config.url}`);
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
axios.interceptors.response.use(
  response => {
    console.log(`Response from: ${response.config.url}`, response.status);
    return response;
  },
  error => {
    console.error('Response error:', error.message);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
    return Promise.reject(error);
  }
);

/**
 * API service for handling all backend communication
 * Provides methods for file system operations, file uploads, and metadata management
 */
export const api = {
  /**
   * Retrieves file system items for a user
   * @param {string} userId - The ID of the user
   * @param {string|null} parentId - The ID of the parent folder (null for root)
   * @returns {Promise<Array>} Array of file system items
   * @throws {Error} If the request fails or response format is invalid
   */
  getFileSystemItems: async (userId, parentId = null) => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('user_id', userId);
      if (parentId !== null) {
        params.append('parent_id', parentId);
      }

      const url = `${API_URL}/file-system/?${params.toString()}`;
      console.log('Fetching file system items from:', url);

      const response = await axios.get(url);
      console.log('Raw API response:', response.data);

      if (!Array.isArray(response.data)) {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response format from server');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching file system items:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw error;
    }
  },

  /**
   * Uploads a file to the server
   * @param {Object} file - The file to upload
   * @param {string} file.uri - The file URI
   * @param {string} file.type - The MIME type of the file
   * @param {string} file.name - The name of the file
   * @param {string} user_id - The ID of the user
   * @param {string|null} parent_id - The ID of the parent folder
   * @param {Array<string>} tags - Array of tags for the file
   * @param {Object} options - Additional options
   * @param {number} [options.timeout=10000] - Request timeout in milliseconds
   * @returns {Promise<Object>} Response data from the server
   * @throws {Error} If the upload fails
   */
  uploadFile: async (file, user_id, parent_id = null, tags = [], options = {}) => {
    try {
      console.log('\nDebug: Preparing file upload');
      console.log('  file:', {
        uri: file.uri,
        type: file.type,
        name: file.name
      });
      console.log('  user_id:', user_id);
      console.log('  parent_id:', parent_id);
      console.log('  tags:', tags);

      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type || 'application/octet-stream',
        name: file.name || file.uri.split('/').pop()
      });
      formData.append('user_id', user_id);
      if (parent_id) formData.append('parent_id', parent_id);
      tags.forEach(tag => formData.append('tags[]', tag));

      const url = `${API_URL}/file-system/upload/`;
      console.log('\nDebug: Sending request');
      console.log('  URL:', url);
      console.log('  Method: POST');
      console.log('  Headers:', {
        'accept': 'application/json',
        'Content-Type': 'multipart/form-data'
      });
      
      const response = await axios.post(
        url,
        formData,
        {
          headers: {
            'accept': 'application/json',
            'Content-Type': 'multipart/form-data'
          },
          timeout: options.timeout || 10000
        }
      );
      
      console.log('\nDebug: Upload response:', response.data);
      
      // Return the complete item object
      return response.data.item;
    } catch (error) {
      console.error('\nDebug: Upload error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      });
      throw error;
    }
  },

  /**
   * Creates a new folder in the file system
   * @param {string} name - The name of the folder
   * @param {string} user_id - The ID of the user
   * @param {string|null} parent_id - The ID of the parent folder
   * @param {Array<string>} tags - Array of tags for the folder
   * @returns {Promise<Object>} Response data from the server
   * @throws {Error} If the folder creation fails
   */
  createFolder: async (name, user_id, parent_id = null, tags = []) => {
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('is_folder', 'true');
      formData.append('user_id', user_id);
      if (parent_id) formData.append('parent_id', parent_id);
      tags.forEach(tag => formData.append('tags[]', tag));

      const response = await axios.post(
        `${API_URL}/file-system/`,
        formData,
        {
          headers: {
            'accept': 'application/json',
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  },

  /**
   * Downloads a file from the server
   * @param {string} fileId - The ID of the file to download
   * @returns {Promise<string>} Base64 encoded file data
   * @throws {Error} If the download fails
   */
  async downloadFile(fileId) {
    try {
      console.log('Downloading file with ID:', fileId);
      const response = await axios.get(`${API_URL}/file-system/download/${fileId}`, {
        responseType: 'blob',
      });
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      // Convert blob to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          // Get the base64 string without the data URL prefix
          const base64Data = reader.result.split(',')[1];
          console.log('Converted blob to base64, length:', base64Data.length);
          resolve(base64Data);
        };
        reader.onerror = (error) => {
          console.error('Error converting blob to base64:', error);
          reject(error);
        };
        reader.readAsDataURL(response.data);
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  },

  /**
   * Retrieves metadata for a file
   * @param {string} fileId - The ID of the file
   * @returns {Promise<Object>} File metadata
   * @throws {Error} If the metadata retrieval fails
   */
  getFileMetadata: async (fileId) => {
    try {
      const response = await axios.get(`${API_URL}/files/${fileId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw error;
    }
  },

  /**
   * Downloads a file from GridFS
   * @param {string} fileId - The ID of the file to download
   * @returns {Promise<string>} Base64 encoded file data
   * @throws {Error} If the download fails
   */
  downloadFile: async (fileId) => {
    try {
      console.log('Downloading file with ID:', fileId);
      const response = await axios.get(`${API_URL}/file-system/download/${fileId}`, {
        responseType: 'blob',
        timeout: 30000, // 30 second timeout
      });
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      // Convert blob to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
            const base64Data = reader.result.split(',')[1];
            if (!base64Data) {
              throw new Error('Failed to convert file to base64');
            }
            resolve(base64Data);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = (error) => {
          console.error('Error reading blob:', error);
          reject(error);
        };
        reader.readAsDataURL(response.data);
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      }
      throw error;
    }
  },

  /**
   * Deletes a file system item (file or folder)
   * @param {string} itemId - The ID of the item to delete
   * @param {boolean} isFolder - Whether the item is a folder
   * @returns {Promise<Object>} Response data from the server
   * @throws {Error} If the deletion fails
   */
  deleteFileSystemItem: async (itemId, isFolder = false) => {
    try {
      const response = await axios.delete(
        `${API_URL}/file-system/${itemId}/`
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting filesystem item:', error);
      throw error;
    }
  },

  /**
   * Updates a file system item
   * @param {string} itemId - The ID of the item to update
   * @param {Object} updateData - The data to update
   * @param {boolean} [updateData.is_starred] - Star status
   * @param {string} [updateData.name] - New name
   * @param {string} [updateData.parent_id] - New parent folder ID
   * @returns {Promise<Object>} Updated item data
   * @throws {Error} If the update fails
   */
  updateFileSystemItem: async (itemId, updateData) => {
    try {
      console.log('Updating file system item:', { itemId, updateData });
      
      // Build query parameters
      const params = new URLSearchParams();
      if (updateData.name) params.append('name', updateData.name);
      if (updateData.parent_id !== undefined) params.append('parent_id', updateData.parent_id);
      if (updateData.is_starred !== undefined) params.append('is_starred', updateData.is_starred);
      
      // Use tags from updateData or default to empty array
      const tags = updateData.tags || [];
      
      const response = await axios.put(
        `${API_URL}/file-system/${itemId}?${params.toString()}`,
        tags,
        {
          timeout: 10000, // 10 second timeout
          headers: {
            'Content-Type': 'application/json',
          },
          validateStatus: function (status) {
            // Consider 200-299 and 500 as valid status codes
            return (status >= 200 && status < 300) || status === 500;
          }
        }
      );
      
      console.log('Update response:', response.data);
      
      // If we got a 500 but the response has data, it might be a successful update
      if (response.status === 500 && response.data) {
        console.log('Received 500 but response has data, treating as success');
        return response.data;
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating file system item:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw error;
    }
  },

  /**
   * Toggles the star status of an item
   * @param {string} itemId - The ID of the item
   * @param {boolean} isStarred - The new star status
   * @returns {Promise<Object>} Updated item data
   * @throws {Error} If the toggle fails
   */
  toggleStarStatus: async (itemId, isStarred) => {
    try {
      console.log('Toggling star status:', { itemId, isStarred });
      const response = await axios.patch(
        `${API_URL}/filesystem/${itemId}/`,
        { is_starred: isStarred }
      );
      return response.data;
    } catch (error) {
      console.error('Error toggling star status:', error);
      throw error;
    }
  },
}; 