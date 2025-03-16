import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Auth & Post Service URLs
const AUTH_API_URL = "https://familygram.onrender.com"; // Auth Service

const Storage = {
    setItem: async (key, value) => {
        if (Platform.OS === "web") {
            return AsyncStorage.setItem(key, value);
        }
        return SecureStore.setItemAsync(key, value);
    },
    getItem: async (key) => {
        if (Platform.OS === "web") {
            return AsyncStorage.getItem(key);
        }
        return SecureStore.getItemAsync(key);
    },
    deleteItem: async (key) => {
        if (Platform.OS === "web") {
            return AsyncStorage.removeItem(key);
        }
        return SecureStore.deleteItemAsync(key);
    },
};

class ApiService {
    constructor() {
        this.refreshingPromise = null;
    }

    async getAccessToken() {
        return await Storage.getItem("accessToken");
    }

    async getRefreshToken() {
        return await Storage.getItem("refreshToken");
    }

    async saveTokens(accessToken, refreshToken) {
        try {
            await Storage.setItem("accessToken", accessToken);
            await Storage.setItem("refreshToken", refreshToken);
        } catch (error) {
            console.error("Error saving tokens:", error);
        }
    }

    async clearTokens() {
        await Storage.deleteItem("accessToken");
        await Storage.deleteItem("refreshToken");
        await Storage.deleteItem("userProfile");
    }

    async refreshAccessToken() {
        if (this.refreshingPromise) return this.refreshingPromise;

        this.refreshingPromise = (async () => {
            const refreshToken = await this.getRefreshToken();
            if (!refreshToken) return null;

            try {
                const response = await fetch(`${AUTH_API_URL}/auth/refresh`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${refreshToken}`
                    },
                });

                const responseBody = await response.json();
                if (!response.ok) throw new Error(responseBody.message || "Failed to refresh token");

                await this.saveTokens(responseBody.data.accessToken, responseBody.data.refreshToken);
                return responseBody.data.accessToken;
            } catch (error) {
                await this.clearTokens();
                return null;
            } finally {
                this.refreshingPromise = null;
            }
        })();

        return this.refreshingPromise;
    }

    // 🚀 Universal Request Function (Now Accepts Full URL)
    async request(url, options = {}) {
        let accessToken = await this.getAccessToken();

        if (!options.headers) options.headers = {};
        if (accessToken) options.headers.Authorization = `Bearer ${accessToken}`;

        try {
            let response = await fetch(url, options);

            if (response.status === 406) {
                console.warn("Access token expired. Refreshing token...");
                accessToken = await this.refreshAccessToken();
                if (!accessToken) {
                    return { status: false, message: "Session expired. Please log in again.", data: null };
                }

                options.headers.Authorization = `Bearer ${accessToken}`;
                response = await fetch(url, options);
            }

            const responseData = await response.json();
            return { status: response.ok, message: responseData.message || "Success", data: responseData };
        } catch (error) {
            return { status: false, message: "Network error. Please try again.", data: null };
        }
    }

    // Auth Requests (Uses AUTH_API_URL)
    async loginUser(userData) {
        const response = await this.request(`${AUTH_API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });

        if (response.status) {
            const { accessToken, refreshToken } = response.data.data;
            if (accessToken && refreshToken) {
                await this.saveTokens(accessToken, refreshToken);
            }

            const profileResponse = await this.fetchUserProfileByEmail(userData.email);

            if (profileResponse.status) {
                return { status: true, message: "Login successful", data: profileResponse.data };
            }
        } else {
            return { status: false, message: response.message || "Login failed", data: null };
        }
    }

    async registerUser(userData) {
        const response = await this.request(`${AUTH_API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });

        if (response.status) {
            const { accessToken, refreshToken } = response.data.data;
            if (accessToken && refreshToken) {
                await this.saveTokens(accessToken, refreshToken);
            }

            const profileResponse = await this.fetchUserProfileByEmail(userData.email);
            if (profileResponse.status) {
                return { status: true, message: "Registration successful", data: profileResponse.data };
            }
            return { status: false, message: "Registration successful but failed to fetch profile", data: null };
        } else {
            return { status: false, message: response.message || "Registration failed", data: null };
        }
    }

    async sendSignupOtp(email) {
        return await fetch(`${AUTH_API_URL}/auth/sendSignupOtp?email=${encodeURIComponent(email)}`, { method: "POST" });
    }

    async fetchUserProfileByEmail(email) {
        const response = await this.request(`${AUTH_API_URL}/user/email?email=${encodeURIComponent(email)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        if (response.status) {
            const userProfile = response.data.data;

            // Store the user profile in storage as a JSON string
            await Storage.setItem("userProfile", JSON.stringify(userProfile));

            // Retrieve and parse the stored profile to confirm
            return { status: true, message: "User profile fetched and stored", data: userProfile };
        } else {
            return { status: false, message: response.message || "Failed to fetch user profile", data: null };
        }

    }

    async updateUserProfile(userData, file) {
        const formData = new FormData();
        formData.append("user", JSON.stringify(userData));

        if (file) {
            if (Platform.OS === "web") {
                formData.append("file", file);
            } else {
                formData.append("file", { uri: file.uri, name: file.name || "image.jpg", type: file.type || "image/jpeg" });
            }
        }

        const response = await this.request("/user/update", {
            method: "POST",
            body: formData,
        });


        if (response.status) {
            await Storage.setItem("userProfile", JSON.stringify(response.data.data));
        }

        return response;
    }

    async checkUsernameAvailability(username) {
        if (!username) return null;

        const response = await fetch(`${AUTH_API_URL}/auth/checkUsername?username=${username}`, {
            method: "POST", // Ensure backend supports POST for this
            headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();

        return data;
    }

    async getProfileImage(fieldId) {
        if (!fieldId) return { status: false, message: "No image available", data: null };

        const response = await fetch(`${AUTH_API_URL}/auth/image/${fieldId}`);
        if (!response.ok) return { status: false, message: "Failed to fetch image", data: null };

        if (Platform.OS === "web") {
            const blob = await response.blob();
            return { status: true, message: "Image fetched", data: URL.createObjectURL(blob) };
        }

        return { status: true, message: "Image fetched", data: response.url };
    }


    async getStoredUserProfile() {
        const storedProfile = await Storage.getItem("userProfile");
        if (storedProfile) {
            return JSON.parse(storedProfile);
        }
    }

    async logoutUser() {
        await this.clearTokens();
        return { status: true, message: "Logged out successfully", data: null };
    }
}

const loginSignup = new ApiService();
export default loginSignup;
