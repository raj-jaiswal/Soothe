import "react-native-get-random-values";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CryptoJS from "crypto-js";
import { useLocalSearchParams, useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import React, { useEffect, useRef, useState } from "react";
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
import io, { Socket } from "socket.io-client";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";

type Message = {
  id: string;
  text: string;
  sender: "me" | "them";
  timeStamp: number;
};

export default function MessagePage() {
  const { id: chatId, name, recipientUsername } = useLocalSearchParams();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [myUsername, setMyUsername] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);

  // Derive Shared Secret securely based on alphabetically sorting usernames
  const sharedKey = [myUsername, String(recipientUsername)].sort().join("_");

  useEffect(() => {
    let isActive = true;
    let socketInstance: Socket | null = null;

    const initChat = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token || !isActive) return;

      const decoded: any = jwtDecode(token);
      if (isActive) setMyUsername(decoded.username);

      // 1. Fetch History
      try {
        const res = await fetch(`${BACKEND_URL}chats/${chatId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (res.ok && isActive) {
          const history = data.map((msg: any) => {
            let decryptedText = "Encrypted Message";
            try {
              const bytes = CryptoJS.AES.decrypt(msg.ciphertext, sharedKey);
              decryptedText =
                bytes.toString(CryptoJS.enc.Utf8) || "Error decrypting";
            } catch (e) {
              console.error("Decryption failed", e);
            }

            return {
              id: msg.SK,
              text: decryptedText,
              sender: msg.senderUsername === decoded.username ? "me" : "them",
              timeStamp: msg.timeStamp,
            };
          });
          setMessages(history);
        }
      } catch (error) {
        console.error("Failed to fetch messages", error);
      }

      // If the user backed out while fetching, don't create a socket!
      if (!isActive) return;

      // 2. Initialize Socket Connection
      socketInstance = io(BACKEND_URL.replace("/api/", ""), {
        auth: { token },
      });

      socketInstance.emit("join", { chatId });

      socketInstance.on("receiveMessage", (msgRecord: any) => {
        let decryptedText = "Encrypted Message";
        try {
          const bytes = CryptoJS.AES.decrypt(msgRecord.ciphertext, sharedKey);
          decryptedText = bytes.toString(CryptoJS.enc.Utf8);
        } catch (e) {
          console.error("Decryption failed", e);
        }

        const newMsg: Message = {
          id: msgRecord.SK,
          text: decryptedText,
          sender: msgRecord.senderUsername === decoded.username ? "me" : "them",
          timeStamp: msgRecord.timeStamp,
        };

        // 3. SAFEGUARD: Check if the message ID is already in the list before adding
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      });

      if (isActive) setSocket(socketInstance);
    };

    if (chatId) initChat();

    // CLEANUP: Runs when component unmounts
    return () => {
      isActive = false;
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [chatId, sharedKey]);

  const sendMessage = () => {
    if (!inputText.trim() || !socket) return;

    // Encrypt the text
    const ciphertext = CryptoJS.AES.encrypt(
      inputText.trim(),
      sharedKey,
    ).toString();

    socket.emit("sendMessage", {
      chatId,
      recipientUsername,
      ciphertext,
      iv: "default", // AES in CryptoJS handles IV internally, just passing a string for schema matching
      messageType: "text",
    });

    setInputText("");
  };

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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>{name}</Text>
          <Ionicons name="call-outline" size={22} color="white" />
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={{ paddingVertical: 10 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.chatBox}>
          <TextInput
            placeholder="Message"
            placeholderTextColor="#aaa"
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Ionicons name="send" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#1f1f1f" },
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 15,
  },
  title: { color: "white", fontSize: 20, fontWeight: "600" },
  list: { flex: 1 },
  messageBubble: {
    maxWidth: "70%",
    padding: 12,
    borderRadius: 14,
    marginVertical: 6,
  },
  myMessage: { alignSelf: "flex-end", backgroundColor: "#7B2FF7" },
  theirMessage: { alignSelf: "flex-start", backgroundColor: "#333" },
  messageText: { color: "white" },
  chatBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 6,
    marginVertical: 10,
  },
  input: { flex: 1, color: "white", paddingVertical: 10 },
  sendButton: {
    backgroundColor: "#7B2FF7",
    padding: 10,
    borderRadius: 20,
    marginLeft: 10,
  },
});
