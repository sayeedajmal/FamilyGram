package com.strong.familypost.Util;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import jakarta.annotation.PostConstruct;

@Service
public class KafkaProducer {
    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    public void init() {
        objectMapper.registerModule(new JavaTimeModule());
    }

    public void sendToKafka(Object payload, String type) throws PostException {
        String topic = switch (type) {
            case "POST_LIKE" -> "post_like";
            case "POST_COMMENT" -> "post-comment";
            default -> throw new RuntimeException("Unknown type");
        };
        try {
            kafkaTemplate.send(topic, objectMapper.writeValueAsString(payload));
        } catch (JsonProcessingException e) {
            throw new PostException(e.getLocalizedMessage());
        }
    }

}
