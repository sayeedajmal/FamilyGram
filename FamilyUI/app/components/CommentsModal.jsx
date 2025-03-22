import React from "react";
import {
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { Colors } from "../constants/Colors";

const CommentModel = ({ item }) => {
  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.light;
  const textColor = themeColors.text;

  return (
    <View className="flex-row items-start mb-4">
      <Image
        source={{ uri: item.thumbnailId }}
        className="w-10 h-10 rounded-full mr-3"
      />
      <View className="flex-1">
        <View className="flex-row justify-between">
          <Text className="font-semibold text-sm" style={{ color: textColor }}>
            {item.username}
          </Text>
          <Text className="text-gray-500 text-xs">{item.createdAt}</Text>
        </View>
        <Text className="text-sm mt-1" style={{ color: textColor }}>
          {item.text}
        </Text>
        <View className="flex-row mt-2">
          <TouchableOpacity className="mr-4">
            <Text className="text-blue-500 text-sm">Like</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text className="text-blue-500 text-sm">Reply</Text>
          </TouchableOpacity>
        </View>

        {/* Render Replies */}
        {item?.replies?.length > 0 && (
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
                    <Text
                      className="font-semibold text-xs"
                      style={{ color: textColor }}
                    >
                      {reply.username}
                    </Text>
                    <Text className="text-gray-500 text-xs">{reply.time}</Text>
                  </View>
                  <Text className="text-xs mt-0.5" style={{ color: textColor }}>
                    {reply.text}
                  </Text>
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
};

export default CommentModel;
