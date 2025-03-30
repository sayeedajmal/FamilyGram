import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import loginSignup from "../api/loginSignup";
import postHandle from "../api/postHandle";
import PostModel from "../components/PostModel";
import { Colors } from "../constants/Colors";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

const HomePage = () => {
  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.light;
  const iconColor = themeColors.icon;
  const bg = themeColors.background;
  const textColor = themeColors.text;
  const navigation = useNavigation();

  const [posts, setPosts] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const MAX_POSTS_COUNT = 12;
  const flatListRef = useRef(null);
  const videoRefs = useRef({});

  // Fetch User Profile
  const fetchUserProfile = async () => {
    try {
      const profile = await loginSignup.getStoredUserProfile();
      if (profile) {
        setMyProfile(profile);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch Posts (append option)
  const fetchPosts = async (append = false) => {
    if (!myProfile?.id) return;
    append ? setLoadingMore(true) : setRefreshing(true);

    try {
      const response = await postHandle.getFeed(myProfile.id, 10);
      if (response?.status && response.data?.data) {
        const fetchedPosts = await Promise.all(
          response.data.data.map(async (post) => {
            let userThumbnailUrl = null;
            if (post?.thumbnailId) {
              const profileImageResponse = await loginSignup.getProfileImage(
                post?.thumbnailId
              );
              if (profileImageResponse.status) {
                userThumbnailUrl = profileImageResponse.data;
              }
            }
            return { ...post, userThumbnailUrl };
          })
        );

        setPosts((prev) => {
          // Merge without duplicates
          const combined = append
            ? [
                ...prev,
                ...fetchedPosts.filter(
                  (p) => !prev.find((existing) => existing.id === p.id)
                ),
              ]
            : fetchedPosts;

          // If more than MAX_POSTS_COUNT, remove the oldest 6 posts
          if (combined.length > MAX_POSTS_COUNT) {
            return combined.slice(6);
          }

          return combined;
        });
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      append ? setLoadingMore(false) : setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (myProfile?.id) {
      fetchPosts(false);
    }
  }, [myProfile]);

  // Handle pull-to-refresh
  const onRefresh = () => {
    setPosts([]);
    fetchPosts(false);
  };

  // Auto-play videos when visible
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

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color={iconColor} />
      </View>
    );
  };
  const openNotif = () => {
    navigation.navigate("Notification");
  };
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
          <TouchableOpacity onPress={openNotif}>
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

      {/* Scrollable List (Stories + Posts) */}
      {posts.length === 0 && (
        <View className="flex-1 justify-center items-center px-6 py-10">
          <Image
            source={require("../../assets/images/profile.png")}
            style={{ width: 150, height: 150, marginBottom: 10 }}
            resizeMode="contain"
          />
          <Text className="text-gray-500 text-lg text-center">
            Your feed is empty! Follow people to see their posts.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Search")}
            className="mt-4 px-4 py-2 bg-blue-500 rounded-lg"
          >
            <Text className="text-white font-medium">
              Find People to Follow
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        data={[{ type: "stories" }, ...posts]}
        keyExtractor={(item) =>
          item.type === "stories" ? "stories" : item.id.toString()
        }
        renderItem={({ item }) => {
          if (item.type === "stories") {
            return (
              <View className="py-2">
                <FlatList
                  horizontal
                  className="px-2"
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(story) => story.id}
                  renderItem={({ item }) => (
                    <View className="ml-4 items-center">
                      <View
                        className="border-2 rounded-full p-1"
                        style={{ borderColor: iconColor }}
                      >
                        <Image
                          source={{ uri: item.image }}
                          className="w-16 h-16 rounded-full"
                        />
                      </View>
                      <Text
                        className="text-xs mt-1 text-center"
                        style={{ color: textColor }}
                      >
                        {item.username}
                      </Text>
                    </View>
                  )}
                />
              </View>
            );
          }

          return (
            <PostModel
              post={item}
              loading={refreshing}
              videoRefs={videoRefs}
              myProf={myProfile}
              userProf={{ username: item.username }}
            />
          );
        }}
        initialNumToRender={5}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={() => fetchPosts(true)}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
};

export default HomePage;
