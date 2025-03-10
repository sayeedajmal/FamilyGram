package com.strong.familypost.Model;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.mongodb.lang.NonNull;

import lombok.Data;

/**
 * Represents a social media post entity in the application.
 * This class maps to documents in the "posts" collection in the database.
 *
 * @author SayeedAjmal
 * @version 1.0
 * @since 2025
 */
@Document(collection = "posts")
@Data
public class Post {

    /** Unique identifier for the post */
    @Id
    private String postId;

    /** ID of the user who created the post */
    @NonNull
    private String userId;

    /** Type of the post (e.g., "photo", "video", etc.) */
    @NonNull
    private String type;

    /** List of URLs pointing to media content associated with the post */
    @NonNull
    private List<String> mediaUrls;

    /** Set of user IDs who have liked this post */
    private Set<String> likes = new HashSet<>();

    /** Timestamp when the post was created */
    @NonNull
    private LocalDateTime createdAt = LocalDateTime.now();
}
