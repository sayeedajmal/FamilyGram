import { Ionicons } from "@expo/vector-icons";
import moment from "moment";
import React, {
  useCallback,
  useEffect,
  useReducer,
  useState,
  useRef,
} from "react";
import {
  ActivityIndicator,
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
    case "UPDATE_NOTIFICATION_IMAGE":
      return state.map((notif) =>
        notif.id === action.payload.id
          ? { ...notif, ...action.payload.data }
          : notif
      );
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  // Default images for fallbacks
  const DEFAULT_AVATAR = require("../../assets/images/profile.png");
  const DEFAULT_POST_IMAGE = require("../../assets/images/profile.png");

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

  // This loads the images in the background after rendering
  const loadImageForNotification = async (notification) => {
    if (!isMounted.current) return;

    let updates = {};

    try {
      if (
        notification.thumbnailId &&
        typeof notification.thumbnailId === "string" &&
        !notification.thumbnailId.startsWith("http")
      ) {
        const imageResponse = await loginSignup.getProfileImage(
          notification.thumbnailId
        );
        if (imageResponse.status) {
          updates.thumbnailId = imageResponse.data;
        }
      }

      if (
        notification.postThumbId &&
        typeof notification.postThumbId === "string" &&
        !notification.postThumbId.startsWith("http")
      ) {
        const postResponse = await postHandle.getPostMedia(
          notification.postThumbId
        );
        if (postResponse.status) {
          updates.postThumbId = postResponse.data;
        }
      }

      if (Object.keys(updates).length > 0 && isMounted.current) {
        dispatch({
          type: "UPDATE_NOTIFICATION_IMAGE",
          payload: {
            id: notification.id,
            data: updates,
          },
        });
      }
    } catch (error) {
      console.error(
        `Error loading images for notification ${notification.id}:`,
        error
      );
    }
  };

  const processNotificationForDisplay = (notification) => {
    // Format the creation time - this is fast and doesn't need to be async
    return {
      ...notification,
      createdAt: formatTime(notification.createdAt),
    };
  };

  const handleNewNotification = (notification) => {
    // First display the notification with whatever data it has
    const processedNotif = processNotificationForDisplay(notification);
    dispatch({ type: "ADD_NOTIFICATION", payload: processedNotif });

    // Then load the images in the background
    loadImageForNotification(processedNotif);
  };

  const handleFetchedNotifications = (notifList) => {
    try {
      if (!Array.isArray(notifList)) {
        setIsLoading(false);
        return;
      }

      // Sort notifications by date first
      const sorted = notifList.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      // Process for immediate display (fast operations only)
      const processedForDisplay = sorted.map(processNotificationForDisplay);

      // Update the state with the notifications (without images yet)
      dispatch({ type: "SET_NOTIFICATIONS", payload: processedForDisplay });

      // Set loading to false as we now have content to display
      setIsLoading(false);

      // Load images in the background
      processedForDisplay.forEach((notification) => {
        loadImageForNotification(notification);
      });
    } catch (err) {
      setError("Failed to load notifications");
      console.error("Error handling fetched notifications:", err);
      setIsLoading(false);
    }
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
      try {
        setIsLoading(true);
        const profile = await loginSignup.getStoredUserProfile();
        if (profile) {
          setMyProfile(profile);
          setupNotificationSocket(profile?.id);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error initializing:", err);
        setError("Failed to load profile data");
        setIsLoading(false);
      }
    };

    init();
    return () => {
      isMounted.current = false;
      NotificationSocket.disconnect();
    };
  }, []);

  const markAsRead = async (id) => {
    try {
      const success = await NotificationSocket.markAsRead(id);
      if (success) dispatch({ type: "MARK_AS_READ", payload: id });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
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
      console.error("Error accepting follow request:", err);
    } finally {
      setIsProcessingId(null);
    }
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
      console.error("Error rejecting follow request:", err);
    } finally {
      setIsProcessingId(null);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (myProfile?.id) {
        await NotificationSocket.fetchNotifications(myProfile.id);
      }
    } catch (err) {
      console.error("Error refreshing notifications:", err);
      setError("Failed to refresh notifications");
    } finally {
      setRefreshing(false);
    }
  }, [myProfile?.id]);

  const getImageSource = (uri) => {
    if (!uri) return null;
    if (typeof uri === "string" && uri.startsWith("http")) {
      return { uri };
    }
    return null; // Will use defaultSource instead
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      className="flex-row items-center py-3 px-2 mb-1 rounded-lg"
      style={{ backgroundColor: item.read ? bg : tint }}
      onPress={() => markAsRead(item.id)}
      disabled={isProcessingId === item.id}
    >
      <Image
        source={getImageSource(item.thumbnailId)}
        defaultSource={DEFAULT_AVATAR}
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
          source={getImageSource(item.postThumbId)}
          defaultSource={DEFAULT_POST_IMAGE}
          className="w-14 h-14 rounded-md ml-2"
        />
      )}

      {item.type === "FOLLOW_REQUEST" && (
        <View className="flex-row ml-3">
          {isProcessingId === item.id ? (
            <ActivityIndicator size="small" color={themeColors.tint} />
          ) : (
            <>
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
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (isLoading && !refreshing && notifications.length === 0) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={themeColors.tint} />
          <Text className="mt-4" style={{ color: textColor }}>
            Loading notifications...
          </Text>
        </View>
      );
    }

    if (error && notifications.length === 0) {
      return (
        <View className="flex-1 justify-center items-center px-4">
          <Ionicons name="alert-circle-outline" size={40} color="red" />
          <Text className="text-center mt-2 text-red-500">{error}</Text>
          <TouchableOpacity
            className="mt-4 px-4 py-2 bg-blue-500 rounded-lg"
            onPress={onRefresh}
          >
            <Text className="text-white font-bold">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[themeColors.tint]}
            tintColor={themeColors.tint}
          />
        }
        ListEmptyComponent={
          <Text className="text-center py-8" style={{ color: textColor }}>
            No notifications yet
          </Text>
        }
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    );
  };

  return (
    <View className="flex-1 px-2" style={{ backgroundColor: bg }}>
      <Text className="text-2xl font-bold my-4" style={{ color: textColor }}>
        Notifications
      </Text>
      {renderContent()}
    </View>
  );
};

export default AppNotification;
