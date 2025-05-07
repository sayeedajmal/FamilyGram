package com.strong.familychat.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.strong.familychat.model.ChatMessageNode;
import com.strong.familychat.model.ChatSession;
import com.strong.familychat.model.Message;
import com.strong.familychat.repository.ChatNodeRepo;
import com.strong.familychat.repository.ChatSessionRepo;
import com.strong.familychat.repository.TextChatRepo;

@Service
public class TextChatService {

    @Autowired
    private TextChatRepo TextChatRepo;

    @Autowired
    private ChatNodeRepo chatNodeRepo;

    @Autowired
    private ChatSessionRepo chatSessionRepo;

    private static final int MAX_MESSAGES_PER_NODE = 100;

    public void storeMessage(Message message, List<String> userIds) {
        // Step 1: Sort userIds to keep consistent key (chat_user1_user2)
        String sessionId = "chat_" + userIds.get(0) + "_" + userIds.get(1);

        // Step 2: Find or create ChatSession
        ChatSession session = chatSessionRepo.findById(sessionId).orElseGet(() -> {
            ChatSession newSession = new ChatSession();
            newSession.setId(sessionId);
            newSession.setParticipants(userIds);
            newSession.setNodes(new ArrayList<>());

            // Create initial chat node
            String initialNodeId = sessionId + "_1";
            newSession.getNodes().add(initialNodeId);
            newSession.setLastMessage(message.getText());
            newSession.setLastMessageTime(Instant.now().getEpochSecond());
            chatSessionRepo.save(newSession);

            ChatMessageNode initialNode = new ChatMessageNode();
            initialNode.setId(initialNodeId);
            initialNode.setChatId(initialNodeId);
            initialNode.setMessages(new ArrayList<>(List.of(message)));
            chatNodeRepo.save(initialNode);

            return newSession;
        });

        // Step 3: Get latest node
        String latestNodeId = session.getNodes().get(session.getNodes().size() - 1);
        ChatMessageNode latestNode = chatNodeRepo.findById(latestNodeId).orElse(null);

        if (latestNode == null)
            return; // should never happen ideally

        if (latestNode.getMessages().size() >= MAX_MESSAGES_PER_NODE) {
            // Step 4: Create a new node
            String newNodeId = sessionId + "_" + (session.getNodes().size() + 1);
            ChatMessageNode newNode = new ChatMessageNode();
            newNode.setId(newNodeId);
            newNode.setChatId(newNodeId);
            newNode.setMessages(new ArrayList<>(List.of(message)));

            chatNodeRepo.save(newNode);
            session.getNodes().add(newNodeId);
        } else {
            // Add to current node
            latestNode.getMessages().add(message);
            chatNodeRepo.save(latestNode);
        }

        // Step 5: Update last message in session
        session.setLastMessage(message.getText());
        session.setLastMessageTime(Instant.now().getEpochSecond());
        chatSessionRepo.save(session);
    }
}