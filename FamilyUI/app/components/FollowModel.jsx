import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useNavigation } from "@react-navigation/native";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { Colors } from "../constants/Colors";

const FollowModel = ({
  userThumbnailUrl,
  userId,
  username,
  name,
  followStatus,
}) => {
  const navigation = useNavigation();

  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.dark;
  const bg = themeColors.background;
  const iconColor = themeColors.icon;
  const textColor = themeColors.text;

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
            userId: userId,
            username: username,
            name: name,
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

      {/* Follow / Message Button */}
      <View className="flex-row items-center space-x-2">
        <TouchableOpacity
          className={`px-4 py-1 rounded-lg mr-2 ${
            followStatus === "Message" ? "bg-gray-300" : "bg-blue-500"
          }`}
        >
          <Text className="text-white text-center text-sm font-medium">
            {followStatus}
          </Text>
        </TouchableOpacity>

        {/* Close Button */}
        <TouchableOpacity>
          <Ionicons name="close" size={24} color={iconColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FollowModel;
