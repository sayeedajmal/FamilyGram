import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native"; // Import useFocusEffect
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Colors } from "../constants/Colors";

const AddMedia = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [caption, setCaption] = useState("");
  const theme = useColorScheme();
  const themeColors = Colors[theme] || Colors.light;
  const background = themeColors.background;

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // Reset state when screen is unfocused
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setSelectedImage(null);
        setCaption(""); // Reset caption when unfocused
      };
    }, [])
  );

  useEffect(() => {
    pickImage(); // Open file chooser on mount
  }, []);

  return (
    <View
      className="flex-1 justify-center items-center bg-gray-900"
      style={{ backgroundColor: background }}
    >
      {selectedImage ? (
        <Image
          source={{ uri: selectedImage }}
          className="w-full h-96 mb-4"
          resizeMode="cover"
        />
      ) : (
        <Text className="text-white text-lg">No image selected</Text>
      )}

      {/* Caption input */}
      {selectedImage && (
        <TextInput
          style={{
            backgroundColor: themeColors.card,
            color: themeColors.text,
            padding: 10,
            width: "90%",
            borderRadius: 8,
          }}
          placeholder="Write a caption..."
          placeholderTextColor={themeColors.text}
          value={caption}
          onChangeText={setCaption}
        />
      )}

      <View className="absolute bottom-6 w-full flex-row justify-center space-x-4">
        {/* Open File Picker Again */}
        <TouchableOpacity
          onPress={pickImage}
          className="p-4 bg-blue-600 rounded-full"
        >
          <Ionicons name="images-outline" size={40} color="white" />
        </TouchableOpacity>

        {/* Confirm Selection */}
        {selectedImage && (
          <TouchableOpacity
            onPress={() => {}}
            className="p-4 bg-green-600 rounded-full"
          >
            <Ionicons name="checkmark-circle-outline" size={40} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default AddMedia;
