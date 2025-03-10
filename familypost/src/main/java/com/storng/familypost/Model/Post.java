package com.storng.familypost.Model;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.mongodb.lang.NonNull;

import lombok.Data;

@Document(collection = "posts")
@Data
public class Post {

    @Id
    @NonNull
    private String id;

    @NonNull
    private String userId;

    @NonNull
    private String type;

    @NonNull
    private List<String> mediaUrls;

    private Set<String> likes = new HashSet<>();

    private List<Comment> comments;

    @NonNull
    private LocalDateTime createdAt;

}