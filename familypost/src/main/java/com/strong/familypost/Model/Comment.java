package com.strong.familypost.Model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.mongodb.lang.NonNull;

import lombok.Data;

/**
 * Represents a Comment entity in the system.
 * This class models user comments on posts in the application.
 * Comments are stored in the "comments" MongoDB collection.
 *
 * @author SayeedAjmal
 * @version 1.0
 * @since 2025
 */
@Data
@Document(collection = "comments")
public class Comment {

    /** Unique identifier for the comment */
    @Id
    private String cmId;

    /** ID of the post this comment belongs to */
    @NonNull
    private String postId;

    /** ID of the user who created this comment */
    @NonNull
    private String userId;

    /** The actual content/text of the comment */
    @NonNull
    private String text;

    /** Timestamp when the comment was created */
    @NonNull
    private LocalDateTime createdAt = LocalDateTime.now();
}
