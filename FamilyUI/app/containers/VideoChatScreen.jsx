import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  useColorScheme,
  StyleSheet,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Colors } from "../constants/Colors";

const VideoChatScreen = () => {
  const navigation = useNavigation();
  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.light;

  const [permission, requestPermission] = useCameraPermissions();
  const [isMuted, setIsMuted] = useState(false);
  const [facing, setFacing] = useState("front");
  const [callStatus, setCallStatus] = useState("calling"); // "calling", "connected", "ended"

  const cameraRef = useRef(null);

  useEffect(() => {
    // Simulate someone accepting the call after 5 seconds
    // In a real app, this would be replaced with actual call signaling
    const timer = setTimeout(() => {
      setCallStatus("connected");
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const toggleMute = () => setIsMuted((prev) => !prev);
  const switchCamera = () =>
    setFacing((current) => (current === "back" ? "front" : "back"));
  const handleHangUp = () => {
    setCallStatus("ended");
    navigation.goBack();
  };

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={styles.container}>
        <Text style={{ color: themeColors.text }}>Loading...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions not granted yet
    return (
      <View style={styles.container}>
        <Text style={{ color: themeColors.text }}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={{ color: themeColors.text }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {callStatus === "calling" ? (
        // During calling state, show your own camera full screen
        <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
          {/* Status indicator */}
          <View style={styles.statusContainer}>
            <Text style={styles.username}>@Sayeed__Ajmal</Text>
            <Text style={styles.callingText}>Calling...</Text>
          </View>

          {/* Controls */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              onPress={toggleMute}
              style={[styles.controlButton, isMuted && styles.mutedButton]}
            >
              <Ionicons
                name={isMuted ? "mic-off" : "mic"}
                size={24}
                color="white"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={switchCamera}
              style={styles.controlButton}
            >
              <Ionicons name="camera-reverse" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Hang Up Button - bottom center */}
          <View style={styles.hangupContainer}>
            <TouchableOpacity
              onPress={handleHangUp}
              style={styles.hangupButton}
            >
              <Ionicons name="call" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </CameraView>
      ) : (
        // When connected, show opponent's video full screen with your camera in PIP
        <View style={styles.connectedContainer}>
          {/* Main screen - would be opponent's video in a real app */}
          <View style={styles.opponentVideo}>
            <Text style={styles.opponentText}>Opponent's Video</Text>
          </View>

          {/* Your camera in small PIP view */}
          <View style={styles.selfViewContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.selfCamera}
              facing={facing}
            />
          </View>

          {/* Controls for connected state */}
          <View style={styles.connectedControlsContainer}>
            <TouchableOpacity
              onPress={toggleMute}
              style={[styles.controlButton, isMuted && styles.mutedButton]}
            >
              <Ionicons
                name={isMuted ? "mic-off" : "mic"}
                size={24}
                color="white"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={switchCamera}
              style={styles.controlButton}
            >
              <Ionicons name="camera-reverse" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleHangUp}
              style={[styles.controlButton, styles.hangupButtonSmall]}
            >
              <Ionicons name="call" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
  },
  camera: {
    flex: 1,
    padding: 0,
    borderRadius: 20,
  },
  statusContainer: {
    position: "absolute",
    top: 40,
    width: "100%",
    alignItems: "center",
  },
  username: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },
  callingText: {
    color: "white",
    marginTop: 8,
  },
  selfViewContainer: {
    position: "absolute",
    top: 16,
    right: 16,
    height: 140,
    width: 90,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "white",
  },
  selfCamera: {
    width: "100%",
    height: "100%",
  },
  selfView: {
    width: "100%",
    height: "100%",
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  selfViewText: {
    color: "white",
    fontSize: 12,
  },
  connectedContainer: {
    flex: 1,
    position: "relative",
  },
  opponentVideo: {
    flex: 1,
    backgroundColor: "#1f2937",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  opponentText: {
    color: "white",
    fontSize: 22,
  },
  controlsContainer: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "column",
    gap: 12,
  },
  connectedControlsContainer: {
    position: "absolute",
    bottom: 24,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  controlButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 25,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  mutedButton: {
    backgroundColor: "#f87171",
  },
  hangupContainer: {
    position: "absolute",
    bottom: 24,
    width: "100%",
    alignItems: "center",
  },
  hangupButton: {
    backgroundColor: "#ef4444",
    borderRadius: 30,
    padding: 16,
  },
  hangupButtonSmall: {
    backgroundColor: "#ef4444",
  },
  permissionButton: {
    marginTop: 16,
    backgroundColor: "#3498db",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});

export default VideoChatScreen;
