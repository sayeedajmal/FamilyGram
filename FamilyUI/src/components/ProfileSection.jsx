import { MaterialIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import loginSignup from "../api/loginSignup";
import ProfileEdit from "./ProfileEdit";

export const ProfileSection = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [activeEdit, setActiveEdit] = useState(false);
  const [activeTab, setActiveTab] = useState("Posts");

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
          imageUrl = response;
        } catch (error) {
          console.error("Error fetching profile image:", error);
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
      <View className="flex-1 items-center justify-center">
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View className="bg-white flex-1">
      {/* Profile Header */}
      <View className="w-[90%] flex-row justify-center gap-8 self-center text-center">
        <View className="w-full flex-col items-center">
          <View className="w-full flex-row justify-between items-center px-4">
            <Text className="text-lg font-bold w-[80%] overflow-hidden">
              {userProfile.username || "Username"}
            </Text>
            <MaterialIcons name="more-horiz" size={24} />
          </View>

          {/* Profile Picture and Stats */}
          <View className="p-2 w-full flex-row justify-around items-center">
            <Image
              source={{
                uri: userProfile.imageUrl || "https://placehold.co/150x150",
              }}
              style={{ width: 96, height: 96, borderRadius: 48 }}
            />
            <View className="flex-row gap-6">
              <Text className="text-center">
                <Text className="font-bold">0</Text>
                {"\n"} posts
              </Text>
              <Text className="text-center">
                <Text className="font-bold">{userProfile.followerCount}</Text>
                {"\n"}
                followers
              </Text>
              <Text className="text-center">
                <Text className="font-bold">{userProfile.followingCount}</Text>
                {"\n"}
                following
              </Text>
            </View>
          </View>

          {/* Name, Bio, and Link */}
          <View className="p-2 w-full flex-col items-start">
            <Text className="font-semibold">{userProfile.name || "Name"}</Text>
            <Text className="text-center">{userProfile.bio || "Bio"}</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL(userProfile.website || "#")}
            >
              <Text className="text-blue-900">
                {userProfile.website || "No website"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tabs Navigation */}
      <View className="p-2 w-[full] flex-row justify-between gap-8 px-4 text-center">
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
              color={activeTab === tab ? "black" : "gray"}
            />
            <Text style={{ color: activeTab === tab ? "black" : "gray" }}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === "Posts" && (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          contentContainerStyle={{ alignItems: "center" }}
          renderItem={({ item }) => (
            <TouchableOpacity className="w-1/3 p-1 rounded-lg">
              <Image
                source={{ uri: item.uri }}
                className="w-[30vw] h-[30vw] rounded-md"
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
        style={{ alignSelf: "center" }}
        visible={activeEdit}
        animationType="slide"
      >
        <ProfileEdit
          onEdit={() => setActiveEdit(false)}
          onUpdate={fetchUserProfile}
        />
      </Modal>
    </View>
  );
};

export default ProfileSection;
