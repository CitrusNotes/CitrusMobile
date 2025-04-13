import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';

/**
 * LibraryModals component that handles all modal dialogs (inputs, tags, etc.) in the Library screen
 * including folder creation, tag addition, and item detail views.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.isFolderModalVisible - Controls visibility of folder creation modal
 * @param {Function} props.setIsFolderModalVisible - Function to toggle folder modal visibility
 * @param {string} props.newFolderName - Current value of new folder name input
 * @param {Function} props.setNewFolderName - Function to update new folder name
 * @param {Function} props.handleCreateFolder - Function to handle folder creation
 * @param {boolean} props.isTagModalVisible - Controls visibility of tag addition modal
 * @param {Function} props.setIsTagModalVisible - Function to toggle tag modal visibility
 * @param {string} props.newTag - Current value of new tag input
 * @param {Function} props.setNewTag - Function to update new tag value
 * @param {Object} props.selectedItem - Currently selected item for tag addition
 * @param {Function} props.handleAddTag - Function to handle tag addition
 * @param {boolean} props.isDetailModalVisible - Controls visibility of detail modal
 * @param {Function} props.setIsDetailModalVisible - Function to toggle detail modal visibility
 * @param {Object} props.selectedItemForDetail - Item to display in detail view
 * @param {Function} props.formatFileSize - Function to format file sizes
 * @param {Function} props.formatDate - Function to format dates
 * @returns {JSX.Element} Rendered modals
 */
const LibraryModals = ({
  isFolderModalVisible,
  setIsFolderModalVisible,
  newFolderName,
  setNewFolderName,
  handleCreateFolder,
  isTagModalVisible,
  setIsTagModalVisible,
  newTag,
  setNewTag,
  selectedItem,
  handleAddTag,
  isDetailModalVisible,
  setIsDetailModalVisible,
  selectedItemForDetail,
  formatFileSize,
  formatDate,
}) => {
  return (
    <>
      {/* Add Folder Modal */}
      <Modal
        visible={isFolderModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsFolderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Folder</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter folder name"
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setNewFolderName('');
                  setIsFolderModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateFolder}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Tag Modal */}
      <Modal
        visible={isTagModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsTagModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Tag</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter tag name"
              value={newTag}
              onChangeText={setNewTag}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setNewTag('');
                  setIsTagModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={() => handleAddTag(selectedItem)}
              >
                <Text style={styles.createButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal
        visible={isDetailModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDetailModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.detailModalOverlay}
          activeOpacity={1}
          onPress={() => setIsDetailModalVisible(false)}
        >
          <View style={styles.detailModalContent}>
            <View style={styles.detailModalHeader}>
              <Text style={styles.detailModalTitle}>Item Details</Text>
              <TouchableOpacity 
                style={styles.detailModalCloseButton}
                onPress={() => setIsDetailModalVisible(false)}
              >
                <MaterialIcons name="close" size={24} color={colors.primary.main} />
              </TouchableOpacity>
            </View>
            
            {selectedItemForDetail && (
              <View style={styles.detailContent}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{selectedItemForDetail.name || 'Unknown'}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>
                    {selectedItemForDetail.is_folder ? 'Folder' : (selectedItemForDetail.content_type || 'File')}
                  </Text>
                </View>
                
                {!selectedItemForDetail.is_folder && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Size:</Text>
                    <Text style={styles.detailValue}>
                      {selectedItemForDetail.fileMetadata?.length ? 
                        formatFileSize(selectedItemForDetail.fileMetadata.length) : 
                        'Unknown'}
                    </Text>
                  </View>
                )}
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Created:</Text>
                  <Text style={styles.detailValue}>
                    {selectedItemForDetail.created_at ? 
                      formatDate(selectedItemForDetail.created_at) : 
                      'Unknown'}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tags:</Text>
                  <View style={styles.tagsContainer}>
                    {selectedItemForDetail.tags && selectedItemForDetail.tags.length > 0 ? (
                      selectedItemForDetail.tags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.detailValue}>No tags</Text>
                    )}
                  </View>
                </View>

                {!selectedItemForDetail.is_folder && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Content Type:</Text>
                    <Text style={styles.detailValue}>
                      {selectedItemForDetail.content_type || 'Unknown'}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

/**
 * Styles for the LibraryModals component
 * @type {Object}
 */
const styles = StyleSheet.create({
  /**
   * Style for modal overlay background
   */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /**
   * Style for modal content container
   */
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },

  /**
   * Style for modal title
   */
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },

  /**
   * Style for modal input fields
   */
  modalInput: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },

  /**
   * Style for modal buttons container
   */
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  /**
   * Base style for modal buttons
   */
  modalButton: {
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },

  /**
   * Style for cancel button
   */
  cancelButton: {
    backgroundColor: '#CCCCCC',
  },

  /**
   * Style for create/add button
   */
  createButton: {
    backgroundColor: colors.primary.main,
  },

  /**
   * Style for cancel button text
   */
  cancelButtonText: {
    color: '#000000',
  },

  /**
   * Style for create/add button text
   */
  createButtonText: {
    color: '#FFFFFF',
  },

  /**
   * Style for detail modal overlay
   */
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /**
   * Style for detail modal content
   */
  detailModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: 20,
  },

  /**
   * Style for detail modal header
   */
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingBottom: 10,
  },

  /**
   * Style for detail modal title
   */
  detailModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.accent,
  },

  /**
   * Style for detail modal close button
   */
  detailModalCloseButton: {
    padding: 5,
  },

  /**
   * Style for detail content container
   */
  detailContent: {
    gap: 15,
  },

  /**
   * Style for detail row
   */
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },

  /**
   * Style for detail label
   */
  detailLabel: {
    width: 120,
    fontSize: 16,
    color: colors.accent,
    fontWeight: 'bold',
  },

  /**
   * Style for detail value
   */
  detailValue: {
    flex: 1,
    fontSize: 16,
    color: colors.accent,
    marginLeft: 8,
  },

  /**
   * Style for tags container
   */
  tagsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginLeft: 8,
  },

  /**
   * Style for individual tag
   */
  tag: {
    backgroundColor: colors.primary.light,
    borderRadius: 12,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    marginHorizontal: 2,
    marginVertical: 2,
  },
  
  /**
   * Style for tag text
   */
  tagText: {
    color: colors.accent,
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.small,
  },
});

export default LibraryModals; 