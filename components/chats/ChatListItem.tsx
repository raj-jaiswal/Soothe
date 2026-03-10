import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ChatListItem({ chat }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() =>
        router.push({
          pathname: "/messages/[id]",
          params: {
            id: chat.id,
            name: chat.name,
          },
        })
      }
    >
      <Image source={{ uri: chat.avatar }} style={styles.avatar} />

      <View style={styles.textContainer}>
        <Text style={styles.name}>{chat.name}</Text>
        <Text style={styles.message}>{chat.message}</Text>
      </View>

      {chat.unread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{chat.unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 30,
    marginRight: 14,
  },

  textContainer: {
    flex: 1,
  },

  name: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  message: {
    color: "#aaa",
    fontSize: 13,
    marginTop: 2,
  },

  badge: {
    backgroundColor: "white",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
