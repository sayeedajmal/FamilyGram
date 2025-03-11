import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import ContentLoader, { Circle, Rect } from "react-content-loader/native";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Colors } from "../constants/Colors";

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
  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.light;
  const iconColor = themeColors.icon;
  const bg = themeColors.background;
  const textColor = themeColors.text;

  useEffect(() => {
    setTimeout(() => {
      setPosts(postsData);
      setLoading(false);
    }, 2000);
  }, []);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: bg }}
    >
      {loading
        ? [1, 2].map((_, index) => (
            <View
              key={index}
              style={{
                padding: 16,
              }}
            >
              <ContentLoader
                speed={1.5}
                width={"100%"}
                height={320}
                backgroundColor="#f3f3f3"
                foregroundColor="#ecebeb"
              >
                <Circle cx="30" cy="30" r="15" />
                <Rect x="50" y="20" rx="4" ry="4" width="120" height="10" />
                <Rect x="0" y="50" rx="8" ry="8" width="100%" height="200" />
                <Rect x="0" y="260" rx="4" ry="4" width="80" height="10" />
                <Rect x="0" y="280" rx="4" ry="4" width="150" height="10" />
              </ContentLoader>
            </View>
          ))
        : posts.map((post) => (
            <View key={post.id} style={{ paddingBottom: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 8,
                }}
              >
                <Image
                  source={{ uri: post.userImage }}
                  style={{ width: 32, height: 32, borderRadius: 16 }}
                />
                <Text
                  style={{
                    color: textColor,
                    fontWeight: "bold",
                    marginLeft: 8,
                  }}
                >
                  {post.username}
                </Text>
              </View>
              <TouchableOpacity>
                <Image
                  source={{ uri: post.postImage }}
                  style={{ width: "100%", aspectRatio: 1 }}
                />
              </TouchableOpacity>
              <View style={{ flexDirection: "row", padding: 16 }}>
                <TouchableOpacity style={{ marginRight: 16 }}>
                  <Ionicons name="heart-outline" size={26} color={iconColor} />
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
              <View style={{ paddingHorizontal: 16 }}>
                <Text style={{ color: textColor, fontWeight: "bold" }}>
                  {post.likes} likes
                </Text>
                <Text style={{ color: textColor }}>
                  <Text style={{ fontWeight: "bold" }}>{post.username}</Text>{" "}
                  {post.caption}
                </Text>
              </View>
            </View>
          ))}
    </ScrollView>
  );
};

export default Posts;
