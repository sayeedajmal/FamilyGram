import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import loginSignup from "../api/loginSignup";

const ProfileEdit = ({ onEdit, onUpdate }) => {
  const [id, setId] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false); // <-- Added loading state

  useEffect(() => {
    const fetchProfile = async () => {
      const userProfile = await loginSignup.getStoredUserProfile();
      if (userProfile) {
        setId(userProfile.id);
        setUsername(userProfile.username || "");
        setFullName(userProfile.name || "");
        setBio(userProfile.bio || "");
        setWebsite(userProfile.website || "");

        // Fetch Image URL
        if (userProfile.photoId) {
          const imageUrl = await loginSignup.getProfileImage(
            userProfile.photoId
          );
          setProfileImage(imageUrl);
        }
      }
    };

    fetchProfile();
  }, []);

  // Handle Image Selection
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      setSelectedImage(result.assets[0]);
    }
  };

  // Handle Profile Update
  const handleSave = async () => {
    setIsUpdating(true); // Start loading
    const updatedUser = {
      id: id,
      username,
      name: fullName,
      bio,
      website,
    };

    try {
      const response = await loginSignup.updateUserProfile(
        updatedUser,
        selectedImage
      );
      if (response) {
        Alert.alert("Success", "Profile updated successfully");
        onUpdate(); // Refresh profile
        onEdit(); // Close the edit screen
      } else {
        Alert.alert("Error", "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setIsUpdating(false); // Stop loading
    }
  };

  return (
    <View className="content-center h-full w-full max-w-md bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-2xl font-semibold">Edit Profile</Text>
        <TouchableOpacity onPress={onEdit}>
          <Text className="text-gray-600 text-lg">✖</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Picture */}
      <View className="items-center mb-6">
        <View className="relative">
          <Image
            source={{
              uri: profileImage || "https://via.placeholder.com/150",
            }}
            className="w-24 h-24 rounded-full border-4 border-gray-100"
          />
          <TouchableOpacity
            className="absolute inset-0 items-center justify-center bg-black/40 rounded-full"
            onPress={pickImage}
          >
            <Text className="text-white">📷</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Form */}
      <View className="space-y-4">
        <View>
          <Text className="text-sm font-medium mb-2">Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            textContentType="username"
            placeholder="@username"
            className="w-full px-4 py-2 rounded-3xl border border-gray-300"
          />
        </View>

        <View>
          <Text className="text-sm font-medium mb-2">Full Name</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            textContentType="name"
            placeholder="Sayeed Ajmal"
            className="w-full px-4 py-2 rounded-3xl border border-gray-300"
          />
        </View>

        <View>
          <Text className="text-sm font-medium mb-2">Bio</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            multiline
            className="w-full px-4 py-2 rounded-3xl border border-gray-300 h-24"
          />
        </View>

        <View>
          <Text className="text-sm font-medium mb-2">Website</Text>
          <TextInput
            value={website}
            onChangeText={setWebsite}
            textContentType="URL"
            placeholder="https://sayeedthedev.web.app"
            className="w-full px-4 py-2 rounded-3xl border border-gray-300"
          />
        </View>
      </View>

      {/* Buttons */}
      <View className="flex-row justify-end space-x-3 pt-4">
        <TouchableOpacity
          onPress={onEdit}
          disabled={isUpdating}
          className="px-6 py-2 rounded-3xl border border-gray-300"
        >
          <Text className="text-gray-700">Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          disabled={isUpdating}
          className="px-6 py-2 rounded-3xl bg-blue-500 flex-row items-center"
        >
          {isUpdating ? (
            <ActivityIndicator color="#fff" size="small" className="mr-2" />
          ) : null}
          <Text className="text-white">
            {isUpdating ? "Updating..." : "Save Changes"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProfileEdit;
