package com.strong.familychat.model;

import java.time.Instant;
import java.util.List;

import org.springframework.context.annotation.Primary;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.annotation.Nonnull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Document("chat_sessions")
@NoArgsConstructor
@AllArgsConstructor
public class ChatSession {
    @Id
    private String id;

    private List<String> participants; // e.g. ["userid1","userid2"]

    private List<String> nodes; // e.g. ["chat_userid1_userid2_1", "chat_userid1_userid2_2"]

    private final Long createdAt = Instant.now().getEpochSecond();

    @Nonnull
    private String lastMessage;

    private Long lastMessageTime = Instant.now().getEpochSecond();;
}
