import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ChatListItem({ chat }: { chat: any }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() =>
        router.push({
          pathname: "/messages/[id]",
          params: {
            id: chat.id, // The Room ID
            name: chat.name,
            recipientUsername: chat.recipientUsername,
            profileImage: chat.profileImage,
          },
        })
      }
    >
      {/* Updated Avatar Section with Fallback */}
      <View style={styles.avatarInner}>
        {chat.profileImage ? (
          <Image
            source={{ uri: chat.profileImage }}
            style={styles.avatarInnerImage}
          />
        ) : (
          <Text style={styles.avatarEmoji}>🎩</Text>
        )}
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.name}>{chat.name}</Text>
        {/* Limit preview text length */}
        <Text style={styles.message} numberOfLines={1}>
          {chat.message}
        </Text>
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
  container: { flexDirection: "row", alignItems: "center", marginVertical: 14 },
  textContainer: { flex: 1 },
  name: { color: "white", fontSize: 16, fontWeight: "600" },
  message: { color: "#aaa", fontSize: 13, marginTop: 2 },
  badge: {
    backgroundColor: "white",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { fontSize: 12, fontWeight: "600" },

  // New Avatar Styles adapted from profile.tsx
  avatarInner: {
    width: 50,
    height: 50,
    borderRadius: 25, // Half of width/height to make it a perfect circle
    marginRight: 14,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333", // Fallback background color
  },
  avatarInnerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  avatarEmoji: {
    fontSize: 24, // Scaled down for the 50x50 container
  },
});
