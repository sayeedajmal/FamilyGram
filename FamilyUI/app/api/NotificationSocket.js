import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { Alert } from "react-native";
import * as Notifications from "expo-notifications";

class NotificationSocket {
    constructor(userId, onNotificationReceived, onFetchNotifications) {
        this.userId = userId;
        this.onNotificationReceived = onNotificationReceived;
        this.onFetchNotifications = onFetchNotifications;
        this.client = null;
        this.connected = false;
        this.serverUrl = "http://192.168.31.218:8085";
    }
    async triggerSystemNotification(notification) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "🔔 New Notification",
                body: notification.message || "You have a new notification!",
                sound: true,  // ✅ Uses default system sound
                priority: "high",
            },
            trigger: null,  // Show immediately
        });
    }
    // Connect to WebSocket
    connect() {
        if (!this.userId) return;

        const socket = new SockJS(`${this.serverUrl}/ws-notifications`);
        this.client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
        });

        this.client.onConnect = () => {
            this.connected = true;
            this.client.subscribe(`/user/${this.userId}/queue/notifications`, (message) => {
                const notification = JSON.parse(message.body);

                // 🔔 Show notification & play default sound
                this.triggerSystemNotification(notification);
                if (this.onNotificationReceived) {
                    this.onNotificationReceived(notification);
                }
            });
        };

        this.client.activate();
    }

    // Fetch existing notifications from GraphQL API
    async fetchNotifications(userId) {
        try {
            const response = await fetch(`${this.serverUrl}/graphql`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: `
            query {
              getUserNotifications(receiverId: "${userId}") {
                id
                type
                message
                senderUsername
                postThumbId
                thumbnailId
                postId
                read
                createdAt
              }
            }
          `,
                }),
            });

            const result = await response.json();
            if (this.onFetchNotifications) {
                this.onFetchNotifications(result.data.getUserNotifications);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    }
    // Mark a notification as read
    async markAsRead(notifId) {
        try {
            const response = await fetch(`${this.serverUrl}/graphql`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: `mutation { markNotificationAsRead(notifId: "${notifId}") { id read } }`,
                }),
            });

            const result = await response.json();
            return result.data?.markNotificationAsRead ? true : false;
        } catch (error) {
            console.error("Error marking notification as read:", error);
            return false;
        }
    }

    async sendNotificationsBulk(type, message, senderUsername, receivers, thumbnailId, postId, postThumbId) {
        try {
            if (!type || !message || !senderUsername || !receivers?.length) {
                console.error("Missing required fields");
                return;
            }

            const defaultThumbnailId = "22343243243223";
            thumbnailId = thumbnailId || defaultThumbnailId;

            if (type === "LIKE" && !postThumbId) {
                console.error("LIKE notifications require postThumbId");
                return;
            }

            if (type === "POST" && !postId) {
                console.error("POST notifications require postId");
                return;
            }

            // Create Notification Inputs for each receiver
            const notifications = receivers.map(receiverId => ({
                type,
                message,
                senderUsername,
                receiverId,
                thumbnailId,
                postId,
                postThumbId,
            }));

            // GraphQL Bulk Mutation Query
            const query = `
                mutation CreateNotifications($dtos: [NotificationInput!]!) {
                    createNotifications(dtos: $dtos) {
                        id
                    }
                }
            `;

            // Make API Call
            const response = await fetch(`${this.serverUrl}/graphql`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query, variables: { dtos: notifications } }),
            });

            const result = await response.json();

            if (result.errors) {
                console.error("GraphQL error:", result.errors);
                Alert.alert("Error", "Failed to send notifications.");
            } else {
                console.log("Notifications Sent:", result.data.createNotifications);
            }
        } catch (error) {
            console.error("Error sending notifications:", error);
            Alert.alert("Error", "Something went wrong.");
        }
    }


    async sendNotification(type, message, senderUsername, receiverId, thumbnailId, postId, postThumbId) {
        try {
            if (!type || !message || !senderUsername || !receiverId || !thumbnailId) {
                console.error("Missing required fields");
                return;
            }

            if (type === "LIKE" && !postThumbId) {
                console.error("LIKE notifications require postThumbId");
                return;
            }

            if (type === "POST" && !postId) {
                console.error("POST notifications require postId");
                return;
            }

            // Construct GraphQL query
            const query = `
            mutation CreateNotification($dto: NotificationInput!) {
              createNotification(dto: $dto) {
                id
              }
            }
          `;

            const variables = {
                dto: {
                    type,
                    message,
                    senderUsername,
                    receiverId,
                    thumbnailId,
                    postId,
                    postThumbId,
                },
            };

            // Make the request
            const response = await fetch(`${this.serverUrl}/graphql`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query, variables }),
            });

            const result = await response.json();
            if (result.errors) {
                console.error("GraphQL error:", result.errors);
                Alert.alert("Error", "Failed to send notification.");
            } else {
                console.log("Notification Sent:", result.data.createNotification);
            }
        } catch (error) {
            console.error("Error sending notification:", error);
            Alert.alert("Error", "Something went wrong.");
        }
    };
    // Disconnect WebSocket
    disconnect() {
        if (this.client) {
            this.client.deactivate();
            this.connected = false;
        }
    }
}

export default new NotificationSocket();
