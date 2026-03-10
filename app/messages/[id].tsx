import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Message = {
  id: string;
  text: string;
  sender: "me" | "them";
  date: string;
};

const messages: Message[] = [
  {
    id: "1",
    text: "Lorem ipsum dolor sit amet consectetur adipiscing elit.",
    sender: "them",
    date: "Today",
  },
  {
    id: "2",
    text: "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    sender: "me",
    date: "Today",
  },
  {
    id: "3",
    text: "Ut enim ad minim veniam quis nostrud exercitation.",
    sender: "them",
    date: "Yesterday",
  },
  {
    id: "4",
    text: "Duis aute irure dolor in reprehenderit.",
    sender: "me",
    date: "Yesterday",
  },
];

export default function MessagePage() {
  const { name } = useLocalSearchParams();
  const router = useRouter();

  const renderItem = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender === "me" ? styles.myMessage : styles.theirMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>

          <Text style={styles.title}>{name}</Text>

          <Ionicons name="call-outline" size={22} color="white" />
        </View>

        {/* Messages */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={{ paddingVertical: 10 }}
          showsVerticalScrollIndicator={false}
        />

        {/* Chat Input */}
        <View style={styles.chatBox}>
          <TextInput
            placeholder="Message"
            placeholderTextColor="#aaa"
            style={styles.input}
          />

          <TouchableOpacity style={styles.sendButton}>
            <Ionicons name="send" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#1f1f1f",
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 15,
  },

  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },

  list: {
    flex: 1,
  },

  messageBubble: {
    maxWidth: "70%",
    padding: 12,
    borderRadius: 14,
    marginVertical: 6,
  },

  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#7B2FF7",
  },

  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#333",
  },

  messageText: {
    color: "white",
  },

  chatBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 6,
    marginVertical: 10,
  },

  input: {
    flex: 1,
    color: "white",
    paddingVertical: 10,
  },

  sendButton: {
    backgroundColor: "#7B2FF7",
    padding: 10,
    borderRadius: 20,
    marginLeft: 10,
  },
});
