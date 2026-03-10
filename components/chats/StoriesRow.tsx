import { FlatList, View } from "react-native";
import StoryAvatar from "./StoryAvatar";

const stories = [
  { id: "1", image: "https://i.pravatar.cc/150?img=1" },
  { id: "2", image: "https://i.pravatar.cc/150?img=2" },
  { id: "3", image: "https://i.pravatar.cc/150?img=3" },
  { id: "4", image: "https://i.pravatar.cc/150?img=4" },
  { id: "5", image: "https://i.pravatar.cc/150?img=5" },
  { id: "6", image: "https://i.pravatar.cc/150?img=1" },
  { id: "7", image: "https://i.pravatar.cc/150?img=2" },
  { id: "8", image: "https://i.pravatar.cc/150?img=3" },
  { id: "9", image: "https://i.pravatar.cc/150?img=4" },
  { id: "10", image: "https://i.pravatar.cc/150?img=5" },
  { id: "11", image: "https://i.pravatar.cc/150?img=1" },
  { id: "12", image: "https://i.pravatar.cc/150?img=2" },
  { id: "13", image: "https://i.pravatar.cc/150?img=3" },
  { id: "14", image: "https://i.pravatar.cc/150?img=4" },
  { id: "15", image: "https://i.pravatar.cc/150?img=5" },
];

export default function StoriesRow() {
  return (
    <View>
      <FlatList
        data={stories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <StoryAvatar image={item.image} />}
      />
    </View>
  );
}
