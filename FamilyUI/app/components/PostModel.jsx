import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import LottieView from "lottie-react-native";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import ContentLoader, { Circle, Rect } from "react-content-loader/native";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Modal from "react-native-modal";
import loginSignup from "../api/loginSignup";
import NotificationSocket from "../api/NotificationSocket";
import postService from "../api/postHandle";
import { Colors } from "../constants/Colors";
import CommentModel from "./CommentsModal";

const mediaContentCache = new Map();

const PostModel = ({ post, loading = false, videoRefs, myProf, userProf }) => {
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
  const [activeComment, setActiveComment] = useState(false);
  const { width } = Dimensions.get("window");
  const [activeIndex, setActiveIndex] = useState(0);
  const lastTap = useRef(null);
  const lottieRef = useRef(null);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [isVideoVisible, setIsVideoVisible] = useState(false);

  // Manage multiple video players for carousel
  const videoPlayers = useRef({});
  const visibilityThreshold = 0.8; // 80% visibility to trigger play/pause

  const [isCommenting, setIsCommenting] = useState(false);
  const [myComment, setMyComment] = useState({
    postId: null,
    userId: null,
    username: null,
    thumbnailId: null,
    text: null,
  });

  const MAX_CACHE_SIZE = 20;
  const manageCacheSize = () => {
    while (mediaContentCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = mediaContentCache.keys().next().value;
      mediaContentCache.delete(oldestKey);
    }
  };

  //COUNT LIKES ON POST
  useEffect(() => {
    if (post) {
      setPostLikesCount((prev) => ({
        ...prev,
        [post.id]: post?.likes?.length,
      }));
    }
  }, [post]);

  const triggerNotifcation = async (type, message) => {
    await NotificationSocket.sendNotificationsBulk(
      type,
      message,
      myProf?.username,
      myProf?.followers,
      myProf?.id,
      myProf?.thumbnailId || "67f22def7d18c31ce1040da1",
      post?.id,
      post?.mediaIds?.[0]
    );
  };
  // Date of Post
  useEffect(() => {
    if (!post?.createdAt) return;
    const postDate = moment.utc(post.createdAt).local();
    const now = moment();
    const diffInMinutes = now.diff(postDate, "minutes");
    const diffInHours = now.diff(postDate, "hours");
    const diffInDays = now.diff(postDate, "days");

    let formattedTime;
    if (diffInMinutes < 1) {
      formattedTime = "Just now";
    } else if (diffInMinutes < 60) {
      formattedTime = `${diffInMinutes} MINUTES AGO`;
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
      setMediaUrls([]); // Clear previous media
      setMediaType(null);
      try {
        const validMediaData = [];

        for (const mediaId of post.mediaIds) {
          try {
            const response = await postService.getPostMedia(mediaId);

            if (!response?.status) continue;

            const type = response?.type?.startsWith("video")
              ? "video"
              : "image";

            const mediaResponse = await fetch(response.data);
            if (!mediaResponse.ok) continue;

            const blob = await mediaResponse.blob();
            const reader = new FileReader();

            // Convert blob to Base64
            reader.readAsDataURL(blob);

            await new Promise((resolve) => {
              reader.onloadend = () => {
                if (reader.result) {
                  validMediaData.push({ content: reader.result, type });

                  // Update state immediately with new media
                  setMediaUrls((prev) => [...prev, reader.result]);
                  setMediaType(type); // Update type for the latest fetched media

                  resolve();
                }
              };
            });
          } catch (error) {
            console.log(`Error processing mediaId ${mediaId}:`, error);
          }
        }
      } catch (error) {
        console.log("Error in fetchMediaUrls:", error);
        Alert.alert("Error", "Failed to load media");
      } finally {
        setIsMediaLoading(false);
      }
    };

    setMyComment((prev) => ({
      ...prev,
      postId: post?.id,
      userId: myProf?.id,
      username: myProf?.username,
      thumbnailId: myProf?.thumbnailId,
    }));

    fetchMediaUrls();
  }, [post]);

  useEffect(() => {
    if (videoRef.current) {
      videoRefs.current[post.id] = videoRef.current;
    }
  }, [videoRef.current]);

  // Effect to handle video visibility
  useEffect(() => {
    // Set isVideoVisible to true when a video is in the center (activeIndex)
    if (mediaType === "video") {
      setIsVideoVisible(true);

      // Control video playback based on visibility
      const player = videoPlayers.current[activeIndex];
      if (player) {
        player.playAsync();
      }

      // Pause other videos
      Object.keys(videoPlayers.current).forEach((key) => {
        if (Number(key) !== activeIndex && videoPlayers.current[key]) {
          videoPlayers.current[key].pauseAsync();
        }
      });
    }
  }, [activeIndex, mediaType]);

  //FETCH COMMENTS
  const fetchComments = async () => {
    const response = await postService.showCommentByPostId(post?.id);
    if (response.status) {
      const updatedComments = await Promise.all(
        response.data.data.map(async (item) => {
          let thumbnailUrl = item.thumbnailId;
          if (item.thumbnailId) {
            try {
              const imageResponse = await loginSignup.getProfileImage(
                item.thumbnailId
              );
              if (imageResponse.status) {
                thumbnailUrl = imageResponse.data;
              }
            } catch (error) {
              console.error("Error fetching profile image:", error);
            }
          }

          const commentDate = moment.utc(item.createdAt).local();
          const now = moment();
          const diffInMinutes = now.diff(commentDate, "minutes");
          const diffInHours = now.diff(commentDate, "hours");
          const diffInDays = now.diff(commentDate, "days");

          let formattedTime;
          if (diffInMinutes < 1) {
            formattedTime = "Just now";
          } else if (diffInMinutes < 60) {
            formattedTime = `${diffInMinutes} MINUTES AGO`;
          } else if (diffInHours < 24) {
            formattedTime = `${diffInHours} HOURS AGO`;
          } else if (diffInDays < 7) {
            formattedTime = `${diffInDays} DAYS AGO`;
          } else {
            formattedTime = commentDate.format("MMM D, YYYY");
          }

          return {
            ...item,
            thumbnailId: thumbnailUrl,
            createdAt: formattedTime,
          };
        })
      );

      updatedComments.sort((a, b) =>
        moment(b.createdAt).isBefore(moment(a.createdAt)) ? 1 : -1
      );
      setAllComments(updatedComments);
    } else {
      Alert.alert("Error", response.message);
    }
  };

  //ADD COMMENTS
  const AddComment = async () => {
    if (!myComment.text?.trim()) return;

    const commentText = myComment.text.trim(); // Store trimmed text

    const updatedComment = {
      ...myComment,
      postId: post?.id,
      userId: myProf?.id,
      username: myProf?.username,
      thumbnailId: myProf?.thumbnailId || "67f22def7d18c31ce1040da1",
    };

    setIsCommenting(true);

    try {
      const response = await postService.addComment(updatedComment);
      if (response.status) {
        if (commentText) {
          triggerNotifcation(
            "COMMENT",
            `Commented on your Post - ${commentText}`
          );
        }

        setMyComment((prev) => ({
          ...prev,
          text: "",
        }));

        Keyboard.dismiss();
        fetchComments();
      } else {
        console.error("Failed to add comment:", response.message);
        Alert.alert("Error", response.message);
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setIsCommenting(false); // Stop loader
    }
  };

  useEffect(() => {
    if (myProf && post?.likes) {
      setLikedPosts((prev) => ({
        ...prev,
        [post.id]: post.likes.includes(myProf.id),
      }));
    }
  }, [myProf, post]);

  const handleDoubleTap = () => {
    const now = Date.now();

    if (lastTap.current && now - lastTap.current < 300) {
      toggleLike(post?.id);

      // Trigger heart animation
      setIsLikeAnimating(true);

      // Platform-specific animation handling
      if (Platform.OS === "ios") {
        // For iOS, use a more explicit animation reset
        requestAnimationFrame(() => {
          if (lottieRef.current) {
            // Reset the animation completely
            lottieRef.current.reset();

            // Slight delay to ensure reset
            setTimeout(() => {
              lottieRef.current.play(0, 50);
            }, 50);
          }

          // Hide animation with a consistent timeout
          setTimeout(() => {
            setIsLikeAnimating(false);
          }, 800);
        });
      } else {
        // Existing Android logic
        setTimeout(() => {
          if (lottieRef.current) {
            lottieRef.current.play(0, 50);
          }

          setTimeout(() => {
            setIsLikeAnimating(false);
          }, 700);
        }, 50);
      }
    }

    lastTap.current = now;
  };

  // Toggle Like Function
  const toggleLike = async (postId) => {
    const isCurrentlyLiked = likedPosts[postId] || false;

    if (isCurrentlyLiked) return;
    // Toggle the like state
    setLikedPosts((prev) => ({
      ...prev,
      [postId]: !isCurrentlyLiked,
    }));

    // Update the like count
    setPostLikesCount((prev) => ({
      ...prev,
      [postId]: prev[postId] + (isCurrentlyLiked ? -1 : 1),
    }));

    try {
      const response = await postService.toggleLike(myProf?.id, postId);

      if (!response.status) {
        // Revert state if API call fails
        setLikedPosts((prev) => ({
          ...prev,
          [postId]: isCurrentlyLiked,
        }));
        setPostLikesCount((prev) => ({
          ...prev,
          [postId]: prev[postId] + (isCurrentlyLiked ? 1 : -1),
        }));

        Alert.alert("Error", "Failed to toggle like. Please try again.");
      } else {
        // Send notification only when liking (not unliking)
        if (!isCurrentlyLiked) {
          console.log(
            "BUDY: ",
            myProf?.username,
            [post?.userId],
            myProf?.thumbnailId || "67f22def7d18c31ce1040da1",
            myProf?.id,
            post?.id,
            post?.mediaIds?.[0]
          );

          await NotificationSocket.sendNotificationsBulk(
            "LIKE",
            "liked your post 💙",
            myProf?.username,
            [post?.userId],
            myProf?.thumbnailId || "67f22def7d18c31ce1040da1",
            myProf?.id,
            post?.id,
            post?.mediaIds?.[0]
          );
        }
      }
    } catch (error) {
      // Revert state if there's an error
      Alert.alert("Error", "Failed Like " + error);

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

  // Create a video player for each media index
  const getVideoPlayer = (index) => {
    if (!videoPlayers.current[index]) {
      const player = useVideoPlayer({ shouldPlay: index === activeIndex });
      videoPlayers.current[index] = player;
      return player;
    }
    return videoPlayers.current[index];
  };

  // Function to handle visibility changes in the ScrollView
  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / width);

    if (pageIndex !== activeIndex) {
      setActiveIndex(pageIndex);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }}>
      <KeyboardAwareScrollView
        style={{ backgroundColor: themeColors.tint }}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View>
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
                <Rect x="0" y="280" rx="4" ry="4" width="200" height="10" />
              </ContentLoader>
            ))}
          </View>
        ) : (
          <View
            key={post.id}
            style={{
              backgroundColor: bg,
              borderRadius: 12,
              padding: 10,
              marginBottom: 5,
            }}
          >
            {/* Post Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Image
                source={
                  post?.userThumbnailUrl
                    ? { uri: post.userThumbnailUrl }
                    : require("../../assets/images/profile.png")
                }
                defaultSource={require("../../assets/images/profile.png")}
                style={{ width: 32, height: 32, borderRadius: 16 }}
              />
              <View style={{ marginLeft: 8 }}>
                <Text className="font-custom-bold" style={{ color: textColor }}>
                  {userProf?.username}
                </Text>
                {post?.location && (
                  <Text
                    className="font-custom"
                    style={{ color: textColor, fontSize: 12 }}
                  >
                    {post?.location}
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
                <View>
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                  >
                    {mediaUrls.map((url, index) => (
                      <View key={index} style={{ padding: 5 }}>
                        <TouchableWithoutFeedback onPress={handleDoubleTap}>
                          <View
                            style={{
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {mediaType === "video" ? (
                              <View
                                style={{
                                  width: width - 25,
                                  aspectRatio: 4 / 5,
                                  borderRadius: 8,
                                  backgroundColor: "#000",
                                  overflow: "hidden",
                                }}
                              >
                                {/* Use VideoView with useVideoPlayer hook */}
                                <VideoView
                                  videoPlayer={getVideoPlayer(index)}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                  }}
                                  source={{ uri: url }}
                                  resizeMode="contain"
                                  isLooping
                                  useNativeControls={false}
                                />

                                {/* Play indicator overlay - only shows when paused */}
                                {activeIndex !== index && (
                                  <View
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      justifyContent: "center",
                                      alignItems: "center",
                                      backgroundColor: "rgba(0,0,0,0.3)",
                                    }}
                                  >
                                    <Ionicons
                                      name="play-circle"
                                      size={60}
                                      color="rgba(255,255,255,0.8)"
                                    />
                                  </View>
                                )}
                              </View>
                            ) : (
                              <Image
                                source={{ uri: url }}
                                style={{
                                  width: width - 25,
                                  aspectRatio: 4 / 5,
                                  borderRadius: 8,
                                }}
                                resizeMode="contain"
                              />
                            )}
                            {isLikeAnimating && (
                              <View
                                style={{
                                  position: "absolute",
                                  top: "50%",
                                  left: "50%",
                                  transform: [
                                    { translateX: -150 },
                                    { translateY: -150 },
                                  ],
                                  width: 300,
                                  height: 300,
                                  zIndex: 999,
                                }}
                              >
                                <LottieView
                                  ref={lottieRef}
                                  source={require("../../assets/images/heart.json")}
                                  autoPlay={false}
                                  loop={false}
                                  style={{ width: 300, height: 300 }}
                                />
                              </View>
                            )}
                          </View>
                        </TouchableWithoutFeedback>
                      </View>
                    ))}
                  </ScrollView>

                  {/* White Dots Indicator */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "center",
                      position: "absolute",
                      bottom: 10,
                      width: "100%",
                    }}
                  >
                    {mediaUrls.map((_, index) => (
                      <View
                        key={index}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          marginHorizontal: 4,
                          backgroundColor:
                            activeIndex === index ? "#fff" : "#888",
                        }}
                      />
                    ))}
                  </View>
                </View>
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
                  onPress={() => toggleLike(post?.id)}
                >
                  <Ionicons
                    name={likedPosts[post?.id] ? "heart" : "heart-outline"}
                    size={26}
                    color={likedPosts[post?.id] ? "red" : iconColor}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setActiveComment(true);
                    fetchComments();
                  }}
                  style={{ marginRight: 16 }}
                >
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
              {postLikesCount[post.id] || post?.likes?.length} likes
            </Text>
            <Text className="font-custom" style={{ color: textColor }}>
              <Text className="font-custom-bold">{post?.username}</Text>{" "}
              {post?.caption}
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <TouchableOpacity>
                <Text
                  className="font-custom"
                  style={{ color: "#6B7280", fontSize: 12 }}
                >
                  View all comments
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
                  className="font-custom"
                  placeholder="Add a comment..."
                  placeholderTextColor="#3B82F6"
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
                    color: "#3B82F6",
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
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Modal
            key={activeComment ? "modal-active" : "modal-inactive"} // Forces re-render
            visible={activeComment}
            statusBarTranslucent
            transparent={true}
            animationType="slide"
            onRequestClose={() => setActiveComment(false)}
            onSwipeComplete={() => setActiveComment(false)}
            swipeDirection="down"
            avoidKeyboard
            style={{ margin: 0, backgroundColor: "transparent" }}
          >
            <View
              style={{
                height: "60%", // Ensures full height on open
                backgroundColor: themeColors.tint,
                position: "absolute",
                bottom: 0,
                width: "100%",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingBottom: 16,
              }}
            >
              <View
                style={{
                  width: "100%",
                  alignItems: "center",
                  paddingTop: 12,
                  paddingBottom: 8,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 5,
                    borderRadius: 2.5,
                    backgroundColor: "#DDDDDD",
                  }}
                />
              </View>

              <Text
                className="font-custom pl-4 text-2xl m-4"
                style={{ color: textColor }}
              >
                Comments
              </Text>

              <FlatList
                data={allComments}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <CommentModel item={item} />}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  paddingBottom: 60, // Space for input
                }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              />

              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: bg,
                  borderTopWidth: 1,
                  borderTopColor: "#e5e7eb",
                  paddingTop: 8,
                  paddingBottom: 12,
                  paddingHorizontal: 16,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Image
                    source={{ uri: myProf?.thumbnailUrl }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      marginRight: 6,
                    }}
                  />
                  <TextInput
                    placeholder="Add a comment..."
                    placeholderTextColor="#aaa"
                    value={myComment.text}
                    onChangeText={(text) =>
                      setMyComment((prev) => ({ ...prev, text }))
                    }
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 20,
                      fontSize: 14,
                      color: textColor,
                      backgroundColor: themeColors.tint,
                      marginRight: 5,
                    }}
                  />
                  <TouchableOpacity
                    style={{ opacity: isCommenting ? 0.6 : 1, padding: 6 }}
                    onPress={() => AddComment()}
                    disabled={isCommenting}
                  >
                    {isCommenting ? (
                      <ActivityIndicator size="small" color="#3B82F6" />
                    ) : (
                      <Text
                        className="font-custom-bold"
                        style={{
                          color: "#3B82F6",
                          fontSize: 14,
                          fontWeight: "bold",
                        }}
                      >
                        POST
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </GestureHandlerRootView>
      </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
  );
};

export default PostModel;
