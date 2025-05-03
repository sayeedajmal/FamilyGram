import * as ImageManipulator from "expo-image-manipulator";
import * as VideoThumbnails from "expo-video-thumbnails";
import { Platform } from "react-native";

import loginSignup from "./loginSignup";
//const API_URL = "http://34.55.86.158:8080";
const FEED_URL = "https://familyfeed.onrender.com";
const POST_URL="https://familypost.onrender.com"

class PostService {

    async createPostWithThumbnails(post, files) {
        const formData = new FormData();
        const thumbnails = [];

        for (const file of files) {
            if (!file) continue;

            const mimeType = file.type;
            const fileName = file.name || `upload.${mimeType.split("/")[1]}`;
            let fileUri = Platform.OS === "ios" ? file.uri.replace("file://", "") : file.uri;

            // 👉 Compress image only (Expo doesn't support video compression)
            if (mimeType.includes("image")) {
                const compressedImage = await ImageManipulator.manipulateAsync(
                    fileUri,
                    [{ resize: { width: 1080 } }],
                    { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
                );
                fileUri = compressedImage.uri;
            }

            // 👇 Add file to formData (video remains uncompressed)
            formData.append("files", {
                uri: fileUri,
                name: fileName,
                type: mimeType,
            });

            // 👉 Generate thumbnail (images resized, videos get snapshot)
            let thumbnail;
            if (mimeType.includes("video")) {
                const { uri } = await VideoThumbnails.getThumbnailAsync(fileUri, {
                    time: 1000,
                    quality: 0.2,
                });
                thumbnail = uri;
            } else {
                const resizedImage = await ImageManipulator.manipulateAsync(
                    fileUri,
                    [{ resize: { width: 300 } }],
                    { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG }
                );
                thumbnail = resizedImage.uri;
            }

            const thumbFileName = `thumb_${fileName}`;
            thumbnails.push({ uri: thumbnail, name: thumbFileName, type: "image/jpeg" });
        }

        thumbnails.forEach((thumb) => {
            formData.append("thumbnails", thumb);
        });

        formData.append("post", JSON.stringify(post));

        const response = await loginSignup.request(`${POST_URL}/posts`, {
            method: "POST",
            headers: {
                "Content-Type": "multipart/form-data",
            },
            body: formData,
        });

        return response;
    }

    async GetPostByUserId(userId) {

        if (!userId) {
            throw new Error("User ID is required");
        }
        console.log("BUDDY: ",userId)

        const response = await loginSignup.request(`${POST_URL}/posts?userId=${userId}`, {
            method: "GET",
        });


        return response;
    }

    async DeletePostById(postId) {

        if (!postId) {
            throw new Error("Post ID is required");
        }

        const response = await loginSignup.request(`${POST_URL}/posts/${postId}`, {
            method: "DELETE",
        });

        return response;
    }

    async getFeed(mineId, page) {
        if (!mineId) {
            throw new Error("UserID is required");
        }

        const response = await loginSignup.request(`${FEED_URL}/feeds/random-feed?mineId=${mineId}&&page=${page}`, {
            method: "GET",
        });        
        return response;
    }

    async toggleLike(userId, postId) {
        if (!userId || !postId) {
            throw new Error("User ID, Post ID are required");
        }

        const response = await loginSignup.request(`${POST_URL}/posts/${postId}/toggle-like?userId=${userId}`, {
            method: "POST",
        });
        return response;
    }

    async addComment(comment) {
        if (!comment || !comment.text?.trim()) return null;

        const response = await loginSignup.request(`${POST_URL}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(comment),
        });

        return response;
    }

    async showCommentByPostId(postId) {
        if (!postId) return;
        const response = await loginSignup.request(`${POST_URL}/comments/post/${postId}`, {
            method: "GET",
        });
        return response;
    }

    async getPostMedia(fieldId) {
        if (!fieldId) return { status: false, message: "No image available", data: null };

        const accessToken = await loginSignup.getAccessToken();

        try {
            const response = await fetch(`${FEED_URL}/feeds/media/${fieldId}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Error response: ", errorText);
                return { status: false, message: errorText || "Failed to fetch image", data: null };
            }

            const contentType = response.headers?.get("Content-Type");

            const data = await response.blob();

            if (Platform.OS === "web") {
                const imageUrl = URL.createObjectURL(data);
                return { status: true, message: "Image fetched", data: imageUrl, type: contentType };
            }

            const mediaUrl = response.url;

            return { status: true, message: "Image fetched", data: mediaUrl, type: contentType };

        } catch (error) {
            console.error("Error fetching image:", error);
            return { status: false, message: "Network error or server issue", data: null };
        }
    }
}

const postService = new PostService();
export default postService;
