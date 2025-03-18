import { MaterialIcons } from "@expo/vector-icons";
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
  const selectedPost = route.params?.selectedPost;
  const selectedIndex = route.params?.selectedIndex || 0;
  const myProfile = route.params?.myProf;
  const userProfile = route.params?.userProf;

  const [posts, setPosts] = useState(selectedPost ? [selectedPost] : []);
  const flatListRef = useRef(null);
  const videoRefs = useRef({});

  const fetchUserPosts = async () => {
    if (!selectedPost?.userId) return;

    try {
      const response = await PostService.GetPostByUserId(userProfile.id);
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

          // Filter out selectedPost to avoid duplicates, then insert at selectedIndex
          const filteredPosts = updatedPosts.filter(
            (post) => post.id !== selectedPost.id
          );
          const newPosts = [...filteredPosts];
          newPosts.splice(selectedIndex, 0, selectedPost);

          setPosts(newPosts);
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: selectedIndex,
              animated: false,
            });
          }, 100);
        }
      }
    } catch (error) {
      console.error("Error fetching user posts:", error);
    }
  };

  useEffect(() => {
    //fetchUserPosts();
  }, [selectedPost?.userId]);

  // Handle video play/pause based on visibility
  const onViewableItemsChanged = ({ viewableItems }) => {
    const visiblePostIds = new Set(viewableItems.map((item) => item.item.id));
    Object.keys(videoRefs.current).forEach((id) => {
      if (videoRefs.current[id]) {
        if (visiblePostIds.has(id)) {
          videoRefs.current[id]?.playAsync();
        } else {
          videoRefs.current[id]?.pauseAsync();
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
      <View className="flex-row items-center p-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons
            name="arrow-back-ios-new"
            size={24}
            color={iconColor}
          />
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
        renderItem={({ item }) => (
          <PostModel
            post={selectedPost}
            loading={false}
            myProf={myProfile}
            userProf={userProfile}
            videoRefs={videoRefs}
          />
        )}
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
              animated: false,
            });
          });
        }}
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

export default Posts;
