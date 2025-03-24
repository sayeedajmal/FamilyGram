import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Linking from "expo-linking";
import React, { useEffect, useState } from "react";
import ContentLoader, { Circle, Rect } from "react-content-loader/native";
import {
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  Modal,
  useColorScheme,
} from "react-native";
import loginSignup from "../api/loginSignup";
import { default as PostService } from "../api/postHandle";
import ProfileEdit from "../components/ProfileEdit";
import { Colors } from "../constants/Colors";

export const ProfileSection = () => {
  const [myProfile, setMyProfile] = useState(null);
  const [activeEdit, setActiveEdit] = useState(false);
  const [activeTab, setActiveTab] = useState("Posts");
  const [myPosts, setMyPosts] = useState([]);
  const [fetch, setFetch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.light;
  const iconColor = themeColors.icon;
  const bg = themeColors.background;
  const textColor = themeColors.text;
  const navigation = useNavigation();

  const fetchUserProfile = async () => {
    const profile = await loginSignup.getStoredUserProfile();
    if (profile) {
      setMyProfile(profile);
    }
    setRefreshing(false);
  };

  //FETCH POSTS
  const fetchMyPosts = async () => {
    if (!myProfile?.id) return;
    setFetch(true);
    const response = await PostService.GetPostByUserId(myProfile.id);

    if (response?.status) {
      let posts = response.data.data;

      if (Array.isArray(posts) && posts.length > 0) {
        // Sort posts by `createdAt` in descending order (latest first)
        posts = posts.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

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
              userThumbnailUrl: myProfile.thumbnailUrl,
            };
          })
        );

        setMyPosts(updatedPosts);
      } else {
        setMyPosts([]);
      }
    }
    setFetch(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyPosts();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (myProfile) fetchMyPosts();
  }, [myProfile]);

  if (!myProfile) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: bg }}
      >
        <ContentLoader
          speed={2}
          width={300}
          height={300}
          viewBox="0 0 300 300"
          backgroundColor={themeColors.skeletonFg}
          foregroundColor={themeColors.skeletonFg}
        >
          <Circle cx="150" cy="50" r="40" />
          <Rect x="75" y="100" rx="5" ry="5" width="150" height="15" />
          <Rect x="40" y="130" rx="5" ry="5" width="50" height="15" />
          <Rect x="125" y="130" rx="5" ry="5" width="50" height="15" />
          <Rect x="210" y="130" rx="5" ry="5" width="50" height="15" />
          <Rect x="40" y="160" rx="5" ry="5" width="220" height="10" />
          <Rect x="40" y="175" rx="5" ry="5" width="180" height="10" />
          <Rect x="40" y="200" rx="10" ry="10" width="220" height="40" />
        </ContentLoader>
      </View>
    );
  }

  const showSettings = () => {
    navigation.navigate("Settings");
  };

  const OpenFollw = () => {
    navigation.navigate("Follow", { userProfile: myProfile });
  };

  const openPost = (post, index) => {
    navigation.navigate("Posts", {
      selectedPost: post,
      selectedIndex: index,
      myProf: myProfile,
      userProf: myProfile,
    });
  };

  const renderHeader = () => (
    <>
      {/* Profile Header */}
      <View className="w-full flex-row justify-center self-center text-center">
        <View className="w-full flex-col items-center">
          <View className="w-full flex-row justify-between items-center px-4">
            <Text
              className="text-lg font-custom-bold w-[80%] overflow-hidden"
              style={{ color: textColor }}
            >
              {myProfile.username}
            </Text>
            <TouchableOpacity onPress={showSettings}>
              <MaterialIcons
                name="menu-open"
                size={28}
                style={{ color: iconColor }}
              />
            </TouchableOpacity>
          </View>
          <View className="p-2 w-full flex-row justify-around items-center">
            <Image
              source={{ uri: myProfile.thumbnailUrl }}
              style={{ width: 96, height: 96, borderRadius: 48 }}
            />
            <View className="flex-row gap-6">
              <Text
                className="text-center font-custom"
                style={{ color: textColor }}
              >
                <Text className="font-custom">0</Text>
                {"\n"} posts
              </Text>
              <Text
                className="text-center font-custom"
                style={{ color: textColor }}
                onPress={OpenFollw}
              >
                <Text className="font-custom">
                  {myProfile.followers.length || "0"}
                </Text>
                {"\n"} followers
              </Text>
              <Text
                className="text-center font-custom"
                style={{ color: textColor }}
                onPress={OpenFollw}
              >
                <Text className="font-custom">
                  {myProfile.following.length || "0"}
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
              {myProfile.name || "Name"}
            </Text>
            <Text
              className="text-start w-[90%] font-custom-italic"
              style={{ color: textColor }}
            >
              {myProfile.bio || "Bio"}
            </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL(myProfile.website || "#")}
            >
              <Text
                className="font-custom underline"
                style={{ color: iconColor }}
              >
                {myProfile.website || "No website"}
              </Text>
            </TouchableOpacity>
          </View>
          <View className="w-full flex-row justify-between items-center">
            <TouchableOpacity
              className="flex-1 bg-blue-500 py-1 rounded-md mx-[1%]"
              onPress={() => setActiveEdit(true)}
            >
              <Text className="text-center font-custom text-white">
                Edit Profile
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-gray-200 py-1 rounded-md mx-[1%]">
              <Text className="text-center font-custom">Share Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tabs Navigation */}
      <View className="p-4 w-[full] flex-row justify-between gap-8 px-4 text-center">
        {["Posts", "Reels", "Saved", "Tagged"].map((tab) => (
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
                  : tab === "Saved"
                  ? "bookmark"
                  : "account-box"
              }
              size={24}
              color={activeTab === tab ? "#0278ae" : "gray"}
            />
            <Text
              style={{ color: activeTab === tab ? textColor : "gray" }}
              className="font-custom"
            >
              {tab}
            </Text>
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
        className="p-[1%] rounded-sm"
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
                data={Array(9).fill(0)} // Fake data for loader
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
            ) : myPosts.length > 0 ? (
              <FlatList
                data={activeTab === "Posts" ? myPosts : []}
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
      case "Saved":
        return (
          <View style={{ flex: 1, backgroundColor: bg }}>
            {renderHeader()}
            <View className="flex-1 items-center justify-center">
              <Text>No saved posts</Text>
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

  return (
    <>
      {getTabContent()}
      {/* Re-added Modal */}
      <Modal
        className="w-screen ml-0 mb-0"
        visible={activeEdit}
        animationType="slide"
        avoidKeyboard
        swipeDirection="down"
        transparent
        statusBarTranslucent
        onRequestClose={() => setActiveEdit(false)}
      >
        <View className="flex-1 justify-end bg-#0278ae/40">
          <View className="h-[90%] rounded-t-2xl shadow-lg">
            <ProfileEdit
              onEdit={() => setActiveEdit(false)}
              onUpdate={fetchUserProfile}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

export default ProfileSection;
