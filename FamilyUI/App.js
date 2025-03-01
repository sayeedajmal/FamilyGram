import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { CardStyleInterpolators, createStackNavigator, TransitionSpecs } from "@react-navigation/stack";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import loginSignup from "./src/api/loginSignup";
import LoginScreen from "./src/components/LoginScreen";
import ProfileSection from "./src/components/ProfileSection";
import SignupScreen from "./src/components/SignupScreen";
import HomePage from "./src/containers/HomePage";
import "./global.css"

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Unified Storage Handling
const Storage = {
  getItem: async (key) => {
    return Platform.OS === "web" ? await AsyncStorage.getItem(key) : await SecureStore.getItemAsync(key);
  },
  deleteItem: async (key) => {
    return Platform.OS === "web" ? await AsyncStorage.removeItem(key) : await SecureStore.deleteItemAsync(key);
  },
};

// Bottom Tab Navigator
const BottomTabNavigator = () => {
  const [profileImage, setProfileImage] = useState("https://placehold.co/150x150");
  const scaleAnim = new Animated.Value(1); // Animation state

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await loginSignup.getStoredUserProfile();
        if (profile?.photoId) {
          const imageUrl = await loginSignup.getProfileImage(profile.photoId);
          setProfileImage(imageUrl);
        }
      } catch (error) {
        console.error("Error fetching profile image:", error);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === "Profile") {
            Animated.timing(scaleAnim, {
              toValue: focused ? 1.2 : 1,
              duration: 200,
              easing: Easing.ease,
              useNativeDriver: true,
            }).start();

            return (
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <Image
                  source={{ uri: profileImage }}
                  style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderWidth: focused ? 2 : 0,
                    borderColor: focused ? "black" : "transparent",
                  }}
                />
              </Animated.View>
            );
          }

          const icons = {
            Home: "home",
            Search: "search",
            Add: "add-circle",
            Play: "play-circle",
          };
          return (
            <Ionicons
              name={focused ? icons[route.name] : `${icons[route.name]}-outline`}
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: "black",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="Home" component={HomePage} />
      <Tab.Screen name="Search" component={HomePage} />
      <Tab.Screen name="Add" component={HomePage} />
      <Tab.Screen name="Play" component={HomePage} />
      <Tab.Screen name="Profile" component={ProfileSection} />
    </Tab.Navigator>
  );
};

// Main App Component
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const fadeAnim = new Animated.Value(0); // Animation state

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();

    const checkAuth = async () => {
      try {
        const token = await Storage.getItem("accessToken");
        if (!token) {
          setIsAuthenticated(false);
          return;
        }

        const storedProfile = await Storage.getItem("userProfile");
        const userProfile = storedProfile ? JSON.parse(storedProfile) : null;

        if (!userProfile?.email) {
          await Storage.deleteItem("accessToken");
          await Storage.deleteItem("refreshToken");
          setIsAuthenticated(false);
          return;
        }

        const profile = await loginSignup.fetchUserProfileByEmail(userProfile.email);
        if (profile) {
          setIsAuthenticated(true);
        } else {
          await Storage.deleteItem("accessToken");
          await Storage.deleteItem("refreshToken");
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
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <Animated.View style={{ flex: 1, justifyContent: "center", alignItems: "center", opacity: fadeAnim }}>
          <ActivityIndicator size="large" color="#3498db" />
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            transitionSpec: {
              open: TransitionSpecs.TransitionIOSSpec,
              close: TransitionSpecs.TransitionIOSSpec,
            },
            cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
          }}
        >
          {isAuthenticated ? (
            <Stack.Screen name="Main" component={BottomTabNavigator} />
          ) : (
            <>
              <Stack.Screen name="Login">
                {(props) => <LoginScreen {...props} setAuthenticated={setIsAuthenticated} />}
              </Stack.Screen>
              <Stack.Screen name="Signup">
                {(props) => <SignupScreen {...props} setAuthenticated={setIsAuthenticated} />}
              </Stack.Screen>
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}
