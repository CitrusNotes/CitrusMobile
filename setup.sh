#!/bin/bash

# Colors for terminal output formatting
GREEN='\033[0;32m'  # Success messages
BLUE='\033[0;34m'   # Section headers
RED='\033[0;31m'    # Error messages
YELLOW='\033[1;33m' # Warning messages
NC='\033[0m'        # No Color (reset)

# Function to print section headers with consistent formatting
print_section() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

# Function to check if all required prerequisites are installed
check_prerequisites() {
    print_section "Checking Prerequisites"
    
    # Check if Node.js is installed
    if ! command -v node >/dev/null 2>&1; then
        echo -e "${RED}Node.js is not installed. Please install Node.js v14 or later.${NC}"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm >/dev/null 2>&1; then
        echo -e "${RED}npm is not installed. Please install npm.${NC}"
        exit 1
    fi
    
    # Check if Expo CLI is installed, install if missing
    if ! command -v expo >/dev/null 2>&1; then
        echo -e "${YELLOW}Expo CLI is not installed. Installing Expo CLI...${NC}"
        npm install -g expo-cli
    fi
    
    # Check if Python 3.8+ is installed
    if ! command -v python3 >/dev/null 2>&1; then
        echo -e "${RED}Python 3 is not installed. Please install Python 3.8 or later.${NC}"
        exit 1
    fi

    # Check if Homebrew is installed (for macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if ! command -v brew >/dev/null 2>&1; then
            echo -e "${RED}Homebrew is not installed. Please install Homebrew first.${NC}"
            exit 1
        fi
    fi
    
    echo -e "${GREEN}All prerequisites are met!${NC}"
}

# Function to set up Python virtual environment and install dependencies
setup_python_env() {
    print_section "Setting up Python Environment"
    
    cd backend

    # Clean up existing virtual environment if present
    if [ -d "venv" ]; then
        echo "Removing existing virtual environment..."
        rm -rf venv
    fi

    # Create new virtual environment
    echo "Creating Python virtual environment..."
    python3 -m venv venv

    # Activate virtual environment based on operating system
    if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "Activating virtual environment for Unix-like system..."
        source venv/bin/activate
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        echo "Activating virtual environment for Windows..."
        source venv/Scripts/activate
    else
        echo -e "${RED}Unsupported operating system${NC}"
        exit 1
    fi
    
    # Upgrade pip to latest version
    echo "Upgrading pip..."
    python -m pip install --upgrade pip

    # Install system dependencies for Pillow on macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Installing system dependencies for Pillow..."
        brew install libjpeg zlib libtiff webp little-cms2 2>/dev/null || true
    fi
    
    # Install critical packages first
    echo "Installing critical dependencies..."
    pip install --only-binary :all: Pillow==10.4.0
    pip install email-validator==2.1.0.post1
    pip install "pydantic[email]"==2.6.1
    
    # Install MongoDB drivers and other core dependencies
    echo "Installing MongoDB drivers and core dependencies..."
    pip install motor pymongo python-dotenv fastapi uvicorn passlib python-multipart
    
    # Install Python dependencies from requirements.txt
    echo "Installing remaining Python dependencies..."
    pip install -r requirements.txt
    
    cd ..
    
    echo -e "${GREEN}Python environment setup complete!${NC}"
}

# Function to set up the frontend environment
setup_frontend() {
    print_section "Setting up Frontend"
    
    cd CitrusMobileExpo
    
    # Clean up existing node_modules if present
    if [ -d "node_modules" ]; then
        echo "Removing existing node_modules..."
        rm -rf node_modules
    fi

    # Install core frontend dependencies
    echo "Installing frontend dependencies..."
    npm install axios react-native-dotenv @react-native-async-storage/async-storage
    
    # Configure babel for environment variables
    echo "Configuring babel for react-native-dotenv..."
    cat > babel.config.js << EOL
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          blacklist: null,
          whitelist: null,
          safe: false,
          allowUndefined: true,
          envName: 'APP_ENV',
        },
      ],
      ['@babel/plugin-transform-class-properties', { loose: true }],
      ['@babel/plugin-transform-private-methods', { loose: true }],
      ['@babel/plugin-transform-private-property-in-object', { loose: true }],
      '@babel/plugin-transform-nullish-coalescing-operator',
      '@babel/plugin-transform-optional-chaining',
    ],
  };
};
EOL
    
    # Install React Navigation and required dependencies
    echo "Installing React Navigation and dependencies..."
    npm install @react-navigation/native@6.1.9 @react-navigation/native-stack@6.9.17 react-native-screens@~4.4.0 react-native-safe-area-context@4.12.0
    
    # Install Expo packages for various features
    echo "Installing Expo packages..."
    npm install @expo/vector-icons expo-camera@~16.0.0 expo-image-picker expo-media-library react-native-webview expo-document-picker expo-file-system@~16.0.5 expo-sharing expo-web-browser react-native-pdf react-native-blob-util @config-plugins/react-native-pdf @config-plugins/react-native-blob-util
    
    # Update core Expo and React Native packages
    echo "Updating Expo and React Native..."
    npm install expo@~52.0.42 react-native@0.76.9
    
    # Install updated Babel plugins for modern JavaScript features
    echo "Installing updated Babel plugins..."
    npm install --save-dev @babel/plugin-transform-nullish-coalescing-operator@7.23.4 \
                          @babel/plugin-transform-class-properties@7.23.3 \
                          @babel/plugin-transform-optional-chaining@7.23.4 \
                          @babel/plugin-transform-private-methods@7.23.3 \
                          @babel/plugin-transform-private-property-in-object@7.23.3
    
    # Install utility packages for development
    echo "Installing updated utility packages..."
    npm install --save-dev rimraf@5.0.5 glob@10.3.10
    
    # Fix any security vulnerabilities in dependencies
    echo "Running npm audit fix..."
    npm audit fix --force
    
    # Create frontend environment file if it doesn't exist
    if [ ! -f .env ]; then
        echo "Creating frontend .env file..."
        cat > .env << EOL
EXPO_API_URL=http://localhost:8000
EXPO_APP_ENV=development
EOL
    fi
    
    # Create TypeScript declaration file for environment variables
    echo "Creating TypeScript declaration file for environment variables..."
    cat > env.d.ts << EOL
declare module '@env' {
  export const EXPO_API_URL: string;
  export const EXPO_APP_ENV: string;
}
EOL
    
    cd ..
    echo -e "${GREEN}Frontend setup complete!${NC}"
}

# Function to set up backend configuration
setup_backend_config() {
    print_section "Setting up Backend Configuration"
    
    # Create backend environment file if it doesn't exist
    if [ ! -f backend/.env ]; then
        echo "Creating backend .env file..."
        cat > backend/.env << EOL
MONGODB_URL=mongodb://localhost:27017/citrusnotes
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
EOL
        echo -e "${YELLOW}Please update the backend/.env file with your MongoDB credentials.${NC}"
    fi
}

# Function to check and kill existing Metro bundler processes
kill_existing_metro() {
    print_section "Checking for existing Metro processes"
    
    # Kill processes on port 8081 (Metro bundler)
    if lsof -i :8081 > /dev/null 2>&1; then
        echo "Found existing Metro process on port 8081. Killing it..."
        lsof -ti:8081 | xargs kill -9 2>/dev/null || true
    fi
    
    # Kill processes on port 19000 (Expo)
    if lsof -i :19000 > /dev/null 2>&1; then
        echo "Found existing Expo process on port 19000. Killing it..."
        lsof -ti:19000 | xargs kill -9 2>/dev/null || true
    fi
    
    # Kill any remaining node processes related to the project
    if pgrep -f "node.*CitrusMobileExpo" > /dev/null 2>&1; then
        echo "Found related Node processes. Killing them..."
        pkill -f "node.*CitrusMobileExpo"
    fi
    
    echo -e "${GREEN}Cleanup complete!${NC}"
}

# Main setup process
main() {
    echo -e "${BLUE}Starting CitrusNotes setup...${NC}"
    
    # Execute setup steps in sequence
    kill_existing_metro
    check_prerequisites
    setup_python_env
    setup_frontend
    setup_backend_config
    
    # Print completion message and next steps
    echo -e "\n${GREEN}Setup completed successfully!${NC}"
    echo -e "\n${BLUE}Next steps:${NC}"
    echo "1. Update the backend/.env file with your MongoDB credentials"
    echo "2. Start MongoDB service if not already running"
    echo "3. Run './run.sh' to start both frontend and backend servers"
    echo "4. Access the application through Expo Go on your device"
}

# Execute the main function
main 