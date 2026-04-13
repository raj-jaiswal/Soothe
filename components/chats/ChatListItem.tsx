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
        {/* Make name and message bold if unread */}
        <Text style={[styles.name, chat.isUnread && styles.unreadTextBold]}>
          {chat.name}
        </Text>
        <Text
          style={[styles.message, chat.isUnread && styles.unreadTextBold]}
          numberOfLines={1}
        >
          {chat.message}
        </Text>
      </View>

      {/* Render a dot instead of a number for frontend-only tracking */}
      {chat.isUnread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", marginVertical: 14 },
  textContainer: { flex: 1 },
  name: { color: "white", fontSize: 16, fontWeight: "600" },
  message: { color: "#aaa", fontSize: 13, marginTop: 2 },

  // New styles for unread states
  unreadTextBold: {
    fontWeight: "bold",
    color: "white", // Brighten the preview text if it's unread
  },
  unreadDot: {
    backgroundColor: "#7B2FF7", // Matches your loading indicator theme
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 10,
  },

  // Avatar Styles
  avatarInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 14,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333",
  },
  avatarInnerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  avatarEmoji: {
    fontSize: 24,
  },
});
