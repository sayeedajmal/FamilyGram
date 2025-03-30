package com.strong.familynotification.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.strong.familynotification.Model.Notification;

@Service
public class WebSocketService {
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void sendNotificationToUser(String receiverId, Notification notification) {
        messagingTemplate.convertAndSendToUser(receiverId, "/queue/notifications", notification);
    } // messagingTemplate.convertAndSend("/topic/post-like", notification);
}