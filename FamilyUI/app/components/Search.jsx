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
import loginSignup from "../api/loginSignup";
import { Colors } from "../constants/Colors";

const Search = () => {
  const navigation = useNavigation();

  const [searchQuery, setSearchQuery] = useState("");
  const [mediaData, setMediaData] = useState([]);
  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.dark;
  const bg = themeColors.background;
  const textColor = themeColors.text;

  useEffect(() => {
    if (!searchQuery) {
      setMediaData([]);
      return;
    }

    const delay = setTimeout(async () => {
      const response = await loginSignup.searchByUsername(
        searchQuery.toLowerCase()
      );
      if (response.status) {
        setMediaData(response.data.data);
      } else {
        setMediaData([]);
      }
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
          thumbnailId: item.thumbnailId || "https://via.placeholder.com/150",
        })
      }
    >
      {/* Profile Image */}
      <Image
        source={{ uri: item.thumbnailId || "https://via.placeholder.com/150" }}
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
            className="pl-8 rounded-2xl font-custom text-center"
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

      {/* Render the profile list */}
      <View className="px-4">
        {/* Recent section (optional, you can add functionality here) */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-sm font-custom" style={{ color: textColor }}>
            Recent
          </Text>
          <TouchableOpacity>
            <Text
              className="text-sm font-custom transition-colors"
              style={{ color: themeColors.icon }}
            >
              Clear all
            </Text>
          </TouchableOpacity>
        </View>

        {/* FlatList to render user profiles */}
        <FlatList
          data={mediaData}
          renderItem={renderProfile}
          keyExtractor={(item) => item.id}
        />
      </View>
    </View>
  );
};

export default Search;
