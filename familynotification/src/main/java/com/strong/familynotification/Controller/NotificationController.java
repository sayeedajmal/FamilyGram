package com.strong.familynotification.Controller;

import java.time.Instant;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import com.fasterxml.jackson.core.JacksonException;
import com.strong.familynotification.Model.Notification;
import com.strong.familynotification.Model.NotificationInput;
import com.strong.familynotification.Service.NotificationService;
import com.strong.familynotification.Util.NotifException;

@Controller
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @QueryMapping
    public List<Notification> getUserNotifications(@Argument("receiverId") String receiverId) throws NotifException {
        return notificationService.getUserNotifications(receiverId);
    }

    @MutationMapping
    public List<Notification> createNotifications(@Argument("dtos") List<NotificationInput> inputs)
            throws NotifException, JacksonException {

        if (inputs == null || inputs.isEmpty()) {
            throw new NotifException("Notification input list cannot be null or empty.");
        }

        List<Notification> notifications = inputs.stream().map(input -> {
            Notification notification = new Notification();
            notification.setType(input.type());
            notification.setMessage(input.message());
            notification.setSenderUsername(input.senderUsername());
            notification.setThumbnailId(input.thumbnailId());
            notification.setPostThumbId(input.postThumbId());
            notification.setReceiverId(input.receiverId());
            notification.setPostId(input.postId());
            notification.setCreatedAt(Instant.now());
            return notification;
        }).toList();

        // Save all notifications at once
        return notificationService.saveAllNotifications(notifications);
    }

    @MutationMapping
    public Notification markNotificationAsRead(@Argument String notifId) throws NotifException {
        return notificationService.markAsRead(notifId);
    }

    @MutationMapping
    public Boolean deleteNotification(@Argument String notifId) throws NotifException {
        notificationService.deleteNotification(notifId);
        return true;
    }
}
