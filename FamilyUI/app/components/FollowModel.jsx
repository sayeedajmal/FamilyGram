import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import loginSignup from "../api/loginSignup";
import { Colors } from "../constants/Colors";

const FollowModel = ({
  userThumbnailUrl,
  userId,
  mineId,
  username,
  name,
  followStatus,
  setFollowers,
  setFollowing,
  setRequested, // Used to update the requested list
}) => {
  const navigation = useNavigation();
  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.dark;
  const bg = themeColors.background;
  const iconColor = themeColors.icon;
  const textColor = themeColors.text;

  const [isProcessing, setIsProcessing] = useState(false); // Loading state

  // Remove request or unfollow
  const removeFollow = async () => {
    setIsProcessing(true);
    try {
      const response = await loginSignup.removeFollow(userId, mineId);
      if (response.status) {
        setFollowers((prev) => prev.filter((user) => user.id !== userId));
        setFollowing((prev) => prev.filter((user) => user.id !== userId));
        setRequested((prev) => prev.filter((user) => user.id !== userId)); // Also remove from requested list
      }
    } catch (error) {
      console.error("Error removing follow:", error);
    }
    setIsProcessing(false);
  };

  // Accept follow request
  const acceptRequest = async () => {
    
    setIsProcessing(true);
    try {
      const response = await loginSignup.acceptRequest(userId, mineId);
      console.log("BUDDY: ",response.message);
      
      if (response.status) {
        setFollowers((prev) => [
          ...prev,
          { id: userId, username, name, userThumbnailUrl },
        ]); // Add to followers
        setRequested((prev) => prev.filter((user) => user.id !== userId)); // Remove from requested list
      }
    } catch (error) {
      console.error("Error accepting follow request:", error);
    }
    setIsProcessing(false);
  };

  return (
    <View
      className="flex-row items-center justify-between px-4 py-3"
      style={{ backgroundColor: bg }}
    >
      {/* Profile Image & Info */}
      <TouchableOpacity
        className="flex-row items-center"
        onPress={() =>
          navigation.navigate("UsersProfile", {
            userId,
            username,
            name,
            thumbnailUrl: userThumbnailUrl,
          })
        }
      >
        <Image
          source={{ uri: userThumbnailUrl }}
          className="w-12 h-12 rounded-full"
        />
        <View className="ml-3">
          <Text
            className="text-base font-semibold"
            style={{ color: textColor }}
          >
            {username}
          </Text>
          <Text className="text-sm text-gray-500">{name}</Text>
        </View>
      </TouchableOpacity>

      {/* Follow/Accept Button & Close Button */}
      <View className="flex-row items-center space-x-2">
        {/* Accept Button if it's a follow request */}
        {followStatus === "Requested" ? (
          <TouchableOpacity
            className="px-4 py-1 rounded-lg bg-green-500"
            onPress={acceptRequest}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white text-center text-sm font-medium">
                Accept
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className={`px-4 py-1 rounded-lg mr-2 ${
              followStatus === "Message" ? "bg-gray-300" : "bg-blue-500"
            }`}
          >
            <Text className="text-white text-center text-sm font-medium">
              {followStatus}
            </Text>
          </TouchableOpacity>
        )}

        {/* Reject/Remove Button */}
        <TouchableOpacity onPress={removeFollow} disabled={isProcessing}>
          {isProcessing ? (
            <ActivityIndicator size="small" color={iconColor} />
          ) : (
            <Ionicons name="close" size={24} color={iconColor} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FollowModel;
