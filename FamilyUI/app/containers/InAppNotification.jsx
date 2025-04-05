import moment from "moment";
import React, { useCallback, useEffect, useReducer, useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import loginSignup from "../api/loginSignup";
import NotificationSocket from "../api/NotificationSocket";
import postHandle from "../api/postHandle";
import { Colors } from "../constants/Colors";

// Reducer function for notification state
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
    default:
      return state;
  }
};

const NotificationItem = ({ item, bg, textColor, markAsRead, tint }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className="flex-row items-center py-3 px-2 mb-1 rounded-lg"
      style={{
        backgroundColor: item.read ? bg : tint, // Light blue for unread
      }}
      onPress={() => markAsRead(item.id)}
    >
      {/* User Avatar */}
      <Image
        source={{ uri: item.thumbnailId }}
        className="w-10 h-10 rounded-full border border-[#0278ae]"
      />

      {/* Notification Text */}
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

      {/* Post Image */}
      {item.postThumbId && (
        <Image
          source={{ uri: item.postThumbId }}
          className="w-14 h-14 rounded-md ml-2"
        />
      )}

      {/* Follow Button */}
      {item.type === "FOLLOW" && (
        <TouchableOpacity className="ml-3 px-3 py-2 bg-blue-500 rounded-md">
          <Text className="text-white text-xs font-bold">Follow Back</Text>
        </TouchableOpacity>
      )}

      {/* Accept / Reject for Follow-Requests */}
      {item.type === "FOLLOW_REQUEST" && (
        <View className="flex-row ml-3">
          <TouchableOpacity
            className="px-3 py-2 bg-green-500 rounded-md mr-2"
            onPress={() => acceptFollowRequest(item)}
          >
            <Text className="text-white text-xs font-bold">Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="px-3 py-2 bg-red-500 rounded-md"
            onPress={() => rejectFollowRequest(item)}
          >
            <Text className="text-white text-xs font-bold">Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const InAppNotification = () => {
  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.light;
  const bg = themeColors.background;
  const textColor = themeColors.text;

  const [notifications, dispatch] = useReducer(notificationReducer, []);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true); // Added loading state
  const [myProfile, setMyProfile] = useState(null);

  const handleFetchedNotifications = async (notificationsData) => {
    if (!notificationsData || !Array.isArray(notificationsData)) {
      setLoading(false);
      return;
    }

    const sortedNotifications = notificationsData.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const processedNotifications = await Promise.all(
      sortedNotifications.map(processNotification)
    );

    dispatch({ type: "SET_NOTIFICATIONS", payload: processedNotifications });
    setLoading(false); // Ensure loading stops after fetching
  };

  const setupNotificationSocket = (userId) => {
    NotificationSocket.userId = userId;
    NotificationSocket.onNotificationReceived = handleNewNotification;
    NotificationSocket.onFetchNotifications = handleFetchedNotifications;

    NotificationSocket.connect();
    NotificationSocket.fetchNotifications(userId);
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      const profile = await loginSignup.getStoredUserProfile();
      if (profile) {
        setMyProfile(profile);
        setupNotificationSocket(profile.id);
      } else {
        setLoading(false); // Stop loading if user profile is not found
      }
    };

    fetchUserProfile();

    return () => {
      NotificationSocket.disconnect();
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (myProfile?.id) {
      await NotificationSocket.fetchNotifications(myProfile.id);
    }
    setRefreshing(false);
  }, [myProfile?.id]);

  return (
    <View className="flex-1 px-1" style={{ backgroundColor: bg }}>
      <Text className="text-2xl font-bold mb-4" style={{ color: textColor }}>
        Notifications
      </Text>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={themeColors.tint} />
        </View>
      ) : notifications.length === 0 ? (
        <Text className="text-center py-8" style={{ color: textColor }}>
          No notifications yet
        </Text>
      ) : (
        <FlatList
          data={notifications}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <NotificationItem
              item={item}
              bg={bg}
              textColor={textColor}
              markAsRead={markAsRead}
              tint={themeColors.tint}
            />
          )}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

export default InAppNotification;
