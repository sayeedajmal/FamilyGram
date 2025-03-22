import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import ContentLoader, { Circle, Rect } from "react-content-loader/native";
import loginSignup from "../api/loginSignup";
import { Colors } from "../constants/Colors";

const Search = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaData, setMediaData] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.dark;
  const bg = themeColors.background;
  const textColor = themeColors.text;

  useEffect(() => {
    if (!searchQuery) {
      setMediaData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true); // Start loading

    const delay = setTimeout(async () => {
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
            return { ...item, thumbnailId: thumbnailUrl };
          })
        );
        setMediaData(updatedMedia);
      } else {
        setMediaData([]);
      }

      setIsLoading(false); // Stop loading
    }, 500);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  const renderProfile = ({ item }) => (
    <TouchableOpacity
      className="flex flex-row items-center px-2 rounded-2xl my-1"
      style={{ backgroundColor: bg }}
      onPress={() =>
        navigation.navigate("UsersProfile", {
          userId: item.id,
          username: item.username,
          name: item.name,
          thumbnailId: item.thumbnailId,
        })
      }
    >
      {/* Profile Image */}
      <Image
        source={{ uri: item.thumbnailId }}
        style={{ width: 40, height: 40, borderRadius: 20 }}
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

  return (
    <View className="h-screen w-screen" style={{ backgroundColor: bg }}>
      {/* Search Bar */}
      <View className="p-4">
        <View>
          <TextInput
            placeholder="Search"
            placeholderTextColor="#aaa"
            style={{ backgroundColor: themeColors.tint, color: textColor }}
            className="pl-8 rounded-2xl font-custom"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
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
        </View>
      </View>

      {/* Recent section */}
      <View className="px-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-sm font-custom" style={{ color: textColor }}>
            Recent
          </Text>
          <TouchableOpacity>
            <Text
              className="text-sm font-custom"
              style={{ color: themeColors.icon }}
            >
              Clear all
            </Text>
          </TouchableOpacity>
        </View>

        {/* Show Skeleton Loader when loading */}
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
                <Rect x="60" y="20" rx="5" ry="5" width="200" height="10" />
                <Rect x="60" y="40" rx="5" ry="5" width="150" height="10" />
              </ContentLoader>
            ))}
          </View>
        ) : (
          // Show real search results
          <FlatList
            data={mediaData}
            renderItem={renderProfile}
            keyExtractor={(item) => item.id}
          />
        )}
      </View>
    </View>
  );
};

export default Search;
