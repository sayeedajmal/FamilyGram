import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import ContentLoader, { Circle, Rect } from "react-content-loader/native";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Colors } from "../constants/Colors";

const postsData = [
  {
    id: 1,
    username: "sayeed__ajmal",
    userImage:
      "https://images.unsplash.com/photo-1604537466158-719b1972feb8?ixlib=rb-1.2.1&auto=format&fit=crop&w=700&q=80",
    postImage:
      "https://images.unsplash.com/photo-1604537466158-719b1972feb8?ixlib=rb-1.2.1&auto=format&fit=crop&w=700&q=80",
    likes: 123,
    caption:
      "Enjoying the amazing view today! The weather is perfect for a day out in nature. #nature #travel #adventure",
  },
  {
    id: 2,
    username: "shoaib_akhtar",
    userImage:
      "https://plus.unsplash.com/premium_photo-1686835759214-526932717a7e?q=80&w=1527&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    postImage:
      "https://plus.unsplash.com/premium_photo-1686835759214-526932717a7e?q=80&w=1527&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    likes: 98,
    caption: "Chilling at the beach! #sunset",
  },
];

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState({});
  const [savedPosts, setSavedPosts] = useState({});

  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.light;
  const iconColor = themeColors.icon;
  const bg = themeColors.background;
  const textColor = themeColors.text;

  useEffect(() => {
    setTimeout(() => {
      setPosts(postsData); // Simulating API response
      setLoading(false);
    }, 2000);
  }, []);

  const toggleLike = (postId) => {
    setLikedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const toggleSave = (postId) => {
    setSavedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  return (
    <ScrollView style={{ backgroundColor: bg }}>
      {loading ? (
        // Show loader while posts are loading
        <View style={{ padding: 16 }}>
          {[1, 2].map((_, index) => (
            <ContentLoader
              key={index}
              speed={1.5}
              width={"100%"}
              height={320}
              backgroundColor="#f3f3f3"
              foregroundColor={themeColors.skeletonFg}
            >
              <Circle cx="30" cy="30" r="15" />
              <Rect x="50" y="20" rx="4" ry="4" width="120" height="10" />
              <Rect x="0" y="50" rx="8" ry="8" width="100%" height="200" />
              <Rect x="0" y="260" rx="4" ry="4" width="80" height="10" />
              <Rect x="0" y="280" rx="4" ry="4" width="150" height="10" />
            </ContentLoader>
          ))}
        </View>
      ) : posts.length === 0 ? (
        // If no posts are available, show message
        <View style={{ padding: 20, alignItems: "center" }}>
          <Text
            style={{ color: textColor, fontSize: 16 }}
            className="font-custom"
          >
            No posts available
          </Text>
        </View>
      ) : (
        // Show posts when available
        posts.map((post) => (
          <View
            key={post.id}
            style={{
              backgroundColor: bg,
              borderRadius: 12,
              padding: 10,
              marginBottom: 16,
            }}
          >
            {/* Post Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Image
                source={{ uri: post.userImage }}
                style={{ width: 32, height: 32, borderRadius: 16 }}
              />
              <Text
                className="font-custom-bold"
                style={{
                  marginLeft: 8,
                  color: textColor,
                }}
              >
                {post.username}
              </Text>
            </View>

            {/* Post Image */}
            <Image
              source={{ uri: post.postImage }}
              style={{
                width: "100%",
                aspectRatio: 1,
                borderRadius: 8,
                resizeMode: "cover",
              }}
            />

            {/* Post Actions */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 8,
              }}
            >
              <View style={{ flexDirection: "row" }}>
                <TouchableOpacity
                  style={{ marginRight: 16 }}
                  onPress={() => toggleLike(post.id)}
                >
                  <Ionicons
                    name={likedPosts[post.id] ? "heart" : "heart-outline"}
                    size={26}
                    color={likedPosts[post.id] ? "red" : iconColor}
                  />
                </TouchableOpacity>

                <TouchableOpacity style={{ marginRight: 16 }}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={26}
                    color={iconColor}
                  />
                </TouchableOpacity>

                <TouchableOpacity>
                  <Ionicons
                    name="share-social-outline"
                    size={26}
                    color={iconColor}
                  />
                </TouchableOpacity>
              </View>

              {/* Save Button */}
              <TouchableOpacity onPress={() => toggleSave(post.id)}>
                <Ionicons
                  name={savedPosts[post.id] ? "bookmark" : "bookmark-outline"}
                  size={26}
                  color={savedPosts[post.id] ? "#FFD700" : iconColor}
                />
              </TouchableOpacity>
            </View>

            {/* Post Likes & Caption */}
            <Text
              className="font-custom-bold"
              style={{
                color: textColor,
                marginTop: 8,
              }}
            >
              {post.likes + (likedPosts[post.id] ? 1 : 0)} likes
            </Text>
            <Text className="font-custom" style={{ color: textColor }}>
              <Text className="font-custom-bold">{post.username}</Text>{" "}
              {post.caption}
            </Text>

            {/* Comments Section */}
            <TouchableOpacity style={{ marginTop: 4 }}>
              <Text
                className="font-custom"
                style={{ color: "#6B7280", fontSize: 12 }}
              >
                View all {post.totalComments || 0} comments
              </Text>
            </TouchableOpacity>

            {/* Comment Input */}
            <View style={{ marginTop: 6 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 8,
                  borderWidth: 1,
                  borderRadius: 30,
                  borderColor: themeColors.tint,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                }}
              >
                <TouchableOpacity style={{ marginRight: 10 }}>
                  <Ionicons name="happy-outline" size={24} color="#6B7280" />
                </TouchableOpacity>

                <TextInput
                  className="font-custom"
                  placeholder="Add a comment..."
                  placeholderTextColor="#6B7280"
                  style={{
                    flex: 1,
                    fontSize: 14,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    color: "black",
                  }}
                />

                <TouchableOpacity style={{ marginLeft: 10 }}>
                  <Text
                    className="font-custom-bold"
                    style={{
                      color: "#3B82F6",
                      fontSize: 14,
                    }}
                  >
                    POST
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default Posts;
