import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import loginSignup from "../api/loginSignup";
import CustomSnackbar from "../components/CustomSnackbar";
import { Colors } from "../constants/Colors";

export default function SignupScreen({ navigation, setAuthenticated }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState("success");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null);
  const [usernameError, setUsernameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [fullNameError, setFullNameError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [resendOtpLoading, setResendOtpLoading] = useState(false); // Added for resend OTP
  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.light;
  const bg = themeColors.background;
  const textColor = themeColors.text;

  const showSnackbarMessage = (message, type = "error") => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 3000); // Auto-hide after 3s
  };

  const handleSignup = async () => {
    setLoading(true);
    setShowSnackbar(false);

    let hasError = false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    setEmailError(false);
    setFullNameError(false);
    setPasswordError(false);

    if (!email) {
      showSnackbarMessage("Please enter your email!", "error");
      setEmailError(true);
      hasError = true;
    } else if (!emailRegex.test(email)) {
      showSnackbarMessage("Please enter a valid email address!", "error");
      setEmailError(true);
      hasError = true;
    }

    if (!fullName) {
      showSnackbarMessage("Please enter your full name!", "error");
      setFullNameError(true);
      hasError = true;
    }

    if (!password || password.length < 6) {
      showSnackbarMessage("Password must be at least 6 characters!", "error");
      setPasswordError(true);
      hasError = true;
    }

    if (hasError) {
      setLoading(false);
      return;
    }

    try {
      const response = await loginSignup.sendSignupOtp(email);

      if (response.status) {
        showSnackbarMessage(`OTP Sent Successfully to ${email}`, "success");
        setOtpSent(true);
      } else {
        showSnackbarMessage(response.message || "Internal Error", "error");
      }
    } catch (error) {
      showSnackbarMessage(
        error || "Error processing request. Please try again.",
        "error"
      );
    }

    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    setShowSnackbar(false);

    if (!otp) {
      showSnackbarMessage("Please enter the OTP!", "error");
      return;
    }

    if (!username) {
      showSnackbarMessage("Please enter the Username!", "error");
      return;
    }

    if (!usernameStatus.isAvailable) {
      showSnackbarMessage("Enter Correct Username", "error");
      return;
    }

    setVerifying(true);

    try {
      const userData = {
        username,
        email,
        name: fullName.toString(),
        password,
        bio: otp,
      };
      const response = await loginSignup.registerUser(userData);

      if (response.status) {
        showSnackbarMessage(
          "Registration Successful! Redirecting to Profile...",
          "success"
        );
        setAuthenticated(true);
      } else {
        showSnackbarMessage(response.message || "Internal Error", "error");
      }
    } catch (error) {
      showSnackbarMessage(
        error || "Error processing request. Please try again.",
        "error"
      );
    }

    setVerifying(false);
  };

  const handleResendOtp = async () => {
    setResendOtpLoading(true);
    try {
      const response = await loginSignup.sendSignupOtp(email);
      if (response.status) {
        showSnackbarMessage(`OTP Sent Successfully to ${email}`, "success");
      } else {
        showSnackbarMessage(response.message || "Internal Error", "error");
      }
    } catch (error) {
      showSnackbarMessage(
        error || "Error processing request. Please try again.",
        "error"
      );
    }
    setResendOtpLoading(false);
  };

  useEffect(() => {
    if (username.length === 0) {
      setUsernameStatus({
        message: "Please enter username",
        isAvailable: false,
      });
      return;
    }
    const delay = setTimeout(async () => {
      const response = await loginSignup.checkUsernameAvailability(
        username.toLowerCase()
      );
      if (response) {
        setUsernameStatus({
          message: response.message,
          isAvailable: response.data,
        });
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [username]);

  const handleUsernameChange = (text) => {
    const sanitizedText = text.replace(/[^a-z0-9-_]/g, "");
    setUsername(sanitizedText);
    setUsernameError(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Custom Snackbar - Always on top */}
      <CustomSnackbar
        message={snackbarMessage}
        visible={showSnackbar}
        type={snackbarType}
      />

      <View className="flex-1 items-center justify-center px-6">
        <View
          className="w-full max-w-sm p-6 rounded-3xl shadow-lg"
          style={{ backgroundColor: themeColors.tint }}
        >
          <Image
            source={require("../../assets/images/logo.png")}
            className="self-center mb-6"
            style={{ height: 40 }}
            resizeMode="contain"
          />

          {!otpSent && (
            <>
              <TextInput
                style={{ color: textColor, backgroundColor: bg }}
                placeholder="Full Name"
                textContentType="username"
                placeholderTextColor="#aaa"
                className={`w-full px-4 font-custom py-3 border ${
                  fullNameError ? "border-red-500" : "border-gray-300"
                } rounded-3xl mb-3`}
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  setFullNameError(false);
                }}
              />

              <TextInput
                style={{ color: textColor, backgroundColor: bg }}
                placeholder="Your Email"
                textContentType="emailAddress"
                placeholderTextColor="#aaa"
                className={`w-full px-4 font-custom py-3 border ${
                  emailError ? "border-red-500" : "border-gray-300"
                } rounded-3xl mb-3`}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError(false);
                }}
              />

              <TextInput
                style={{ color: textColor, backgroundColor: bg }}
                placeholder="Password"
                placeholderTextColor="#aaa"
                secureTextEntry
                textContentType="newPassword"
                className={`w-full px-4 font-custom py-3 border ${
                  passwordError ? "border-red-500" : "border-gray-300"
                } rounded-3xl`}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError(false);
                }}
              />

              <TouchableOpacity
                onPress={handleSignup}
                className="w-full bg-blue-500 py-3 rounded-3xl mt-3 flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-lg font-semibold font-custom">
                    Sign Up
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {otpSent && (
            <View className="mt-4">
              <Text
                className="text-gray-600 text-center mb-2 font-custom"
                style={{ color: textColor }}
              >
                Enter OTP sent to your email
              </Text>

              <TextInput
                style={{ color: textColor }}
                placeholder="Enter OTP"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                className="w-full px-4 font-custom text-2xl py-3 border border-gray-300 rounded-3xl mb-3 text-center"
                value={otp}
                onChangeText={setOtp}
              />

              <View>
                <Text
                  className={`text-sm font-medium m-2 ${
                    usernameStatus
                      ? usernameStatus.isAvailable
                        ? "text-green-500"
                        : "text-red-500"
                      : "text-black"
                  }`}
                >
                  {usernameStatus ? usernameStatus.message : "Username"}
                </Text>
                <TextInput
                  style={{ color: textColor }}
                  value={username}
                  placeholderTextColor="#aaa"
                  className={`w-full px-4 font-custom py-3 border ${
                    usernameError ? "border-red-500" : "border-gray-300"
                  } rounded-3xl`}
                  onChangeText={handleUsernameChange}
                  textContentType="username"
                  placeholder="@username"
                />
              </View>

              <TouchableOpacity
                onPress={handleVerifyOtp}
                className="w-full bg-green-500 py-3 my-3 rounded-3xl flex items-center justify-center"
                disabled={verifying}
              >
                {verifying ? (
                  <ActivityIndicator color={bg} />
                ) : (
                  <Text
                    className="text-lg font-semibold font-custom"
                    style={{ color: textColor }}
                  >
                    Verify OTP & Register
                  </Text>
                )}
              </TouchableOpacity>

              {/* Resend OTP */}
              <TouchableOpacity
                onPress={handleResendOtp}
                className="w-full py-3 mt-2 flex items-center justify-center"
                disabled={resendOtpLoading}
              >
                {resendOtpLoading ? (
                  <ActivityIndicator color={bg} />
                ) : (
                  <Text className="text-blue-500 font-semibold text-sm">
                    Resend OTP
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {otpSent && (
            <View className="mt-4 pt-4 border-t border-gray-300 w-full">
              <Text
                className="text-center text-sm font-custom"
                style={{ color: textColor }}
              >
                Already have an account?{" "}
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text className="text-blue-500 font-semibold ml-1 h-6 mt-3 font-custom">
                    Log in
                  </Text>
                </TouchableOpacity>
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
