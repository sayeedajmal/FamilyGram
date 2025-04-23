package com.strong.familychat.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.strong.familychat.model.ChatMessageNode;

@Repository
public interface ChatNodeRepo extends MongoRepository<ChatMessageNode, String> {

}
