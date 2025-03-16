import React, { useState } from "react";
import {
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";

const commentsData = [
  {
    id: "1",
    username: "sarah_wilson",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    time: "2h",
    text: "This view is absolutely breathtaking! Where is this place? 😍",
    replies: [
      {
        id: "1-1",
        username: "alex_travel",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
        time: "10m",
        text: "This is in Santorini, Greece! One of my favorite places ever visited.",
      },
    ],
  },
  {
    id: "2",
    username: "emma_rose",
    avatar: "https://randomuser.me/api/portraits/women/30.jpg",
    time: "5h",
    text: "Wow, this is incredible! Need to add this to my bucket list. ❤️",
    replies: [],
  },
];

const CommentItem = ({ item }) => (
  <View className="flex-row items-start mb-4">
    <Image
      source={{ uri: item.avatar }}
      className="w-10 h-10 rounded-full mr-3"
    />
    <View className="flex-1">
      <View className="flex-row justify-between">
        <Text className="font-semibold text-sm">{item.username}</Text>
        <Text className="text-gray-500 text-xs">{item.time}</Text>
      </View>
      <Text className="text-sm mt-1">{item.text}</Text>
      <View className="flex-row mt-2">
        <TouchableOpacity className="mr-4">
          <Text className="text-blue-500 text-sm">Like</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text className="text-blue-500 text-sm">Reply</Text>
        </TouchableOpacity>
      </View>

      {/* Render Replies */}
      {item.replies.length > 0 && (
        <FlatList
          data={item.replies}
          keyExtractor={(reply) => reply.id}
          renderItem={({ item: reply }) => (
            <View className="flex-row items-start ml-10 pl-3 border-l-2 border-gray-200 mt-2">
              <Image
                source={{ uri: reply.avatar }}
                className="w-8 h-8 rounded-full mr-3"
              />
              <View className="flex-1">
                <View className="flex-row justify-between">
                  <Text className="font-semibold text-xs">
                    {reply.username}
                  </Text>
                  <Text className="text-gray-500 text-xs">{reply.time}</Text>
                </View>
                <Text className="text-xs mt-0.5">{reply.text}</Text>
                <View className="flex-row mt-1">
                  <TouchableOpacity className="mr-3">
                    <Text className="text-gray-500 text-xs">Like</Text>
                  </TouchableOpacity>
                  <TouchableOpacity>
                    <Text className="text-gray-500 text-xs">Reply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  </View>
);

const Comments = () => {
  const [comment, setComment] = useState("");

  return (
    <View className="max-h-[80vh] bg-white p-4 rounded-lg shadow-md">
      <FlatList
        data={commentsData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CommentItem item={item} />}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Comment */}
      <View className="flex-row items-center mt-4 border-t border-gray-200 pt-2">
        <Image
          source={{ uri: "https://randomuser.me/api/portraits/women/33.jpg" }}
          className="w-9 h-9 rounded-full mr-3"
        />
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Add a comment..."
          placeholderTextColor="black"
          className="flex-1 bg-gray-100 p-3 rounded-full text-sm"
        />
        <TouchableOpacity className="ml-2 o" onPress={() => setComment("")}>
          <Text className="text-blue-500 font-semibold text-sm">Post</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Comments;
