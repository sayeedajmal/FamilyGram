package com.strong.familynotification.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.strong.familynotification.Model.Notification;
import com.strong.familynotification.Model.SignalingMessage;

@Service
public class WebSocketService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Sends notification messages to the user's WebSocket queue
    public void sendNotificationToUser(String receiverId, Notification notification) {
        messagingTemplate.convertAndSendToUser(receiverId, "/queue/notifications", notification);
    }

    // Send a signaling message (offer, answer, ice-candidate) to a specific user
    public void sendSignalingMessageToUser(String receiverId, SignalingMessage message) {
        messagingTemplate.convertAndSendToUser(receiverId, "/queue/signaling", message);
    }
}
