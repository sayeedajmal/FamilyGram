import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av"; // Use Expo's Video Component
import { Colors } from "../constants/Colors";

const PostCreationScreen = () => {
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);

  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.light;
  const iconColor = themeColors.icon;
  const bg = themeColors.background;
  const textColor = themeColors.text;

  // Open Image/Video Picker
  const pickMedia = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow images & videos
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const selectedAsset = result.assets[0];
      setMedia(selectedAsset.uri);
      setMediaType(selectedAsset.type); // 'image' or 'video'
    }
  };

  return (
    <ScrollView className="p-6" style={{ backgroundColor: bg }}>
      {/* Header */}
      <View className="flex-row justify-between items-center">
        <Text style={{ color: textColor }} className="text-lg font-custom-bold">
          Create New Post
        </Text>
        <TouchableOpacity>
          <Ionicons name="send-outline" size={28} color={iconColor} />
        </TouchableOpacity>
      </View>

      {/* Media Upload & Preview */}
      <TouchableOpacity onPress={pickMedia}>
        {media ? (
          mediaType === "video" ? (
            // Render video using expo-av
            <Video
              source={{ uri: media }}
              style={{ width: "100%", height: "100%", borderRadius: 10 }}
              useNativeControls // Enables play/pause controls
              resizeMode="contain"
              isLooping
            />
          ) : (
            // Render image
            <Image source={{ uri: media }} className="w-full h-60 rounded-lg" />
          )
        ) : (
          // Upload Placeholder
          <View
            style={{ backgroundColor: themeColors.tint }}
            className="w-full h-[80%] border-2 border-dashed border-gray-300 flex items-center justify-center my-6 rounded-lg"
          >
            <Feather name="plus" size={32} color={iconColor} />
            <Text style={{ color: textColor }} className="text-gray-500 mt-2">
              Select a photo or video
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* User Info */}
      <View className="flex-row items-center space-x-3 mb-6">
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
          }}
          className="w-10 h-10 rounded-full"
        />
        <Text style={{ color: textColor }} className="font-custom text-sm ml-2">
          Sayeed__ajmal
        </Text>
      </View>

      {/* Caption Input */}
      <TextInput
        style={{ color: textColor }}
        placeholder="Write a caption..."
        value={caption}
        placeholderTextColor="#aaa"
        onChangeText={setCaption}
        className="border-b pb-2 text-sm font-custom mb-4"
        multiline
      />

      {/* Location Input */}
      <View className="flex-row justify-between items-center mb-6 font-custom">
        <TextInput
          style={{ color: textColor }}
          placeholder="Add location"
          value={location}
          placeholderTextColor="#aaa"
          onChangeText={setLocation}
          className="flex-1 text-sm"
        />
        <Ionicons name="location-outline" size={20} color={iconColor} />
      </View>

      {/* Options */}
      <TouchableOpacity className="flex-row justify-between items-center py-4 border-t border-b">
        <Text style={{ color: textColor }} className="text-sm">
          Tag People
        </Text>
        <Feather name="chevron-right" size={18} color={iconColor} />
      </TouchableOpacity>

      <TouchableOpacity className="flex-row justify-between items-center py-4 border-b">
        <Text style={{ color: textColor }} className="text-sm">
          Add Music
        </Text>
        <Feather name="chevron-right" size={18} color={iconColor} />
      </TouchableOpacity>

      {/* Advanced Settings */}
      <TouchableOpacity className="flex-row justify-between items-center py-4">
        <Text style={{ color: textColor }} className="text-sm font-medium">
          Advanced Settings
        </Text>
        <Ionicons name="chevron-down" size={18} color={iconColor} />
      </TouchableOpacity>
    </ScrollView>
  );
};

export default PostCreationScreen;
