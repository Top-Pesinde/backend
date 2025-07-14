# Socket.IO İstemci (Client) Entegrasyon Rehberi

Bu doküman, sunucu tarafında hazırlanan Socket.IO altyapısının istemci (frontend) tarafında nasıl kullanılacağını adım adım açıklamaktadır. Rehber, React, Vue, Angular veya mobil (React Native) projeler için genel bir yol haritası sunar.

## 1. Kurulum

Öncelikle projenize `socket.io-client` kütüphanesini ekleyin.

```bash
npm install socket.io-client
# veya
yarn add socket.io-client
```

## 2. Sunucuya Bağlanma ve Kimlik Doğrulama

Kullanıcı uygulamaya giriş yaptığında (login), sunucudan bir JWT (JSON Web Token) alırsınız. Bu token, Socket.IO sunucusuna kimliğinizi doğrulatmak için kullanılmalıdır.

Bağlantı, `io` fonksiyonu ile kurulur ve `auth` seçeneği ile token gönderilir.

```javascript
import { io } from "socket.io-client";

// 1. Kullanıcının login sonrası aldığı ve sakladığı token'ı alın.
const authToken = localStorage.getItem('authToken'); // Örnek: Web için

// 2. Sunucu adresi ve token ile bağlantıyı başlatın.
const socket = io("http://SUNUCU_IP_ADRESINIZ:3000", { // Sunucu adresini buraya yazın
  auth: {
    token: authToken
  },
  transports: ['websocket', 'polling'] // Bağlantı stabilitesi için önerilir
});
```

## 3. Temel Bağlantı Olaylarını Yönetme

Bağlantının durumunu takip etmek, hataları ayıklamak ve kullanıcıya geri bildirim vermek için temel olayları dinlemek kritik öneme sahiptir.

```javascript
socket.on("connect", () => {
  console.log("✅ Sunucuya başarıyla bağlandı! Socket ID:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("❌ Sunucu bağlantısı kesildi:", reason);
  // Burada kullanıcıya bağlantının koptuğunu bildiren bir uyarı gösterebilirsiniz.
});

socket.on("connect_error", (error) => {
  console.error("🔌 Bağlantı hatası:", error.message);
  // Genellikle geçersiz token veya sunucuya ulaşılamama durumlarında tetiklenir.
  // Kullanıcıyı tekrar login ekranına yönlendirebilirsiniz.
});
```

## 4. Sohbet İşlevselliği

### Ad��m 4.1: Sohbet Odasına Katılma (En Önemli Adım)

Bir kullanıcı belirli bir sohbet ekranını açtığında, sunucuya o sohbete ait odaya katıldığını bildirmelidir. **Bu işlem, "mesajlar okundu" özelliğini otomatik olarak tetikler.**

```javascript
// Kullanıcı bir sohbeti görüntülediğinde bu fonksiyonu çağırın.
function joinChatRoom(conversationId) {
  if (socket) {
    socket.emit("join_conversation", { conversationId });
  }
}

// Örnek kullanım:
// Kullanıcı, ID'si 'conv-123' olan sohbete girdi.
joinChatRoom('conv-123');

// Sunucudan gelen onayı dinleyebilirsiniz (opsiyonel).
socket.on("conversation_joined", (data) => {
  console.log(`✅ ${data.conversationId} odasına başarıyla katıldınız.`);
});
```

**Bu adım neden önemli?**
- Client `join_conversation` olayını gönderdiğinde, sunucu bu kullanıcı için o sohbetteki tüm okunmamış mesajları veritabanında "okundu" olarak günceller.
- Ardından sunucu, odadaki diğer kullanıcıya (mesajları gönderene) `messages_read_by_user` olayını gönderir. Bu sayede karşı taraf "görüldü" bilgisini alır.

### Adım 4.2: Sohbet Odasından Ayrılma

Kullanıcı sohbet ekranından ayrıldığında veya uygulama kapandığında, sunucuyu bilgilendirmek iyi bir pratiktir.

```javascript
function leaveChatRoom(conversationId) {
  if (socket) {
    socket.emit("leave_conversation", { conversationId });
  }
}
```

### Adım 4.3: Mesaj Gönderme

Kullanıcı bir mesaj yazdığında ve "Gönder" butonuna bastığında, `send_chat_message` olayı ile mesaj sunucuya iletilir.

```javascript
function sendMessage(content, receiverId, conversationId) {
  if (socket && content.trim()) {
    const messageData = {
      receiverId: receiverId,
      conversationId: conversationId,
      content: content,
      messageType: 'TEXT' // veya 'IMAGE', 'FILE' vb.
    };
    socket.emit("send_chat_message", messageData);
  }
}
```

### Adım 4.4: Gelen Olayları Dinleme

Uygulamanızın anlık olarak güncellenmesi için sunucudan gelen olayları sürekli dinlemeniz gerekir.

```javascript
// Yeni bir mesaj geldiğinde tetiklenir.
socket.on("new_chat_message", (data) => {
  console.log("Yeni mesaj geldi:", data.message);
  // Arayüzdeki mesaj listesini bu yeni mesajla güncelleyin.
  // Örneğin: setMessages(prevMessages => [...prevMessages, data.message]);
});

// Gönderdiğiniz bir mesajın karşı tarafa başarıyla iletildiğini belirtir.
// (Mesajın yanında tek tik göstermek için kullanılabilir)
socket.on("message_delivered", (data) => {
    console.log(`Mesaj ${data.messageId} iletildi.`);
    // İlgili mesajın durumunu 'delivered' olarak güncelleyin.
});

// Karşı tarafın sohbeti açıp mesajlarınızı okuduğunu belirtir.
// (Mesajın yanında çift mavi tik göstermek için kullanılabilir)
socket.on("messages_read_by_user", (data) => {
  console.log(`Kullanıcı ${data.userId} mesajlarınızı okudu.`);
  // Bu sohbetteki gönderdiğiniz tüm mesajların durumunu 'read' olarak güncelleyin.
});

// Bir hata oluştuğunda sunucudan gelen hata mesajını dinleyin.
socket.on("chat_error", (error) => {
  console.error("Sohbet Hatası:", error.message);
  // Kullanıcıya bir uyarı gösterin.
});
```

## 5. React ile Örnek Kod Yapısı

Aşağıda, bu mantığın bir React (Hooks) bileşeninde nasıl kullanılabileceğine dair basitleştirilmiş bir örnek verilmiştir.

```jsx
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const ChatComponent = ({ conversationId, currentUser, otherUser }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    // Socket bağlantısını kur
    const authToken = localStorage.getItem('authToken');
    socketRef.current = io("http://SUNUCU_IP_ADRESINIZ:3000", {
      auth: { token: authToken }
    });

    const socket = socketRef.current;

    // Odaya katıl
    socket.emit('join_conversation', { conversationId });

    // Olay dinleyicilerini ayarla
    socket.on('new_chat_message', (data) => {
      if (data.message.conversationId === conversationId) {
        setMessages(prev => [...prev, data.message]);
      }
    });

    socket.on('messages_read_by_user', (data) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => 
          prev.map(msg => 
            msg.senderId === currentUser.id ? { ...msg, isRead: true } : msg
          )
        );
      }
    });

    // Bileşen kaldırıldığında temizlik yap
    return () => {
      socket.emit('leave_conversation', { conversationId });
      socket.disconnect();
    };
  }, [conversationId, currentUser.id]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (input.trim() && socketRef.current) {
      socketRef.current.emit('send_chat_message', {
        receiverId: otherUser.id,
        conversationId: conversationId,
        content: input,
      });
      setInput('');
    }
  };

  return (
    <div>
      <div className="message-area">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.senderId === currentUser.id ? 'sent' : 'received'}`}>
            <p>{msg.content}</p>
            {msg.senderId === currentUser.id && (
              <span className="status">{msg.isRead ? 'Görüldü' : 'İletildi'}</span>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage}>
        <input type="text" value={input} onChange={e => setInput(e.target.value)} />
        <button type="submit">Gönder</button>
      </form>
    </div>
  );
};
```
Bu rehber, sunucu ve istemci arasındaki anlık iletişimi kurmanız için sağlam bir temel oluşturur.
