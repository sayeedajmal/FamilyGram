import { useState } from "react";
import {
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
} from "react-native";
import loginSignup from "../../../FamilyUI/api/loginSignup";
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
      className="flex-1 bg-white items-center justify-center px-6"
    >
      <View className="w-full justify-center max-w-sm bg-white p-6 rounded-3xl shadow-md">
        <Image
          source={require("../../assets/images/logo.png")}
          className="self-center mb-6"
          style={{ height: 40 }}
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
          className="w-full bg-blue-500 py-3 rounded-3xl mt-3 justify-center items-center"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-lg font-semibold">Log in</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity className="items-center mt-3">
          <Text className="text-blue-900 text-xs">Forgot password?</Text>
        </TouchableOpacity>

        <View className="mt-8 h-10 pt-4 border-t border-gray-300 w-full">
          <Text className="text-center text-sm">
            Don't have an account?
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text className="text-blue-500 font-semibold h-10 m-1 mt-3">
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
