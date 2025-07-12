#!/usr/bin/env node

const io = require('socket.io-client');
const readline = require('readline');
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
const TESTUSER_ID = 'cmd0kp5p500009d1w3k7gbigv';

let socket;
let token;
let conversationId;

// Terminal interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Clear screen and show header
function showHeader() {
    console.clear();
    console.log(`${colors.magenta}===========================================${colors.reset}`);
    console.log(`${colors.cyan}🚀 MONEPERO REAL-TIME CHAT 🚀${colors.reset}`);
    console.log(`${colors.magenta}===========================================${colors.reset}`);
    console.log(`${colors.yellow}📱 Testuser2 → Testuser Live Chat${colors.reset}`);
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
            console.log(`${colors.green}✅ Login successful!${colors.reset}`);
            console.log(`${colors.blue}🔑 Token: ${token.substring(0, 50)}...${colors.reset}`);
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

// Get or create conversation
async function getConversation() {
    try {
        const response = await axios.get(`${API_URL}/api/v1/chat/conversations`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data.success && response.data.data.length > 0) {
            // Find conversation with testuser
            const conversation = response.data.data.find(conv => 
                conv.user1.id === TESTUSER_ID || conv.user2.id === TESTUSER_ID
            );
            
            if (conversation) {
                conversationId = conversation.id;
                console.log(`${colors.green}✅ Found existing conversation: ${conversationId}${colors.reset}`);
                return true;
            }
        }
        
        console.log(`${colors.yellow}📝 Creating new conversation...${colors.reset}`);
        return true;
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
        
        // Join conversation if exists
        if (conversationId) {
            socket.emit('join_conversation', { conversationId });
        }
        
        startChat();
    });

    socket.on('disconnect', () => {
        console.log(`${colors.red}❌ Socket disconnected!${colors.reset}`);
    });

    // Listen for new messages
    socket.on('new_chat_message', (data) => {
        const message = data.message;
        const senderName = message.sender.firstName + ' ' + message.sender.lastName;
        const timestamp = new Date(message.createdAt).toLocaleTimeString();
        
        console.log(`\n${colors.green}📩 ${senderName} (${timestamp}): ${message.content}${colors.reset}`);
        showPrompt();
    });

    // Listen for typing indicators
    socket.on('user_typing', (data) => {
        console.log(`${colors.cyan}✏️  ${data.username} is typing...${colors.reset}`);
    });

    socket.on('user_stopped_typing', (data) => {
        console.log(`${colors.cyan}✏️  ${data.username} stopped typing${colors.reset}`);
    });

    socket.on('connect_error', (error) => {
        console.log(`${colors.red}❌ Socket connection error: ${error.message}${colors.reset}`);
    });
}

// Send message function
async function sendMessage(content) {
    try {
        const response = await axios.post(`${API_URL}/api/v1/chat/messages/send`, {
            receiverId: TESTUSER_ID,
            content: content,
            messageType: 'TEXT'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data.success) {
            console.log(`${colors.green}✅ Message sent!${colors.reset}`);
            
            // Update conversation ID if new
            if (!conversationId && response.data.data.conversationId) {
                conversationId = response.data.data.conversationId;
                socket.emit('join_conversation', { conversationId });
            }
        } else {
            console.log(`${colors.red}❌ Failed to send message: ${response.data.message}${colors.reset}`);
        }
    } catch (error) {
        console.log(`${colors.red}❌ Send error: ${error.message}${colors.reset}`);
    }
}

// Show prompt
function showPrompt() {
    rl.question(`${colors.cyan}💬 Message: ${colors.reset}`, async (input) => {
        if (input.trim() === '') {
            showPrompt();
            return;
        }

        if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
            console.log(`${colors.yellow}👋 Goodbye!${colors.reset}`);
            process.exit(0);
        }

        if (input.toLowerCase() === 'help') {
            console.log(`${colors.yellow}📚 Available commands:${colors.reset}`);
            console.log(`${colors.cyan}   • exit/quit - End chat${colors.reset}`);
            console.log(`${colors.cyan}   • help - Show this help${colors.reset}`);
            console.log(`${colors.cyan}   • clear - Clear screen${colors.reset}`);
            showPrompt();
            return;
        }

        if (input.toLowerCase() === 'clear') {
            showHeader();
            console.log(`${colors.green}✅ Socket connected - Real-time chat active!${colors.reset}`);
            console.log(`${colors.yellow}📝 Instructions:${colors.reset}`);
            console.log(`${colors.cyan}   • Type messages and press Enter${colors.reset}`);
            console.log(`${colors.cyan}   • Incoming messages will appear automatically${colors.reset}`);
            console.log(`${colors.cyan}   • Type 'exit' to quit${colors.reset}`);
            console.log(`${colors.magenta}===========================================${colors.reset}`);
            showPrompt();
            return;
        }

        // Send typing indicator
        socket.emit('typing_start', { conversationId });

        // Send message
        await sendMessage(input);

        // Stop typing indicator
        socket.emit('typing_stop', { conversationId });

        showPrompt();
    });
}

// Start chat function
function startChat() {
    console.log(`${colors.green}✅ Real-time chat started!${colors.reset}`);
    console.log(`${colors.yellow}📝 Instructions:${colors.reset}`);
    console.log(`${colors.cyan}   • Type messages and press Enter${colors.reset}`);
    console.log(`${colors.cyan}   • Incoming messages will appear automatically${colors.reset}`);
    console.log(`${colors.cyan}   • Type 'exit' to quit or 'help' for commands${colors.reset}`);
    console.log(`${colors.magenta}===========================================${colors.reset}`);
    
    showPrompt();
}

// Main function
async function main() {
    showHeader();
    
    // Login
    const loginSuccess = await login();
    if (!loginSuccess) {
        process.exit(1);
    }

    // Get conversation
    const conversationSuccess = await getConversation();
    if (!conversationSuccess) {
        process.exit(1);
    }

    // Setup socket
    setupSocket();
}

// Handle exit
process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}👋 Chat session ended!${colors.reset}`);
    if (socket) {
        socket.disconnect();
    }
    process.exit(0);
});

// Start the application
main().catch(error => {
    console.error(`${colors.red}❌ Application error: ${error.message}${colors.reset}`);
    process.exit(1);
}); 