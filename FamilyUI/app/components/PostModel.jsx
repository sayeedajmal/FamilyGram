import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import ContentLoader, { Circle, Rect } from "react-content-loader/native";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import postService, { default as PostService } from "../api/postHandle";
import { Colors } from "../constants/Colors";
const mediaContentCache = new Map();

const PostModel = ({ post, loading = false, videoRefs, myProfile, secondProfile }) => {
  const videoRef = useRef(null);
  const [likedPosts, setLikedPosts] = useState({});
  const [savedPosts, setSavedPosts] = useState({});
  const [mediaUrls, setMediaUrls] = useState([]);
  const [mediaType, setMediaType] = useState();
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.light;
  const iconColor = themeColors.icon;
  const bg = themeColors.background;
  const textColor = themeColors.text;
  const [timeAgo, setTimeAgo] = useState("");
  const [postLikesCount, setPostLikesCount] = useState({});
  const [allComments, setAllComments] = useState({});
  const [isCommenting, setIsCommenting] = useState(false);
  const [myComment, setMyComment] = useState({
    postId: null,
    userId: null,
    text: null,
  });

  const MAX_CACHE_SIZE = 50;
  const manageCacheSize = () => {
    while (mediaContentCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = mediaContentCache.keys().next().value;
      mediaContentCache.delete(oldestKey);
    }
  };

  useEffect(() => {
    if (post) {
      setPostLikesCount((prev) => ({
        ...prev,
        [post.id]: post.likes.length,
      }));
    }
  }, [post]);

  //Date of Post
  useEffect(() => {
    const postDate = moment(post?.createdAt);
    const now = moment();
    const diffInHours = now.diff(postDate, "hours");
    const diffInDays = now.diff(postDate, "days");

    let formattedTime;
    if (diffInHours < 1) {
      formattedTime = "Just now";
    } else if (diffInHours < 24) {
      formattedTime = `${diffInHours} HOURS AGO`;
    } else if (diffInDays < 7) {
      formattedTime = `${diffInDays} DAYS AGO`;
    } else {
      formattedTime = postDate.format("MMM D, YYYY");
    }
    setTimeAgo(formattedTime);
  }, [post?.createdAt]);

  //Get PostMedia
  useEffect(() => {
    const fetchMediaUrls = async () => {
      if (!post?.mediaIds?.length) return;
      setIsMediaLoading(true);
      try {
        const mediaDataArray = await Promise.all(
          post.mediaIds.map(async (mediaId) => {
            if (mediaContentCache.has(mediaId)) {
              return mediaContentCache.get(mediaId);
            }
            try {
              const response = await PostService.getPostMedia(mediaId);
              if (!response?.status) return null;
              const type = response?.type?.startsWith("video")
                ? "video"
                : "image";
              const mediaResponse = await fetch(response.data);
              if (!mediaResponse.ok) return null;
              const blob = await mediaResponse.blob();
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              return new Promise((resolve) => {
                reader.onloadend = () => {
                  if (reader.result) {
                    const base64Data = reader.result;
                    mediaContentCache.set(mediaId, {
                      content: base64Data,
                      type,
                    });
                    manageCacheSize();
                    resolve({ content: base64Data, type });
                  } else {
                    resolve(null);
                  }
                };
              });
            } catch (error) {
              console.log(`Error processing mediaId ${mediaId}:`, error);
              return null;
            }
          })
        );

        const validMediaData = mediaDataArray.filter((data) => data !== null);
        if (validMediaData.length > 0) {
          setMediaType(validMediaData[0].type);
          setMediaUrls(validMediaData.map((data) => data.content));
        }
      } catch (error) {
        console.log("Error in fetchMediaUrls:", error);
        Alert.alert("Error", "Failed to load media");
      } finally {
        setIsMediaLoading(false);
      }
    };

    setMyComment((prev) => ({
      ...prev, // Keep existing values
      postId: post?.id, // Only update userId
    }));
    fetchMediaUrls();
  }, [post?.mediaIds]);

  useEffect(() => {
    if (videoRef.current) {
      videoRefs.current[post.id] = videoRef.current;
    }
  }, [videoRef.current]);

  

  const AddComment = async () => {
    if (!myComment.postId || !myComment.userId || !myComment.text?.trim())
      return;

    setIsCommenting(true); // Start loader

    try {
      const response = await postService.addComment(myComment);

      if (response.status) {
        setMyComment({
          postId: myComment.postId,
          userId: myComment.userId,
          text: "", // Reset text while keeping postId & userId
        });
      } else {
        console.error("Failed to add comment:", response.message);
        Alert.alert("Error", "Failed to add comment. Please try again.");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setIsCommenting(false); // Stop loader
    }
  };

  useEffect(() => {
    if (myProfile && post?.likes) {
      setLikedPosts((prev) => ({
        ...prev,
        [post.id]: post.likes.includes(myProfile.id),
      }));
    }
  }, [myProfile, post]);

  const toggleLike = async (postId) => {
    const isCurrentlyLiked = likedPosts[postId] || false;

    setLikedPosts((prev) => ({
      ...prev,
      [postId]: !isCurrentlyLiked,
    }));

    setPostLikesCount((prev) => ({
      ...prev,
      [postId]: prev[postId] + (isCurrentlyLiked ? -1 : 1),
    }));

    try {
      const response = await postService.toggleLike(myProfile.id, postId);

      if (!response.status) {
        setLikedPosts((prev) => ({
          ...prev,
          [postId]: isCurrentlyLiked,
        }));

        setPostLikesCount((prev) => ({
          ...prev,
          [postId]: prev[postId] + (isCurrentlyLiked ? 1 : -1),
        }));

        Alert.alert("Error", "Failed to toggle like. Please try again.");
      }
    } catch (error) {
      console.error("Unexpected error in toggleLike:", error);

      setLikedPosts((prev) => ({
        ...prev,
        [postId]: isCurrentlyLiked,
      }));

      setPostLikesCount((prev) => ({
        ...prev,
        [postId]: prev[postId] + (isCurrentlyLiked ? 1 : -1),
      }));

      Alert.alert(
        "Error",
        "Something went wrong. Please check your connection."
      );
    }
  };

  const toggleSave = (postId) => {
    setSavedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }}>
      <KeyboardAwareScrollView
        style={{ backgroundColor: bg }}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View ref={ref}>
            {[1, 2].map((_, index) => (
              <ContentLoader
                key={index}
                speed={1.5}
                width={"100%"}
                height={320}
                backgroundColor="#f3f3f3"
                foregroundColor={themeColors.skeletonFg}
              >
                <Circle cx="30" cy="30" r="15" />
                <Rect x="50" y="20" rx="4" ry="4" width="120" height="10" />
                <Rect x="0" y="50" rx="8" ry="8" width="100%" height="200" />
                <Rect x="0" y="260" rx="4" ry="4" width="80" height="10" />
                <Rect x="0" y="280" rx="4" ry="4" width="150" height="10" />
              </ContentLoader>
            ))}
          </View>
        ) : !post ? (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text
              style={{ color: textColor, fontSize: 16 }}
              className="font-custom"
            >
              No posts available
            </Text>
          </View>
        ) : (
          <View
            key={post.id}
            style={{
              backgroundColor: bg,
              borderRadius: 12,
              padding: 10,
              marginBottom: 16,
            }}
          >
            {/* Post Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Image
                source={secondProfile?.imageUrl}
                style={{ width: 32, height: 32, borderRadius: 16 }}
              />
              <View style={{ marginLeft: 8 }}>
                <Text className="font-custom-bold" style={{ color: textColor }}>
                  {secondProfile?.username}
                </Text>
                {post.location && (
                  <Text
                    className="font-custom"
                    style={{ color: textColor, fontSize: 12 }}
                  >
                    {post.location}
                  </Text>
                )}
              </View>
            </View>

            {/* Post Image/Media with Isolated Loader */}
            <View>
              {isMediaLoading ? (
                <ContentLoader
                  speed={2}
                  width="100%"
                  height={300}
                  backgroundColor="#f3f3f3"
                  foregroundColor={themeColors.skeletonFg}
                >
                  {/* Main media placeholder */}
                  <Rect x="0" y="0" rx="8" ry="8" width="100%" height="100%" />

                  {/* Play button icon effect */}
                  <Circle cx="50%" cy="50%" r="24" />
                </ContentLoader>
              ) : mediaUrls.length > 0 ? (
                mediaType === "video" ? (
                  <Video
                    ref={videoRef}
                    source={{ uri: mediaUrls[0] }}
                    style={{
                      width: "100%",
                      aspectRatio: 1,
                      borderRadius: 8,
                    }}
                    resizeMode="contain"
                    isLooping
                  />
                ) : (
                  <Image
                    source={{ uri: mediaUrls[0] }}
                    style={{
                      width: "100%",
                      aspectRatio: 1,
                      borderRadius: 8,
                    }}
                    resizeMode="cover"
                  />
                )
              ) : (
                <Text>No media available</Text>
              )}
            </View>

            {/* Post Actions */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 8,
              }}
            >
              <View style={{ flexDirection: "row" }}>
                <TouchableOpacity
                  style={{ marginRight: 16 }}
                  onPress={() => toggleLike(post.id)}
                >
                  <Ionicons
                    name={likedPosts[post.id] ? "heart" : "heart-outline"}
                    size={26}
                    color={likedPosts[post.id] ? "red" : iconColor}
                  />
                </TouchableOpacity>
                <TouchableOpacity style={{ marginRight: 16 }}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={26}
                    color={iconColor}
                  />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Ionicons
                    name="share-social-outline"
                    size={26}
                    color={iconColor}
                  />
                </TouchableOpacity>
              </View>

              {/* Save Button */}
              <TouchableOpacity onPress={() => toggleSave(post.id)}>
                <Ionicons
                  name={savedPosts[post.id] ? "bookmark" : "bookmark-outline"}
                  size={26}
                  color={savedPosts[post.id] ? "#FFD700" : iconColor}
                />
              </TouchableOpacity>
            </View>

            {/* Post Likes & Caption */}
            <Text
              className="font-custom-bold"
              style={{ color: textColor, marginTop: 8 }}
            >
              {postLikesCount[post.id] || post.likes.length} likes
            </Text>

            <Text className="font-custom" style={{ color: textColor }}>
              <Text className="font-custom-bold">{post.username}</Text>
              {post.caption}
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <TouchableOpacity>
                <Text
                  className="font-custom"
                  style={{ color: "#6B7280", fontSize: 12 }}
                >
                  View all {post.totalComments || 0} comments
                </Text>
              </TouchableOpacity>
              <Text
                className="font-custom"
                style={{ color: "#6B7280", fontSize: 10 }}
              >
                POSTED {timeAgo}
              </Text>
            </View>

            {/* Comment Input */}
            <View behavior={Platform.OS === "ios" ? "padding" : "height"}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 8,
                  borderWidth: 1,
                  borderRadius: 30,
                  borderColor: themeColors.tint,
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                }}
              >
                <TouchableOpacity style={{ marginRight: 10 }}>
                  <Ionicons name="happy-outline" size={24} color="#6B7280" />
                </TouchableOpacity>
                <TextInput
                  className="font-custom-italic"
                  placeholder="Add a comment..."
                  placeholderTextColor="#6B7280"
                  value={myComment.text}
                  onChangeText={(text) =>
                    setMyComment((prev) => ({ ...prev, text }))
                  }
                  style={{
                    flex: 1,
                    fontSize: 14,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    color: "black",
                  }}
                />
                <TouchableOpacity
                  style={{ marginLeft: 10, opacity: isCommenting ? 0.6 : 1 }}
                  onPress={() => AddComment()}
                  disabled={isCommenting}
                >
                  {isCommenting ? (
                    <ActivityIndicator size="small" color="#3B82F6" />
                  ) : (
                    <Text
                      className="font-custom-bold"
                      style={{ color: "#3B82F6", fontSize: 14 }}
                    >
                      POST
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
  );
};

export default PostModel;
