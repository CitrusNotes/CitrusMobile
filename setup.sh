#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

# Function to check prerequisites
check_prerequisites() {
    print_section "Checking Prerequisites"
    
    # Check Node.js
    if ! command -v node >/dev/null 2>&1; then
        echo -e "${RED}Node.js is not installed. Please install Node.js v14 or later.${NC}"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm >/dev/null 2>&1; then
        echo -e "${RED}npm is not installed. Please install npm.${NC}"
        exit 1
    fi
    
    # Check Expo CLI
    if ! command -v expo >/dev/null 2>&1; then
        echo -e "${YELLOW}Expo CLI is not installed. Installing Expo CLI...${NC}"
        npm install -g expo-cli
    fi
    
    # Check Python 3.8+
    if ! command -v python3 >/dev/null 2>&1; then
        echo -e "${RED}Python 3 is not installed. Please install Python 3.8 or later.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}All prerequisites are met!${NC}"
}

# Function to setup Python virtual environment
setup_python_env() {
    print_section "Setting up Python Environment"
    
    # Create virtual environment
    echo "Creating Python virtual environment..."
    python3 -m venv backend/venv
    source backend/venv/bin/activate
    
    # Upgrade pip
    echo "Upgrading pip..."
    pip install --upgrade pip
    
    # Install requirements
    echo "Installing Python dependencies..."
    cd backend
    pip install -r requirements.txt
    cd ..
    
    echo -e "${GREEN}Python environment setup complete!${NC}"
}

# Function to setup frontend
setup_frontend() {
    print_section "Setting up Frontend"
    
    # Install frontend dependencies
    echo "Installing frontend dependencies..."
    cd CitrusMobileExpo
    npm install
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        echo "Creating frontend .env file..."
        cat > .env << EOL
EXPO_API_URL=http://localhost:8000
EXPO_APP_ENV=development
EOL
    fi
    
    cd ..
    echo -e "${GREEN}Frontend setup complete!${NC}"
}

# Function to setup backend configuration
setup_backend_config() {
    print_section "Setting up Backend Configuration"
    
    # Create .env file if it doesn't exist
    if [ ! -f backend/.env ]; then
        echo "Creating backend .env file..."
        cat > backend/.env << EOL
DATABASE_URL=mysql://user:password@localhost:3306/citrusnotes
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
EOL
        echo -e "${YELLOW}Please update the backend/.env file with your database credentials.${NC}"
    fi
}

# Main setup process
main() {
    echo -e "${BLUE}Starting CitrusNotes setup...${NC}"
    
    check_prerequisites
    setup_python_env
    setup_frontend
    setup_backend_config
    
    echo -e "\n${GREEN}Setup completed successfully!${NC}"
    echo -e "\n${BLUE}Next steps:${NC}"
    echo "1. Update the backend/.env file with your database credentials"
    echo "2. Run './run.sh' to start both frontend and backend servers"
    echo "3. Access the application through Expo Go on your device"
}

# Run main function
main 