import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import PostModel from "../components/PostModel";
import { Colors } from "../constants/Colors";

const stories = [
  { id: 1, username: "Your Story", image: "https://placekitten.com/100/100" },
  { id: 2, username: "john_doe", image: "https://placekitten.com/101/101" },
  { id: 3, username: "jane_doe", image: "https://placekitten.com/102/102" },
];

const postsData = [
  {
    id: 1,
    username: "sayeed__ajmal",
    userImage:
      "https://images.unsplash.com/photo-1604537466158-719b1972feb8?ixlib=rb-1.2.1&auto=format&fit=crop&w=700&q=80",
    postImage:
      "https://images.unsplash.com/photo-1604537466158-719b1972feb8?ixlib=rb-1.2.1&auto=format&fit=crop&w=700&q=80",
    likes: 123,
    caption:
      "Enjoying the amazing view today! The weather is perfect for a day out in nature. #nature #travel #adventure",
  },
  {
    id: 2,
    username: "shoaib_akhtar",
    userImage:
      "https://plus.unsplash.com/premium_photo-1686835759214-526932717a7e?q=80&w=1527&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    postImage:
      "https://plus.unsplash.com/premium_photo-1686835759214-526932717a7e?q=80&w=1527&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    likes: 98,
    caption: "Chilling at the beach! #sunset",
  },
];

const HomePage = () => {
  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.light;
  const iconColor = themeColors.icon;
  const bg = themeColors.background;
  const textColor = themeColors.text;
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-1">
        <Image
          source={require("../../assets/images/logo.png")}
          resizeMode="contain"
          style={{ height: 30, width: 180, marginLeft: -15 }}
        />
        <View className="flex-row">
          <TouchableOpacity>
            <Ionicons
              name="heart-sharp"
              size={30}
              color={iconColor}
              className="mx-4"
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="chatbubble-outline" size={30} color={iconColor} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 py-2"
        >
          {stories.map((story) => (
            <View key={story.id} className="mr-4 items-center">
              <View
                className="border-2 rounded-full p-1"
                style={{ borderColor: iconColor }}
              >
                <Image
                  source={{ uri: story.image }}
                  className="w-16 h-16 rounded-full"
                />
              </View>
              <Text className="text-xs mt-1" style={{ color: textColor }}>
                {story.username}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Posts */}
        <PostModel posts={postsData} loading={false} />
      </ScrollView>
    </View>
  );
};

export default HomePage;
