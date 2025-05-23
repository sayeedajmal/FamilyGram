import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
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
import NotificationSocket from "../api/NotificationSocket";

const HomePage = () => {
  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.light;
  const iconColor = themeColors.icon;
  const bg = themeColors.background;
  const textColor = themeColors.text;
  const navigation = useNavigation();
  const [unreadCount, setUnreadCount] = useState(0);

  const [posts, setPosts] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const MAX_POSTS_COUNT = 10;
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

  // Set up notification handler only once when profile is loaded
  useEffect(() => {
    const handleNewNotification = (notification) => {
        setUnreadCount((prev) => prev + 1);
      };

      // We only need to set the handler, the connection is managed in App.js
      NotificationSocket.onNotificationReceived = handleNewNotification;
    NotificationSocket.connect();

    return () => {
      NotificationSocket.disconnect();
    };
  }, []);

  const post = [
    {
      id: "post001",
      username: "sara.k",
      userThumbnailUrl: "https://randomuser.me/api/portraits/women/45.jpg",
      caption: "Chasing sunsets 🌅✨",
      location: "Santa Monica, CA",
      mediaUrls: [
        "https://plus.unsplash.com/premium_photo-1678495222603-b66f6393c166?q=80&w=1978&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
      mediaType: "image",
      likes: [],
      createdAt: "2025-04-10 19:27:45",
    },
    {
      id: "post002",
      username: "jay_m",
      userThumbnailUrl: "https://randomuser.me/api/portraits/men/32.jpg",
      caption: "Quick drone test flight 🎥",
      location: "Austin, TX",
      mediaUrls: [
        "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      ],
      mediaType: "video",
      likes: [],
      createdAt: "2025-04-10 19:27:45",
    },
    {
      id: "post003",
      username: "lena.art",
      userThumbnailUrl: "https://randomuser.me/api/portraits/women/65.jpg",
      caption: "New art piece finally done 🎨🖼️",
      location: "Berlin, Germany",
      mediaUrls: [
        "https://images.unsplash.com/photo-1742599968125-a790a680a605?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1734630630491-458df4f38213?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
      mediaType: "image",
      likes: [],
      createdAt: "2025-04-10 19:27:45",
    },
    {
      id: "post004",
      username: "travel.jon",
      userThumbnailUrl: "https://randomuser.me/api/portraits/men/74.jpg",
      caption: "Exploring Kyoto with my lens 📷🍁",
      location: "Kyoto, Japan",
      mediaUrls: [
        "https://www.sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
      ],
      mediaType: "video",
      likes: [],
      createdAt: "2025-04-10 19:27:45",
    },
    {
      id: "post005",
      username: "nina_cafe",
      userThumbnailUrl: "https://randomuser.me/api/portraits/women/12.jpg",
      caption: "Coffee and calm mornings ☕🌿",
      location: "Paris, France",
      mediaUrls: [
        "https://images.unsplash.com/photo-1741687969502-4c406092f7de?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
      mediaType: "image",
      likes: [],
      createdAt: "2025-04-10 19:27:45",
    },
  ];

  const fetchPosts = async (append = false) => {
    if (!myProfile?.id) return;
    append ? setLoadingMore(true) : setRefreshing(true);

    try {
      const response = await postHandle.getFeed(myProfile?.id, 0);
      setPage((prev) => (prev === 10 ? 0 : prev + 1));
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
          const combined = append
            ? [
                ...prev,
                ...fetchedPosts.filter(
                  (p) => !prev.find((existing) => existing.id === p.id)
                ),
              ]
            : fetchedPosts;

          if (combined.length > MAX_POSTS_COUNT) {
            return combined.slice(6);
          }

          return combined;
        });
      }

      //setPosts(post);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      append ? setLoadingMore(false) : setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchPosts(false);
  }, []);

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
    setUnreadCount(0);
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
          <TouchableOpacity
            onPress={openNotif}
            style={{ position: "relative" }}
          >
            <Ionicons
              name="heart-sharp"
              size={30}
              color={iconColor}
              className="mx-4"
            />
            {unreadCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: 6,
                  right: 12,
                  backgroundColor: "red",
                  borderRadius: 10,
                  width: 10,
                  height: 10,
                }}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity>
            <Ionicons name="chatbubble-outline" size={30} color={iconColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable List (Stories + Posts) */}
      {/* {posts.length === 0 && (
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
      )} */}

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
