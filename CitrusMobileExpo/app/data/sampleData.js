/**
 * Sample data for the Library screen in js format (Old format)
 * Provides example items and folders for demonstration purposes
 * 
 * @module sampleData
 */

export const sampleItems = [
  {
    _id: '1',
    name: 'Documents',
    path: '/Documents',
    is_folder: true,
    created_at: '2024-03-15T10:00:00Z',
    modified_at: '2024-03-15T10:00:00Z',
    size: 0,
    parent_id: null
  },
  {
    _id: '2',
    name: 'Images',
    path: '/Images',
    is_folder: true,
    created_at: '2024-03-15T10:00:00Z',
    modified_at: '2024-03-15T10:00:00Z',
    size: 0,
    parent_id: null
  },
  {
    _id: '3',
    name: 'Project Proposal.pdf',
    path: '/Project Proposal.pdf',
    is_folder: false,
    created_at: '2024-03-15T10:00:00Z',
    modified_at: '2024-03-15T10:00:00Z',
    size: 1024 * 1024, // 1MB
    parent_id: null,
    content_type: 'application/pdf'
  },
  {
    _id: '4',
    name: 'Meeting Notes.pdf',
    path: '/Meeting Notes.pdf',
    is_folder: false,
    created_at: '2024-03-15T10:00:00Z',
    modified_at: '2024-03-15T10:00:00Z',
    size: 512 * 1024, // 512KB
    parent_id: null,
    content_type: 'application/pdf'
  },
  {
    _id: '5',
    name: 'Document 1.pdf',
    path: '/Documents/Document 1.pdf',
    is_folder: false,
    created_at: '2024-03-15T10:00:00Z',
    modified_at: '2024-03-15T10:00:00Z',
    size: 768 * 1024, // 768KB
    parent_id: '1',
    content_type: 'application/pdf'
  },
  {
    _id: '6',
    name: 'Image 1.jpg',
    path: '/Images/Image 1.jpg',
    is_folder: false,
    created_at: '2024-03-15T10:00:00Z',
    modified_at: '2024-03-15T10:00:00Z',
    size: 2 * 1024 * 1024, // 2MB
    parent_id: '2',
    content_type: 'image/jpeg'
  }
]; 