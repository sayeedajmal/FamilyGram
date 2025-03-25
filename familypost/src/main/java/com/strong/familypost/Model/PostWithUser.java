package com.strong.familypost.Model;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.data.annotation.Id;

import com.mongodb.lang.NonNull;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Data
@AllArgsConstructor
public class PostWithUser {

    // User details
    private String username;
    private String name;
    private String thumbnailId;

    /** Unique identifier for the post */
    @Id
    private String id;

    /** ID of the user who created the post */
    @NonNull
    private String userId;

    private String caption;

    /** List of media IDs (original files) */
    @NonNull
    private List<String> mediaIds;

    /** Location with the post */
    private String location;

    /** Set of user IDs who have liked this post */
    private Set<String> likes = new HashSet<>();

    /** Timestamp when the post was created */
    @NonNull
    private LocalDateTime createdAt = LocalDateTime.now();

}
