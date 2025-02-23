import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Link } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

export const Profile = () => {
  const posts = [...Array(20)].map((_, i) => ({
    id: i,
    uri: `https://placehold.co/400x400?text=Post${i + 1}`,
  }));

  return (
    <View className="bg-white flex-1">
      {/* Profile Header */}
      <View className="w-full p-4 border-b flex-row justify-center items-center">
        <View className="flex-row gap-4 items-center">
          <Image
            source={{ uri: "https://placehold.co/150x150" }}
            className="w-[20vw] h-[20vw] md:w-[10vw] md:h-[10vw] rounded-full shadow-lg"
          />
          <View className="space-y-4" style={{ width: "min-content" }}>
            <View className="flex-row items-center gap-4">
              <Text className="text-xl">username</Text>
              <TouchableOpacity className="px-4 py-2 bg-blue-500 rounded-lg">
                <Text className="text-white">Follow</Text>
              </TouchableOpacity>
              <TouchableOpacity className="px-4 py-2 bg-gray-200 rounded-lg">
                <Text>Message</Text>
              </TouchableOpacity>
              <MaterialIcons name="more-horiz" size={24} />
            </View>
            <View className="flex-row gap-3">
              <Text>
                <Text className="font-bold">1,234</Text> posts
              </Text>
              <Text>
                <Text className="font-bold">4.5M</Text> followers
              </Text>
              <Text>
                <Text className="font-bold">1,234</Text> following
              </Text>
            </View>
            <View>
              <Text className="font-semibold">Display Name</Text>
              <Text>
                Bio description goes here. Multiple lines of text can be added.
              </Text>
              <Link href="#" className="text-blue-900">
                www.website.com
              </Link>
            </View>
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

export default Profile;