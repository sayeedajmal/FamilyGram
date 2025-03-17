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
import loginSignup from "../api/loginSignup";
import PostService from "../api/postHandle";
import PostModel from "../components/PostModel";
import { Colors } from "../constants/Colors";

const Posts = () => {
  const navigation = useNavigation();
  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.light;
  const [secondProfile, setSecondProfile] = useState(null);
  const [myProfile, setMyProfile] = useState(null);

  const iconColor = themeColors.icon;
  const bg = themeColors.background;
  const textColor = themeColors.text;

  const route = useRoute();
  const selectedPost = route.params?.postData;
  const selectedIndex = route.params?.selectedIndex || 0;

  const [posts, setPosts] = useState(selectedPost ? [selectedPost] : []);
  const flatListRef = useRef(null);
  const videoRefs = useRef({});

  const fetchUserPosts = async () => {
    if (!selectedPost?.userId) return;

    try {
      const response = await PostService.GetPostByUserId(selectedPost.userId);
      if (response?.status) {
        const fetchedPosts = response.data.data;

        if (Array.isArray(fetchedPosts) && fetchedPosts.length > 0) {
          // Remove duplicate selectedPost
          const filteredPosts = fetchedPosts.filter(
            (post) => post.id !== selectedPost.id
          );

          const beforePosts = filteredPosts.slice(0, selectedIndex);
          const afterPosts = filteredPosts.slice(
            selectedIndex,
            selectedIndex + 2
          ); // Posts after

          setPosts([...beforePosts, selectedPost, ...afterPosts]);

          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: selectedIndex,
              animated: false,
            });
          }, 0);
        }
      }
    } catch (error) {
      console.error("Error fetching user posts:", error);
    }
  };

  useEffect(() => {
    fetchUserPosts();
  }, [selectedPost?.userId]);

  //SECOND PROFILE
  const getSecondProfile = async () => {
    if (selectedPost?.userId) {
      const response = await loginSignup.getSecondProfile(selectedPost?.userId);
      if (response.status) {
        const secondProfile = response.data;
        let imageUrl = require("../../assets/images/profile.png");
        if (secondProfile.photoId) {
          try {
            const response = await loginSignup.getProfileImage(
              secondProfile.photoId
            );
            imageUrl = response.data;
          } catch (error) {
            console.log("Error fetching profile image:", error);
          }
        }
        setSecondProfile({ ...secondProfile, imageUrl });
      }
    }
  };
  useEffect(() => {
    getSecondProfile();
  }, []);

  //MY PROFILE
  const fetchUserProfile = async () => {
    const profile = await loginSignup.getStoredUserProfile();
    if (profile) {
      let imageUrl = require("../../assets/images/profile.png");
      if (profile.photoId) {
        try {
          const response = await loginSignup.getProfileImage(profile.photoId);
          imageUrl = response.data;
        } catch (error) {
          console.log("Error fetching profile image:", error);
        }
      }
      setMyProfile({ ...profile, imageUrl });
    }
  };
  useEffect(() => {
    fetchUserProfile();
  }, []);

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
          <Ionicons name="arrow-back" size={24} color={iconColor} />
        </TouchableOpacity>
        <Text className="text-lg font-bold ml-4" style={{ color: textColor }}>
          Posts
        </Text>
      </View>

      {/* Render All Posts in a FlatList */}
      <FlatList
        ref={flatListRef}
        data={posts} // ✅ Correctly ordered posts
        keyExtractor={(item) => item.id.toString()}
        initialNumToRender={5} // ✅ Enough posts to prevent loading issues
        renderItem={({ item }) => (
          <PostModel
            post={item}
            loading={false}
            videoRefs={videoRefs}
            myProfile={myProfile}
            secondProfile={secondProfile}
          />
        )}
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
