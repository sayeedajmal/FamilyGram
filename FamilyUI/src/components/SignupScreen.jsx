import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import loginSignup from "../api/loginSignup";
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

  const handleSignup = async () => {
    setLoading(true);
    setShowSnackbar(false); // Reset snackbar visibility before making a call

    let hasError = false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    setEmailError(false);
    setFullNameError(false);
    setPasswordError(false);

    if (!email) {
      setSnackbarMessage("Please enter your email!");
      setSnackbarType("error");
      setEmailError(true);
      hasError = true;
    } else if (!emailRegex.test(email)) {
      setSnackbarMessage("Please enter a valid email address!");
      setSnackbarType("error");
      setEmailError(true);
      hasError = true;
    }
    if (!fullName) {
      setSnackbarMessage("Please enter your full name!");
      setSnackbarType("error");
      setFullNameError(true);
      hasError = true;
    }
    if (!password || password.length < 6) {
      setSnackbarMessage("Password must be at least 6 characters!");
      setSnackbarType("error");
      setPasswordError(true);
      hasError = true;
    }

    if (hasError) {
      setShowSnackbar(true); // Ensure the snackbar is visible after error
      setLoading(false);
      return;
    }

    try {
      const response = await loginSignup.sendSignupOtp(email);
      const responseText = await response.text();

      if (response.status === 200) {
        setSnackbarMessage(`OTP Sent Successfully to ${email}`);
        setSnackbarType("success");
        setOtpSent(true);
        setLoading(false);
      } else {
        let responseBody = {};
        try {
          responseBody = JSON.parse(responseText);
        } catch (error) {
          console.error("JSON Parse Error:", error);
        }
        setSnackbarMessage(responseBody.message || "Internal Error");
        setSnackbarType("error");
        setShowSnackbar(true);
        setVerifying(false);
        setLoading(false);
      }
    } catch (error) {
      setSnackbarMessage("Error processing request. Please try again.", error);
      setSnackbarType("error");
      setVerifying(false);
    }

    setShowSnackbar(true);
    setVerifying(false);
  };

  const handleVerifyOtp = async () => {
    setShowSnackbar(false);

    if (!otp) {
      setSnackbarMessage("Please enter the OTP!");
      setSnackbarType("error");
      setShowSnackbar(true);
      return;
    }

    setVerifying(true);

    try {
      const userData = { email, name: fullName, password, bio: otp };
      const response = await loginSignup.registerUser(userData);
      const responseText = await response.text();

      if (response.status === 201) {
        setSnackbarMessage(
          "Registration Successful! Redirecting to Profile..."
        );
        setSnackbarType("success");

        // ✅ Update Authentication State
        setAuthenticated(true);

        // ✅ Navigate to Profile
        navigation.replace("ProfileSection");
      } else {
        let responseBody = {};
        try {
          responseBody = JSON.parse(responseText);
        } catch (error) {
          console.error("JSON Parse Error:", error);
        }
        setSnackbarMessage(responseBody.message || "Internal Error");
        setSnackbarType("error");
        setShowSnackbar(true);
        setVerifying(false);
        return;
      }
    } catch (error) {
      setSnackbarMessage("Error processing request. Please try again.");
      setSnackbarType("error");
    }

    setShowSnackbar(true);
    setVerifying(false);
  };

  return (
    <View className="flex-1  bg-white items-center justify-center px-6">
      {/* Custom Snackbar */}
      <CustomSnackbar
        message={snackbarMessage}
        visible={showSnackbar}
        type={snackbarType}
      />

      {/* Signup Box */}
      <View className="w-full h-[60%] justify-center max-w-sm bg-white p-6 rounded-3xl shadow-lg">
        <Image
          source={{
            uri: "https://www.instagram.com/static/images/web/logged_out_wordmark.png/7a252de00b20.png",
          }}
          className="h-12 w-40 self-center mb-6"
          resizeMode="contain"
        />

        {/* Hide Signup Fields if OTP is Sent */}
        {!otpSent && (
          <>
            {/* Full Name Input */}
            <TextInput
              placeholder="Full Name"
              textContentType="username"
              showSoftInputOnFocus
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

            {/* Email Input */}
            <TextInput
              placeholder="Your Email"
              textContentType="emailAddress"
              showSoftInputOnFocus
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

            {/* Password Input */}
            <TextInput
              placeholder="Password"
              placeholderTextColor="#aaa"
              secureTextEntry
              textContentType="newPassword"
              showSoftInputOnFocus
              className={`w-full px-4 py-3 border ${
                passwordError ? "border-red-500" : "border-gray-300"
              } rounded-3xl bg-gray-50`}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError(false);
              }}
            />

            {/* Signup Button or Loader */}
            <TouchableOpacity
              onPress={handleSignup}
              className="w-full bg-blue-500 py-3 rounded-3xl mt-3 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-center text-lg font-semibold">
                  Sign Up
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* OTP Input Box (Only show if OTP is sent) */}
        {otpSent && (
          <View className="mt-4">
            <Text className="text-gray-600 text-center mb-2">
              Enter OTP sent to your email
            </Text>
            <TextInput
              placeholder="Enter OTP"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              textContentType="oneTimeCode"
              showSoftInputOnFocus
              className="w-full px-4 py-3 border border-gray-300 rounded-3xl bg-gray-50 mb-3 text-center"
              value={otp}
              onChangeText={setOtp}
            />
            {/* Verify OTP & Register Button */}
            <TouchableOpacity
              onPress={handleVerifyOtp}
              className="w-full bg-green-500 py-3 rounded-3xl flex items-center justify-center"
              disabled={verifying}
            >
              {verifying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-center text-lg font-semibold">
                  Verify OTP & Register
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Already have an account? */}
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
  );
}
