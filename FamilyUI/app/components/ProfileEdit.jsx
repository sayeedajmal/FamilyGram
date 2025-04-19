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
  useColorScheme,
} from "react-native";
import loginSignup from "../api/loginSignup";
import { Colors } from "../constants/Colors";

const ProfileEdit = ({ onEdit, onUpdate }) => {
  const [id, setId] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [oldUsername, setOldUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState(null);

  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.light;
  const bg = themeColors.background;
  const textColor = themeColors.text;
  useEffect(() => {
    const fetchProfile = async () => {
      const userProfile = await loginSignup.getStoredUserProfile();
      if (userProfile) {
        setId(userProfile.id || "");
        setUsername(userProfile.username || "");
        setFullName(userProfile.name || "");
        setBio(userProfile.bio || "");
        setWebsite(userProfile.website || "");
        setOldUsername(userProfile.username);
        setEmail(userProfile.email);
        setProfileImage(userProfile.thumbnailUrl || "");
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (username === oldUsername) {
      return;
    }
    if (username.length === 0) {
      setUsernameStatus({
        message: "Please enter username",
        isAvailable: false,
      });
      return;
    }
    const delay = setTimeout(async () => {
      const response = await loginSignup.checkUsernameAvailability(
        username.toLowerCase()
      );
      if (response) {
        setUsernameStatus({
          message: response.message,
          isAvailable: response.data,
        });
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [username, oldUsername]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      setSelectedImage(result.assets[0]);
    }
  };

  const handleUsernameChange = (text) => {
    const sanitizedText = text.replace(/[^a-z0-9-_]/g, "");
    setUsername(sanitizedText);
  };

  const handleSave = async () => {
    setIsUpdating(true);
    const updatedUser = {
      id,
      username: username.toLowerCase(),
      name: fullName,
      bio,
      email,
      website,
    };

    const response = await loginSignup.updateUserProfile(
      updatedUser,
      selectedImage
    );
    if (response.status) {
      Alert.alert("Success", "Profile updated successfully");
      onUpdate();
      onEdit();
    } else {
      Alert.alert("Error", response.message);
      setIsUpdating(false);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: bg }}
      className="content-center h-full w-full max-w-md rounded-xl shadow-lg p-6"
    >
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-2xl font-semibold" style={{ color: textColor }}>
          Edit Profile
        </Text>
      </View>

      <View className="items-center mb-6">
        <View className="relative">
          <Image
            source={{ uri: profileImage || "https://via.placeholder.com/150" }}
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

      <View className="space-y-4">
        <View>
          <Text
            className={`text-sm font-medium m-2 ${
              usernameStatus
                ? usernameStatus.isAvailable
                  ? "text-green-500"
                  : "text-red-500"
                : textColor
            }`}
          >
            {usernameStatus ? usernameStatus.message : "Username"}
          </Text>
          <TextInput
            style={{ color: textColor }}
            value={username}
            onChangeText={handleUsernameChange}
            textContentType="username"
            placeholder="@username"
            className="w-full px-4 py-2 rounded-3xl border border-gray-300"
          />
        </View>

        <View>
          <Text
            className="text-sm font-medium m-2"
            style={{ color: textColor }}
          >
            Full Name
          </Text>
          <TextInput
            style={{ color: textColor }}
            value={fullName}
            onChangeText={setFullName}
            textContentType="name"
            placeholder="Sayeed Ajmal"
            className="w-full px-4 py-2 rounded-3xl border border-gray-300"
          />
        </View>

        <View>
          <Text
            style={{ color: textColor }}
            className="text-sm font-medium m-2"
          >
            Bio
          </Text>
          <TextInput
            style={{ color: textColor }}
            value={bio}
            placeholderTextColor="#aaa"
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            multiline
            className="w-full px-4 py-2 rounded-3xl border border-gray-300 h-24"
          />
        </View>

        <View>
          <Text
            style={{ color: textColor }}
            className="text-sm font-medium m-2"
          >
            Website
          </Text>
          <TextInput
            style={{ color: textColor }}
            value={website}
            placeholderTextColor="#aaa"
            onChangeText={setWebsite}
            textContentType="URL"
            placeholder="https://sayeedthedev.web.app"
            className="w-full px-4 py-2 rounded-3xl border border-gray-300"
          />
        </View>
      </View>

      <View className="flex-row justify-end space-x-3 pt-4">
        <TouchableOpacity
          onPress={onEdit}
          disabled={isUpdating}
          className="px-6 py-2 mx-2 rounded-3xl border border-gray-300"
        >
          <Text style={{ color: textColor }} className="text-gray-700">
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          disabled={
            isUpdating || (usernameStatus && !usernameStatus.isAvailable)
          }
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
    </ScrollView>
  );
};

export default ProfileEdit;
