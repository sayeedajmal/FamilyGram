import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Platform, StyleSheet } from "react-native";

const CustomSnackbar = ({ message, visible, type = "success", onDismiss }) => {
  const position = useRef(new Animated.Value(-100)).current;
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.timing(position, {
        toValue: Platform.OS === "web" ? 20 : 50, // Adjust top position for web
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Clear any existing timeout before setting a new one
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      // Auto-hide after 3 seconds
      timeoutRef.current = setTimeout(() => {
        Animated.timing(position, {
          toValue: -100, // Slide out
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          if (onDismiss) onDismiss(); // Call onDismiss when animation ends
        });
      }, 3000);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [visible]);

  const backgroundColor = type === "success" ? "#22c55e" : "#ef4444"; // Green for success, Red for error

  return (
    <Animated.View
      style={[
        styles.snackbar,
        { backgroundColor, transform: [{ translateY: position }] },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  snackbar: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    maxWidth: "90%",
    minWidth: 200,
    padding: 12,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5, // For Android shadow
    zIndex: 1000,
  },
  text: {
    color: "white",
    fontSize: 14,
    textAlign: "center",
  },
});

export default CustomSnackbar;
