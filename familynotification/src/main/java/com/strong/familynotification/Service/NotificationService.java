package com.strong.familynotification.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JacksonException;
import com.strong.familynotification.Model.Notification;
import com.strong.familynotification.Repository.NotifRepo;
import com.strong.familynotification.Util.NotifException;

@Service
public class NotificationService {

    @Autowired
    private NotifRepo notifRepo;
    @Autowired
    private KafkaProdService kafkaProdService;
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Scheduled(cron = "0 0 3 * * ?")
    public void cleanupReadNotifications() {
        Instant oneWeekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        notifRepo.deleteByReadTrueAndCreatedAtBefore(oneWeekAgo);
    }

    // Save multiple notifications and publish events for each
    public List<Notification> saveAllNotifications(List<Notification> notifications)
            throws NotifException, JacksonException {
        List<Notification> savedNotifications = notifRepo.saveAll(notifications);

        // Publish events for each notification
        for (Notification notif : savedNotifications) {
            kafkaProdService.sendNotificationEvent(notif);
        }

        return savedNotifications;
    }

    @SuppressWarnings("unchecked")
    public List<Notification> fetchNotificationsFromKafka(String userId) {
        String redisKey = "notifications:" + userId;
        List<Object> notifications = redisTemplate.opsForList().range(redisKey, 0, -1);
        return notifications != null ? (List<Notification>) (List<?>) notifications : new ArrayList<>();
    }

    // Get notifications for a user with pagination
    public List<Notification> getUserNotifications(String userId) {
        // Fetch from Redis first
        // List<Notification> recentNotifs = fetchNotificationsFromKafka(userId);

        // Fetch unread notifications from MongoDB if needed
        List<Notification> unreadNotif = notifRepo.findUnreadNotifications(userId);

        // return Stream.concat(recentNotifs.stream(), unreadNotifs.stream()).toList();
        return unreadNotif;
    }

    // Mark a notification as read
    public Notification markAsRead(String notifId) throws NotifException {
        return notifRepo.findById(notifId)
                .map(notif -> {
                    notif.setRead(true);
                    notifRepo.delete(notif);
                    return notifRepo.save(notif);
                })
                .orElseThrow(() -> new NotifException("Notification not found: " + notifId));
    }

    // Delete a single notification (handles not found case)
    public void deleteNotification(String notifId) throws NotifException {
        Optional<Notification> notif = notifRepo.findById(notifId);
        if (notif.isPresent()) {
            notifRepo.deleteById(notifId);
        } else {
            throw new NotifException("Notification not found: " + notifId);
        }
    }

    // Delete all notifications for a user
    public void deleteAllForUser(String userId) {
        notifRepo.deleteByReceiverId(userId);
    }
}