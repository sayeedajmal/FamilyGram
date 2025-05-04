import { Feather, Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import loginSignup from "../api/loginSignup";
import NotificationSocket from "../api/NotificationSocket";
import postHandle from "../api/postHandle";
import { Colors } from "../constants/Colors";

const PostCreationScreen = () => {
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.light;
  const iconColor = themeColors.icon;
  const bg = themeColors.background;
  const textColor = themeColors.text;
  const navigation = useNavigation();

  const videoRefs = useRef({});

  useFocusEffect(
    useCallback(() => {
      return () => {
        setCaption("");
        setLocation("");
        setMediaFiles([]);
        setIsUpdating(false);
      };
    }, [])
  );

  const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png"];
  const SUPPORTED_VIDEO_TYPES = ["video/mp4", "video/mkv", "video/quicktime"];

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const filteredAssets = result.assets.filter(
        (asset) =>
          SUPPORTED_IMAGE_TYPES.includes(asset.mimeType) ||
          SUPPORTED_VIDEO_TYPES.includes(asset.mimeType)
      );

      const selectedFiles = filteredAssets.map((asset) => ({
        uri: asset.uri,
        type:
          asset.mimeType ||
          (asset.type && asset.type.includes("video")
            ? "video/mp4"
            : "image/jpeg"),
        name: asset.fileName || `media_${Date.now()}`,
      }));

      if (selectedFiles.length > 0) {
        setMediaFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
      }
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await loginSignup.getStoredUserProfile();
        setUserProfile(profile);
      } catch (error) {
        Alert.alert("Error", "Failed to fetch profile image.");
      }
    };

    fetchUserProfile();
  }, []);

  const PostCreation = async () => {
    if (mediaFiles.length === 0) {
      Alert.alert("Error", "Please choose at least one media file.");
      return;
    }

    setIsUpdating(true);

    const newPost = {
      userId: userProfile?.id,
      caption,
      location,
    };

    const response = await postHandle.createPostWithThumbnails(
      newPost,
      mediaFiles
    );

    if (response.status) {
      setIsUpdating(false);
      const data = response.data.data;
      Alert.alert("Success", "Post Created Successfully!");

      const postId = data?.id;
      const postThumbId = data?.thumbnailIds?.[0];

      await NotificationSocket.sendNotificationsBulk(
        "POST",
        "Posted a new post",
        userProfile?.username,
        userProfile?.followers,
        userProfile?.id,
        userProfile?.thumbnailId,
        postId,
        postThumbId
      );

      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } else {
      setIsUpdating(false);
      Alert.alert("Error", response.message);
    }
  };

  return (
    <KeyboardAwareScrollView
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: bg, flex: 1 }}
    >
      <KeyboardAvoidingView style={{ flex: 1, padding: 16 }}>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4">
          <Text
            style={{ color: textColor }}
            className="text-lg font-custom-bold"
          >
            Create New Post
          </Text>
          <TouchableOpacity onPress={PostCreation} disabled={isUpdating}>
            {isUpdating ? (
              <ActivityIndicator size="small" color={iconColor} />
            ) : (
              <Ionicons name="send-outline" size={28} color={iconColor} />
            )}
          </TouchableOpacity>
        </View>

        {/* Media Upload & Preview */}
        <TouchableOpacity onPress={pickMedia} className="mb-6 w-[90vw]">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row w-[90vw]"
          >
            {mediaFiles.length > 0 ? (
              mediaFiles.map((file, index) => (
                <TouchableOpacity key={index}>
                  {file.type.includes("video") ? (
                    <Video
                      ref={(ref) => (videoRefs.current[index] = ref)}
                      source={{ uri: file.uri }}
                      rate={1.0}
                      volume={1.0}
                      isMuted={false}
                      resizeMode="cover"
                      shouldPlay
                      isLooping
                      style={{
                        width: 300,
                        height: 300,
                        marginRight: 10,
                        borderRadius: 10,
                      }}
                    />
                  ) : (
                    <Image
                      source={{ uri: file.uri }}
                      style={{
                        width: 300,
                        height: 300,
                        marginRight: 10,
                        borderRadius: 10,
                      }}
                    />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View
                style={{ backgroundColor: themeColors.tint }}
                className="w-[90vw] h-80 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg"
              >
                <Feather name="plus" size={32} color={iconColor} />
                <Text
                  style={{ color: textColor }}
                  className="text-gray-500 mt-2"
                >
                  Select photos or videos
                </Text>
              </View>
            )}
          </ScrollView>
        </TouchableOpacity>

        {/* User Info */}
        <View className="flex-row items-center mb-6">
          <Image
            source={{ uri: userProfile?.thumbnailUrl }}
            className="w-10 h-10 rounded-full"
          />
          <Text
            style={{ color: textColor }}
            className="font-custom-bold text-lg ml-2"
          >
            {userProfile?.username || "You"}
          </Text>
        </View>

        {/* Caption Input */}
        <TextInput
          autoCorrect={true}
          returnKeyType="done"
          spellCheck={true}
          style={{
            color: textColor,
            borderBottomWidth: 1,
            borderBottomColor: "#ccc",
            paddingBottom: 6,
          }}
          placeholder="Write a caption..."
          value={caption}
          className="font-custom"
          placeholderTextColor="#aaa"
          onChangeText={setCaption}
          multiline
        />

        {/* Location Input */}
        <View className="flex-row justify-between items-center my-6">
          <TextInput
            autoCorrect={true}
            style={{ color: textColor, flex: 1 }}
            placeholder="Add location"
            value={location}
            placeholderTextColor="#aaa"
            onChangeText={setLocation}
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
      </KeyboardAvoidingView>
    </KeyboardAwareScrollView>
  );
};

export default PostCreationScreen;
