import React from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import NotificationSocket from "../api/NotificationSocket";

const SendNotification = () => {
  const notificationData = {
    LIKE: {
      type: "LIKE",
      message: "Liked your Post",
      senderUsername: "sayeed__ajmal",
      thumbnailId: "https://randomuser.me/api/portraits/men/2.jpg",
      receiverId: "67e0172f1819b9575155479b",
      postThumbId: "https://randomuser.me/api/portraits/women/2.jpg",
      postId: "1234",
    },
    POST: {
      type: "POST",
      message: "New Post Posted",
      senderUsername: "sayeed__ajmal",
      thumbnailId: "https://randomuser.me/api/portraits/men/2.jpg",
      receiverId: "67e0172f1819b9575155479b",
      postThumbId: "https://randomuser.me/api/portraits/men/2.jpg",
      postId: "5678",
    },
    FOLLOW: {
      type: "FOLLOW",
      message: "Started following you",
      senderUsername: "sayeed__ajmal",
      thumbnailId: "https://randomuser.me/api/portraits/men/2.jpg",
      receiverId: "67e0172f1819b9575155479b",
      postThumbId: null,
      postId: null,
    },
    FOLLOW_REQUEST: {
      type: "FOLLOW_REQUEST",
      message: "Requested to follow you",
      senderUsername: "sayeed__ajmal",
      thumbnailId: "https://randomuser.me/api/portraits/men/2.jpg",
      receiverId: "67e0172f1819b9575155479b",
      postThumbId: null,
      postId: null,
    },
  };

  // Method to handle sending notifications
  const handleSendNotification = async (type) => {
    const data = notificationData[type];

    if (!data) {
      Alert.alert("Error", "Invalid notification type");
      return;
    }

    try {
      console.log("📢 Sending notification: ", data);

      const response = await NotificationSocket.sendNotification(
        data.type,
        data.message,
        data.senderUsername,
        data.receiverId,
        data.thumbnailId,
        data.postId,
        data.postThumbId
      );

      console.log("✅ Notification Sent: ", response);
    } catch (error) {
      console.error("❌ Error sending notification:", error);
      Alert.alert("Error", "Failed to send notification");
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}>
        Send a Notification
      </Text>

      {/* LIKE Button */}
      <TouchableOpacity
        onPress={() => handleSendNotification("LIKE")}
        style={{
          backgroundColor: "#1E90FF",
          padding: 10,
          borderRadius: 8,
          marginBottom: 10,
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          Send LIKE Notification
        </Text>
      </TouchableOpacity>

      {/* POST Button */}
      <TouchableOpacity
        onPress={() => handleSendNotification("POST")}
        style={{
          backgroundColor: "#32CD32",
          padding: 10,
          borderRadius: 8,
          marginBottom: 10,
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          Send POST Notification
        </Text>
      </TouchableOpacity>

      {/* FOLLOW Button */}
      <TouchableOpacity
        onPress={() => handleSendNotification("FOLLOW")}
        style={{ backgroundColor: "#8A2BE2", padding: 10, borderRadius: 8 }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          Send FOLLOW Notification
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleSendNotification("FOLLOW_REQUES")}
        style={{ backgroundColor: "#8A2BE2", padding: 10, borderRadius: 8 }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          Send FOLLOW Notification
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SendNotification;
