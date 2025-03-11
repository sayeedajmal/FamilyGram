import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import loginSignup from "../../../FamilyUI/api/loginSignup";
import CustomSnackbar from "../components/CustomSnackbar";

export default function SignupScreen({ navigation, setAuthenticated }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState("success");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [emailError, setEmailError] = useState(false);
  const [fullNameError, setFullNameError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

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

    setVerifying(true);

    try {
      const userData = {
        email,
        name: fullName.toLocaleLowerCase(),
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
        navigation.replace("ProfileSection");
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

  return (
    <View className="flex-1 bg-white">
      {/* Custom Snackbar - Always on top */}
      <CustomSnackbar
        message={snackbarMessage}
        visible={showSnackbar}
        type={snackbarType}
      />

      <View className="flex-1 items-center justify-center px-6">
        <View className="w-full max-w-sm bg-white p-6 rounded-3xl shadow-lg">
          <Image
            source={require("../../assets/images/logo.png")}
            className="self-center mb-6"
            style={{ height: 40 }}
            resizeMode="contain"
          />

          {!otpSent && (
            <>
              <TextInput
                placeholder="Full Name"
                textContentType="username"
                placeholderTextColor="#aaa"
                className={`w-full px-4 py-3 border ${
                  fullNameError ? "border-red-500" : "border-gray-300"
                } rounded-3xl bg-gray-50 mb-3`}
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  setFullNameError(false);
                }}
              />

              <TextInput
                placeholder="Your Email"
                textContentType="emailAddress"
                placeholderTextColor="#aaa"
                className={`w-full px-4 py-3 border ${
                  emailError ? "border-red-500" : "border-gray-300"
                } rounded-3xl bg-gray-50 mb-3`}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError(false);
                }}
              />

              <TextInput
                placeholder="Password"
                placeholderTextColor="#aaa"
                secureTextEntry
                textContentType="newPassword"
                className={`w-full px-4 py-3 border ${
                  passwordError ? "border-red-500" : "border-gray-300"
                } rounded-3xl bg-gray-50`}
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
                  <Text className="text-white text-lg font-semibold">
                    Sign Up
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {otpSent && (
            <View className="mt-4">
              <Text className="text-gray-600 text-center mb-2">
                Enter OTP sent to your email
              </Text>
              <TextInput
                placeholder="Enter OTP"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                className="w-full px-4 py-3 border border-gray-300 rounded-3xl bg-gray-50 mb-3 text-center"
                value={otp}
                onChangeText={setOtp}
              />
              <TouchableOpacity
                onPress={handleVerifyOtp}
                className="w-full bg-green-500 py-3 rounded-3xl flex items-center justify-center"
                disabled={verifying}
              >
                {verifying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-lg font-semibold">
                    Verify OTP & Register
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {!otpSent && (
            <View className="mt-8 pt-4 border-t border-gray-300 w-full">
              <Text className="text-center text-sm">
                Already have an account?
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text className="text-blue-500 font-semibold ml-1 h-6 mt-3">
                    {" "}
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
