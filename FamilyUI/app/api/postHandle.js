import * as ImageManipulator from "expo-image-manipulator";
import * as VideoThumbnails from "expo-video-thumbnails";
import Platform from "react-native";
import loginSignup from "./loginSignup";
//const POST_API_URL = "http://192.168.31.218:8083";
const POST_API_URL = "https://familypost.onrender.com";
const FEED_API_URL = "http://192.168.31.218:8084";

class PostService {
    async createPost(post, file) {

        const formData = new FormData();

        if (file && file.uri) {

            const mimeType = file.type;


            const fileName = file.name || `upload.${mimeType.split("/")[1]}`;


            const fileUri = Platform.OS === "ios" ? file.uri.replace("file://", "") : file.uri;

            formData.append("file", {
                uri: fileUri,
                name: fileName,
                type: mimeType
            });
        }

        formData.append("post", JSON.stringify(post));


        const response = await loginSignup.request(`${POST_API_URL}/posts`, {
            method: "POST",
            headers: {
                "Content-Type": "multipart/form-data",
            },
            body: formData,
        });

        return response;

    }

    async createPostWithThumbnails(post, files) {
        const formData = new FormData();
        const thumbnails = [];

        for (const file of files) {
            if (file) {
                const mimeType = file.type;
                const fileName = file.name || `upload.${mimeType.split("/")[1]}`;
                const fileUri = Platform.OS === "ios" ? file.uri.replace("file://", "") : file.uri;

                formData.append("files", {
                    uri: fileUri,
                    name: fileName,
                    type: mimeType,
                });

                let thumbnail;
                if (mimeType.includes("video")) {
                    // Generate thumbnail for video
                    const { uri } = await VideoThumbnails.getThumbnailAsync(fileUri, {
                        time: 1000,
                        quality: 0.5,
                    });
                    thumbnail = uri;
                } else {
                    // Generate a resized thumbnail for image
                    const resizedImage = await ImageManipulator.manipulateAsync(
                        fileUri,
                        [{ resize: { width: 300 } }],
                        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                    );
                    thumbnail = resizedImage.uri;
                }

                const thumbFileName = `thumb_${fileName}`;
                thumbnails.push({ uri: thumbnail, name: thumbFileName, type: "image/jpeg" });
            }
        }

        // Append thumbnails to formData
        thumbnails.forEach((thumb) => {
            formData.append("thumbnails", thumb);
        });

        formData.append("post", JSON.stringify(post));

        const response = await loginSignup.request(`${POST_API_URL}/posts`, {
            method: "POST",
            headers: {
                "Content-Type": "multipart/form-data",
            },
            body: formData,
        });

        return response;
    };

    async GetPostByUserId(userId) {

        if (!userId) {
            throw new Error("User ID is required");
        }

        const response = await loginSignup.request(`${POST_API_URL}/posts?userId=${userId}`, {
            method: "GET",
        });

        return response;
    }
    async getPostById(postId) {

        if (!postId) {
            throw new Error("Post ID is required");
        }

        const response = await loginSignup.request(`${POST_API_URL}/posts/myposts/${postId}?userId=${postId}`, {
            method: "GET",
        });

        return response;
    }

    async getFeed(mineId) {

        if (!mineId) {
            throw new Error("UserID is required");
        }

        const response = await loginSignup.request(`http://192.168.31.218:8084/feeds/random-feed?mineId=67de6e850829c84b1c1de72a`, {
            method: "GET",
        });
        return response;
    }

    async toggleLike(userId, postId) {
        if (!userId || !postId) {
            throw new Error("User ID, Post ID are required");
        }

        return await loginSignup.request(`${POST_API_URL}/posts/${postId}/toggle-like?userId=${userId}`, {
            method: "POST",
        });
    }

    async addComment(comment) {
        if (!comment || !comment.text?.trim()) return null;

        const response = await loginSignup.request(`${POST_API_URL}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(comment),
        });

        return response;
    }

    async showCommentByPostId(postId) {
        if (!postId) return;
        const response = await loginSignup.request(`${POST_API_URL}/comments/post/${postId}`, {
            method: "GET",
        });
        return response;
    }

    async getPostMedia(fieldId) {
        if (!fieldId) return { status: false, message: "No image available", data: null };

        const accessToken = await loginSignup.getAccessToken();

        try {
            const response = await fetch(`${FEED_API_URL}/feeds/media/${fieldId}`, {
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
