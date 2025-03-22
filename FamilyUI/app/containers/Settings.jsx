import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import loginSignup from "../api/loginSignup";

const Settings = ({ setIsAuthenticated }) => {
  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.light;
  const [loading, setLoading] = useState(false);

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
            setIsAuthenticated(false); // ✅ Update App state to show LoginScreen
          },
        },
      ]);
    } else {
      setLoading(false);
      Alert.alert("Logout Failed", "Please try again.");
    }
  };

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: themeColors.background }}
    >
      <TouchableOpacity
        className="absolute bottom-6 end-4"
        onPress={handleLogout}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={themeColors.icon} />
        ) : (
          <Ionicons
            name="log-out"
            size={28}
            color={themeColors.icon}
            className="rounded-2xl"
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

export default Settings;
