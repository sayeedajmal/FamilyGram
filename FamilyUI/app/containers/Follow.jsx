import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import loginSignup from "../api/loginSignup";
import FollowModel from "../components/FollowModel";
import { Colors } from "../constants/Colors";
import ContentLoader, { Circle, Rect } from "react-content-loader/native";

const { width } = Dimensions.get("window");

const Follow = ({ route }) => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(true);
  const [loadingFollowing, setLoadingFollowing] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const scrollRef = useRef(null);
  const tabIndicator = useRef(new Animated.Value(0)).current;

  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.dark;
  const bg = themeColors.background;
  const textColor = themeColors.text;
  const { userProfile } = route.params;

  useEffect(() => {
    const fetchFollowers = async () => {
      if (userProfile?.followers?.length > 0) {
        const followersData = await Promise.all(
          userProfile.followers.map(async (followerId) => {
            const response = await loginSignup.getLiteUser(followerId);
            const imageResponse = await loginSignup.getProfileImage(
              response.data?.thumbnailId
            );
            return { ...response.data, userThumbnailUrl: imageResponse.data };
          })
        );
        setFollowers(followersData);
      }
      setLoadingFollowers(false);
    };
    fetchFollowers();
  }, []);

  useEffect(() => {
    const fetchFollowing = async () => {
      if (userProfile?.following?.length > 0) {
        const followingData = await Promise.all(
          userProfile.following.map(async (followingId) => {
            const response = await loginSignup.getLiteUser(followingId);
            const imageResponse = await loginSignup.getProfileImage(
              response.data?.thumbnailId
            );
            return { ...response.data, userThumbnailUrl: imageResponse.data };
          })
        );
        setFollowing(followingData);
      }
      setLoadingFollowing(false);
    };
    fetchFollowing();
  }, []);

  const switchTab = (index) => {
    setActiveTab(index);
    Animated.timing(tabIndicator, {
      toValue: index * (width / 2),
      duration: 200,
      useNativeDriver: false,
    }).start();
    scrollRef.current.scrollTo({ x: index * width, animated: true });
  };

  const UserCardLoader = () => (
    <ContentLoader
      speed={2}
      width={width - 32}
      height={70}
      viewBox={`0 0 ${width - 32} 70`}
      backgroundColor="#f3f3f3"
      foregroundColor="#ecebeb"
    >
      <Circle cx="35" cy="35" r="30" />
      <Rect x="80" y="20" rx="5" ry="5" width="150" height="15" />
      <Rect x="80" y="45" rx="5" ry="5" width="100" height="10" />
      <Rect x={width - 110} y="20" rx="5" ry="5" width="80" height="30" />
    </ContentLoader>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: bg }}>
      {/* Header */}
      <View className="flex-row items-center justify-between p-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.icon} />
        </TouchableOpacity>
        <Text className="text-lg font-custom" style={{ color: textColor }}>
          {userProfile?.username}
        </Text>
        <View className="w-6" />
      </View>

      {/* Tabs with Animation */}
      <View className="relative flex-row">
        <TouchableOpacity
          style={{ flex: 1, paddingVertical: 10 }}
          onPress={() => switchTab(0)}
        >
          <Text
            className={`text-center font-custom ${
              activeTab === 0 ? "font-custom-bold" : ""
            }`}
            style={{ color: activeTab === 0 ? "#0278ae" : textColor }}
          >
            Following
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, paddingVertical: 10 }}
          onPress={() => switchTab(1)}
        >
          <Text
            className={`text-center font-custom ${
              activeTab === 1 ? "font-custom-bold" : ""
            }`}
            style={{ color: activeTab === 1 ? "#0278ae" : textColor }}
          >
            Followers
          </Text>
        </TouchableOpacity>
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: width / 2,
            height: 3,
            backgroundColor: themeColors.icon,
            transform: [{ translateX: tabIndicator }],
          }}
        />
      </View>

      {/* Search Bar */}
      <View>
        <View className="relative">
          <TextInput
            placeholder="Search"
            placeholderTextColor="#aaa"
            className="pl-8 py-2 rounded-lg"
            style={{ color: textColor, backgroundColor: themeColors.tint }}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            className="absolute right-3 top-1/2 -translate-y-1/2"
            onPress={() => setSearchQuery("")}
          >
            <Ionicons
              name="close-circle-sharp"
              color={themeColors.icon}
              size={20}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Swipeable Content */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const pageIndex = Math.round(
            event.nativeEvent.contentOffset.x / width
          );
          setActiveTab(pageIndex);
          Animated.timing(tabIndicator, {
            toValue: pageIndex * (width / 2),
            duration: 200,
            useNativeDriver: false,
          }).start();
        }}
      >
        {/* Following List */}
        <View style={{ width }}>
          {loadingFollowing ? (
            Array.from({ length: 5 }).map((_, index) => (
              <View key={index}>{UserCardLoader()}</View>
            ))
          ) : (
            <FlatList
              data={following}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <FollowModel
                  key={item.id}
                  userThumbnailUrl={item.userThumbnailUrl}
                  userId={item.id}
                  username={item.username}
                  name={item.name}
                  followStatus="Following"
                />
              )}
            />
          )}
        </View>

        {/* Followers List */}
        <View style={{ width }}>
          {loadingFollowers ? (
            Array.from({ length: 5 }).map((_, index) => (
              <View key={index}>{UserCardLoader()}</View>
            ))
          ) : (
            <FlatList
              data={followers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <FollowModel
                  key={item.id}
                  userThumbnailUrl={item.userThumbnailUrl}
                  userId={item.id}
                  username={item.username}
                  name={item.name}
                  followStatus="Follow Back"
                />
              )}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default Follow;
