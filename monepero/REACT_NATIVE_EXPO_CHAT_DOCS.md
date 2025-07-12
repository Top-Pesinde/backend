# React Native Expo Chat System Documentation

## 📱 Chat Sistemi - React Native Expo Entegrasyonu

Bu dokümantasyon, Monepero platformu için React Native Expo uygulamasında Socket.IO tabanlı chat sisteminin nasıl entegre edileceğini açıklar.

## 🚀 Kurulum

### 1. Gerekli Paketler

```bash
# Socket.IO client
npx expo install socket.io-client

# AsyncStorage (token saklama için)
npx expo install @react-native-async-storage/async-storage

# Navigation (chat sayfaları için)
npx expo install @react-navigation/native @react-navigation/native-stack

# Icons (mesajlaşma UI için)
npx expo install @expo/vector-icons

# Notification (push notifications için)
npx expo install expo-notifications
```

### 2. Temel Yapı

```
src/
├── services/
│   ├── socketService.js
│   ├── chatService.js
│   └── authService.js
├── components/
│   ├── ChatRoom.js
│   ├── MessageBubble.js
│   └── ConversationList.js
├── screens/
│   ├── ChatScreen.js
│   └── ConversationsScreen.js
└── hooks/
    ├── useSocket.js
    └── useChat.js
```

## 🔧 Servisler

### Socket Service (socketService.js)

```javascript
import { io } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = {};
  }

  async connect() {
    try {
      const token = await AsyncStorage.getItem("accessToken");

      if (!token) {
        throw new Error("No access token found");
      }

      this.socket = io("http://localhost:3000", {
        auth: { token },
        transports: ["websocket", "polling"],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.setupEventListeners();

      return new Promise((resolve, reject) => {
        this.socket.on("connected", (data) => {
          console.log("Socket connected:", data);
          this.isConnected = true;
          resolve(data);
        });

        this.socket.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
          this.isConnected = false;
          reject(error);
        });
      });
    } catch (error) {
      console.error("Socket connection failed:", error);
      throw error;
    }
  }

  setupEventListeners() {
    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      this.isConnected = false;
    });

    this.socket.on("reconnect", () => {
      console.log("Socket reconnected");
      this.isConnected = true;
    });

    this.socket.on("new_chat_message", (data) => {
      this.emit("newMessage", data);
    });

    this.socket.on("message_sent", (data) => {
      this.emit("messageSent", data);
    });

    this.socket.on("chat_error", (data) => {
      this.emit("chatError", data);
    });

    this.socket.on("user_typing", (data) => {
      this.emit("userTyping", data);
    });

    this.socket.on("user_stopped_typing", (data) => {
      this.emit("userStoppedTyping", data);
    });
  }

  // Event listener yönetimi
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback
      );
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback(data));
    }
  }

  // Mesaj gönderme
  sendMessage(receiverId, content, messageType = "TEXT") {
    if (!this.isConnected) {
      throw new Error("Socket is not connected");
    }

    this.socket.emit("send_chat_message", {
      receiverId,
      content,
      messageType,
    });
  }

  // Konuşmaya katılma
  joinConversation(conversationId) {
    if (this.isConnected) {
      this.socket.emit("join_conversation", { conversationId });
    }
  }

  // Konuşmadan ayrılma
  leaveConversation(conversationId) {
    if (this.isConnected) {
      this.socket.emit("leave_conversation", { conversationId });
    }
  }

  // Mesajları okundu işaretle
  markMessagesAsRead(conversationId) {
    if (this.isConnected) {
      this.socket.emit("mark_messages_read", { conversationId });
    }
  }

  // Typing events
  startTyping(conversationId) {
    if (this.isConnected) {
      this.socket.emit("typing_start", { conversationId });
    }
  }

  stopTyping(conversationId) {
    if (this.isConnected) {
      this.socket.emit("typing_stop", { conversationId });
    }
  }

  // Bağlantıyı kapat
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }
}

export default new SocketService();
```

### Chat Service (chatService.js)

```javascript
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://localhost:3000/api/v1";

class ChatService {
  async getAuthHeaders() {
    const token = await AsyncStorage.getItem("accessToken");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  // Konuşmaları getir
  async getConversations() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
        headers,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get conversations error:", error);
      throw error;
    }
  }

  // Konuşma mesajlarını getir
  async getMessages(conversationId, page = 1, limit = 50) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
        { headers }
      );

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get messages error:", error);
      throw error;
    }
  }

  // REST API ile mesaj gönder (alternatif)
  async sendMessage(receiverId, content, messageType = "TEXT") {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/chat/messages/send`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          receiverId,
          content,
          messageType,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Send message error:", error);
      throw error;
    }
  }

  // Konuşma başlat
  async startConversation(userId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/chat/conversations/start`, {
        method: "POST",
        headers,
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Start conversation error:", error);
      throw error;
    }
  }

  // Mesajları okundu işaretle
  async markMessagesAsRead(conversationId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/chat/conversations/${conversationId}/read`,
        {
          method: "PUT",
          headers,
        }
      );

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Mark messages as read error:", error);
      throw error;
    }
  }

  // Kullanıcıyı engelle
  async blockUser(userId, reason) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/chat/block`, {
        method: "POST",
        headers,
        body: JSON.stringify({ userId, reason }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Block user error:", error);
      throw error;
    }
  }

  // Kullanıcı engelini kaldır
  async unblockUser(userId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/chat/unblock`, {
        method: "POST",
        headers,
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Unblock user error:", error);
      throw error;
    }
  }
}

export default new ChatService();
```

## 🎣 Hooks

### useSocket Hook (useSocket.js)

```javascript
import { useEffect, useState } from "react";
import socketService from "../services/socketService";

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    const connect = async () => {
      try {
        await socketService.connect();
        setIsConnected(true);
        setConnectionError(null);
      } catch (error) {
        setConnectionError(error.message);
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      socketService.disconnect();
    };
  }, []);

  return {
    isConnected,
    connectionError,
    socket: socketService,
  };
};
```

### useChat Hook (useChat.js)

```javascript
import { useState, useEffect, useCallback } from "react";
import socketService from "../services/socketService";
import chatService from "../services/chatService";

export const useChat = (conversationId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);

  // Mesajları yükle
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      setLoading(true);
      const response = await chatService.getMessages(conversationId);
      if (response.success) {
        setMessages(response.data.messages.reverse()); // Eski mesajlar üstte
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Yeni mesaj geldiğinde
  const handleNewMessage = useCallback(
    (data) => {
      const message = data.message;
      if (message.conversationId === conversationId) {
        setMessages((prev) => [...prev, message]);
      }
    },
    [conversationId]
  );

  // Mesaj gönderildiğinde
  const handleMessageSent = useCallback(
    (data) => {
      const message = data.message;
      if (message.conversationId === conversationId) {
        setMessages((prev) => [...prev, message]);
      }
    },
    [conversationId]
  );

  // Typing events
  const handleUserTyping = useCallback(
    (data) => {
      if (data.conversationId === conversationId) {
        setTypingUsers((prev) => [
          ...prev.filter((u) => u.id !== data.user.id),
          data.user,
        ]);
      }
    },
    [conversationId]
  );

  const handleUserStoppedTyping = useCallback(
    (data) => {
      if (data.conversationId === conversationId) {
        setTypingUsers((prev) => prev.filter((u) => u.id !== data.user.id));
      }
    },
    [conversationId]
  );

  // Socket event listeners
  useEffect(() => {
    socketService.on("newMessage", handleNewMessage);
    socketService.on("messageSent", handleMessageSent);
    socketService.on("userTyping", handleUserTyping);
    socketService.on("userStoppedTyping", handleUserStoppedTyping);

    return () => {
      socketService.off("newMessage", handleNewMessage);
      socketService.off("messageSent", handleMessageSent);
      socketService.off("userTyping", handleUserTyping);
      socketService.off("userStoppedTyping", handleUserStoppedTyping);
    };
  }, [
    handleNewMessage,
    handleMessageSent,
    handleUserTyping,
    handleUserStoppedTyping,
  ]);

  // Konuşmaya katıl
  useEffect(() => {
    if (conversationId) {
      socketService.joinConversation(conversationId);
      loadMessages();
    }

    return () => {
      if (conversationId) {
        socketService.leaveConversation(conversationId);
      }
    };
  }, [conversationId, loadMessages]);

  // Mesaj gönder
  const sendMessage = useCallback(
    (content, messageType = "TEXT") => {
      if (!conversationId) return;

      // Socket ile gönder (real-time)
      socketService.sendMessage(conversationId, content, messageType);
    },
    [conversationId]
  );

  // Typing durumunu başlat
  const startTyping = useCallback(() => {
    if (conversationId) {
      socketService.startTyping(conversationId);
    }
  }, [conversationId]);

  // Typing durumunu durdur
  const stopTyping = useCallback(() => {
    if (conversationId) {
      socketService.stopTyping(conversationId);
    }
  }, [conversationId]);

  return {
    messages,
    loading,
    error,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    loadMessages,
  };
};
```

## 📱 Components

### MessageBubble Component (MessageBubble.js)

```javascript
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { format } from "date-fns";

const MessageBubble = ({ message, isOwn, showSender = true }) => {
  return (
    <View
      style={[
        styles.container,
        isOwn ? styles.ownMessage : styles.otherMessage,
      ]}
    >
      {showSender && !isOwn && (
        <Text style={styles.senderName}>{message.sender.username}</Text>
      )}
      <View
        style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}
      >
        <Text
          style={[
            styles.messageText,
            isOwn ? styles.ownText : styles.otherText,
          ]}
        >
          {message.content}
        </Text>
        <Text
          style={[
            styles.timestamp,
            isOwn ? styles.ownTimestamp : styles.otherTimestamp,
          ]}
        >
          {format(new Date(message.createdAt), "HH:mm")}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 16,
  },
  ownMessage: {
    alignItems: "flex-end",
  },
  otherMessage: {
    alignItems: "flex-start",
  },
  senderName: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
    marginLeft: 8,
  },
  bubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 18,
  },
  ownBubble: {
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "#E9E9EB",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownText: {
    color: "#FFFFFF",
  },
  otherText: {
    color: "#000000",
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  ownTimestamp: {
    color: "#FFFFFF",
    opacity: 0.7,
    textAlign: "right",
  },
  otherTimestamp: {
    color: "#666",
    textAlign: "left",
  },
});

export default MessageBubble;
```

### ChatRoom Component (ChatRoom.js)

```javascript
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MessageBubble from "./MessageBubble";
import { useChat } from "../hooks/useChat";

const ChatRoom = ({ conversationId, currentUserId, otherUser }) => {
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);
  const typingTimer = useRef(null);

  const {
    messages,
    loading,
    error,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
  } = useChat(conversationId);

  // Mesaj gönder
  const handleSendMessage = () => {
    if (inputText.trim()) {
      sendMessage(inputText.trim());
      setInputText("");
      stopTyping();
    }
  };

  // Typing durumu yönetimi
  const handleTextChange = (text) => {
    setInputText(text);

    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      startTyping();
    }

    // Typing timer'ı sıfırla
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
    }

    typingTimer.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping();
    }, 1000);
  };

  // Component unmount olduğunda typing'i durdur
  useEffect(() => {
    return () => {
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
      }
      stopTyping();
    };
  }, [stopTyping]);

  // Yeni mesaj geldiğinde scroll
  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const renderMessage = ({ item }) => (
    <MessageBubble
      message={item}
      isOwn={item.senderId === currentUserId}
      showSender={item.senderId !== currentUserId}
    />
  );

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    return (
      <View style={styles.typingContainer}>
        <Text style={styles.typingText}>
          {typingUsers[0].username} yazıyor...
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      {renderTypingIndicator()}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={handleTextChange}
          placeholder="Mesaj yazın..."
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !inputText.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={!inputText.trim()}
        >
          <Ionicons name="send" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  messagesList: {
    flex: 1,
    paddingVertical: 8,
  },
  typingContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  typingText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E1E1E1",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E1E1E1",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#CCC",
  },
});

export default ChatRoom;
```

## 📺 Screens

### ChatScreen (ChatScreen.js)

```javascript
import React, { useEffect } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import ChatRoom from "../components/ChatRoom";
import { useSocket } from "../hooks/useSocket";

const ChatScreen = ({ route, navigation }) => {
  const { conversationId, otherUser, currentUserId } = route.params;
  const { isConnected, connectionError } = useSocket();

  useEffect(() => {
    navigation.setOptions({
      title: otherUser?.username || "Chat",
    });
  }, [navigation, otherUser]);

  useEffect(() => {
    if (connectionError) {
      Alert.alert("Bağlantı Hatası", connectionError);
    }
  }, [connectionError]);

  if (!isConnected) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Bağlanıyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ChatRoom
        conversationId={conversationId}
        currentUserId={currentUserId}
        otherUser={otherUser}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ChatScreen;
```

## 🔔 Push Notifications

### Notification Service (notificationService.js)

```javascript
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://localhost:3000/api/v1";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  // FCM token'ı register et
  async registerForPushNotifications() {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Notification permission not granted");
        return;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log("Expo push token:", token);

      // Backend'e token'ı gönder
      await this.sendTokenToBackend(token);

      return token;
    } catch (error) {
      console.error("Push notification registration failed:", error);
    }
  }

  async sendTokenToBackend(token) {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");

      if (!accessToken) {
        throw new Error("No access token found");
      }

      const response = await fetch(`${API_BASE_URL}/fcm-tokens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          token,
          platform: "EXPO",
        }),
      });

      const data = await response.json();
      console.log("Token registered:", data);
    } catch (error) {
      console.error("Token registration failed:", error);
    }
  }

  // Notification listener'ları ayarla
  setupNotificationListeners() {
    // Notification geldiğinde
    Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notification received:", notification);
    });

    // Notification'a tıklandığında
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification response:", response);
      const data = response.notification.request.content.data;

      if (data.type === "new_message") {
        // Chat sayfasına yönlendir
        // navigation.navigate('Chat', { conversationId: data.conversationId });
      }
    });
  }
}

export default new NotificationService();
```

## 🚀 App.js Entegrasyonu

```javascript
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import notificationService from "./src/services/notificationService";
import ChatScreen from "./src/screens/ChatScreen";
import ConversationsScreen from "./src/screens/ConversationsScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    // Push notifications'ı başlat
    notificationService.registerForPushNotifications();
    notificationService.setupNotificationListeners();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Conversations"
          component={ConversationsScreen}
          options={{ title: "Mesajlar" }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{ headerBackTitle: "Geri" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## 📋 Kullanım Örnekleri

### 1. Chat Sayfasını Açma

```javascript
// ConversationsScreen.js
const openChat = (conversation) => {
  navigation.navigate("Chat", {
    conversationId: conversation.id,
    otherUser: conversation.otherUser,
    currentUserId: currentUser.id,
  });
};
```

### 2. Yeni Konuşma Başlatma

```javascript
import chatService from "../services/chatService";

const startNewChat = async (userId) => {
  try {
    const response = await chatService.startConversation(userId);
    if (response.success) {
      navigation.navigate("Chat", {
        conversationId: response.data.id,
        otherUser: response.data.otherUser,
        currentUserId: currentUser.id,
      });
    }
  } catch (error) {
    Alert.alert("Hata", "Konuşma başlatılamadı");
  }
};
```

### 3. Kullanıcı Engelleme

```javascript
const blockUser = async (userId) => {
  try {
    await chatService.blockUser(userId, "Spam mesajlar");
    Alert.alert("Başarılı", "Kullanıcı engellendi");
  } catch (error) {
    Alert.alert("Hata", "Kullanıcı engellenemedi");
  }
};
```

## 🔧 Yapılandırma

### app.json

```json
{
  "expo": {
    "name": "Monepero Chat",
    "slug": "monepero-chat",
    "version": "1.0.0",
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#007AFF"
    },
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      }
    }
  }
}
```

## 🐛 Hata Yönetimi

### Error Boundary Component

```javascript
import React from "react";
import { View, Text, StyleSheet } from "react-native";

class ChatErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Chat error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Bir hata oluştu. Lütfen uygulamayı yeniden başlatın.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
  },
});

export default ChatErrorBoundary;
```

## 🎨 Tema ve Stil

### Theme Provider

```javascript
import React, { createContext, useContext } from "react";

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const theme = {
    colors: {
      primary: "#007AFF",
      background: "#F5F5F5",
      surface: "#FFFFFF",
      text: "#000000",
      textSecondary: "#666666",
      border: "#E1E1E1",
      success: "#34C759",
      error: "#FF3B30",
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    borderRadius: {
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
    },
  };

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};
```

## 📱 Platform Özellikleri

### iOS Özellikleri

```javascript
// iOS'ta keyboard safe area
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ChatScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingBottom: insets.bottom }}>{/* Chat content */}</View>
  );
};
```

### Android Özellikleri

```javascript
// Android'de status bar
import { StatusBar } from "expo-status-bar";

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      {/* App content */}
    </>
  );
}
```

## 🔐 Güvenlik

### Token Yönetimi

```javascript
// authService.js
import AsyncStorage from "@react-native-async-storage/async-storage";

class AuthService {
  async login(username, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        await AsyncStorage.setItem("accessToken", data.data.accessToken);
        await AsyncStorage.setItem("refreshToken", data.data.refreshToken);
        return data.data;
      }

      throw new Error(data.message);
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
  }
}

export default new AuthService();
```

## 🚀 Production Hazırlığı

### Environment Variables

```javascript
// config.js
const config = {
  development: {
    API_BASE_URL: "http://localhost:3000/api/v1",
    SOCKET_URL: "http://localhost:3000",
  },
  production: {
    API_BASE_URL: "https://api.monepero.com/api/v1",
    SOCKET_URL: "https://api.monepero.com",
  },
};

export default config[__DEV__ ? "development" : "production"];
```

### Build Optimizasyonu

```bash
# Production build
expo build:android --type app-bundle
expo build:ios --type archive

# OTA Updates
expo publish --release-channel production
```

## 🧪 Test

### Unit Test Örneği

```javascript
// __tests__/socketService.test.js
import socketService from "../src/services/socketService";

describe("SocketService", () => {
  it("should connect to socket server", async () => {
    const mockToken = "test-token";
    AsyncStorage.getItem.mockResolvedValue(mockToken);

    const result = await socketService.connect();
    expect(result).toBeDefined();
  });
});
```

Bu dokümantasyon, React Native Expo uygulamanızda chat sistemini tamamen entegre etmek için gerekli tüm bilgileri içermektedir. Her bir bileşen modüler olarak tasarlanmış ve kolayca özelleştirilebilir durumdadır.

## 🔗 API Endpoints

### Chat API'leri

| Method | Endpoint                           | Açıklama                         |
| ------ | ---------------------------------- | -------------------------------- |
| GET    | `/chat/conversations`              | Kullanıcının konuşmalarını getir |
| GET    | `/chat/conversations/:id/messages` | Konuşma mesajlarını getir        |
| POST   | `/chat/conversations/start`        | Yeni konuşma başlat              |
| POST   | `/chat/messages/send`              | Mesaj gönder (REST)              |
| PUT    | `/chat/conversations/:id/read`     | Mesajları okundu işaretle        |
| POST   | `/chat/block`                      | Kullanıcı engelle                |
| POST   | `/chat/unblock`                    | Kullanıcı engelini kaldır        |

### Socket Events

| Event                 | Yön             | Açıklama                   |
| --------------------- | --------------- | -------------------------- |
| `connected`           | Server → Client | Bağlantı başarılı          |
| `new_chat_message`    | Server → Client | Yeni mesaj geldi           |
| `send_chat_message`   | Client → Server | Mesaj gönder               |
| `join_conversation`   | Client → Server | Konuşmaya katıl            |
| `leave_conversation`  | Client → Server | Konuşmadan ayrıl           |
| `typing_start`        | Client → Server | Yazmaya başla              |
| `typing_stop`         | Client → Server | Yazmayı durdur             |
| `user_typing`         | Server → Client | Kullanıcı yazıyor          |
| `user_stopped_typing` | Server → Client | Kullanıcı yazmayı durdurdu |

Bu dokümantasyon ile React Native Expo uygulamanızda tam özellikli bir chat sistemi kurabilirsiniz! 🚀
