#!/bin/bash

# Colors for better terminal experience
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# API Configuration
API_URL="http://localhost:3000"
TESTUSER2_USERNAME="testuser2"
TESTUSER2_PASSWORD="123456"
TESTUSER_ID="cmd0kp5p500009d1w3k7gbigv"

# Function to safely encode JSON
json_escape() {
    echo -n "$1" | sed 's/"/\\"/g' | sed "s/'/\\'/g"
}

# Function to send message
send_message() {
    local message="$1"
    if [ -n "$message" ]; then
        echo -e "${BLUE}📤 Sending: ${NC}$message"
        
        # Safely encode the message
        local encoded_message=$(json_escape "$message")
        
        RESPONSE=$(curl -s -X POST "$API_URL/api/v1/chat/messages/send" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $TOKEN" \
          -d "{\"receiverId\": \"$TESTUSER_ID\", \"content\": \"$encoded_message\", \"messageType\": \"TEXT\"}")
        
        # Check if message was sent successfully
        if echo "$RESPONSE" | grep -q '"success":true'; then
            echo -e "${GREEN}✅ Message sent successfully!${NC}"
        else
            echo -e "${RED}❌ Failed to send message${NC}"
            echo -e "${RED}Error: $RESPONSE${NC}"
        fi
        echo ""
    fi
}

# Clear screen and show header
clear
echo -e "${PURPLE}===========================================${NC}"
echo -e "${CYAN}🚀 MONEPERO TERMINAL CHAT 🚀${NC}"
echo -e "${PURPLE}===========================================${NC}"
echo -e "${YELLOW}📱 Testuser2 → Testuser Chat${NC}"
echo -e "${PURPLE}===========================================${NC}"

# Login as testuser2
echo -e "${BLUE}🔐 Logging in as testuser2...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$TESTUSER2_USERNAME\", \"password\": \"$TESTUSER2_PASSWORD\"}")

# Extract token from response
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Login failed!${NC}"
    echo -e "${RED}Response: $LOGIN_RESPONSE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Login successful!${NC}"
echo -e "${BLUE}🔑 Token: ${TOKEN:0:50}...${NC}"
echo ""

# Instructions
echo -e "${YELLOW}📝 Instructions:${NC}"
echo -e "${CYAN}   • Type your message and press Enter${NC}"
echo -e "${CYAN}   • Type 'exit' or 'quit' to end chat${NC}"
echo -e "${CYAN}   • Type 'help' for commands${NC}"
echo -e "${PURPLE}===========================================${NC}"
echo ""

# Interactive chat loop
while true; do
    echo -e "${CYAN}💬 Message: ${NC}"
    read -r user_input
    
    # Check for exit commands
    if [[ "$user_input" == "exit" || "$user_input" == "quit" ]]; then
        echo -e "${YELLOW}👋 Goodbye!${NC}"
        break
    fi
    
    # Check for help command
    if [[ "$user_input" == "help" ]]; then
        echo -e "${YELLOW}📚 Available commands:${NC}"
        echo -e "${CYAN}   • exit/quit - End chat${NC}"
        echo -e "${CYAN}   • help - Show this help${NC}"
        echo -e "${CYAN}   • clear - Clear screen${NC}"
        echo ""
        continue
    fi
    
    # Check for clear command
    if [[ "$user_input" == "clear" ]]; then
        clear
        echo -e "${PURPLE}===========================================${NC}"
        echo -e "${CYAN}🚀 MONEPERO TERMINAL CHAT 🚀${NC}"
        echo -e "${YELLOW}📱 Testuser2 → Testuser Chat${NC}"
        echo -e "${PURPLE}===========================================${NC}"
        echo ""
        continue
    fi
    
    # Skip empty messages
    if [[ -z "$user_input" ]]; then
        continue
    fi
    
    # Send message
    send_message "$user_input"
done

echo -e "${GREEN}🎯 Chat session ended!${NC}" 