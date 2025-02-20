import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function LoginScreen() {
  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      {/* Login Box */}
      <View className="w-full max-w-sm bg-white p-6 rounded-3xl shadow-lg">
        {/* Instagram Logo */}
        <Image
          source={{
            uri: "https://www.instagram.com/static/images/web/logged_out_wordmark.png/7a252de00b20.png",
          }}
          className="h-12 w-40 self-center mb-6"
          resizeMode="contain"
        />

        {/* Username Input */}
        <TextInput
          placeholder="Phone number, username, or email"
          placeholderTextColor="#aaa"
          className="w-full px-4 py-3 border border-gray-300 rounded-3xl bg-gray-50 mb-3"
        />

        {/* Password Input */}
        <TextInput
          placeholder="Password"
          placeholderTextColor="#aaa"
          secureTextEntry
          className="w-full px-4 py-3 border border-gray-300 rounded-3xl bg-gray-50"
        />

        {/* Login Button */}
        <TouchableOpacity className="w-full bg-blue-500 py-3 rounded-3xl mt-3">
          <Text className="text-white text-center text-lg font-semibold">
            Log in
          </Text>
        </TouchableOpacity>

        {/* OR Divider */}
        <View className="flex-row items-center my-4">
          <View className="flex-1 h-[1px] bg-gray-300"></View>
          <Text className="px-2 text-gray-500 text-sm font-semibold">OR</Text>
          <View className="flex-1 h-[1px] bg-gray-300"></View>
        </View>

        {/* Login with Facebook */}
        <TouchableOpacity className="w-full flex-row items-center justify-center gap-2">
          <Text className="text-blue-900 font-semibold">
            Log in with Facebook
          </Text>
        </TouchableOpacity>

        {/* Forgot Password */}
        <TouchableOpacity>
          <Text className="block text-center text-xs text-blue-900 mt-2">
            Forgot password?
          </Text>
        </TouchableOpacity>

        <View className="mt-8 pt-4 border-t border-gray-300 w-full max-w-sm">
          <Text className="text-center text-sm">
            Don't have an account?
            <TouchableOpacity>
              <Text className="text-blue-500 font-semibold ml-1">Sign up</Text>
            </TouchableOpacity>
          </Text>
        </View>
      </View>
    </View>
  );
}
