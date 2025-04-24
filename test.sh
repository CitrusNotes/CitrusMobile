#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print section headers
print_section() {
    echo -e "\n${YELLOW}=== $1 ===${NC}"
}

# Function to handle errors
handle_error() {
    echo -e "${RED}Error: $1${NC}"
    exit 1
}

# Main script
print_section "Setting up CitrusMobile Test Environment"

# Check if backend directory exists
if [ ! -d "backend" ]; then
    handle_error "backend directory not found"
fi

# Change to backend directory
print_section "Changing to backend directory"
cd backend || handle_error "Failed to change to backend directory"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_section "Creating virtual environment"
    python3 -m venv venv || handle_error "Failed to create virtual environment"
fi

# Activate virtual environment
print_section "Activating virtual environment"
source venv/bin/activate || handle_error "Failed to activate virtual environment"

# Install requirements
print_section "Installing requirements"
pip install -r requirements.txt || handle_error "Failed to install requirements"

# Run tests
print_section "Running tests"
python tests/test_image_scan.py || handle_error "Tests failed"

# Deactivate virtual environment
print_section "Tests completed"
deactivate

echo -e "\n${GREEN}All done!${NC}" 