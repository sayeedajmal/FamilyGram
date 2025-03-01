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

          // Ensure the response is a Blob
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
      <View className="p-4 w-full border-b flex-col justify-center items-center">
        <View className="w-full flex-col items-center">
          {/* Username and More Icon */}
          <View className="w-full flex-row justify-between items-center px-4">
            <Text className="text-lg font-bold w-[80%] overflow-hidden">
              {userProfile.username || "Username"}
            </Text>
            <MaterialIcons name="more-horiz" size={24} />
          </View>

          {/* Profile Picture and Stats */}
          <View className="p-2 w-full flex-row justify-around items-center">
            {Platform.OS === "web" ? (
              <img
                src={userProfile.imageUrl || "https://placehold.co/150x150"}
                alt="Profile"
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  objectFit: "cover",
                }}
              />
            ) : (
              <Image
                source={{
                  uri: userProfile.imageUrl || "https://placehold.co/150x150",
                }}
                style={{ width: 96, height: 96, borderRadius: 48 }}
              />
            )}

            <View className="flex-row gap-6">
              <Text className="text-center">
                <Text className="font-bold">0</Text> posts
              </Text>
              <Text className="text-center">
                <Text className="font-bold">{userProfile.followerCount}</Text>{" "}
                followers
              </Text>
              <Text className="text-center">
                <Text className="font-bold">{userProfile.followingCount}</Text>{" "}
                following
              </Text>
            </View>
          </View>

          {/* Name, Bio, and Link */}
          <View className="px-4 w-full flex-col items-start">
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

      {/* Profile Actions */}
      <View className="flex-row justify-center gap-4 w-full p-4">
        <TouchableOpacity
          onPress={() => setActiveEdit(true)}
          className="flex-1 bg-gray-200 p-2 rounded-md"
        >
          <Text className="text-center font-semibold">Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 bg-gray-200 p-2 rounded-md">
          <Text className="text-center font-semibold">Share Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 bg-gray-200 p-2 rounded-md">
          <Text className="text-center font-semibold">Call</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View className="border-b flex-row justify-center gap-8 p-4 self-center text-center">
        <TouchableOpacity className="items-center">
          <MaterialIcons name="grid-on" size={24} />
          <Text>POSTS</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center">
          <MaterialIcons name="slideshow" size={24} />
          <Text>REELS</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center">
          <MaterialIcons name="bookmark" size={24} />
          <Text>SAVED</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center">
          <MaterialIcons name="account-box" size={24} />
          <Text>TAGGED</Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable Posts with FlatList */}
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
