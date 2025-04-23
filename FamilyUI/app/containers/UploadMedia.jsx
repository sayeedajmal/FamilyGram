import { Feather, Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import loginSignup from "../api/loginSignup";
import postHandle from "../api/postHandle";

const UploadMedia = () => {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch User Profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await loginSignup.getStoredUserProfile();
        if (profile) {
          if (profile.photoId) {
            const response = await loginSignup.getProfileImage(profile.photoId);
            setUserProfile({ ...profile, imageUrl: response.data });
          } else {
            setUserProfile(profile);
          }
        }
      } catch (error) {
        Alert.alert("Error", "Failed to fetch profile image.");
      }
    };
    fetchUserProfile();
  }, []);

  // Select Multiple Media Files
  const pickMedia = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const selectedFiles = result.assets.map((asset) => ({
        uri: asset.uri,
        type:
          asset.mimeType ||
          (asset.type.includes("video") ? "video/mp4" : "image/jpeg"),
        name: asset.fileName || `media_${Date.now()}`,
      }));
      setMediaFiles([...mediaFiles, ...selectedFiles]);
    }
  };

  // Upload Post with Media
  const uploadPost = async () => {
    if (mediaFiles.length === 0) {
      Alert.alert("No Media", "Please select at least one media file.");
      return;
    }

    setIsUploading(true);
    try {
      const newPost = {
        userId: userProfile?.id,
        caption,
        location,
        type: mediaFiles[0]?.type.includes("video") ? "video" : "image",
      };

      const response = await postHandle.createPostWithThumbnails(
        newPost,
        mediaFiles
      );
      if (response.status) {
        Alert.alert("Success", "Post uploaded successfully!");
        setMediaFiles([]);
        setCaption("");
        setLocation("");
      } else {
        Alert.alert("Error", response.message);
      }
    } catch (error) {
      Alert.alert("Upload Failed", "Something went wrong.");
    }
    setIsUploading(false);
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#fff" }}>
      {/* Profile Header */}
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}
      >
        <Image
          source={
            userProfile?.imageUrl
              ? { uri: userProfile.imageUrl }
              : require("../../assets/images/profile.png")
          }
          style={{ width: 40, height: 40, borderRadius: 20 }}
        />
        <Text style={{ marginLeft: 10, fontSize: 16, fontWeight: "bold" }}>
          {userProfile?.username || "You"}
        </Text>
      </View>

      {/* Caption Input */}
      <TextInput
        style={{
          borderBottomWidth: 1,
          borderBottomColor: "#ccc",
          paddingBottom: 6,
          marginBottom: 10,
        }}
        placeholder="Write a caption..."
        value={caption}
        onChangeText={setCaption}
        multiline
      />

      {/* Location Input */}
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
      >
        <TextInput
          style={{ flex: 1 }}
          placeholder="Add location"
          value={location}
          onChangeText={setLocation}
        />
        <Ionicons name="location-outline" size={20} color="gray" />
      </View>

      {/* Media Selection Button */}
      <TouchableOpacity onPress={pickMedia} style={{ marginBottom: 15 }}>
        <View
          style={{
            backgroundColor: "#eee",
            padding: 20,
            alignItems: "center",
            borderRadius: 10,
          }}
        >
          <Feather name="plus" size={32} color="#555" />
          <Text style={{ color: "#555", marginTop: 8 }}>Select Media</Text>
        </View>
      </TouchableOpacity>

      {/* Preview Selected Media */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {mediaFiles.map((file, index) => (
          <View key={index} style={{ marginRight: 10 }}>
            {file.type.includes("video") ? (
              <Video
                source={{ uri: file.uri }}
                style={{ width: 100, height: 100, borderRadius: 8 }}
                useNativeControls
                resizeMode="cover"
                isLooping
              />
            ) : (
              <Image
                source={{ uri: file.uri }}
                style={{ width: 100, height: 100, borderRadius: 8 }}
              />
            )}
          </View>
        ))}
      </ScrollView>

      {/* Upload Button */}
      <TouchableOpacity
        onPress={uploadPost}
        style={{
          backgroundColor: "#007AFF",
          padding: 12,
          alignItems: "center",
          borderRadius: 8,
          marginTop: 20,
        }}
      >
        {isUploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontSize: 16 }}>Upload Post</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default UploadMedia;
