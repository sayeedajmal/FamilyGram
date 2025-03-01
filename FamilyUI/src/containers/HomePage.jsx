import React, { useState } from "react";
import { View, ScrollView, Image, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const stories = [
  { id: 1, username: "Your Story", image: "https://placekitten.com/100/100" },
  { id: 2, username: "john_doe", image: "https://placekitten.com/101/101" },
  { id: 3, username: "jane_doe", image: "https://placekitten.com/102/102" },
];

const postsData = [
  {
    id: 1,
    username: "john_doe",
    userImage: "https://placekitten.com/50/50",
    postImage: "https://placekitten.com/400/400",
    likes: 123,
    caption: "Beautiful day with family! #familytime",
  },
  {
    id: 2,
    username: "jane_doe",
    userImage: "https://placekitten.com/51/51",
    postImage: "https://placekitten.com/401/401",
    likes: 98,
    caption: "Chilling at the beach! #sunset",
  },
];

const HomePage = () => {
  const [posts, setPosts] = useState(postsData);

  const toggleLike = (postId) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              likes: post.liked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-2 border-b border-gray-200">
        <Text className="text-2xl font-bold">FamilyGram</Text>
        <View className="flex-row">
          <TouchableOpacity>
            <Ionicons
              name="heart-sharp"
              size={30}
              color="black"
              className="mx-4"
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="chatbubble-outline" size={30} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView>
        {/* Stories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 py-2"
        >
          {stories.map((story) => (
            <View key={story.id} className="mr-4 items-center">
              <View className="border-2 border-pink-500 rounded-full p-1">
                <Image
                  source={{ uri: story.image }}
                  className="w-16 h-16 rounded-full"
                />
              </View>
              <Text className="text-xs mt-1">{story.username}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Posts */}
        {posts.map((post) => (
          <View key={post.id} className="border-b border-gray-200 pb-4">
            {/* Post Header */}
            <View className="flex-row items-center p-2">
              <Image
                source={{ uri: post.userImage }}
                className="w-8 h-8 rounded-full"
              />
              <Text className="font-semibold ml-2">{post.username}</Text>
            </View>

            {/* Post Image */}
            <TouchableOpacity
              onPress={() => toggleLike(post.id)}
              onLongPress={() => toggleLike(post.id)}
            >
              <Image
                source={{ uri: post.postImage }}
                className="w-full aspect-square"
              />
            </TouchableOpacity>

            {/* Post Actions */}
            <View className="flex-row p-4">
              <TouchableOpacity
                className="mr-4"
                onPress={() => toggleLike(post.id)}
              >
                <Ionicons
                  name={post.liked ? "heart" : "heart-outline"}
                  size={26}
                  color={post.liked ? "red" : "black"}
                />
              </TouchableOpacity>
              <TouchableOpacity className="mr-4">
                <Ionicons name="chatbubble-outline" size={26} color="black" />
              </TouchableOpacity>
              <TouchableOpacity>
                <Ionicons name="share-social-outline" size={26} color="black" />
              </TouchableOpacity>
            </View>

            {/* Likes and Caption */}
            <View className="px-4">
              <Text className="font-bold">{post.likes} likes</Text>
              <Text>
                <Text className="font-bold">{post.username}</Text>{" "}
                {post.caption}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomePage;
