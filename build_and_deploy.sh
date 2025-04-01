#!/bin/bash

# Define text colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RESET='\033[0m'  # Reset color

# Exit on error
set -e

# Function to display the menu and prompt for user choice
show_menu() {
  echo -e "${BLUE}BUILD JAR FILE${RESET}"
  echo -e "${YELLOW}Choose a service to build:${RESET}"
  echo -e "${GREEN}1.${RESET} familyauth"
  echo -e "${GREEN}2.${RESET} familypost"
  echo -e "${GREEN}3.${RESET} familynotification"
  echo -e "${GREEN}4.${RESET} familyfeed"
  echo -e "${GREEN}5.${RESET} All Services"
}

# Function to track and display elapsed time every second
track_time() {
  start_time=$(date +%s)
  while true; do
    sleep 1
    elapsed_time=$(( $(date +%s) - start_time ))
    echo -ne "${YELLOW}Elapsed time: $elapsed_time seconds${RESET}\r"
  done
}

# Call the show_menu function to display options
show_menu

# Read user input for the choice
read -p "Please enter the number of your choice: " choice

# Log file
LOG_FILE="build_log.txt"

# Function to build a service
build_service() {
  service_name=$1
  echo -e "${GREEN}Building $service_name...${RESET}"
  
  cd "$service_name" || { echo -e "${RED}Error: Directory $service_name not found!${RESET}"; exit 1; }

  # Start tracking time in the background
  track_time & 
  timer_pid=$!
  trap "kill $timer_pid 2>/dev/null" EXIT  # Cleanup on exit

  # Perform Maven build silently
  mvn clean install -DskipTests > "$LOG_FILE" 2>&1

  # Stop the timer
  kill $timer_pid 2>/dev/null
  trap - EXIT

  echo -e "${GREEN}$service_name build completed.${RESET}"
  rm -f "$LOG_FILE"

  cd ..
}

# Handle the user's choice for building the JAR file
case $choice in
  1) build_service "familyauth" ;;
  2) build_service "familypost" ;;
  3) build_service "familynotification" ;;
  4) build_service "familyfeed" ;;
  5)
    for service in familyauth familypost familynotification familyfeed; do
      build_service "$service"
    done
    ;;
  *)
    echo -e "${RED}Invalid choice. Please choose 1, 2, 3, 4, or 5.${RESET}"
    exit 1
    ;;
esac

# Ask user if they want to deploy Docker
read -p "Do you want to deploy using Docker? (y/n): " deploy_choice
if [[ "$deploy_choice" != "y" ]]; then
  echo -e "${YELLOW}Skipping Docker deployment.${RESET}"
  exit 0
fi

# Show Docker menu
echo -e "${YELLOW}DEPLOYMENT DOCKER${RESET}"
echo -e "${GREEN}1.${RESET} Build Docker Image"
echo -e "${GREEN}2.${RESET} Deploy Docker Containers"
echo -e "${GREEN}3.${RESET} Build and Deploy Both"

# Read user's choice for Docker deployment
read -p "Please enter the number of your choice: " docker_choice

# Handle Docker operations
case $docker_choice in
  1)
    echo -e "${GREEN}Building Docker images...${RESET}"
    docker-compose build
    echo -e "${GREEN}Docker images built successfully.${RESET}"
    ;;
  2)
    echo -e "${GREEN}Deploying Docker containers...${RESET}"
    docker-compose up -d
    echo -e "${GREEN}Docker containers deployed successfully.${RESET}"
    ;;
  3)
    echo -e "${GREEN}Building and Deploying Docker...${RESET}"
    docker-compose build && docker-compose up -d
    echo -e "${GREEN}Docker process completed.${RESET}"
    ;;
  *)
    echo -e "${RED}Invalid choice. Please choose 1, 2, or 3.${RESET}"
    exit 1
    ;;
esac


