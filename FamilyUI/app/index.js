import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { CardStyleInterpolators, createStackNavigator, TransitionSpecs } from "@react-navigation/stack";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import ContentLoader, { Circle, Rect } from "react-content-loader/native";
import { Animated, Appearance, Easing, Image, Platform, StatusBar, View } from "react-native";
import loginSignup from "./api/loginSignup";
import LoginScreen from "./components/LoginScreen";
import ProfileSection from "./components/ProfileSection";
import SignupScreen from "./components/SignupScreen";
import { Colors } from "./constants/Colors";
import HomePage from "./containers/HomePage";
import "../global.css";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const Storage = {
  setItem: async (key, value) => {
    return Platform.OS === "web" ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value);
  },
  getItem: async (key) => {
    return Platform.OS === "web" ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key);
  },
  deleteItem: async (key) => {
    return Platform.OS === "web" ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key);
  },
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [profileImage, setProfileImage] = useState("");
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(1);

  const [theme, setTheme] = useState(Appearance.getColorScheme());
  const themeColors = Colors[theme];

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

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
          loginSignup.clearTokens();
          return;
        }

        const userProfile = await loginSignup.getStoredUserProfile();
        if (!userProfile?.email) {
          setIsAuthenticated(false);
          loginSignup.clearTokens();
          return;
        }

        const profile = await loginSignup.fetchUserProfileByEmail(userProfile.email);
        setIsAuthenticated(profile.status === true);
      } catch (error) {
        console.error("Authentication check failed:", error);
        loginSignup.clearTokens();
        setIsAuthenticated(false);
      }
    };

    const fetchUserProfile = async () => {
      const profile = await loginSignup.getStoredUserProfile();
      if (profile?.photoId) {
        const imageUrl = await loginSignup.getProfileImage(profile.photoId);
        setProfileImage(imageUrl.data);
      }
    };

    checkAuth();
    fetchUserProfile();
  }, []);

  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, backgroundColor: themeColors.background, justifyContent: "center", alignItems: "center" }}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <ContentLoader
            speed={2}
            width={400}
            height={500}
            viewBox="0 0 400 500"
            backgroundColor="#f3f3f3"
            foregroundColor={themeColors.skeletonFg}
          >
            <Circle cx="50" cy="40" r="30" />
            <Rect x="90" y="20" rx="5" ry="5" width="200" height="10" />
            <Rect x="90" y="40" rx="5" ry="5" width="150" height="10" />
            <Rect x="0" y="80" rx="5" ry="5" width="400" height="200" />
            <Rect x="0" y="300" rx="5" ry="5" width="300" height="10" />
            <Rect x="0" y="320" rx="5" ry="5" width="250" height="10" />
            <Rect x="0" y="340" rx="5" ry="5" width="280" height="10" />
          </ContentLoader>
        </Animated.View>
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
        animated={true}
        showHideTransition="fade"
        backgroundColor={themeColors.background}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
      />

      {isAuthenticated ? (
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarStyle: {
              backgroundColor: themeColors.background,
            },
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
                      source={profileImage ? { uri: profileImage } : require("../assets/images/iconLauncher.png")}
                      style={{
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        borderWidth: focused ? 2 : 0,
                        borderColor: focused ? "#0278ae" : "transparent",
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
            tabBarActiveTintColor: "#0278ae",
            tabBarInactiveTintColor: "gray",
          })}
        >
          <Tab.Screen name="Home" component={HomePage} />
          <Tab.Screen name="Search" component={HomePage} />
          <Tab.Screen name="Add" component={HomePage} />
          <Tab.Screen name="Play" component={HomePage} />
          <Tab.Screen name="Profile" component={ProfileSection} />
        </Tab.Navigator>
      ) : (
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
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} setAuthenticated={setIsAuthenticated} />}
          </Stack.Screen>
          <Stack.Screen name="Signup">
            {(props) => <SignupScreen {...props} setAuthenticated={setIsAuthenticated} />}
          </Stack.Screen>
        </Stack.Navigator>
      )}
    </>
  );
}
