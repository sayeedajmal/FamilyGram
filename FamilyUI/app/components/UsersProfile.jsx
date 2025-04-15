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
import NotificationSocket from "../api/NotificationSocket";

export const UsersProfile = () => {
  const [myProfile, setMyProfile] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [fetch, setFetch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("Posts");
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isRequested, setIsRequested] = useState(false);

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
      const response = await loginSignup.getSecondProfile(userId);
      if (response.status) {
        setUserProfile(response.data);
        if (
          response.data.followRequests &&
          Array.isArray(response.data.followRequests)
        ) {
          setIsRequested(response.data.followRequests.includes(myProfile?.id));
        } else {
          setIsRequested(false);
        }
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
      thumbnailUrl
    );

    if (response) {
      setUserProfile(response);

      if (userProfile.privacy && !isFollowing) {
        setIsRequested(true);
        await NotificationSocket.sendNotificationsBulk(
          "FOLLOW_REQUEST",
          "requested to follow you",
          myProfile?.username,
          [userProfile?.id],
          myProfile?.id,
          myProfile?.thumbnailId
        );
      }

      await fetchUserProfile();
      setIsLoading(false);
    } else {
      Alert.alert(
        "Error",
        response.message || "Failed to update follow status"
      );
      setIsLoading(false);
    }
  };

  const FetchPosts = async () => {
    if (!userProfile?.id) return;
    setFetch(true);

    const response = await PostService.GetPostByUserId(userProfile.id);
    if (response?.status) {
      let posts = response.data.data;

      if (Array.isArray(posts) && posts.length > 0) {
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

  // Fetch my profile once
  useEffect(() => {
    fetchMyProfile();
  }, []);

  // Fetch user profile when myProfile is ready
  useEffect(() => {
    if (myProfile && userId) {
      fetchUserProfile();
    }
  }, [myProfile, userId]);

  // Set follow state when both profiles are ready
  useEffect(() => {
    if (userProfile && myProfile) {
      setIsFollowing(
        Array.isArray(myProfile?.following) &&
          myProfile.following.includes(userProfile.id)
      );

      setIsRequested(
        Array.isArray(userProfile.followRequests) &&
          userProfile.followRequests.includes(myProfile.id)
      );
    }
  }, [userProfile, myProfile]);

  // Conditionally fetch posts based on privacy
  useEffect(() => {
    if (!userProfile || !myProfile) return;
  
    const isPrivate = userProfile.privacy;
  
    if (isPrivate) {
      FetchPosts()
      // else: Private and I'm not following → don't fetch
    } else {
      FetchPosts(); // Public profile → always fetch
    }
  }, [userProfile, myProfile, isFollowing]);
  

  const openPost = (post, index) => {
    navigation.navigate("Posts", {
      selectedPost: post,
      selectedIndex: index,
      myProf: myProfile,
      userProf: userProfile,
    });
  };

  // Common header with profile info - shown for both private and public accounts
  const ProfileHeader = () => (
    <View className="w-full flex-col items-center">
      <View className="w-full flex-row justify-between items-center pr-4">
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
            <Text className="font-custom">
              {!userProfile?.privacy || isFollowing
                ? userPosts?.length ?? 0
                : "0"}
            </Text>
            {"\n"} posts
          </Text>
          <Text
            className="text-center font-custom"
            style={{ color: textColor }}
            onPress={userProfile?.privacy && !isFollowing ? null : OpenFollw}
          >
            <Text className="font-custom">
              {userProfile?.followers?.length || "0"}
            </Text>
            {"\n"} followers
          </Text>
          <Text
            className="text-center font-custom"
            style={{ color: textColor }}
            onPress={userProfile?.privacy && !isFollowing ? null : OpenFollw}
          >
            <Text className="font-custom">
              {userProfile?.following?.length || "0"}
            </Text>
            {"\n"} following
          </Text>
        </View>
      </View>
      <View className="px-4 pb-2 w-full flex-col items-start">
        <Text className="text-lg font-custom-bold" style={{ color: textColor }}>
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
          <Text className="font-custom underline" style={{ color: iconColor }}>
            {userProfile?.website || "No website"}
          </Text>
        </TouchableOpacity>
      </View>
      <View className="w-full flex-row justify-between items-center">
        <TouchableOpacity
          className={`flex-1 py-1 rounded-md mx-[1%] ${
            isFollowing || isRequested
              ? `bg-${themeColors.tint} border border-black dark:border-white`
              : "border border-black dark:border-white bg-blue-500"
          }`}
          onPress={toggleFollow}
          disabled={isLoading}
        >
          <Text
            className="text-center font-custom"
            style={{ color: isFollowing || isRequested ? iconColor : "white" }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : isFollowing ? (
              "Following"
            ) : isRequested ? (
              "Requested"
            ) : userProfile?.privacy ? (
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
  );

  // Tabs are only shown for non-private accounts or if we're following a private account
  const TabsNavigation = () => (
    <View className="p-4 w-full flex-row justify-center gap-8 px-4 text-center">
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

  // Content for Posts tab
  const PostsContent = () => {
    if (fetch) {
      return (
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
                <Rect x="0" y="0" rx="8" ry="8" width="100%" height="110" />
              </ContentLoader>
            </View>
          )}
        />
      );
    } else if (userPosts.length > 0) {
      return (
        <FlatList
          data={userPosts}
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
      );
    } else {
      return (
        <View className="flex-1 justify-center items-center">
          <Text
            className="text-gray-500 text-xl font-custom-bold"
            style={{ color: textColor }}
          >
            No posts available
          </Text>
        </View>
      );
    }
  };

  // Private account content
  const PrivateAccountContent = () => (
    <View className="flex-1 items-center justify-center mt-8">
      <MaterialIcons
        name="lock"
        size={50}
        style={{ color: iconColor, marginBottom: 10 }}
      />
      <Text
        className="text-xl font-custom-bold mb-2 text-center px-4"
        style={{ color: textColor }}
      >
        This Account is Private
      </Text>
      <Text
        className="text-base font-custom text-center px-4"
        style={{ color: textColor }}
      >
        Follow this account to see their photos and videos.
      </Text>
    </View>
  );

  // Get content based on selected tab (for public accounts)
  const TabContent = () => {
    switch (activeTab) {
      case "Posts":
        return <PostsContent />;
      case "Reels":
        return (
          <View className="flex-1 items-center justify-center">
            <Text
              className="text-gray-500 text-xl font-custom-bold"
              style={{ color: textColor }}
            >
              No reels available
            </Text>
          </View>
        );
      case "Tagged":
        return (
          <View className="flex-1 items-center justify-center">
            <Text
              className="text-gray-500 text-xl font-custom-bold"
              style={{ color: textColor }}
            >
              No tagged posts
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  // If still loading initial data
  if (!userProfile) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: bg,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={iconColor} />
      </View>
    );
  }

  // Main render method using components
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ProfileHeader />
      {userProfile?.privacy && !isFollowing ? (
        <PrivateAccountContent />
      ) : (
        <>
          <TabsNavigation />
          <TabContent />
        </>
      )}
    </View>
  );
};

export default UsersProfile;
