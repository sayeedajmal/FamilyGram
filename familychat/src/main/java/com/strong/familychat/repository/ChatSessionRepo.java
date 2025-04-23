package com.strong.familychat.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.strong.familychat.model.ChatSession;

@Repository
public interface ChatSessionRepo extends MongoRepository<ChatSession, String> {

}
