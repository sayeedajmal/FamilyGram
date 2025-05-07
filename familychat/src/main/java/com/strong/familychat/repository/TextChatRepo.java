package com.strong.familychat.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.strong.familychat.model.ChatMessageNode;

public interface TextChatRepo extends MongoRepository<ChatMessageNode, String> {

}
