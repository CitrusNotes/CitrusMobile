# CitrusNotes Mobile

A modern Note Taking application built with Expo (React Native) and Python (FastAPI), with Azure MariaDB integration.

## setup.sh

This script sets up the environment for running the app
**Please delete 'venv' folder in the Backend folder and .env files in both Backend and CitrusMobileExpo folders if they exist before running this script.

## run.sh

This script runs the app by opening two terminals


## Project Structure

```
CitrusMobileExpo/
├── app/                      # Main application code
│   ├── services/             # Backend services and API calls
│   ├── store/                # Redux state management
│   ├── screens/              # Screen components
│   └── utils/                # Utility functions
├── components/               # Reusable UI components
├── assets/                   # Images, fonts, etc.
├── constants/                # App constants
├── hooks/                    # Custom React hooks
├── App.js                  # Expo configuration
├── app.json                  # Expo configuration
└── package.json              # Frontend dependencies

Backend/
├── app/                     # Backend application code (FastAPI)
├── tests/                   # Test files
└── requirements.txt         # Python dependencies
```

## Features

- Browse and navigate through files and directories
- Upload and download files
- File preview support
- File operations (rename, delete, move)
- Secure authentication
- File metadata handling
- Azure MariaDB integration for data persistence
- Image processing capabilities with OpenCV
- Numerical computing with NumPy

## Prerequisites

- Node.js (v14 or later)
- Python 3.8 or later
- Expo CLI
- iOS Simulator (for Mac) or Android Studio (for Android development)
- Azure account with MariaDB instance
- Azure CLI (optional, for Azure management)


## Coding Standards

###FIXME

## License

This project is licensed under the MIT License - see the LICENSE file for details.
