import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  useColorScheme,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";

const mockUsers = [
  {
    id: "1",
    username: "@nash_m",
    name: "Nash Malik",
    thumbnailUrl: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: "2",
    username: "@sana_p",
    name: "Sana Patel",
    thumbnailUrl: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: "3",
    username: "@aj_dev",
    name: "Ajay Dev",
    thumbnailUrl: "https://randomuser.me/api/portraits/men/55.jpg",
  },
  {
    id: "4",
    username: "@zoe.z",
    name: "Zoe Zhang",
    thumbnailUrl: "https://randomuser.me/api/portraits/women/68.jpg",
  },
  {
    id: "5",
    username: "@leo_k",
    name: "Leon Kennedy",
    thumbnailUrl: "https://randomuser.me/api/portraits/men/77.jpg",
  },
];

const DMScreen = () => {
  const navigation = useNavigation();
  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.light;

  const [searchQuery, setSearchQuery] = useState("");

  const handleProfileSelect = (item) => {
    console.log("Selected:", item.username);
  };

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProfile = ({ item }) => (
    <TouchableOpacity
      className="flex-row items-center px-3 py-2 rounded-2xl my-1"
      onPress={() => handleProfileSelect(item)}
    >
      <Image
        source={{ uri: item.thumbnailUrl }}
        style={{ width: 40, height: 40, borderRadius: 20 }}
        defaultSource={require("../../assets/images/profile.png")}
      />
      <View className="ml-4 flex-1">
        <Text
          className="text-m font-custom-bold"
          style={{ color: themeColors.text }}
        >
          {item.username}
        </Text>
        <Text
          className="text-xs font-custom-italic"
          style={{ color: themeColors.text }}
        >
          {item.name}
        </Text>
      </View>
      <View>
        <Ionicons name="videocam" size={32} color={themeColors.icon} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View
      className="flex-1 px-2 pt-6"
      style={{ backgroundColor: themeColors.background }}
    >
      {/* Header */}
      <View className="flex-row items-center mb-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={themeColors.icon} />
        </TouchableOpacity>
        <Text
          className="ml-4 text-xl font-custom-bold"
          style={{ color: themeColors.text }}
        >
          @Sayeed__Ajmal
        </Text>
      </View>

      {/* Search */}
      <View className="mb-4 relative">
        <TextInput
          placeholder="Search User"
          placeholderTextColor="#aaa"
          style={{ backgroundColor: themeColors.tint, color: themeColors.text }}
          className="pl-10 pr-10 py-2 rounded-2xl font-custom"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <View className="absolute left-3 top-1/2 -translate-y-1/2">
          <Ionicons name="search-outline" size={20} color={themeColors.icon} />
        </View>
        {searchQuery.length > 0 && (
          <TouchableOpacity
            className="absolute right-3 top-1/2 -translate-y-1/2"
            onPress={() => setSearchQuery("")}
          >
            <Ionicons
              name="close-circle-outline"
              size={22}
              color={themeColors.icon}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* User List */}
      <View
        className="flex-1 rounded-xl p-2 mb-2"
        style={{ backgroundColor: themeColors.tint }}
      >
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderProfile}
          ListEmptyComponent={
            <Text className="text-center text-gray-500 font-custom mt-10">
              No users found.
            </Text>
          }
        />
      </View>
    </View>
  );
};

export default DMScreen;
