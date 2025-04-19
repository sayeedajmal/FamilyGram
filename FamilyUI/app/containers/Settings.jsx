import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import loginSignup from "../api/loginSignup";
import { Colors } from "../constants/Colors";

const Settings = ({ setIsAuthenticated }) => {
  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.light;
  const [loading, setLoading] = useState(false);
  const [myProfile, setMyProfile] = useState(null);
  const [privacy, setIsPrivacy] = useState(false);
  const [username, setUsername] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(theme === "dark");

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const profile = await loginSignup.getStoredUserProfile();

    if (profile) {
      setMyProfile(profile);
      setIsPrivacy(profile.privacy);
      setUsername(profile.username);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    const response = await loginSignup.logout();
    if (response.status) {
      loginSignup.clearTokens();
      Alert.alert("Logged Out", "See you soon!", [
        {
          text: "OK",
          onPress: () => {
            setLoading(false);
            setIsAuthenticated(false);
          },
        },
      ]);
    } else {
      setLoading(false);
      Alert.alert("Logout Failed", "Please try again.");
    }
  };

  const updatePrivacy = async () => {
    try {
      setLoading(true);
      const newPrivacy = !privacy;

      // Send the update request to the backend
      const response = await loginSignup.updatePrivacy(
        myProfile?.id,
        newPrivacy
      );

      if (response?.status) {
        Alert.alert(
          "Privacy Updated",
          `Your profile is now ${newPrivacy ? "Private" : "Public"}`
        );

        setIsPrivacy(newPrivacy); // Update toggle UI immediately

        let updatedProfile = await loginSignup.fetchUserProfile(myProfile?.id);
        setMyProfile(updatedProfile);
      } else {
        Alert.alert("Privacy Update Failed", "Please try again.");
      }
    } catch (error) {
      Alert.alert("Privacy Update Failed", "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const updateUsername = () => {
    Alert.alert("Update Username", "Feature coming soon!");
  };

  const updatePassword = () => {
    Alert.alert("Update Password", "Feature coming soon!");
  };

  return (
    <View
      className="flex-1 px-4 pt-6"
      style={{ backgroundColor: themeColors.background }}
    >
      <Text
        className="text-2xl font-bold mb-6"
        style={{ color: themeColors.text }}
      >
        Settings
      </Text>

      {/* Username Field */}
      <View className="mb-4">
        <Text
          className="text-lg font-medium mb-1"
          style={{ color: themeColors.text }}
        >
          Username
        </Text>
        <TextInput
          className="p-2 border rounded-lg"
          style={{
            backgroundColor: themeColors.card,
            borderColor: themeColors.border,
            color: themeColors.text,
          }}
          editable={false}
          value={username}
          onChangeText={setUsername}
          placeholder="Enter new username"
          placeholderTextColor={themeColors.placeholder}
        />
        <TouchableOpacity className="mt-2" onPress={updateUsername}>
          <Text className="text-blue-500">Update Username</Text>
        </TouchableOpacity>
      </View>

      {/* Change Password */}
      <TouchableOpacity
        className="mb-4 flex-row items-center space-x-2"
        onPress={updatePassword}
      >
        <MaterialIcons name="lock-outline" size={24} color={themeColors.text} />
        <Text className="text-lg" style={{ color: themeColors.text }}>
          Change Password
        </Text>
      </TouchableOpacity>

      {/* Privacy Toggle */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg" style={{ color: themeColors.text }}>
          {privacy ? "Private Account" : "Public Account"}
        </Text>
        <Switch value={privacy} onValueChange={updatePrivacy} />
      </View>

      {/* Notifications Toggle */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg" style={{ color: themeColors.text }}>
          Enable Notifications
        </Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
        />
      </View>

      {/* Dark Mode Toggle */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg" style={{ color: themeColors.text }}>
          Dark Mode
        </Text>
        <Switch value={darkMode} onValueChange={() => setDarkMode(!darkMode)} />
      </View>

      {/* Social Links */}
      <View className="mt-6 absolute bottom-0 left-4">
        <Text
          className="text-lg font-medium mb-2"
          style={{ color: themeColors.text }}
        >
          Social Links
        </Text>
        <TouchableOpacity className="mb-2 flex-row items-center space-x-2">
          <Ionicons name="logo-instagram" size={24} color="#E1306C" />
          <Text className="text-lg" style={{ color: themeColors.text }}>
            Instagram
          </Text>
        </TouchableOpacity>
        <TouchableOpacity className="mb-2 flex-row items-center space-x-2">
          <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
          <Text className="text-lg" style={{ color: themeColors.text }}>
            Twitter
          </Text>
        </TouchableOpacity>
        <TouchableOpacity className="mb-2 flex-row items-center space-x-2">
          <Ionicons name="logo-facebook" size={24} color="#1877F2" />
          <Text className="text-lg" style={{ color: themeColors.text }}>
            Facebook
          </Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        className="absolute bottom-6 end-4 p-1"
        onPress={handleLogout}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={themeColors.icon} />
        ) : (
          <Ionicons
            name="log-out"
            size={38}
            color={themeColors.icon}
            className="rounded-2xl"
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

export default Settings;
