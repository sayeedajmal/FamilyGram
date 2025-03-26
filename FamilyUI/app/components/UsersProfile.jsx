import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Linking from "expo-linking";
import React, { useEffect, useState } from "react";
import ContentLoader, { Rect } from "react-content-loader/native";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import loginSignup from "../api/loginSignup";
import { default as PostService } from "../api/postHandle";
import { Colors } from "../constants/Colors";

export const UsersProfile = () => {
  const [myProfile, setMyProfile] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [fetch, setFetch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("Posts");
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.light;
  const iconColor = themeColors.icon;
  const bg = themeColors.background;
  const textColor = themeColors.text;

  const navigation = useNavigation();
  const route = useRoute();
  const userId = route.params?.userId;
  const username = route.params?.username;
  const thumbnailUrl = route.params?.thumbnailUrl;
  const name = route.params?.name;

  const fetchMyProfile = async () => {
    const profile = await loginSignup.getStoredUserProfile();
    if (profile) {
      setMyProfile(profile);
    }
  };

  const fetchUserProfile = async () => {
    if (!userId) return;

    try {
      const response = await loginSignup.getSecondProfile(
        userId,
        myProfile?.id
      );
      if (response.status) {
        setUserProfile(response.data);
      } else {
        Alert.alert("Error", response.message);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch user profile");
    }
  };

  const OpenFollw = () => {
    navigation.navigate("Follow", { userProfile: userProfile });
  };
  const toggleFollow = async () => {
    if (!userProfile?.id || myProfile?.id === userProfile?.id) return;

    setIsLoading(true);

    const response = await loginSignup.toggleFollow(
      userProfile.id,
      myProfile.id,
      thumbnailUrl,
      myProfile.email
    );

    if (response.status) {
      await fetchUserProfile();
    } else {
      Alert.alert("Error", response.message);
    }

    setIsLoading(false);
  };

  const FetchPosts = async () => {
    if (!userProfile?.id) return;
    setFetch(true);

    const response = await PostService.GetPostByUserId(userProfile.id);
    if (response?.status) {
      let posts = response.data.data;

      if (Array.isArray(posts) && posts.length > 0) {
        // Sort posts by createdAt (newest first)
        posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const updatedPosts = await Promise.all(
          posts.map(async (post) => {
            let postThumbnailUrl = "https://placehold.co/150x150?text=No+Image";
            if (post.thumbnailIds && post.thumbnailIds.length > 0) {
              try {
                const thumbnailResponse = await PostService.getPostMedia(
                  post.thumbnailIds[0]
                );
                if (thumbnailResponse?.status) {
                  postThumbnailUrl = thumbnailResponse.data;
                }
              } catch (error) {
                console.error("Error fetching thumbnail:", error);
              }
            }

            return {
              ...post,
              postThumbnailUrl,
              userThumbnailUrl: thumbnailUrl,
            };
          })
        );

        setUserPosts(updatedPosts);
      } else {
        setUserPosts([]);
      }
    }

    setFetch(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyProfile();
    await fetchUserProfile();
    await FetchPosts();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchMyProfile();
  }, []);

  useEffect(() => {
    if (myProfile && userId) {
      fetchUserProfile();
    }

    setIsFollowing(myProfile?.following?.includes(userProfile?.id) || false);
  }, [myProfile, userId, userProfile?.id]);

  useEffect(() => {
    if (userProfile) {
      FetchPosts();
    }
  }, [userProfile]);

  const openPost = (post, index) => {
    navigation.navigate("Posts", {
      selectedPost: post,
      selectedIndex: index,
      myProf: myProfile,
      userProf: userProfile,
    });
  };

  const renderHeader = () => (
    <>
      {/* Profile Header */}
      <View className="w-full flex-row justify-center self-center text-center">
        <View className="w-full flex-col items-center">
          <View className="w-full flex-row justify-between items-center px-4">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialIcons
                name="arrow-back-ios-new"
                size={28}
                style={{ color: iconColor }}
              />
            </TouchableOpacity>
            <Text
              className="text-xl font-custom-bold w-[80%] overflow-hidden"
              style={{ color: textColor }}
            >
              {username}
            </Text>
            <TouchableOpacity>
              <MaterialIcons
                name="notifications-none"
                size={28}
                style={{ color: iconColor }}
              />
            </TouchableOpacity>
            <TouchableOpacity>
              <MaterialIcons
                name="menu-open"
                size={28}
                style={{ color: iconColor }}
              />
            </TouchableOpacity>
          </View>
          <View className="p-2 w-full flex-row justify-around items-center">
            <Image
              source={{ uri: thumbnailUrl }}
              style={{ width: 96, height: 96, borderRadius: 48 }}
            />
            <View className="flex-row gap-6">
              <Text
                className="text-center font-custom"
                style={{ color: textColor }}
              >
                <Text className="font-custom">{userPosts?.length ?? 0}</Text>
                {"\n"} posts
              </Text>
              <Text
                className="text-center font-custom"
                style={{ color: textColor }}
                onPress={OpenFollw}
              >
                <Text className="font-custom">
                  {userProfile?.followers.length || "0"}
                </Text>
                {"\n"} followers
              </Text>
              <Text
                className="text-center font-custom"
                style={{ color: textColor }}
                onPress={OpenFollw}
              >
                <Text className="font-custom">
                  {userProfile?.following.length || "0"}
                </Text>
                {"\n"} following
              </Text>
            </View>
          </View>
          <View className="px-4 pb-2 w-full flex-col items-start">
            <Text
              className="text-lg font-custom-bold"
              style={{ color: textColor }}
            >
              {name}
            </Text>
            <Text
              className="text-start w-[90%] font-custom"
              style={{ color: textColor }}
            >
              {userProfile?.bio || "Bio"}
            </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL(userProfile?.website || "#")}
            >
              <Text
                className="font-custom underline"
                style={{ color: iconColor }}
              >
                {userProfile?.website || "No website"}
              </Text>
            </TouchableOpacity>
          </View>
          <View className="w-full flex-row justify-between items-center">
            <TouchableOpacity
              className={`flex-1 py-1 rounded-md mx-[1%] ${
                isFollowing
                  ? `bg-${themeColors.tint} border border-black dark:border-white`
                  : "bg-blue-500 border-black dark:border-white"
              }`}
              onPress={toggleFollow}
              disabled={isLoading}
            >
              <Text
                className="text-center font-custom"
                style={{ color: isFollowing ? iconColor : "white" }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : isFollowing ? (
                  "Following"
                ) : userProfile?.followRequests?.includes(myProfile?.id) ? (
                  "Requested"
                ) : userProfile?.private ? (
                  "Request"
                ) : (
                  "Follow"
                )}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 border py-1 rounded-md mx-[1%]"
              style={{ borderColor: themeColors.text }}
            >
              <Text
                className="text-center font-custom"
                style={{ color: themeColors.text }}
              >
                Message
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 border py-1 rounded-md mx-[1%]"
              style={{ borderColor: themeColors.text }}
            >
              <Text
                className="text-center font-custom"
                style={{ color: themeColors.text }}
              >
                Share Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tabs Navigation */}
      <View className="p-4 w-[full] flex-row justify-center gap-8 px-4 text-center">
        {["Posts", "Reels", "Tagged"].map((tab) => (
          <TouchableOpacity
            key={tab}
            className="items-center"
            onPress={() => setActiveTab(tab)}
          >
            <MaterialIcons
              name={
                tab === "Posts"
                  ? "grid-4x4"
                  : tab === "Reels"
                  ? "slow-motion-video"
                  : "account-box"
              }
              size={24}
              color={activeTab === tab ? "#0278ae" : "gray"}
            />
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  const renderPostItem = ({ item, index }) => (
    <TouchableOpacity
      style={{ width: "33.33%", aspectRatio: 1 }}
      onPress={() => openPost(item, index)}
    >
      <Image
        source={{ uri: item.postThumbnailUrl }}
        style={{ width: "100%", height: "100%" }}
        className="border border-gray-400"
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  const getTabContent = () => {
    switch (activeTab) {
      case "Posts":
        return (
          <View style={{ flex: 1, backgroundColor: bg }}>
            {renderHeader()}

            {fetch ? (
              <FlatList
                data={Array(9).fill(0)}
                keyExtractor={(_, index) => index.toString()}
                numColumns={3}
                renderItem={() => (
                  <View className="w-[33%] p-1">
                    <ContentLoader
                      speed={2}
                      height={110}
                      viewBox="0 0 110 110"
                      backgroundColor="#e0e0e0"
                      foregroundColor="#d6d6d6"
                    >
                      <Rect
                        x="0"
                        y="0"
                        rx="8"
                        ry="8"
                        width="100%"
                        height="110"
                      />
                    </ContentLoader>
                  </View>
                )}
              />
            ) : userPosts.length > 0 ? (
              <FlatList
                data={activeTab === "Posts" ? userPosts : []}
                keyExtractor={(item) => item.id.toString()}
                numColumns={3}
                renderItem={renderPostItem}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={themeColors.icon}
                    colors={[themeColors.icon]}
                  />
                }
              />
            ) : (
              <View className="flex-1 justify-center items-center">
                <Text className="text-gray-500 text-3xl font-custom-bold">
                  No posts available
                </Text>
              </View>
            )}
          </View>
        );
      case "Reels":
        return (
          <View style={{ flex: 1, backgroundColor: bg }}>
            {renderHeader()}
            <View className="flex-1 items-center justify-center">
              <Text>No reels available</Text>
            </View>
          </View>
        );
      case "Tagged":
        return (
          <View style={{ flex: 1, backgroundColor: bg }}>
            {renderHeader()}
            <View className="flex-1 items-center justify-center">
              <Text>No tagged posts</Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return getTabContent();
};

export default UsersProfile;
