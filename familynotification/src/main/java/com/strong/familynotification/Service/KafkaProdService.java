package com.strong.familynotification.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JacksonException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.strong.familynotification.Model.Notification;
import com.strong.familynotification.Util.NotifException;

import jakarta.annotation.PostConstruct;

@Service
public class KafkaProdService {
    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    @Autowired
    private WebSocketService webSocketService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    public void init() {
        objectMapper.registerModule(new JavaTimeModule());
    }

    public void sendNotificationEvent(Notification notif) throws JacksonException, NotifException {
        String messageJson = objectMapper.writeValueAsString(notif);

        String topic;
        switch (notif.getType()) {
            case "COMMENT":
                topic = "post-comment";
                break;
            case "LIKE":
                topic = "post-like";
                break;
            case "POST":
                topic = "post-created";
                break;
            case "FOLLOW":
                topic = "user-follow";
                break;
            case "FOLLOW_REQUEST":
                topic = "user-follow-request";
                break;
            default:
                throw new NotifException("Unknown notification type: " + notif.getType());
        }

        kafkaTemplate.send(topic, messageJson);

        // ✅ Store in Redis (optional, if needed for quick access)
        // String redisKey = "notifications:" + notif.getReceiverId();
        // redisTemplate.expire(redisKey, Duration.ofDays(7));
        // redisTemplate.opsForList().leftPush(redisKey, notif);
        // redisTemplate.opsForList().trim(redisKey, 0, 49); // Keep only last 50

        // ✅ Send real-time notification via WebSocket
        webSocketService.sendNotificationToUser(notif.getReceiverId(), notif);
    }

}
