import { useState } from "react";
import { View, TouchableOpacity, Image, Text } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

const AddMedia = ({ onSelect }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  return (
    <View className="flex-1 justify-center items-center">
      {selectedImage ? (
        <Image
          source={{ uri: selectedImage }}
          className="w-full h-2/3 rounded-lg"
          resizeMode="contain"
        />
      ) : (
        <Text className="text-white text-lg mb-5">No image selected</Text>
      )}

      <View className="flex-row mt-5 space-x-4">
        <TouchableOpacity
          onPress={pickImage}
          className="p-4 bg-blue-500 rounded-full"
        >
          <Ionicons name="images-outline" size={40} color="white" />
        </TouchableOpacity>

        {selectedImage && (
          <TouchableOpacity
            onPress={() => onSelect(selectedImage)}
            className="p-4 bg-green-500 rounded-full"
          >
            <Ionicons name="checkmark-circle-outline" size={40} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default AddMedia;
