import React, { useState, useEffect } from "react";
import { Image, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ContentLoader, { Rect, Circle } from "react-content-loader/native";

const postsData = [
  {
    id: 1,
    username: "john_doe",
    userImage: "https://placehold.co/600x400",
    postImage: "https://placehold.co/600x400",
    likes: 123,
    caption: "Beautiful day with family! #familytime",
  },
  {
    id: 2,
    username: "jane_doe",
    userImage: "https://placehold.co/600x400",
    postImage: "https://placehold.co/600x400",
    likes: 98,
    caption: "Chilling at the beach! #sunset",
  },
];

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch delay
    setTimeout(() => {
      setPosts(postsData);
      setLoading(false);
    }, 2000);
  }, []);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {loading ? (
        // Show Skeleton Loader when loading
        <>
          {[1, 2].map((_, index) => (
            <View key={index} className="border-b border-gray-200 pb-4 p-4">
              <ContentLoader
                speed={1.5}
                width={"100%"}
                height={320}
                backgroundColor="#f3f3f3"
                foregroundColor="#ecebeb"
              >
                {/* Profile Image */}
                <Circle cx="30" cy="30" r="15" />
                {/* Username */}
                <Rect x="50" y="20" rx="4" ry="4" width="120" height="10" />
                {/* Post Image */}
                <Rect x="0" y="50" rx="8" ry="8" width="100%" height="200" />
                {/* Like and Caption */}
                <Rect x="0" y="260" rx="4" ry="4" width="80" height="10" />
                <Rect x="0" y="280" rx="4" ry="4" width="150" height="10" />
              </ContentLoader>
            </View>
          ))}
        </>
      ) : (
        // Show actual posts after loading
        posts.map((post) => (
          <View key={post.id} className="pb-4">
            {/* Post Header */}
            <View className="flex-row items-center p-2">
              <Image
                source={{ uri: post.userImage }}
                className="w-8 h-8 rounded-full"
              />
              <Text className="font-semibold ml-2">{post.username}</Text>
            </View>

            {/* Post Image */}
            <TouchableOpacity onPress={() => {}} onLongPress={() => {}}>
              <Image
                source={{ uri: "https://placehold.co/600x400" }}
                className="w-full aspect-square"
              />
            </TouchableOpacity>

            {/* Post Actions */}
            <View className="flex-row p-4">
              <TouchableOpacity className="mr-4">
                <Ionicons name="heart-outline" size={26} color="#0278ae" />
              </TouchableOpacity>
              <TouchableOpacity className="mr-4">
                <Ionicons name="chatbubble-outline" size={26} color="#0278ae" />
              </TouchableOpacity>
              <TouchableOpacity>
                <Ionicons
                  name="share-social-outline"
                  size={26}
                  color="#0278ae"
                />
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
        ))
      )}
    </ScrollView>
  );
};

export default Posts;
