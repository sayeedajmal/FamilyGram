package com.strong.familypost.Model;

import java.util.HashSet;
import java.util.Set;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.mongodb.lang.NonNull;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a Comment entity in the system.
 * This class models user likes on posts in the application.
 * Likes are stored in the "likes" MongoDB collection.
 *
 * @author SayeedAjmal
 * @version 1.0
 * @since 2025
 */
@Data
@Document(collection = "likes")
@NoArgsConstructor
@AllArgsConstructor
public class Like {

    /** Unique identifier for the comment */
    @Id
    private String id;

    /** ID of the post this comment belongs to */
    @NonNull
    private String postId;


    /** Set of user IDs who have liked this post */
    private Set<String> likes = new HashSet<>();
}
