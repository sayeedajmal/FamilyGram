package com.strong.familynotification.Service;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.strong.familynotification.Model.Notification;
import com.strong.familynotification.Util.NotifException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class KafkaConsumerService {
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    // ✅ Consume "LIKE" Notification
    @KafkaListener(topics = "post-like", groupId = "notification-group")
    public void consumeLikeEvent(String messageJson, Acknowledgment ack)
            throws JsonMappingException, JsonProcessingException, NotifException {
        processNotification(messageJson);
        ack.acknowledge();
    }

    // ✅ Consume "COMMENT" Notification
    @KafkaListener(topics = "post-comment", groupId = "notification-group")
    public void consumeCommentEvent(String messageJson, Acknowledgment ack)
            throws JsonMappingException, JsonProcessingException, NotifException {
        processNotification(messageJson);
        ack.acknowledge();
    }

    // ✅ Consume "POST" Notification
    @KafkaListener(topics = "post-created", groupId = "notification-group")
    public void consumePostEvent(String messageJson, Acknowledgment ack)
            throws JsonMappingException, JsonProcessingException, NotifException {
        processNotification(messageJson);
        ack.acknowledge();
    }

    // ✅ Consume "FOLLOW" Notification
    @KafkaListener(topics = "user-follow", groupId = "notification-group")
    public void consumeFollowEvent(String messageJson, Acknowledgment ack)
            throws JsonMappingException, JsonProcessingException, NotifException {
        processNotification(messageJson);
        ack.acknowledge();
    }

    // ✅ Consume "FOLLOW-REQUEST" Notification
    @KafkaListener(topics = "user-follow-request", groupId = "notification-group")
    public void consumeFollowRequestEvent(String messageJson, Acknowledgment ack)
            throws JsonMappingException, JsonProcessingException, NotifException {
        processNotification(messageJson);
        ack.acknowledge();
    }

    // ✅ Common Method to Process & Send Notification
    private void processNotification(String messageJson) throws JsonProcessingException, NotifException {
        Notification notif = objectMapper.readValue(messageJson, Notification.class);
        messagingTemplate.convertAndSendToUser(notif.getReceiverId(), "/queue/notifications", notif);
    }
}
