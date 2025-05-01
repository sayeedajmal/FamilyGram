package com.strong.familynotification.Controller;

import java.security.Principal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import com.strong.familynotification.Model.SignalingMessage;
import com.strong.familynotification.Service.WebSocketService;

@Controller
public class SignalController {

    @Autowired
    private WebSocketService webSocketService;

    @MessageMapping("/signal/{receiverId}")
    public void handleSignalingMessage(@DestinationVariable String receiverId,
            SignalingMessage message,
            Principal principal) {
        webSocketService.sendSignalingMessageToUser(receiverId, message);
    }
}
