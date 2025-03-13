import { MaterialIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import ContentLoader, { Rect, Circle } from "react-content-loader/native";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import loginSignup from "../api/loginSignup";
import ProfileEdit from "./ProfileEdit";
import { Colors } from "../constants/Colors";

export const ProfileSection = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [activeEdit, setActiveEdit] = useState(false);
  const [activeTab, setActiveTab] = useState("Posts");

  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.light;
  const iconColor = themeColors.icon;
  const bg = themeColors.background;
  const textColor = themeColors.text;

  const posts = [...Array(20)].map((_, i) => ({
    id: i,
    uri: `https://placehold.co/400x400?text=Post${i + 1}`,
  }));

  const fetchUserProfile = async () => {
    const profile = await loginSignup.getStoredUserProfile();
    if (profile) {
      let imageUrl = "https://placehold.co/150x150"; // Default profile image

      if (profile.photoId) {
        try {
          const response = await loginSignup.getProfileImage(profile.photoId);
          imageUrl = response.data;
        } catch (error) {
          Alert("Error fetching profile image:", error);
        }
      }

      setUserProfile({ ...profile, imageUrl });
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  if (!userProfile) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: bg }}
      >
        <ContentLoader
          speed={2}
          width={300}
          height={300}
          viewBox="0 0 300 300"
          backgroundColor={themeColors.skeletonFg}
          foregroundColor={themeColors.skeletonFg}
        >
          {/* Profile Image */}
          <Circle cx="150" cy="50" r="40" />

          {/* Username */}
          <Rect x="75" y="100" rx="5" ry="5" width="150" height="15" />

          {/* Stats (Posts, Followers, Following) */}
          <Rect x="40" y="130" rx="5" ry="5" width="50" height="15" />
          <Rect x="125" y="130" rx="5" ry="5" width="50" height="15" />
          <Rect x="210" y="130" rx="5" ry="5" width="50" height="15" />

          {/* Bio */}
          <Rect x="40" y="160" rx="5" ry="5" width="220" height="10" />
          <Rect x="40" y="175" rx="5" ry="5" width="180" height="10" />

          {/* Buttons */}
          <Rect x="40" y="200" rx="10" ry="10" width="220" height="40" />
        </ContentLoader>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Profile Header */}
      <View className="w-full flex-row justify-center self-center text-center">
        <View className="w-full flex-col items-center">
          <View className="w-full flex-row justify-between items-center px-4">
            <Text
              className="text-lg font-bold w-[80%] overflow-hidden"
              style={{ color: textColor }}
            >
              {userProfile.username || "Username"}
            </Text>
            <TouchableOpacity>
              <MaterialIcons
                name="menu-open"
                size={28}
                style={{ color: iconColor }}
              />
            </TouchableOpacity>
          </View>

          {/* Profile Picture and Stats */}
          <View className="p-2 w-full flex-row justify-around items-center">
            <Image
              source={
                userProfile.imageUrl
                  ? { uri: userProfile.imageUrl }
                  : require("../../assets/images/profile.png")
              }
              style={{ width: 96, height: 96, borderRadius: 48 }}
            />
            <View className="flex-row gap-6">
              <Text className="text-center" style={{ color: textColor }}>
                <Text className="font-bold">0</Text>
                {"\n"} posts
              </Text>
              <Text className="text-center" style={{ color: textColor }}>
                <Text className="font-bold">{userProfile.followerCount}</Text>
                {"\n"}
                followers
              </Text>
              <Text className="text-center" style={{ color: textColor }}>
                <Text className="font-bold">{userProfile.followingCount}</Text>
                {"\n"}
                following
              </Text>
            </View>
          </View>

          {/* Name, Bio, and Link */}
          <View className="px-4 pb-2 w-full flex-col items-start">
            <Text className="text-lg font-bold" style={{ color: textColor }}>
              {userProfile.name || "Name"}
            </Text>
            <Text className="text-start w-[90%]" style={{ color: textColor }}>
              {userProfile.bio || "Bio"}
            </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL(userProfile.website || "#")}
            >
              <Text className="text-blue-900" style={{ color: textColor }}>
                {userProfile.website || "No website"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Edit Profile Button */}
          <View className="w-full flex-row justify-between items-center">
            <TouchableOpacity
              className="flex-1 bg-blue-500 p-2 rounded-md mx-[1%]"
              onPress={() => setActiveEdit(true)}
            >
              <Text className="text-center font-semibold text-white">
                Edit Profile
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-gray-200 p-2 rounded-md mx-[1%]">
              <Text className="text-center font-semibold">Share Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-gray-200 p-2 rounded-md mx-[1%]">
              <Text className="text-center font-semibold">Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tabs Navigation */}
      <View className="p-4 w-[full] flex-row justify-between gap-8 px-4 text-center">
        {["Posts", "Reels", "Saved", "Tagged"].map((tab) => (
          <TouchableOpacity
            key={tab}
            className="items-center"
            onPress={() => setActiveTab(tab)}
          >
            <MaterialIcons
              name={
                tab === "Posts"
                  ? "grid-on"
                  : tab === "Reels"
                  ? "slideshow"
                  : tab === "Saved"
                  ? "bookmark"
                  : "account-box"
              }
              size={24}
              color={activeTab === tab ? "#0278ae" : "gray"}
            />
            <Text style={{ color: activeTab === tab ? textColor : "gray" }}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === "Posts" && (
        <FlatList
          showsVerticalScrollIndicator={false}
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          contentContainerStyle={{ alignItems: "center" }}
          renderItem={({ item }) => (
            <TouchableOpacity className="w-1/3 p-1 rounded-lg">
              <Image
                source={{ uri: item.uri }}
                className="w-[30vw] h-[30vw] rounded-md mx-[1%]"
              />
            </TouchableOpacity>
          )}
        />
      )}
      {activeTab === "Reels" && (
        <View className="flex-1 items-center justify-center">
          <Text>No reels available</Text>
        </View>
      )}
      {activeTab === "Saved" && (
        <View className="flex-1 items-center justify-center">
          <Text>No saved posts</Text>
        </View>
      )}
      {activeTab === "Tagged" && (
        <View className="flex-1 items-center justify-center">
          <Text>No tagged posts</Text>
        </View>
      )}

      {/* Modal for Profile Editing */}
      <Modal
        visible={activeEdit}
        animationType="slide"
        transparent
        statusBarTranslucent
      >
        <View className="flex-1 justify-end bg-#0278ae/40">
          <View className="h-[90%] rounded-t-2xl shadow-lg">
            <ProfileEdit
              onEdit={() => setActiveEdit(false)}
              onUpdate={fetchUserProfile}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProfileSection;
