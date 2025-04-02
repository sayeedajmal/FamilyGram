package com.strong.familynotification.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

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

        // 1️⃣ Save notifications in MongoDB
        List<Notification> savedNotifications = notifRepo.saveAll(notifications);

        for (Notification notif : savedNotifications) {
            kafkaProdService.sendNotificationEvent(notif); // Publish Kafka event

            // 2️⃣ Push new notification to Redis (store it at the top of the list)
            String redisKey = "notifications:" + notif.getReceiverId();
            redisTemplate.opsForList().leftPush(redisKey, notif);

            // 3️⃣ Reset expiration time to keep it cached for 24 hours
            redisTemplate.expire(redisKey, 24, TimeUnit.HOURS);
        }

        return savedNotifications;
    }

    // Get notifications for a user with pagination
    @SuppressWarnings("unchecked")
    public List<Notification> getUserNotifications(String userId) {
        String redisKey = "notifications:" + userId;

        // 1️⃣ Check Redis first
        List<Object> cachedNotifs = redisTemplate.opsForList().range(redisKey, 0, -1);
        if (cachedNotifs != null && !cachedNotifs.isEmpty()) {
            return (List<Notification>) (List<?>) cachedNotifs; // Return from Redis if available
        }

        // 2️⃣ If Redis is empty, fetch from MongoDB
        List<Notification> unreadNotif = notifRepo.findUnreadNotifications(userId);

        // 3️⃣ Store in Redis for future use (cache for 24 hours)
        if (!unreadNotif.isEmpty()) {
            redisTemplate.opsForList().rightPushAll(redisKey, unreadNotif);
            redisTemplate.expire(redisKey, 24, TimeUnit.HOURS);
        }

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