package com.storng.familypost.Model;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Data;

@Data
public class Comment {

    private String id = UUID.randomUUID().toString();

    private String userId;

    private String text;

    private LocalDateTime createdAt = LocalDateTime.now();
}
