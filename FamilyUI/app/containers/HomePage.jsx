import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import PostService from "../api/postHandle";
import PostModel from "../components/PostModel";
import { Colors } from "../constants/Colors";

const HomePage = () => {
  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.light;
  const iconColor = themeColors.icon;
  const bg = themeColors.background;
  const textColor = themeColors.text;

  const [posts, setPosts] = useState([]);
  const flatListRef = useRef(null);
  const videoRefs = useRef({});

  // Fetch posts from all users (or a default user for now)
  const fetchPosts = async () => {
    try {
      const response = await PostService.GetAllPosts();
      if (response?.status) {
        setPosts(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const onViewableItemsChanged = ({ viewableItems }) => {
    const visiblePostIds = new Set(viewableItems.map((item) => item.item.id));
    Object.keys(videoRefs.current).forEach((id) => {
      if (videoRefs.current[id]) {
        if (visiblePostIds.has(id)) {
          videoRefs.current[id].playAsync();
        } else {
          videoRefs.current[id].pauseAsync();
        }
      }
    });
  };

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };
  const viewabilityConfigCallbackPairs = useRef([
    { onViewableItemsChanged, viewabilityConfig },
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-1">
        <Image
          source={require("../../assets/images/logo.png")}
          resizeMode="contain"
          style={{ height: 30, width: 180, marginLeft: -15 }}
        />
        <View className="flex-row">
          <TouchableOpacity>
            <Ionicons
              name="heart-sharp"
              size={30}
              color={iconColor}
              className="mx-4"
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="chatbubble-outline" size={30} color={iconColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stories */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[
          {
            id: "your_story",
            username: "Your Story",
            image: "https://placekitten.com/100/100",
          },
          {
            id: "john_doe",
            username: "john_doe",
            image: "https://placekitten.com/101/101",
          },
          {
            id: "jane_doe",
            username: "jane_doe",
            image: "https://placekitten.com/102/102",
          },
        ]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="mr-4 items-center">
            <View
              className="border-2 rounded-full p-1"
              style={{ borderColor: iconColor }}
            >
              <Image
                source={{ uri: item.image }}
                className="w-16 h-16 rounded-full"
              />
            </View>
            <Text className="text-xs mt-1" style={{ color: textColor }}>
              {item.username}
            </Text>
          </View>
        )}
      />

      {/* Posts */}
      <FlatList
        ref={flatListRef}
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <PostModel post={item} loading={false} videoRefs={videoRefs} />
        )}
        initialNumToRender={5}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-500 text-lg">No posts available</Text>
          </View>
        }
      />
    </View>
  );
};

export default HomePage;
