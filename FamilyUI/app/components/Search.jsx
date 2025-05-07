import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import ContentLoader, { Circle, Rect } from "react-content-loader/native";
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useColorScheme,
} from "react-native";
import loginSignup from "../api/loginSignup";
import { Colors } from "../constants/Colors";

const RECENT_SEARCHES_KEY = "recentSearches";
const MAX_RECENT_SEARCHES = 10;

const Search = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaData, setMediaData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showRecentSearches, setShowRecentSearches] = useState(true);
  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.dark;
  const bg = themeColors.background;
  const textColor = themeColors.text;

  // Load recent searches on component mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Load recent searches from AsyncStorage
  const loadRecentSearches = async () => {
    try {
      const storedSearches = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (storedSearches) {
        setRecentSearches(JSON.parse(storedSearches));
      }
    } catch (error) {
      console.error("Error loading recent searches:", error);
    }
  };

  // Save recent searches to AsyncStorage
  const saveRecentSearches = async (searches) => {
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
    } catch (error) {
      console.error("Error saving recent searches:", error);
    }
  };

  // Add a search to recent searches
  const addToRecentSearches = (profile) => {
    // Only add if it's a valid profile and the search had results
    if (!profile || !profile.id) return;

    setRecentSearches((prevSearches) => {
      // Remove the profile if it already exists to avoid duplicates
      const filteredSearches = prevSearches.filter(
        (item) => item.id !== profile.id
      );

      // Add the new profile to the beginning of the array
      const newSearches = [profile, ...filteredSearches].slice(
        0,
        MAX_RECENT_SEARCHES
      );

      // Save to AsyncStorage
      saveRecentSearches(newSearches);

      return newSearches;
    });
  };

  // Clear all recent searches
  const clearRecentSearches = () => {
    Alert.alert(
      "Clear Recent Searches",
      "Are you sure you want to clear all recent searches?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          onPress: async () => {
            setRecentSearches([]);
            await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
          },
          style: "destructive",
        },
      ]
    );
  };

  // Handle search
  useEffect(() => {
    if (!searchQuery) {
      setMediaData([]);
      setIsLoading(false);
      setShowRecentSearches(true);
      return;
    }

    setIsLoading(true);
    setShowRecentSearches(false);

    const delay = setTimeout(async () => {
      try {
        const response = await loginSignup.searchByUsername(
          searchQuery.toLowerCase()
        );

        if (response.status) {
          const updatedMedia = await Promise.all(
            response.data.data.map(async (item) => {
              let thumbnailUrl = item.thumbnailId;
              if (item.thumbnailId) {
                try {
                  const imageResponse = await loginSignup.getProfileImage(
                    item.thumbnailId
                  );
                  if (imageResponse.status) {
                    thumbnailUrl = imageResponse.data;
                  }
                } catch (error) {
                  console.error("Error fetching profile image:", error);
                }
              }
              return { ...item, thumbnailUrl };
            })
          );
          setMediaData(updatedMedia);
        } else {
          setMediaData([]);
        }
      } catch (error) {
        console.error("Error searching for users:", error);
        setMediaData([]);
      }

      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  // Handle profile selection
  const handleProfileSelect = (profile) => {
    // Add the selected profile to recent searches
    addToRecentSearches(profile);

    // Navigate to the user's profile
    navigation.navigate("UsersProfile", {
      userId: profile.id,
      username: profile.username,
      name: profile.name,
      thumbnailUrl: profile.thumbnailUrl,
    });
  };

  // Render a profile item in the list
  const renderProfile = ({ item }) => (
    <TouchableOpacity
      className="flex flex-row items-center px-2 rounded-2xl my-1"
      style={{ backgroundColor: bg }}
      onPress={() => handleProfileSelect(item)}
    >
      {/* Profile Image */}
      <Image
        source={{ uri: item.thumbnailUrl }}
        style={{ width: 40, height: 40, borderRadius: 20 }}
        defaultSource={require("../../assets/images/profile.png")}
      />

      {/* Profile Info */}
      <View className="ml-4 flex-1">
        <Text className="text-sm font-custom" style={{ color: textColor }}>
          {item.username}
        </Text>
        <Text className="text-xs" style={{ color: textColor }}>
          {item.name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Handle selecting a recent search
  const handleRecentSearchSelect = (item) => {
    setSearchQuery(item.username);
    handleProfileSelect(item);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="h-screen w-screen"
      style={{ backgroundColor: bg }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1">
          {/* Search Bar */}
          <View className="p-4">
            <View>
              <TextInput
                placeholder="Search"
                placeholderTextColor="#aaa"
                style={{ backgroundColor: themeColors.tint, color: textColor }}
                className="pl-8 rounded-2xl py-2 font-custom"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <View className="absolute left-3 top-1/2 -translate-y-1/2">
                <Ionicons
                  name="search-outline"
                  color={themeColors.icon}
                  size={20}
                />
              </View>
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  onPress={() => setSearchQuery("")}
                >
                  <Ionicons
                    name="close-circle-outline"
                    color={themeColors.icon}
                    size={25}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View className="px-4 flex-1">
            {/* Show recent searches when no search is active */}
            {showRecentSearches && recentSearches.length > 0 && (
              <>
                <View className="flex-row justify-between items-center mb-4">
                  <Text
                    className="text-sm font-custom"
                    style={{ color: textColor }}
                  >
                    Recent
                  </Text>
                  <TouchableOpacity onPress={clearRecentSearches}>
                    <Text
                      className="text-sm font-custom"
                      style={{ color: themeColors.icon }}
                    >
                      Clear all
                    </Text>
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={recentSearches}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      className="flex flex-row items-center px-2 rounded-2xl my-1"
                      style={{ backgroundColor: bg }}
                      onPress={() => handleRecentSearchSelect(item)}
                    >
                      {/* Profile Image */}
                      <Image
                        source={{ uri: item.thumbnailUrl }}
                        style={{ width: 40, height: 40, borderRadius: 20 }}
                        defaultSource={require("../../assets/images/profile.png")}
                      />

                      {/* Profile Info */}
                      <View className="ml-4 flex-1">
                        <Text
                          className="text-sm font-custom"
                          style={{ color: textColor }}
                        >
                          {item.username}
                        </Text>
                        <Text className="text-xs" style={{ color: textColor }}>
                          {item.name}
                        </Text>
                      </View>

                      {/* Time Icon (for visual indication of recent search) */}
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color={themeColors.icon}
                      />
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => `recent-${item.id}`}
                  keyboardShouldPersistTaps="handled"
                />
              </>
            )}

            {/* Show results or skeleton loader during search */}
            {!showRecentSearches && (
              <>
                {isLoading ? (
                  <View>
                    {[1, 2, 3, 4, 5].map((index) => (
                      <ContentLoader
                        key={index}
                        speed={2}
                        width={400}
                        height={60}
                        viewBox="0 0 400 60"
                        backgroundColor={themeColors.skeletonBg}
                        foregroundColor={themeColors.skeletonFg}
                      >
                        <Circle cx="30" cy="30" r="20" />
                        <Rect
                          x="60"
                          y="20"
                          rx="5"
                          ry="5"
                          width="200"
                          height="10"
                        />
                        <Rect
                          x="60"
                          y="40"
                          rx="5"
                          ry="5"
                          width="150"
                          height="10"
                        />
                      </ContentLoader>
                    ))}
                  </View>
                ) : (
                  <>
                    {mediaData.length > 0 ? (
                      <FlatList
                        data={mediaData}
                        renderItem={renderProfile}
                        keyExtractor={(item) => `search-${item.id}`}
                        keyboardShouldPersistTaps="handled"
                      />
                    ) : (
                      searchQuery.length > 0 && (
                        <View className="flex-1 justify-center items-center">
                          <Ionicons
                            name="search-outline"
                            size={50}
                            color={themeColors.icon}
                          />
                          <Text
                            className="mt-4 text-center"
                            style={{ color: textColor }}
                          >
                            No results found for "{searchQuery}"
                          </Text>
                        </View>
                      )
                    )}
                  </>
                )}
              </>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default Search;
