import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImageManipulator from "expo-image-manipulator";
import * as SecureStore from "expo-secure-store";
import { Image, Platform } from "react-native";

const AUTH_API_URL = "http://192.168.31.218:8082";
//const AUTH_API_URL = "https://familygram.onrender.com";

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


    async request(url, options = {}) {
        let accessToken = await this.getAccessToken();

        if (!options.headers) options.headers = {};
        if (accessToken) options.headers.Authorization = `Bearer ${accessToken}`;

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
    }


    async searchByUsername(username) {
        return await this.request(`${AUTH_API_URL}/user/search?username=${encodeURIComponent(username)}`, {
            method: 'GET',
        });
    }

    async logout() {
        return await this.request(`${AUTH_API_URL}/user/logout`, {
            method: 'POST',
        });
    }


    async loginUser(userData) {
        try {
            const response = await fetch(`${AUTH_API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });

            const responseData = await response.json();

            if (response.ok) {
                const { accessToken, refreshToken, myProfile } = responseData.data || {};
                const myProfileData = myProfile;
                if (accessToken && refreshToken) {
                    let thumbnailUrl = "";

                    const thumbnailId = myProfileData.thumbnailId || "67f22def7d18c31ce1040da1";
                    const imageResponse = await this.getProfileImage(thumbnailId);
                    if (imageResponse.status) {
                        thumbnailUrl = imageResponse.data;
                    }

                    if (myProfileData) {
                        myProfileData.thumbnailUrl = thumbnailUrl;
                        await Storage.setItem("userProfile", JSON.stringify(myProfileData));
                    }

                    await this.saveTokens(accessToken, refreshToken);
                }
                return { status: true, message: "Login successful", data: null };
            }
            return { status: false, message: responseData.message || "Login failed", data: null };
        } catch (error) {
            console.error("Login error:", error);
            return { status: false, message: "An error occurred during login", data: null };
        }
    }


    async registerUser(userData) {

        const response = await fetch(`${AUTH_API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });

        const responseData = await response.json();

        if (response.ok) {
            const { accessToken, refreshToken, myProfile } = responseData.data || {};
            const myProfileData = myProfile;
            if (accessToken && refreshToken) {
                let thumbnailUrl = "";

                const thumbnailId = myProfileData.thumbnailId || "67f22def7d18c31ce1040da1";
                const imageResponse = await this.getProfileImage(thumbnailId);
                if (imageResponse.status) {
                    thumbnailUrl = imageResponse.data;
                }
                myProfileData.thumbnailUrl = thumbnailUrl;
                await Storage.setItem("userProfile", JSON.stringify(myProfileData));

                await this.saveTokens(accessToken, refreshToken);
            }
            return { status: true, message: "Register successful", data: null };
        }
        return { status: false, message: responseData.message || "Registration failed", data: null };
    }


    async sendSignupOtp(email) {
        return await fetch(`${AUTH_API_URL}/auth/sendSignupOtp?email=${encodeURIComponent(email)}`, { method: "POST" });
    }


    async getLiteUser(userId) {
        const response = await this.request(`${AUTH_API_URL}/user/${encodeURIComponent(userId)}/lite`, {
            method: "GET",
        });

        if (response.status) {
            const userProfile = response.data.data;


            return { status: true, message: "LiteUser Fetched", data: userProfile };
        } else {
            return { status: false, message: response.message || "Failed to fetch user profile", data: null };
        }

    }

    async updatePrivacy(userId, privacy) {
        const response = await this.request(`${AUTH_API_URL}/user/updatePrivacy?userId=${userId}&privacy=${privacy}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        return response;
    }

    async getSecondProfile(userId) {
        const response = await this.request(`${AUTH_API_URL}/user/byId?userId=${encodeURIComponent(userId)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        if (response.status) {
            const userProfile = response.data.data;

            return { status: true, message: "Second Profile Fetched", data: userProfile };
        } else {
            return { status: false, message: response.message || "Failed to fetch user profile", data: null };
        }

    }
    async toggleFollow(userId, mineId, imageUrl) {
        const response = await this.request(`${AUTH_API_URL}/user/toggleFollow?mineId=${mineId}&yourId=${userId}&imageUrl=${imageUrl}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        if (response.status) {
            return await this.fetchUserProfile(mineId);
        }
    }

    async acceptRequest(userId, mineId) {
        const response = await this.request(`${AUTH_API_URL}/user/accept?mineId=${mineId}&userId=${userId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        if (response.status) {
            await this.fetchUserProfile(mineId);
        }
        return response;
    }
    async rejectFollowRequest(userId, mineId) {
        const response = await this.request(`${AUTH_API_URL}/user/rejectFollowRequest?mineId=${mineId}&yourId=${userId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        if (response.status) {
            await this.fetchUserProfile(mineId);
        }
        return response;
    }

    async updateUserProfile(userData, file) {
        try {
            const formData = new FormData();
            formData.append("user", JSON.stringify(userData));

            if (file) {
                const originalImage = await ImageManipulator.manipulateAsync(
                    file.uri,
                    [],
                    { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG }
                );

                formData.append("file", {
                    uri: originalImage.uri,
                    name: file.fileName || "image.jpg",
                    type: file.mimeType || "image/jpeg",
                });

                const resizedImage = await ImageManipulator.manipulateAsync(
                    file.uri,
                    [{ resize: { width: 100, height: 100 } }],
                    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                );

                formData.append("thumbnail", {
                    uri: resizedImage.uri,
                    name: "thumbnail.jpg",
                    type: "image/jpeg",
                });
            }


            const response = await this.request(`${AUTH_API_URL}/user/update`, {
                method: "POST",
                body: formData,
                headers: {
                    "Content-Type": "multipart/form-data",
                    "Accept": "application/json",
                }
            });
            if (response.status) {
                const userProfile = response.data.data;
                let thumbnailUrl = "";

                const thumbnailId = userProfile.thumbnailId || "67f22def7d18c31ce1040da1";
                const imageResponse = await this.getProfileImage(thumbnailId);
                if (imageResponse.status) {
                    thumbnailUrl = imageResponse.data;
                }
                userProfile.thumbnailUrl = thumbnailUrl;
                await Storage.setItem("userProfile", JSON.stringify(userProfile));

                return {
                    status: true,
                    message: "User profile updated successfully!",
                    data: userProfile,
                };
            } else {
                throw new Error(response.message || "Profile update failed!");
            }
        } catch (error) {
            console.error("Profile update error:", error);
            return {
                status: false,
                message: error.message || "Something went wrong!",
                data: null,
            };
        }
    }

    async fetchUserProfile(mineId) {
        const response = await this.request(`${AUTH_API_URL}/user/myProfile?mineId=${encodeURIComponent(mineId)}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (response.status) {
            const userProfile = response.data.data;
            let thumbnailUrl = "";

            const thumbnailId = userProfile.thumbnailId || "67f22def7d18c31ce1040da1";
            const imageResponse = await this.getProfileImage(thumbnailId);
            if (imageResponse.status) {
                thumbnailUrl = imageResponse.data;
            }
            userProfile.thumbnailUrl = thumbnailUrl;
            await Storage.setItem("userProfile", JSON.stringify(userProfile));
            return userProfile;
        } else {
            return { status: false, message: response.message || "Failed to fetch user profile", data: null };
        }
    }


    async checkUsernameAvailability(username) {
        if (!username) return null;

        const response = await fetch(`${AUTH_API_URL}/auth/checkUsername?username=${username}`, {
            method: "POST",
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
