package com.strong.familychat.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;

import lombok.Data;

@Data
public class Message {
    @Id
    private String id;
    private String senderId;
    private String text;
    private final Long timestamp = Instant.now().getEpochSecond();
    private String type; // "text", "image", "video", etc.
    private boolean seen;

}
