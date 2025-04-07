package com.strong.familynotification.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class AuthConsumer {

    @Autowired
    private StorageService storageService;

    @KafkaListener(topics = { "user-create", "user-update" }, groupId = "user-group")
    public void consumeUserEvents(String message) {
        storageService.addToBuffer(message);
    }
}
