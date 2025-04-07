package com.strong.familynotification.Model;

public record NotificationInput(
                String type,
                String message,
                String postThumbId,
                String thumbnailId,
                String senderUsername,
                String receiverId,
                String senderId,
                String postId) {
}
