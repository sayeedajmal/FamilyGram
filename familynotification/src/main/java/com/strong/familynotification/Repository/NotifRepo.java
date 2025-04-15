package com.strong.familynotification.Repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.strong.familynotification.Model.Notification;

public interface NotifRepo extends MongoRepository<Notification, String> {
    List<Notification> findByReceiverIdOrderByCreatedAtDesc(String receiverId);

    List<Notification> findByReceiverId(String receiverId, Pageable pageable);

    void deleteByReceiverId(String receiverId);

    int deleteByReadTrueAndCreatedAtBefore(Instant date);

    @Query("{ 'receiverId': ?0, 'read': false }")
    List<Notification> findUnreadNotifications(String receiverId);

    List<Notification> findByReceiverId(String receiverId);
}
