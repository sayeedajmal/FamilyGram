import { Ionicons } from "@expo/vector-icons";
import moment from "moment";
import React, { useCallback, useEffect, useReducer, useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import loginSignup from "../api/loginSignup";
import NotificationSocket from "../api/NotificationSocket";
import postHandle from "../api/postHandle";
import { Colors } from "../constants/Colors";

const notificationReducer = (state, action) => {
  switch (action.type) {
    case "SET_NOTIFICATIONS":
      return action.payload;
    case "ADD_NOTIFICATION":
      return state.some((n) => n.id === action.payload.id)
        ? state
        : [action.payload, ...state];
    case "MARK_AS_READ":
      return state.map((notif) =>
        notif.id === action.payload ? { ...notif, read: true } : notif
      );
    case "REMOVE_NOTIFICATION":
      return state.filter((notif) => notif.id !== action.payload);
    default:
      return state;
  }
};

const AppNotification = () => {
  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.light;
  const bg = themeColors.background;
  const textColor = themeColors.text;
  const tint = themeColors.tint;

  const [notifications, dispatch] = useReducer(notificationReducer, []);
  const [refreshing, setRefreshing] = useState(false);
  const [myProfile, setMyProfile] = useState(null);
  const [isProcessingId, setIsProcessingId] = useState(null);

  const formatTime = (createdAt) => {
    const postDate = moment.utc(createdAt).local();
    const now = moment();
    const diffInMinutes = now.diff(postDate, "minutes");
    const diffInHours = now.diff(postDate, "hours");
    const diffInDays = now.diff(postDate, "days");

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInHours < 24) return `${diffInHours} hr ago`;
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return postDate.format("MMM D, YYYY");
  };

  const processNotification = async (notification) => {
    let thumbnailUrl = notification.thumbnailId;
    let postThumbUrl = notification.postThumbId;

    try {
      if (notification.thumbnailId) {
        const imageResponse = await loginSignup.getProfileImage(
          notification.thumbnailId
        );
        if (imageResponse.status) {
          thumbnailUrl = imageResponse.data;
        }
      }

      if (notification.postThumbId) {
        const postResponse = await postHandle.getPostMedia(
          notification.postThumbId
        );
        if (postResponse.status) {
          postThumbUrl = postResponse.data;
        }
      }
    } catch (error) {
      console.error("Error processing notification:", error);
    }

    return {
      ...notification,
      thumbnailId: thumbnailUrl,
      postThumbId: postThumbUrl,
      createdAt: formatTime(notification.createdAt),
    };
  };

  const handleNewNotification = async (notification) => {
    const processed = await processNotification(notification);
    dispatch({ type: "ADD_NOTIFICATION", payload: processed });
  };

  const handleFetchedNotifications = async (notifList) => {
    if (!Array.isArray(notifList)) return;
    const sorted = notifList.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    const processed = await Promise.all(sorted.map(processNotification));
    dispatch({ type: "SET_NOTIFICATIONS", payload: processed });
  };

  const setupNotificationSocket = (userId) => {
    NotificationSocket.userId = userId;
    NotificationSocket.onNotificationReceived = handleNewNotification;
    NotificationSocket.onFetchNotifications = handleFetchedNotifications;

    NotificationSocket.connect();
    NotificationSocket.fetchNotifications(userId);
  };

  useEffect(() => {
    const init = async () => {
      const profile = await loginSignup.getStoredUserProfile();
      if (profile) {
        setMyProfile(profile);
        setupNotificationSocket(profile.id);
      }
    };
    init();

    return () => NotificationSocket.disconnect();
  }, []);

  const markAsRead = async (id) => {
    const success = await NotificationSocket.markAsRead(id);
    if (success) dispatch({ type: "MARK_AS_READ", payload: id });
  };

  const acceptFollowRequest = async (item) => {
    setIsProcessingId(item.id);
    try {
      const res = await loginSignup.acceptRequest(item.senderId, myProfile.id);
      if (res.status) {
        dispatch({ type: "MARK_AS_READ", payload: item.id });
        await NotificationSocket.deleteNotificationById(item.id);
        await NotificationSocket.sendNotificationsBulk(
          "FOLLOW",
          "accepted your follow request",
          myProfile.username,
          [item.senderId],
          myProfile?.id,
          myProfile.thumbnailId
        );
      }
    } catch (err) {
      console.error(err);
    }
    setIsProcessingId(null);
  };

  const rejectFollowRequest = async (item) => {
    setIsProcessingId(item.id);
    try {
      const res = await loginSignup.rejectFollowRequest(
        item?.senderId,
        myProfile?.id
      );
      if (res.status) {
        await NotificationSocket.deleteNotificationById(item.id);
        dispatch({ type: "REMOVE_NOTIFICATION", payload: item.id });
      }
    } catch (err) {
      console.error(err);
    }
    setIsProcessingId(null);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (myProfile?.id) {
      NotificationSocket.fetchNotifications(myProfile.id);
    }
    setRefreshing(false);
  }, [myProfile?.id]);

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      className="flex-row items-center py-3 px-2 mb-1 rounded-lg"
      style={{ backgroundColor: item.read ? bg : tint }}
      onPress={() => markAsRead(item.id)}
      disabled={isProcessingId === item.id}
    >
      <Image
        source={{ uri: item.thumbnailId }}
        className="w-10 h-10 rounded-full border border-[#0278ae]"
      />
      <View className="flex-1 ml-4">
        <Text
          className="text-sm font-custom"
          style={{
            color: textColor,
            fontWeight: item.read ? "normal" : "bold",
          }}
        >
          <Text className="font-custom-bold">@{item.senderUsername}</Text>{" "}
          {item.message} {item.comment ? ` "${item.comment}"` : ""}
        </Text>
        <Text className="text-xs font-custom text-gray-400">
          {item.createdAt}
        </Text>
      </View>

      {item.postThumbId && (
        <Image
          source={{ uri: item.postThumbId }}
          className="w-14 h-14 rounded-md ml-2"
        />
      )}

      {item.type === "FOLLOW_REQUEST" && (
        <View className="flex-row ml-3">
          <TouchableOpacity
            className="px-3 py-2 bg-green-500 rounded-md mr-2"
            onPress={() => acceptFollowRequest(item)}
            disabled={isProcessingId === item.id}
          >
            <Text className="text-white text-xs font-bold">Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="px-3 py-2 bg-red-500 rounded-full"
            onPress={() => rejectFollowRequest(item)}
            disabled={isProcessingId === item.id}
          >
            <Ionicons name="close" size={16} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 px-2" style={{ backgroundColor: bg }}>
      <Text className="text-2xl font-bold my-4" style={{ color: textColor }}>
        Notifications
      </Text>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text className="text-center py-8" style={{ color: textColor }}>
            No notifications yet
          </Text>
        }
      />
    </View>
  );
};

export default AppNotification;
