# CitrusNotes Mobile

A modern Note Taking application built with Expo (React Native) and Python (FastAPI), with MongoDB integration.

## Project Structure

```
CitrusMobileExpo/
├── app/                      # Main application code
│   ├── navigation/           # Navigation configuration
│   ├── screens/              # Screen components
│   │   ├── LibraryScreen.js  # Main library view
│   │   ├── CameraScreen.js   # Camera functionality
│   │   ├── ScanScreen.js     # Document scanning
│   │   └── WelcomeScreen.js  # Welcome/landing screen
│   ├── components/           # Reusable UI components
│   ├── constants/            # App constants and theme
│   ├── services/             # API and service modules
│   │   └── api.js           # API service implementation
│   ├── store/               # Redux store configuration
│   └── utils/               # Utility functions
├── assets/                   # Images, fonts, etc.
├── App.js                    # Root component
├── app.json                  # Expo configuration
└── package.json              # Frontend dependencies

Backend/
├── app/                     # Backend application code (FastAPI)
│   ├── main.py             # Main FastAPI application
│   ├── models.py           # Pydantic models
│   ├── database.py         # MongoDB configuration
│   └── utils/              # Utility modules
├── tests/                   # Test files
└── requirements.txt         # Python dependencies
```

## Features

### File Management
- Browse and navigate through files and directories
- Grid and list view options
- Search functionality
- File and folder organization
- Upload and download files
- File preview support
- File operations (rename, delete, move)

### Media Handling
- Camera integration for capturing photos
- Image upload from device library
- Document scanning with OpenCV
- PDF creation from scanned images
- File upload support
- PDF creation

### User Interface
- Modern, clean design
- Responsive layout
- Dark mode support
- Customizable themes
- Intuitive navigation

### Security
- Secure authentication with JWT
- File encryption
- Permission management
- Secure API endpoints

### Data Management
- MongoDB integration with GridFS for file storage
- Local data caching
- File metadata handling
- Image processing capabilities with OpenCV
- Efficient file system operations

## Setup Instructions

### Prerequisites
- Node.js (v14 or later)
- Python 3.8 or later
- Expo CLI
- iOS Simulator (for Mac) or Android Studio (for Android development)
- MongoDB Atlas account or local MongoDB instance
- MongoDB Compass (optional, for database management)

### Initial Setup
1. Clone the repository
2. Run the setup script:
   ```bash
   ./setup.sh
   ```
   This script will:
   - Check prerequisites
   - Set up Python virtual environment
   - Install frontend dependencies
   - Configure backend settings
   - Update React and Expo packages

### Backend Configuration
1. Navigate to the `backend` directory
2. Update the `.env` file with your MongoDB credentials:
   ```
   MONGODB_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```
   For local MongoDB:
   ```
   MONGODB_URL=mongodb://localhost:27017/citrusnotes
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Running the Application
1. Start the development servers:
   ```bash
   ./run.sh
   ```
   This will start both the frontend and backend servers.

## Development

### Frontend Development
- Built with Expo (React Native)
- Uses React Navigation for routing
- Implements Redux for state management
- Follows modern React patterns
- Uses functional components with hooks

### Backend Development
- FastAPI for RESTful API
- MongoDB with GridFS for file storage
- Pydantic models for data validation
- Async/await for efficient operations
- Comprehensive error handling

## API Documentation

### Authentication
- POST `/users/` - Create new user
- GET `/users/` - List all users
- GET `/users/{user_id}` - Get specific user

### File System
- POST `/file-system/` - Create file system item
- GET `/file-system/` - List file system items
- PUT `/file-system/{item_id}` - Update file system item
- DELETE `/file-system/{item_id}` - Delete file system item

### File Operations
- POST `/files/upload/` - Upload file
- GET `/files/{file_id}` - Download file
- GET `/files/` - List files

### Document Management
- POST `/documents/` - Create document
- GET `/documents/{document_id}` - Get document
- GET `/documents/` - List documents
- GET `/images/{file_id}` - Get image

## Coding Standards

### Frontend (JavaScript/React Native)
- Use functional components with hooks
- Follow React Native best practices
- Implement proper error handling


#### JavaScript General Conventions
- Use ES6+ features and syntax
- Follow Airbnb JavaScript Style Guide
- Use meaningful variable and function names
- Use const/let instead of var
- Use template literals for string interpolation
- Use arrow functions for anonymous functions
- Use destructuring for object/array assignments
- Use async/await for asynchronous operations
- Use proper error handling with try/catch
- Use JSDoc comments for documentation

### Backend (Python)
- Follow PEP 8 style guide: [PEP 8](https://github.com/python/peps/blob/main/pep-0008.txt)
- Implement proper error handling
- Use async/await for asynchronous operations
- Write comprehensive tests
- Use proper docstrings (Google style)
- Use type hints for better code clarity
- Use virtual environments for dependency management
- Use proper import ordering
- Use proper exception handling
- Use context managers for resource management

## License

This project is licensed under the MIT License - see the LICENSE file for details.
