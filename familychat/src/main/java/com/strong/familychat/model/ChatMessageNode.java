package com.strong.familychat.model;

import java.time.Instant;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document("chat_messages")
public class ChatMessageNode {
    @Id
    private String id;

    private String chatId; // e.g. "chat_user1_user2_1"

    private final Long createdAt = Instant.now().getEpochSecond();
    private List<Message> messages;
}
