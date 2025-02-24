import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const API_URL = `http://localhost:8082`;

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

    async getStoredUserProfile() {
        try {
            const storedProfile = await Storage.getItem("userProfile");
            return storedProfile ? JSON.parse(storedProfile) : null;
        } catch (error) {
            console.error("Error retrieving user profile:", error);
            return null;
        }
    }

    /** Save access & refresh tokens securely */
    async saveTokens(accessToken, refreshToken) {
        try {
            await Storage.setItem("accessToken", accessToken);
            await Storage.setItem("refreshToken", refreshToken);
        } catch (error) {
            console.error("Error saving tokens:", error);
        }
    }

    /** Get stored access token */
    async getAccessToken() {
        return await Storage.getItem("accessToken");
    }

    /** Get stored refresh token */
    async getRefreshToken() {
        return await Storage.getItem("refreshToken");
    }

    /** Clear tokens (logout or refresh failure) */
    async clearTokens() {
        await Storage.deleteItem("accessToken");
        await Storage.deleteItem("refreshToken");
    }

    /** Refresh the access token */
    async refreshAccessToken() {
        if (this.refreshingPromise) return this.refreshingPromise;

        this.refreshingPromise = (async () => {
            const refreshToken = await this.getRefreshToken();
            console.log("refreshToken", refreshToken);

            if (!refreshToken) return null;

            try {
                const response = await fetch(`${API_URL}/auth/refresh`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${refreshToken}`,
                    },
                });

                if (!response.ok) throw new Error("Failed to refresh token");

                const { accessToken } = await response.json();
                await this.saveTokens(accessToken, refreshToken);
                return accessToken;
            } catch (error) {
                console.error("Token refresh failed:", error);
                await this.clearTokens();
                return null;
            } finally {
                this.refreshingPromise = null;
            }
        })();

        return this.refreshingPromise;
    }

    /** Central API request method */
    async request(endpoint, options = {}) {
        let accessToken = await this.getAccessToken();

        if (!options.headers) options.headers = {};
        if (accessToken) options.headers.Authorization = `Bearer ${accessToken}`;

        let response = await fetch(`${API_URL}${endpoint}`, options);

        if (response.status === 406) {
            accessToken = await this.refreshAccessToken();
            if (!accessToken) return null;

            options.headers.Authorization = `Bearer ${accessToken}`;
            response = await fetch(`${API_URL}${endpoint}`, options);
        }

        return response;
    }

    /** User Authentication Methods */
    async registerUser(userData) {
        const response = await this.request("/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });

        if (response.status === 200) {
            const data = await response.json();
            await this.saveTokens(data.accessToken, data.refreshToken);

            const profile = await this.fetchUserProfileByEmail(userData.email);
            if (profile) {
                await Storage.setItem("userProfile", JSON.stringify(profile));
            }
        }

        return response;
    }

    async loginUser(userData) {
        const response = await this.request("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });

        if (response.status === 200) {
            const data = await response.json();
            await this.saveTokens(data.accessToken, data.refreshToken);

            const profile = await this.fetchUserProfileByEmail(userData.email);
            if (profile) {
                await Storage.setItem("userProfile", JSON.stringify(profile));
            }
        }

        return response;
    }

    async fetchUserProfileByEmail(email) {
        const response = await this.request(
            `/user/email?email=${encodeURIComponent(email)}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            }
        );

        if (response.ok) {
            return response.json();
        }
    }

    async logoutUser() {
        await this.clearTokens();
    }

    async fetchUserProfile() {
        return this.request("/user/profile");
    }
}

const loginSignup = new ApiService();
export default loginSignup;
