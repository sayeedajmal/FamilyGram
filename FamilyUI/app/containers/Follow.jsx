import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
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

const { width } = Dimensions.get("window");

const Follow = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const scrollRef = useRef(null);
  const tabIndicator = useRef(new Animated.Value(0)).current;

  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.dark;
  const bg = themeColors.background;
  const iconColor = themeColors.icon;
  const textColor = themeColors.text;

  useEffect(() => {
    const fetchData = async () => {
      const followersResponse = await loginSignup.getFollowers();
      const followingResponse = await loginSignup.getFollowing();
      if (followersResponse.status) setFollowers(followersResponse.data);
      if (followingResponse.status) setFollowing(followingResponse.data);
    };
    fetchData();
  }, []);
  const dummyUsers = [
    {
      id: "1",
      thumbnailId: "https://randomuser.me/api/portraits/men/1.jpg",
      userId: "user_1",
      username: "john_doe",
      name: "John Doe",
      followStatus: "Follow",
    },
    {
      id: "2",
      thumbnailId: "https://randomuser.me/api/portraits/women/2.jpg",
      userId: "user_2",
      username: "emma_watson",
      name: "Emma Watson",
      followStatus: "Follow Back",
    },
    {
      id: "3",
      thumbnailId: "https://randomuser.me/api/portraits/men/3.jpg",
      userId: "user_3",
      username: "michael_smith",
      name: "Michael Smith",
      followStatus: "Message",
    },
  ];

  const switchTab = (index) => {
    setActiveTab(index);
    Animated.timing(tabIndicator, {
      toValue: index * (width / 2),
      duration: 200,
      useNativeDriver: false,
    }).start();
    scrollRef.current.scrollTo({ x: index * width, animated: true });
  };

  return (
    <View className="flex-1" style={{ backgroundColor: bg }}>
      {/* Header */}
      <View className="flex-row items-center justify-between p-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.icon} />
        </TouchableOpacity>
        <Text className="text-lg font-custom" style={{ color: textColor }}>
          sayeed__ajmal
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
            Followers
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
            Following
          </Text>
        </TouchableOpacity>
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: width / 2,
            height: 3,
            backgroundColor: { iconColor },
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
        {/* Followers List */}
        <View style={{ width }}>
          <FlatList
            data={followers.length > 0 ? followers : dummyUsers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <FollowModel
                thumbnailId={item.thumbnailId}
                userId={item.userId}
                username={item.username}
                name={item.name}
                followStatus={item.followStatus}
              />
            )}
          />
        </View>

        {/* Following List */}
        <View style={{ width }}>
          <FlatList
            data={followers.length > 0 ? followers : dummyUsers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <FollowModel
                thumbnailId={item.thumbnailId}
                userId={item.userId}
                username={item.username}
                name={item.name}
                followStatus={item.followStatus}
              />
            )}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default Follow;
