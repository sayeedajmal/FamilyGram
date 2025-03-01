import { useState } from "react";
import {
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import loginSignup from "../api/loginSignup";
import CustomSnackbar from "../components/CustomSnackbar";

export default function LoginScreen({ navigation, setAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  const handleLogin = async () => {
    setSnackbar({ visible: false });

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

    if (response.status === 200) {
      setSnackbar({
        visible: true,
        message: "Login successful",
        type: "success",
      });

      setAuthenticated(true);

      // ✅ Navigate to Profile
      navigation.replace("ProfileSection");
    } else {
      // Read the response once
      const responseText = await response.text();
      let responseBody = {};
      try {
        responseBody = JSON.parse(responseText);
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }

      setSnackbar({
        visible: true,
        message: responseBody.message || "Invalid credentials",
        type: "error",
      });
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <View className="w-full max-w-sm bg-white p-6 rounded-3xl shadow-lg">
        <Image
          source={{
            uri: "https://www.instagram.com/static/images/web/logged_out_wordmark.png/7a252de00b20.png",
          }}
          className="h-12 w-40 self-center mb-6"
          resizeMode="contain"
        />

        <TextInput
          placeholder="Email"
          textContentType="emailAddress"
          placeholderTextColor="#aaa"
          className="w-full px-4 py-3 border border-gray-300 rounded-3xl bg-gray-50 mb-3"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          placeholder="Password"
          textContentType="password"
          placeholderTextColor="#aaa"
          secureTextEntry
          className="w-full px-4 py-3 border border-gray-300 rounded-3xl bg-gray-50"
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          className="w-full bg-blue-500 py-3 rounded-3xl mt-3"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center text-lg font-semibold">
              Log in
            </Text>
          )}
        </TouchableOpacity>

        <View className="flex-row items-center my-4">
          <View className="flex-1 h-[1px] bg-gray-300"></View>
          <Text className="px-2 text-gray-500 text-sm font-semibold">OR</Text>
          <View className="flex-1 h-[1px] bg-gray-300"></View>
        </View>

        <TouchableOpacity className="w-full flex-row items-center justify-center gap-2">
          <Text className="text-blue-900 font-semibold">
            Log in with Facebook
          </Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text className="block text-center text-xs text-blue-900 mt-2">
            Forgot password?
          </Text>
        </TouchableOpacity>

        <View className="mt-8 pt-4 border-t border-gray-300 w-full max-w-sm">
          <Text className="text-center text-sm">
            Don't have an account?
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text className="text-blue-500 font-semibold ml-1">Sign up</Text>
            </TouchableOpacity>
          </Text>
        </View>
      </View>
      <CustomSnackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
      />
    </View>
  );
}
