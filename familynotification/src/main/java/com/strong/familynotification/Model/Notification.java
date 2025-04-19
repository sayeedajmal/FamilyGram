package com.strong.familynotification.Model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Data;

@Data
@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;

    private String type; // LIKE, COMMENT, FOLLOW
    private String message; // Custom message (only for likes/comments)

    private String senderUsername; // The user who performed the action
    private String receiverId;
    private String senderId;
    private String postId; // If related to a post, otherwise null
    private String postThumbId; // The thumbnail of the post (if applicable)

    private String thumbnailId; // Always needed (profile picture of action user)

    private boolean read = false;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private Instant createdAt;
}
