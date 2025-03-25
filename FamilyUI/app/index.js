import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { CardStyleInterpolators, createStackNavigator } from "@react-navigation/stack";
import { useFonts } from "expo-font";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import ContentLoader, { Circle, Rect } from "react-content-loader/native";
import { Animated, Appearance, Easing, Image, Platform, StatusBar, View } from "react-native";
import Settings from "../app/containers/Settings";
import "../global.css";
import loginSignup from "./api/loginSignup";
import LoginScreen from "./components/LoginScreen";
import Search from "./components/Search";
import SignupScreen from "./components/SignupScreen";
import UsersProfile from "./components/UsersProfile";
import { Colors } from "./constants/Colors";
import Follow from "./containers/Follow";
import HomePage from "./containers/HomePage";
import PostCreationScreen from "./containers/PostCreationScreen";
import Posts from "./containers/Posts";
import ProfileSection from "./containers/ProfileSection";

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
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [profileImage, setProfileImage] = useState("");
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(1);

  const [theme, setTheme] = useState(Appearance.getColorScheme());
  const themeColors = Colors[theme];



  const [fonts] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    SpaceBold: require("../assets/fonts/SpaceMono-Bold.ttf"),
    SpaceItalic: require("../assets/fonts/SpaceMono-Italic.ttf"),

  });

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
        setProfileImage(userProfile.thumbnailUrl);
        const profile = await loginSignup.fetchUserProfileByEmail(userProfile.email);
        setIsAuthenticated(profile.status);
      } catch (error) {
        console.error("Authentication check failed:", error);
        loginSignup.clearTokens();
        setIsAuthenticated(false);
      }
    };

    // const fetchUserProfile = async () => {
    //   const profile = await loginSignup.getStoredUserProfile();

    //   if (profile?.thumbnailId) {
    //     const imageUrl = await loginSignup.getProfileImage(profile.thumbnailId);
    //     setProfileImage(imageUrl.data);
    //   }
    // };

    checkAuth();
    //fetchUserProfile();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar
        barStyle={
          themeColors === 'dark'
            ? Platform.OS === 'ios'
              ? 'light-content'
              : 'light-content'
            : 'dark-content'
        }
        backgroundColor={themeColors.background}
      />
      {isAuthenticated ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs">
            {() => (
              <Tab.Navigator
                screenOptions={({ route }) => ({
                  tabBarStyle: {
                    backgroundColor: themeColors.background,
                    height: Platform.OS === "ios" ? 0 : 50,
                    padding: 0,
                    margin: 0
                  },
                  keyboardHidesTabBar: true,
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
                            source={
                              profileImage
                                ? { uri: profileImage }
                                : require("../assets/images/profile.png")
                            }
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
                <Tab.Screen name="Search" component={Search} />
                <Tab.Screen name="Add" component={PostCreationScreen} />
                <Tab.Screen name="Play" component={HomePage} />
                <Tab.Screen name="Profile" component={ProfileSection} />
              </Tab.Navigator>
            )}
          </Stack.Screen>
          <Stack.Screen name="Posts" options={{
            presentation: 'transparentModal',
            animation: 'slide_from_right'
          }} component={Posts} />

          <Stack.Screen name="Follow" options={{
            presentation: "card",
            gestureEnabled: true,
            gestureDirection: "horizontal",
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
            headerShown: false,
            cardOverlayEnabled: true,
            detachPreviousScreen: false,
            cardStyle: {
              overflow: "hidden",
            },
            overlayEnabled: true,
          }} component={Follow} />

          <Stack.Screen
            name="Settings"
            options={{
              presentation: "card",
              gestureEnabled: true,
              gestureDirection: "horizontal",
              cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
              headerShown: false,
              cardOverlayEnabled: true,
              detachPreviousScreen: false,
              cardStyle: {
                overflow: "hidden",
              },
              overlayEnabled: true,
            }}
          >
            {(props) => <Settings {...props} setIsAuthenticated={setIsAuthenticated} />}
          </Stack.Screen>

          <Stack.Screen name="UsersProfile" options={{
            presentation: "card",
            gestureEnabled: true,
            gestureDirection: "horizontal",
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
            headerShown: false,
            cardOverlayEnabled: true,
            detachPreviousScreen: false,
            cardStyle: {
              overflow: "hidden",
            },
            overlayEnabled: true,
          }} component={UsersProfile} />

        </Stack.Navigator>
      ) : (
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            transitionSpec: {
              open: { animation: 'timing', config: { duration: 300 } },
              close: { animation: 'timing', config: { duration: 300 } },
            },
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
    </View>
  );
}