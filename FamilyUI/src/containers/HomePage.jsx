import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Posts from "../components/Posts";

const stories = [
  { id: 1, username: "Your Story", image: "https://placekitten.com/100/100" },
  { id: 2, username: "john_doe", image: "https://placekitten.com/101/101" },
  { id: 3, username: "jane_doe", image: "https://placekitten.com/102/102" },
];

const HomePage = () => {
  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-1">
        <Image
          source={require("../../assets/logo.png")}
          resizeMode="contain"
          style={{ height: 30, width: 180, marginLeft: -15 }}
        />
        <View className="flex-row">
          <TouchableOpacity>
            <Ionicons
              name="heart-sharp"
              size={30}
              color="#0278ae"
              className="mx-4"
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="chatbubble-outline" size={30} color="#0278ae" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 py-2"
        >
          {stories.map((story) => (
            <View key={story.id} className="mr-4 items-center">
              <View className="border-2 border-pink-500 rounded-full p-1">
                <Image
                  source={{ uri: story.image }}
                  className="w-16 h-16 rounded-full"
                />
              </View>
              <Text className="text-xs mt-1">{story.username}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Posts */}
        <Posts />
      </ScrollView>
    </View>
  );
};

export default HomePage;
