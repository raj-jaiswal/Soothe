import { Image, StyleSheet, View } from "react-native";

export default function StoryAvatar({ image }) {
  return (
    <View style={styles.wrapper}>
      <Image source={{ uri: image }} style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginRight: 12,
    padding: 3,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#a855f7",
  },

  image: {
    width: 55,
    height: 55,
    borderRadius: 40,
  },
});
