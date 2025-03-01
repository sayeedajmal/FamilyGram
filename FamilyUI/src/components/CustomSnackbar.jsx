import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Platform } from "react-native";

const CustomSnackbar = ({ message, visible, type = "success" }) => {
  const position = useRef(new Animated.Value(-100)).current; // Using useRef to persist animation value

  useEffect(() => {
    if (visible) {
      Animated.timing(position, {
        toValue: 50, // Slide in from top
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Hide after 3 seconds
      setTimeout(() => {
        Animated.timing(position, {
          toValue: -100, // Slide out
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 3000);
    }
  }, [visible]);

  if (!visible || Platform.OS === "web") return null; // Prevent rendering on web

  const backgroundColor = type === "success" ? "#22c55e" : "#ef4444"; // Green for success, Red for error

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: position,
        right: 20,
        backgroundColor,
        padding: 12,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 4,
        maxWidth: 250,
      }}
    >
      <Text style={{ color: "white", fontSize: 14 }}>{message}</Text>
    </Animated.View>
  );
};

export default CustomSnackbar;
