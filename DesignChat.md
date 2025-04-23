# CHATSESSIONS

```json
{
  "_id": "2i749rwoiufkjflkasdhjrewlfjadsf",
  "participants": ["user1", "user2"],
  "nodes": ["chat_user1_user2_1", "chat_user1_user2_2", "chat_user1_user2_3"],
  "createdAt": "2025-04-22T14:35:10.000Z",
  "lastMessage": "All good! You?",
  "lastMessageTime": "2025-04-22T14:35:10.000Z"
}
```

# CHATMESSAGES

- Each **chat session node** (`chat_user1_user2_1`, `chat_user1_user2_2`, etc.) is its **own document**.
- Each document has a `chatId`, metadata, and a **messages array** that could contain up to ~16MB worth of messages (like 10,000 messages max).
- You want these **stored in separate arrays (or documents)** — **NOT combined** into a single array like before.

So it should look like this:

---

### (Each node as a separate array/document):

#### 🗂️ Document 1 (Node 1 of user1 ↔ user2)

```json
[
  {
    "chatId": "chat_user1_user2_1",
    "createdAt": 1713799999,
    "messages": [
      {
        "_id": "msg1",
        "senderId": "user1",
        "text": "Hey user2, how’s it going?",
        "timestamp": 1713800000,
        "type":"text" //image, video
        "seen":true,
      },
      {
        "_id": "msg2",
        "senderId": "user2",
        "text": "All good! You?",
        "timestamp": 1713800100,
        "type":"text" //image, video
        "seen":true,
      }
    ]
  }
]
```

#### 🗂️ Document 2 (Node 2 of user1 ↔ user2)

```json
[
  {
    "chatId": "chat_user1_user2_2",
    "createdAt": 1713800150,
    "messages": [
      {
        "_id": "msg3",
        "senderId": "user1",
        "text": "Anything new on your end?",
        "timestamp": 1713800200,
        "type":"text" //image, video
        "seen":true,
      },
      {
        "_id": "msg4",
        "senderId": "user2",
        "text": "Not much, just work.",
        "timestamp": 1713800300,
        "type":"text" //image, video
        "seen":true,
      }
    ]
  }
]
```

#### 🗂️ Document 3 (Node 1 of user2 ↔ user3)

```json
[
  {
    "chatId": "chat_user2_user3_1",
    "createdAt": 1713800400,
    "messages": [
      {
        "_id": "msg5",
        "senderId": "user2",
        "text": "Hey user3!",
        "timestamp": 1713800450,
        "type":"text" //image, video
        "seen":true,
      },
      {
        "_id": "msg6",
        "senderId": "user3",
        "text": "What’s up?",
        "timestamp": 1713800500,
        "type":"text" //image, video
        "seen":true,
      }
    ]
  }
]
```
