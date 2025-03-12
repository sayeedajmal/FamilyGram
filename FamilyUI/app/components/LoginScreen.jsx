import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import loginSignup from "../api/loginSignup";
import CustomSnackbar from "../components/CustomSnackbar";
import { Colors } from "../constants/Colors";

export default function LoginScreen({ navigation, setAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.light;
  const iconColor = themeColors.icon;
  const bg = themeColors.background;
  const textColor = themeColors.text;

  const handleLogin = async () => {
    setSnackbar((prev) => ({ ...prev, visible: false }));

    if (!email || !password) {
      setSnackbar({
        visible: true,
        message: "Please enter both email and password",
        type: "error",
      });
      return;
    }

    setLoading(true);

    const response = await loginSignup.loginUser({ email, password });

    if (response.status) {
      setSnackbar({
        visible: true,
        message: "Login successful",
        type: "success",
      });
      setAuthenticated(true);
    } else {
      setSnackbar({
        visible: true,
        message: response.message || "Login failed",
        type: "error",
      });
      setLoading(false);
    }

    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 items-center justify-center px-6 "
      style={{ backgroundColor: bg }}
    >
      <View
        className="w-full justify-center max-w-sm p-6 rounded-3xl shadow-md"
        style={{ backgroundColor: themeColors.tint }}
      >
        <Image
          source={require("../../assets/images/logo.png")}
          className="self-center mb-6"
          style={{ height: 40 }}
          resizeMode="contain"
        />

        <TextInput
          style={{ color: textColor, backgroundColor: bg }}
          placeholder="Email"
          textContentType="emailAddress"
          placeholderTextColor="#aaa"
          className="w-full px-4 py-3 border border-gray-300 rounded-3xl font-custom mb-3"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={{ color: textColor, backgroundColor: bg }}
          placeholder="Password"
          textContentType="password"
          placeholderTextColor="#aaa"
          secureTextEntry
          className="w-full px-4 py-3 border border-gray-300 font-custom rounded-3xl"
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          className="w-full bg-blue-500 py-3 rounded-3xl mt-3 justify-center items-center"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={bg} />
          ) : (
            <Text className="text-white text-lg font-semibold font-custom">
              Log in
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity className="items-center mt-3">
          <Text
            className="text-blue-900 text-xs font-custom"
            style={{ color: textColor }}
          >
            Forgot password?
          </Text>
        </TouchableOpacity>

        <View className="mt-8 h-10 pt-4 border-t border-gray-300 w-full">
          <Text
            className="text-center text-sm font-custom"
            style={{ color: textColor }}
          >
            Don't have an account?
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text
                className="font-semibold h-10 m-1 mt-3 font-custom"
                style={{ color: iconColor }}
              >
                Sign up
              </Text>
            </TouchableOpacity>
          </Text>
        </View>
      </View>

      <CustomSnackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={() => setSnackbar((prev) => ({ ...prev, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}
