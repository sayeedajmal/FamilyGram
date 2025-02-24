import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, FlatList } from "react-native";
import { Link } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import loginSignup from "../api/loginSignup";

export const ProfileSection = () => {
  const [userProfile, setUserProfile] = useState(null);

  const posts = [...Array(20)].map((_, i) => ({
    id: i,
    uri: `https://placehold.co/400x400?text=Post${i + 1}`,
  }));

  useEffect(() => {
    async function fetchData() {
      const profile = await loginSignup.getStoredUserProfile();
      if (profile) setUserProfile(profile);
    }
    fetchData();
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
        {/* Center container for larger screens */}
        <View className="w-full md:w-[60vw] lg:w-[40vw] flex-col md:items-center">
          {/* Username and More Icon */}
          <View className="w-full flex-row justify-between items-center px-4">
            <Text className="text-lg font-bold w-[80%] text-nowrap overflow-hidden">
              {userProfile.username || "Username"}
            </Text>
            <MaterialIcons name="more-horiz" size={24} />
          </View>

          {/* Profile Picture and Stats */}
          <View className="p-4 w-full flex-row justify-around md:justify-center md:gap-16 items-center">
            <Image
              source={{
                uri: userProfile.photoUrl || "https://placehold.co/150x150",
              }}
              className="w-[15vw] h-[15vw] md:w-[8vw] md:h-[8vw] lg:w-[6vw] lg:h-[6vw] rounded-full shadow-lg"
            />
            <View className="flex-row gap-3 md:gap-6 lg:gap-12">
              <Text className="text-center">
                <Text className="font-bold">1,234</Text> posts
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
          <View className="px-4 w-full md:w-[60vw] lg:w-[40vw] flex-col items-start md:items-center">
            <Text className="font-semibold">{userProfile.name || "Name"}</Text>
            <Text className="text-center md:text-left">
              {userProfile.bio || "Bio"}
            </Text>
            <Link href="#" className="text-blue-900">
              www.website.com
            </Link>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View className="max-w-[80vw] border-b flex-row justify-center gap-8 p-4 self-center text-center">
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
    </View>
  );
};

export default ProfileSection;
