import * as SecureStore from "expo-secure-store";

const API_URL = `http://localhost:8082`;

export const saveToken = async (accessToken, refreshToken) => {
    try {
        SecureStore.setItem("accessToken", accessToken);
        SecureStore.setItem("refreshToken", refreshToken);
    } catch (error) {
        console.error("Error saving tokens:", error);
    }
};


const getAccessToken = async () => {
    return await SecureStore.getItemAsync("accessToken");
};

const getRefreshToken = async () => {
    return await SecureStore.getItemAsync("refreshToken");
};

const clearTokens = async () => {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
};

const refreshAccessToken = async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) throw new Error("Failed to refresh token");

        const { accessToken } = await response.json();
        await SecureStore.setItemAsync("accessToken", accessToken);
        return accessToken;
    } catch (error) {
        console.error("Token refresh failed:", error);
        await clearTokens();
        return null;
    }
};

const fetchWithAuth = async (url, options = {}) => {
    let accessToken = await getAccessToken();
    if (!accessToken) return null;

    options.headers = {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
    };

    let response = await fetch(url, options);

    if (response.status === 401) {
        accessToken = await refreshAccessToken();
        if (!accessToken) return response;

        options.headers.Authorization = `Bearer ${accessToken}`;
        response = await fetch(url, options);
    }

    return response;
};

const loginSignup = {
    registerUser: async (userData) => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });

        if (response.status === 201) {
            const data = await response.json();
            await saveToken(data.accessToken, data.refreshToken);
        }

        return response;
    },

    sendSignupOtp: async (email) => {
        return fetch(`${API_URL}/auth/sendSignupOtp?email=${encodeURIComponent(email)}`, {
            method: "POST",
        });
    },

    loginUser: async (userData) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });

        if (response.status === 200) {
            const data = await response.json();
            console.log("DATA: ", data.accessToken, data.refreshToken);

            await saveToken(data.accessToken, data.refreshToken);
        }

        return response;
    },

    logoutUser: async () => {
        await clearTokens();
    },

    fetchUserProfile: async () => {
        return fetchWithAuth(`${API_URL}/auth/profile`);
    },
};

export default loginSignup;
