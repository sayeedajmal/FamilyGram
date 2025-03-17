import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import PostService from "../api/postHandle";
import PostModel from "../components/PostModel";
import { Colors } from "../constants/Colors";

const Posts = () => {
  const navigation = useNavigation();
  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.light;
  const iconColor = themeColors.icon;
  const bg = themeColors.background;
  const textColor = themeColors.text;

  const route = useRoute();
  const selectedPost = route.params?.postData;
  const selectedIndex = route.params?.selectedIndex || 0;

  const [posts, setPosts] = useState(selectedPost ? [selectedPost] : []);
  const flatListRef = useRef(null);

  const fetchUserPosts = async () => {
    if (!selectedPost?.userId) return;

    try {
      const response = await PostService.GetPostByUserId(selectedPost.userId);
      if (response?.status) {
        const fetchedPosts = response.data.data;
        if (Array.isArray(fetchedPosts) && fetchedPosts.length > 0) {
          const updatedPosts = await Promise.all(
            fetchedPosts.map(async (post) => {
              let thumbnailUrl = "https://placehold.co/150x150?text=No+Image";
              if (post.thumbnailIds && post.thumbnailIds.length > 0) {
                try {
                  const thumbnailResponse = await PostService.getPostMedia(
                    post.thumbnailIds[0]
                  );
                  if (thumbnailResponse?.status) {
                    thumbnailUrl = thumbnailResponse.data;
                  }
                } catch (error) {
                  console.error("Error fetching thumbnail:", error);
                }
              }
              return { ...post, thumbnailUrl };
            })
          );

          setPosts((prevPosts) => {
            const filteredPosts = updatedPosts.filter(
              (post) => post.id !== selectedPost.id
            );

            const newPosts = [...filteredPosts];
            newPosts.splice(selectedIndex, 0, selectedPost);
            return newPosts;
          });

          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: selectedIndex,
              animated: true,
            });
          }, 100);
        } else {
          setPosts(selectedPost ? [selectedPost] : []);
        }
      }
    } catch (error) {
      console.error("Error fetching user posts:", error);
      setPosts(selectedPost ? [selectedPost] : []);
    }
  };

  useEffect(() => {
    fetchUserPosts();
  }, [selectedPost?.userId]);

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View className="flex-row items-center p-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={iconColor} />
        </TouchableOpacity>
        <Text className="text-lg font-bold ml-4" style={{ color: textColor }}>
          Posts
        </Text>
      </View>

      {/* Render All Posts in a FlatList */}
      <FlatList
        ref={flatListRef}
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        initialNumToRender={5}
        renderItem={({ item }) => <PostModel post={item} loading={false} />}
        getItemLayout={(data, index) => ({
          length: 500,
          offset: 500 * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          const wait = new Promise((resolve) => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
            });
          });
        }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-500 text-lg">No posts available</Text>
          </View>
        }
      />
    </View>
  );
};

export default Posts;
