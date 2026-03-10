import ChatListItem from "@/components/chats/ChatListItem";
import StoriesRow from "@/components/chats/StoriesRow";
import { Ionicons } from "@expo/vector-icons";
import { FlatList, StyleSheet, Text, View } from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

const chats = [
  {
    id: "1",
    name: "Arvind",
    message: "Ooh I like the sound of that",
    avatar: "https://i.pravatar.cc/150?img=1",
    unread: 0,
  },
  {
    id: "2",
    name: "Rahul Singla",
    message: "Sent a song",
    avatar: "https://i.pravatar.cc/150?img=2",
    unread: 0,
  },
  {
    id: "3",
    name: "Piyush Singh",
    message: "well yeah I am running out of ideas",
    avatar: "https://i.pravatar.cc/150?img=3",
    unread: 3,
  },
  {
    id: "4",
    name: "Mrinalini",
    message: "Heyy Been a while",
    avatar: "https://i.pravatar.cc/150?img=4",
    unread: 0,
  },
  {
    id: "5",
    name: "Akshara Sen",
    message: "You sent a song",
    avatar: "https://i.pravatar.cc/150?img=5",
    unread: 0,
  },
  {
    id: "6",
    name: "Aradhana",
    message: "okay",
    avatar: "https://i.pravatar.cc/150?img=6",
    unread: 0,
  },
  {
    id: "7",
    name: "Arvind",
    message: "Ooh I like the sound of that",
    avatar: "https://i.pravatar.cc/150?img=1",
    unread: 0,
  },
  {
    id: "8",
    name: "Rahul Singla",
    message: "Sent a song",
    avatar: "https://i.pravatar.cc/150?img=2",
    unread: 0,
  },
  {
    id: "9",
    name: "Piyush Singh",
    message: "well yeah I am running out of ideas",
    avatar: "https://i.pravatar.cc/150?img=3",
    unread: 3,
  },
  {
    id: "10",
    name: "Mrinalini",
    message: "Heyy Been a while",
    avatar: "https://i.pravatar.cc/150?img=4",
    unread: 0,
  },
  {
    id: "11",
    name: "Akshara Sen",
    message: "You sent a song",
    avatar: "https://i.pravatar.cc/150?img=5",
    unread: 0,
  },
];

export default function Chats() {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
        <Ionicons name="person-add" size={24} color="white" />
      </View>

      <StoriesRow />

      <View style={styles.divider} />

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatListItem chat={item} />}
        style={{ marginBottom: insets.bottom + 50 }}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1f1f1f",
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 15,
  },

  title: {
    fontSize: 28,
    color: "white",
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#444",
    marginVertical: 20,
  },
});
