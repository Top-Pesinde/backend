#!/usr/bin/env node

const io = require('socket.io-client');
const axios = require('axios');

// Colors for terminal
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

// Configuration
const API_URL = 'http://localhost:3000';
const TESTUSER2_USERNAME = 'testuser2';
const TESTUSER2_PASSWORD = '123456';

let socket;
let token;
let userId;
let conversations = [];

// Clear screen and show header
function showHeader() {
    console.clear();
    console.log(`${colors.magenta}===========================================${colors.reset}`);
    console.log(`${colors.cyan}📱 TESTUSER2 MESSAGE LISTENER 📱${colors.reset}`);
    console.log(`${colors.magenta}===========================================${colors.reset}`);
    console.log(`${colors.yellow}🔊 Listening for incoming messages...${colors.reset}`);
    console.log(`${colors.magenta}===========================================${colors.reset}`);
}

// Login function
async function login() {
    try {
        console.log(`${colors.blue}🔐 Logging in as testuser2...${colors.reset}`);
        
        const response = await axios.post(`${API_URL}/api/v1/auth/login`, {
            username: TESTUSER2_USERNAME,
            password: TESTUSER2_PASSWORD
        });

        if (response.data.success) {
            token = response.data.data.accessToken;
            userId = response.data.data.user.id;
            console.log(`${colors.green}✅ Login successful!${colors.reset}`);
            console.log(`${colors.blue}👤 User ID: ${userId}${colors.reset}`);
            console.log(`${colors.blue}🔑 Token: ${token.substring(0, 30)}...${colors.reset}`);
            return true;
        } else {
            console.log(`${colors.red}❌ Login failed!${colors.reset}`);
            return false;
        }
    } catch (error) {
        console.log(`${colors.red}❌ Login error: ${error.message}${colors.reset}`);
        return false;
    }
}

// Get conversations and join them
async function getAndJoinConversations() {
    try {
        console.log(`${colors.blue}📋 Loading conversations...${colors.reset}`);
        
        const response = await axios.get(`${API_URL}/api/v1/chat/conversations`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data.success && response.data.data.length > 0) {
            conversations = response.data.data;
            console.log(`${colors.green}✅ Found ${conversations.length} conversations${colors.reset}`);
            
            // Join all conversations
            conversations.forEach(conv => {
                console.log(`${colors.cyan}👥 Joining conversation: ${conv.id}${colors.reset}`);
                socket.emit('join_conversation', { conversationId: conv.id });
            });
            
            return true;
        } else {
            console.log(`${colors.yellow}📝 No conversations found${colors.reset}`);
            return true;
        }
    } catch (error) {
        console.log(`${colors.red}❌ Conversation error: ${error.message}${colors.reset}`);
        return false;
    }
}

// Setup socket connection
function setupSocket() {
    console.log(`${colors.blue}🔌 Connecting to socket...${colors.reset}`);
    
    socket = io(API_URL, {
        auth: { token: token },
        transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
        console.log(`${colors.green}✅ Socket connected!${colors.reset}`);
        
        // Join conversations after socket connection
        getAndJoinConversations().then(() => {
            startListening();
        });
    });

    socket.on('disconnect', () => {
        console.log(`${colors.red}❌ Socket disconnected! Trying to reconnect...${colors.reset}`);
    });

    socket.on('reconnect', () => {
        console.log(`${colors.green}✅ Socket reconnected!${colors.reset}`);
        // Rejoin conversations after reconnection
        conversations.forEach(conv => {
            socket.emit('join_conversation', { conversationId: conv.id });
        });
    });

    // Listen for new messages
    socket.on('new_chat_message', (data) => {
        const message = data.message;
        const senderName = message.sender.firstName + ' ' + message.sender.lastName;
        const senderUsername = message.sender.username;
        const timestamp = new Date(message.createdAt).toLocaleTimeString();
        
        console.log(`\n${colors.green}📩 NEW MESSAGE${colors.reset}`);
        console.log(`${colors.cyan}👤 From: ${senderName} (@${senderUsername})${colors.reset}`);
        console.log(`${colors.blue}🕐 Time: ${timestamp}${colors.reset}`);
        console.log(`${colors.white}💬 Message: ${message.content}${colors.reset}`);
        console.log(`${colors.yellow}📄 Type: ${message.messageType}${colors.reset}`);
        console.log(`${colors.magenta}=====================================\n${colors.reset}`);
    });

    // Listen for typing indicators
    socket.on('user_typing', (data) => {
        if (data.userId !== userId) { // Don't show own typing
            console.log(`${colors.cyan}✏️  ${data.username} is typing...${colors.reset}`);
        }
    });

    socket.on('user_stopped_typing', (data) => {
        if (data.userId !== userId) { // Don't show own typing
            console.log(`${colors.cyan}✏️  ${data.username} stopped typing${colors.reset}`);
        }
    });

    // Listen for new conversations
    socket.on('new_conversation', (data) => {
        console.log(`\n${colors.yellow}🆕 NEW CONVERSATION${colors.reset}`);
        console.log(`${colors.cyan}📋 Conversation ID: ${data.conversationId}${colors.reset}`);
        console.log(`${colors.cyan}👤 With: ${data.otherUser.firstName} ${data.otherUser.lastName}${colors.reset}`);
        
        // Join the new conversation
        socket.emit('join_conversation', { conversationId: data.conversationId });
        console.log(`${colors.green}✅ Joined new conversation${colors.reset}`);
    });

    socket.on('connect_error', (error) => {
        console.log(`${colors.red}❌ Socket connection error: ${error.message}${colors.reset}`);
    });

    socket.on('error', (error) => {
        console.log(`${colors.red}❌ Socket error: ${error}${colors.reset}`);
    });
}

// Start listening function
function startListening() {
    console.log(`${colors.green}🎧 Message listener started!${colors.reset}`);
    console.log(`${colors.yellow}📝 Status: Listening for incoming messages...${colors.reset}`);
    console.log(`${colors.cyan}💡 Press Ctrl+C to stop listening${colors.reset}`);
    console.log(`${colors.magenta}===========================================${colors.reset}\n`);
    
    // Show current time
    const now = new Date().toLocaleString();
    console.log(`${colors.blue}🕐 Started at: ${now}${colors.reset}\n`);
    
    // Keep alive ping every 30 seconds
    setInterval(() => {
        if (socket && socket.connected) {
            socket.emit('ping');
            console.log(`${colors.blue}🏓 Ping sent - ${new Date().toLocaleTimeString()}${colors.reset}`);
        }
    }, 30000);
}

// Display conversation info
function showConversationInfo() {
    if (conversations.length > 0) {
        console.log(`${colors.cyan}📋 Active Conversations:${colors.reset}`);
        conversations.forEach((conv, index) => {
            const otherUser = conv.user1.id === userId ? conv.user2 : conv.user1;
            console.log(`${colors.yellow}${index + 1}. ${otherUser.firstName} ${otherUser.lastName} (@${otherUser.username})${colors.reset}`);
        });
        console.log('');
    }
}

// Main function
async function main() {
    showHeader();
    
    // Login
    const loginSuccess = await login();
    if (!loginSuccess) {
        process.exit(1);
    }

    // Setup socket
    setupSocket();
}

// Handle exit
process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}👋 Message listener stopped!${colors.reset}`);
    if (socket) {
        socket.disconnect();
    }
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error(`${colors.red}❌ Uncaught Exception: ${error.message}${colors.reset}`);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error(`${colors.red}❌ Unhandled Rejection at: ${promise}, reason: ${reason}${colors.reset}`);
    process.exit(1);
});

// Start the application
console.log(`${colors.green}🚀 Starting testuser2 message listener...${colors.reset}`);
main().catch(error => {
    console.error(`${colors.red}❌ Application error: ${error.message}${colors.reset}`);
    process.exit(1);
}); 