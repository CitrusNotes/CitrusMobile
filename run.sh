#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a process is running
is_process_running() {
    pgrep -f "$1" >/dev/null
}

# Function to kill a process
kill_process() {
    pkill -f "$1"
}

# Function to cleanup on exit
cleanup() {
    echo -e "\n${BLUE}Cleaning up...${NC}"
    kill_process "uvicorn"
    kill_process "expo"
    exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

# Check if backend .env exists
if [ ! -f backend/.env ]; then
    echo -e "${RED}Error: backend/.env file not found. Please run setup.sh first.${NC}"
    exit 1
fi

# Check if frontend .env exists
if [ ! -f CitrusMobileExpo/.env ]; then
    echo -e "${RED}Error: CitrusMobileExpo/.env file not found. Please run setup.sh first.${NC}"
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
    do script "cd \"'$(pwd)'/CitrusMobileExpo\" && npm start"
    activate
end tell'

echo -e "${GREEN}Application is starting!${NC}"
echo -e "${BLUE}Backend API: http://localhost:8000${NC}"
echo -e "${BLUE}Expo Server: http://localhost:19000${NC}"
echo -e "${BLUE}Scan the QR code with Expo Go to run the app on your device${NC}"
echo -e "${BLUE}Press Ctrl+C in each terminal to stop the respective servers${NC}" 