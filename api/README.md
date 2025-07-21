sequenceDiagram
    participant U1 as User1
    participant S as Socket Server
    participant DB as Database
    participant U2 as User2

    U1->>S: send_chat_message
    S->>DB: Mesajı kaydet
    DB-->>S: Kayıt onayı
    S->>U2: new_chat_message
    U2->>S: mark_messages_read
    S->>U1: messages_read_by_user




    sequenceDiagram
    participant U1 as User1
    participant S as Socket Server
    participant DB as Database
    participant U2 as User2

    U2->>S: mark_messages_read
    S->>DB: Mesajları okundu işaretle
    DB-->>S: Güncelleme onayı
    S->>U1: messages_read_by_user (unreadCount: 0)
    S->>U2: unread_count_updated (unreadCount: 0)
    S->>U1: unread_count_updated (unreadCount: 0)

    