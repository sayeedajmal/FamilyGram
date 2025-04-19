package com.strong.familynotification.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JacksonException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    @Autowired
    private ObjectMapper objectMapper; // Ensure JSON serialization

    private static final long CACHE_EXPIRATION = 24; // Hours

    @Scheduled(fixedRate = 30000)
    public void cleanupReadNotifications() {
        Instant oneWeekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        notifRepo.deleteByReadTrueAndCreatedAtBefore(oneWeekAgo);
    }

    // Save multiple notifications and publish events for each
    public List<Notification> saveAllNotifications(List<Notification> notifications)
            throws NotifException, JacksonException {

        List<Notification> savedNotifications = notifRepo.saveAll(notifications);

        for (Notification notif : savedNotifications) {
            kafkaProdService.sendNotificationEvent(notif); // Publish Kafka event

            String redisKey = "notifications:" + notif.getReceiverId();
            String jsonNotif = objectMapper.writeValueAsString(notif); // Serialize before saving
            redisTemplate.opsForList().leftPush(redisKey, jsonNotif);

            redisTemplate.expire(redisKey, CACHE_EXPIRATION, TimeUnit.HOURS);
        }

        return savedNotifications;
    }

    // Get notifications for a user with pagination
    public List<Notification> getUserNotifications(String userId) {
        String redisKey = "notifications:" + userId;

        // 1. Try to fetch all notifications from Redis (up to 10)
        List<Object> cachedNotifs = redisTemplate.opsForList().range(redisKey, 0, 9); // Get up to 10 notifications
        List<Notification> notifications;

        if (cachedNotifs != null && !cachedNotifs.isEmpty()) {
            List<Notification> parsedNotifications = cachedNotifs.stream()
                    .map(obj -> {
                        try {
                            return objectMapper.readValue(obj.toString(), Notification.class);
                        } catch (JsonProcessingException e) {
                            return null;
                        }
                    })
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            notifications = new ArrayList<>(parsedNotifications);
        } else {
            notifications = new ArrayList<>();
        }

        // 2. Separate read and unread notifications
        List<Notification> unreadNotifs = notifications.stream()
                .filter(notif -> !notif.isRead()) // unread notifications
                .collect(Collectors.toList());
        List<Notification> readNotifs = notifications.stream()
                .filter(notif -> notif.isRead()) // read notifications
                .collect(Collectors.toList());

        // 3. If Redis didn't have enough notifications, fetch them from DB
        if (notifications.size() < 10) {
            List<Notification> dbNotifs = notifRepo.findByReceiverId(userId);
            unreadNotifs.addAll(dbNotifs.stream()
                    .filter(notif -> !notif.isRead())
                    .collect(Collectors.toList()));
            readNotifs.addAll(dbNotifs.stream()
                    .filter(notif -> notif.isRead())
                    .collect(Collectors.toList()));
        }

        // 5. Calculate how many read notifications to show (20% of total, capped at 2)
        int readToShow = Math.min((int) (0.2 * 10), readNotifs.size()); // 20% of 10 is 2, so we cap it to 2

        // 6. Combine unread and read notifications (unread first, then read)
        List<Notification> finalNotifications = new ArrayList<>();
        finalNotifications.addAll(unreadNotifs); // Add all unread notifications
        finalNotifications.addAll(readNotifs.subList(0, readToShow)); // Add 20% of read notifications

        // 7. If the total is more than 10, trim to 10
        if (finalNotifications.size() > 10) {
            finalNotifications = finalNotifications.subList(0, 10);
        }

        // 8. Cache only new unread notifications back to Redis if needed
        // Only add new unread notifications to Redis
        List<String> jsonUnreadNotifs = unreadNotifs.stream()
                .filter(notif -> !notifications.contains(notif)) // Avoid duplicating already cached notifications
                .map(notif -> {
                    try {
                        return objectMapper.writeValueAsString(notif);
                    } catch (JsonProcessingException e) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (!jsonUnreadNotifs.isEmpty()) {
            redisTemplate.opsForList().leftPushAll(redisKey, jsonUnreadNotifs);
            redisTemplate.expire(redisKey, CACHE_EXPIRATION, TimeUnit.HOURS);
        }

        return finalNotifications;
    }

    // Mark notifications as read and update Redis
    public List<Notification> markAsRead(List<String> notifIds) throws NotifException {
        List<Notification> notifications = notifRepo.findAllById(notifIds);

        if (notifications.isEmpty()) {
            throw new NotifException("No notifications found for the provided IDs.");
        }

        notifications.forEach(notif -> notif.setRead(true));
        List<Notification> updatedNotifs = notifRepo.saveAll(notifications);

        // Update Redis cache
        String userId = notifications.get(0).getReceiverId();
        String redisKey = "notifications:" + userId;

        List<Object> cachedNotifs = redisTemplate.opsForList().range(redisKey, 0, -1);
        if (cachedNotifs != null && !cachedNotifs.isEmpty()) {
            List<String> updatedCache = cachedNotifs.stream()
                    .map(obj -> {
                        try {
                            Notification n = objectMapper.readValue(obj.toString(), Notification.class);
                            if (notifIds.contains(n.getId())) {
                                n.setRead(true);
                            }
                            return objectMapper.writeValueAsString(n);
                        } catch (JsonProcessingException e) {
                            return null;
                        }
                    })
                    .filter(json -> json != null)
                    .collect(Collectors.toList());

            redisTemplate.delete(redisKey);
            redisTemplate.opsForList().leftPushAll(redisKey, updatedCache);
            redisTemplate.expire(redisKey, CACHE_EXPIRATION, TimeUnit.HOURS);
        }

        return updatedNotifs;
    }

    // Delete a notification and remove from Redis
    public void deleteNotification(String notifId) throws NotifException {
        Optional<Notification> notif = notifRepo.findById(notifId);
        if (notif.isPresent()) {
            notifRepo.deleteById(notifId);

            // Remove from Redis
            String redisKey = "notifications:" + notif.get().getReceiverId();
            List<Object> cachedNotifs = redisTemplate.opsForList().range(redisKey, 0, -1);
            if (cachedNotifs != null && !cachedNotifs.isEmpty()) {
                List<String> updatedCache = cachedNotifs.stream()
                        .map(obj -> {
                            try {
                                Notification n = objectMapper.readValue(obj.toString(), Notification.class);
                                return !n.getId().equals(notifId) ? objectMapper.writeValueAsString(n) : null;
                            } catch (JsonProcessingException e) {
                                return null;
                            }
                        })
                        .filter(json -> json != null)
                        .collect(Collectors.toList());

                redisTemplate.delete(redisKey);
                redisTemplate.opsForList().leftPushAll(redisKey, updatedCache);
                redisTemplate.expire(redisKey, CACHE_EXPIRATION, TimeUnit.HOURS);
            }
        } else {
            throw new NotifException("Notification not found: " + notifId);
        }
    }

    // Delete all notifications for a user and clear Redis cache
    public void deleteAllForUser(String userId) {
        notifRepo.deleteByReceiverId(userId);
        redisTemplate.delete("notifications:" + userId);
    }
}
