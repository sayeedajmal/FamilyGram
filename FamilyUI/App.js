import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import "react-native-gesture-handler";
import "./global.css";
import loginSignup from "./src/api/loginSignup";
import LoginScreen from "./src/components/LoginScreen";
import ProfileSection from "./src/components/ProfileSection";
import SignupScreen from "./src/components/SignupScreen";

const Stack = createStackNavigator();

// Helper function to handle storage (SecureStore for mobile, AsyncStorage for web)
const Storage = {
  getItem: async (key) => {
    return Platform.OS === "web" ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key);
  },
  deleteItem: async (key) => {
    return Platform.OS === "web" ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key);
  },
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await Storage.getItem("accessToken");

      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        // 🔥 Get userProfile from storage
        const storedProfile = await Storage.getItem("userProfile");
        const userProfile = storedProfile ? JSON.parse(storedProfile) : null;

        if (!userProfile || !userProfile.email) {
          await Storage.deleteItem("accessToken");
          await Storage.deleteItem("refreshToken");
          setIsAuthenticated(false);
          return;
        }

        // 📨 Use the email from stored profile
        const profile = await loginSignup.fetchUserProfileByEmail(userProfile.email);

        if (profile) {
          setIsAuthenticated(true);
        } else {
          // await Storage.deleteItem("accessToken");
          // await Storage.deleteItem("refreshToken");
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        await Storage.deleteItem("accessToken");
        await Storage.deleteItem("refreshToken");
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="ProfileSection" component={ProfileSection} />
        ) : (
          <>
            <Stack.Screen name="Login">
              {props => <LoginScreen {...props} setAuthenticated={setIsAuthenticated} />}
            </Stack.Screen>
            <Stack.Screen name="Signup">
              {props => <SignupScreen {...props} setAuthenticated={setIsAuthenticated} />}
            </Stack.Screen>

          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}