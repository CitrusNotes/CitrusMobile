#!/bin/bash

# Colors for terminal output formatting
GREEN='\033[0;32m'  # Success messages
BLUE='\033[0;34m'   # Section headers
RED='\033[0;31m'    # Error messages
YELLOW='\033[1;33m' # Warning messages
NC='\033[0m'        # No Color (reset)

# Function to check if a process is running
is_process_running() {
    pgrep -f "$1" >/dev/null
}

# Function to kill a process by name
kill_process() {
    pkill -f "$1"
}

# Function to run tests
run_tests() {
    echo -e "${BLUE}Running automated tests...${NC}"
    
    # Change to backend directory
    cd backend || {
        echo -e "${RED}Failed to change to backend directory${NC}"
        return 1
    }
    
    # Activate virtual environment
    source venv/bin/activate || {
        echo -e "${RED}Failed to activate virtual environment${NC}"
        return 1
    }
    
    # Run test script
    if ./test.sh; then
        echo -e "${GREEN}All tests passed successfully!${NC}"
        return 0
    else
        echo -e "${RED}Tests failed. Please fix the issues before proceeding.${NC}"
        return 1
    fi
}

# Function to check and kill existing development processes
kill_existing_processes() {
    echo -e "${BLUE}Checking for existing processes...${NC}"
    
    # Kill Metro bundler process on port 8081
    if lsof -i :8081 > /dev/null 2>&1; then
        echo "Found existing Metro process on port 8081. Killing it..."
        lsof -ti:8081 | xargs kill -9 2>/dev/null || true
    fi
    
    # Kill Expo process on port 19000
    if lsof -i :19000 > /dev/null 2>&1; then
        echo "Found existing Expo process on port 19000. Killing it..."
        lsof -ti:19000 | xargs kill -9 2>/dev/null || true
    fi
    
    # Kill backend process on port 8000
    if lsof -i :8000 > /dev/null 2>&1; then
        echo "Found existing backend process on port 8000. Killing it..."
        lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    fi
    
    # Kill any remaining Node processes related to the project
    if pgrep -f "node.*CitrusMobileExpo" > /dev/null 2>&1; then
        echo "Found related Node processes. Killing them..."
        pkill -f "node.*CitrusMobileExpo"
    fi
    
    echo -e "${GREEN}Cleanup complete!${NC}"
}

# Function to handle cleanup on script termination
cleanup() {
    echo -e "\n${BLUE}Cleaning up...${NC}"
    kill_existing_processes
    exit 0
}

# Function to verify MongoDB connection before starting the application
verify_mongodb_connection() {
    echo -e "${BLUE}Verifying MongoDB connection...${NC}"
    if ! python3 -c "
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

load_dotenv()
client = AsyncIOMotorClient(os.getenv('MONGODB_URL'))
db = client.CitrusNotes

async def test_connection():
    try:
        await db.command('ping')
        print('MongoDB connection successful!')
    except Exception as e:
        print(f'Error connecting to MongoDB: {e}')
        exit(1)

asyncio.run(test_connection())
" > /dev/null 2>&1; then
        echo -e "${RED}Failed to connect to MongoDB. Please check your connection string in backend/.env${NC}"
        exit 1
    fi
    echo -e "${GREEN}MongoDB connection verified!${NC}"
}

# Set up trap to handle script termination (Ctrl+C)
trap cleanup SIGINT SIGTERM

# Check if required environment files exist
if [ ! -f backend/.env ]; then
    echo -e "${RED}Error: backend/.env file not found. Please run setup.sh first.${NC}"
    exit 1
fi

if [ ! -f CitrusMobileExpo/.env ]; then
    echo -e "${RED}Error: CitrusMobileExpo/.env file not found. Please run setup.sh first.${NC}"
    exit 1
fi

# Clean up any existing processes
kill_existing_processes

# Verify MongoDB connection before proceeding
verify_mongodb_connection

# Run tests before starting servers
if ! run_tests; then
    echo -e "${RED}Tests failed. Aborting startup.${NC}"
    exit 1
fi

# Start backend server in a new terminal window
echo -e "${BLUE}Starting backend server in a new terminal...${NC}"
osascript -e '
tell application "Terminal"
    do script "cd \"'$(pwd)'/backend\" && source venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
    activate
end tell'

# Start Expo development server in a new terminal window
echo -e "${BLUE}Starting Expo development server in a new terminal...${NC}"
osascript -e '
tell application "Terminal"
    do script "cd \"'$(pwd)'/CitrusMobileExpo\" && npm start -- --clear"
    activate
end tell'

# Print startup information
echo -e "${GREEN}Application is starting!${NC}"
echo -e "${BLUE}Backend API: http://localhost:8000${NC}"
echo -e "${BLUE}Expo Server: http://localhost:19000${NC}"
echo -e "${BLUE}Scan the QR code with Expo Go to run the app on your device${NC}"
echo -e "${BLUE}Press Ctrl+C in each terminal to stop the respective servers${NC}"
echo -e "${YELLOW}Note: Make sure MongoDB Atlas IP whitelist includes your current IP address${NC}" 