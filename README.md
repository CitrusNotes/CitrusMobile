# CitrusNotes Mobile

A modern Note Taking application built with Expo (React Native), Python (FastAPI), and MongoDB integration. The frontend uses Axios for API communication and includes features for document scanning, file management, and secure authentication.

## Project Structure

```
CitrusMobileExpo/
├── app/                      # Main application code
│   ├── navigation/           # Navigation configuration
│   │   └── AppNavigator.js   # Defines the app's navigation structure and screen flow
│   ├── screens/              # Screen components
│   │   ├── CameraScreen.js   # Camera interface for capturing photos and documents
│   │   ├── FavoriteScreen.js # Interface for viewing and managing favorite items
│   │   ├── LibraryScreen.js  # Main file management interface, displays files and folders
│   │   ├── ScanScreen.js     # Document scanning interface with PDF creation
│   │   ├── SignInScreen.js   # User authentication interface
│   │   ├── SignUpScreen.js   # User registration interface
│   │   └── WelcomeScreen.js  # Initial landing page with app introduction
│   ├── components/           # Reusable UI components
│   │   ├── BottomNavBar.js   # Bottom navigation bar with Library, Favorites, and Scan options
│   │   ├── LibraryFAB.js     # Floating action button for creating folders and uploading files
│   │   ├── LibraryItems.js   # Grid and list view components for displaying files and folders
│   │   ├── LibraryModals.js  # Modal components for file operations (rename, move, delete)
│   │   ├── LibraryNavBar.js  # Top navigation bar with back button and view mode toggle
│   │   └── SearchBar.js      # Search interface for filtering files and folders
│   ├── constants/            # App constants and theme
│   │   └── theme.js          # Color schemes, typography, and spacing constants
│   ├── services/             # API and service modules
│   │   ├── api.js           # Axios-based API service for backend communication
│   │   └── auth.js          # Authentication service for user management
│   ├── store/               # Redux store configuration
│   └── utils/               # Utility functions
├── App.js                    # Root component that initializes the app
├── app.json                  # Expo configuration and app metadata
├── babel.config.js           # Babel configuration; Might be Redundant
├── env.d.ts                  # TypeScript environment declarations; Might be Redundant
└── package.json              # Frontend dependencies and scripts

Backend/
├── app/                     # Backend application code
│   ├── main.py             # Main FastAPI application and route definitions
│   ├── models.py           # Pydantic models for data validation
│   ├── database.py         # MongoDB connection and configuration
│   └── utils/              # Utility modules for file processing and other operations
├── temp/                    # Temporary files for processing
├── requirements.txt         # Python dependencies
└── .flake8                  # Flake8 configuration for code linting

Root/
├── setup.sh                 # Script to set up development environment
├── run.sh                   # Script to start development servers
├── package.json             # Root dependencies
└── .gitignore              # Git ignore rules
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

### Environment Configuration

#### Backend Configuration
1. Navigate to the `backend` directory
2. Update the `.env` file with your MongoDB credentials:

   For MongoDB Atlas:
   ```
   MONGODB_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```
   Replace `<username>`, `<password>`, and `<cluster>` with your MongoDB Atlas credentials.

   For local MongoDB:
   ```
   MONGODB_URL=mongodb://localhost:27017/citrusnotes
   ```

3. Additional backend environment variables:
   ```
   SECRET_KEY=<your-secret-key>  # Used for JWT token generation
   ALGORITHM=HS256              # JWT algorithm
   ACCESS_TOKEN_EXPIRE_MINUTES=30 # Token expiration time
   ```

#### Frontend Configuration
1. Navigate to the `CitrusMobileExpo` directory
2. Update the `.env` file with your backend API URL:
   ```
   EXPO_API_URL=http://localhost:8000  # For local development on a simulator
   # or
   EXPO_API_URL=http://your-ip4:8000 # Also for local development on Expo Go
   # or
   EXPO_API_URL=https://your-production-api.com  # For production
   ```

### Running the Application
1. Start the development servers:
   ```bash
   ./run.sh
   ```
   This will start both the frontend and backend servers.

2. For local development:
   - Backend API will be available at: http://localhost:8000
   - Expo development server will be available at: http://localhost:19000
   - Scan the QR code with Expo Go to run the app on your device

3. For production deployment:
   - Update the `EXPO_API_URL` in the frontend `.env` file to point to your production API
   - Build the Expo app using `expo build` commands
   - Deploy the backend to your production server

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
