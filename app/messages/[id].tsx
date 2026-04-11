import "react-native-get-random-values";

import { useAppTheme } from "@/components/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CryptoJS from "crypto-js";
import { useLocalSearchParams, useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
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

function getInitials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function MessagePage() {
  const {
    id: chatId,
    name,
    recipientUsername,
    profileImage,
  } = useLocalSearchParams();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const { currentMood } = useAppTheme();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [myUsername, setMyUsername] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sharedKey = [myUsername, String(recipientUsername)].sort().join("_");

  useEffect(() => {
    let isActive = true;
    let socketInstance: Socket | null = null;

    const initChat = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token || !isActive) return;

      const decoded: any = jwtDecode(token);
      if (isActive) setMyUsername(decoded.username);

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
      } finally {
        if (isActive) setIsLoading(false);
      }

      if (!isActive) return;

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

        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      });

      if (isActive) setSocket(socketInstance);
    };

    if (chatId) initChat();

    return () => {
      isActive = false;
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [chatId, sharedKey]);

  const sendMessage = () => {
    if (!inputText.trim() || !socket) return;

    const ciphertext = CryptoJS.AES.encrypt(
      inputText.trim(),
      sharedKey,
    ).toString();

    socket.emit("sendMessage", {
      chatId,
      recipientUsername,
      ciphertext,
      iv: "default",
      messageType: "text",
    });

    setInputText("");
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender === "me"
          ? [styles.myMessage, { backgroundColor: currentMood.colors[1] }]
          : styles.theirMessage,
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
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ paddingRight: 10 }}
          >
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>

          <View style={styles.headerProfile}>
            {profileImage && profileImage !== "undefined" ? (
              <Image
                source={{ uri: profileImage as string }}
                style={styles.headerAvatar}
              />
            ) : (
              <View style={styles.headerAvatarFallback}>
                <Text style={styles.headerAvatarText}>
                  {getInitials(name as string)}
                </Text>
              </View>
            )}
            <Text style={styles.title}>{name}</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={currentMood.colors[1]} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Start a conversation with {name}
                </Text>
              </View>
            }
          />
        )}

        <View style={styles.chatBox}>
          <TextInput
            placeholder="Message"
            placeholderTextColor="#aaa"
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: currentMood.colors[1] },
            ]}
            onPress={sendMessage}
          >
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
    marginTop: 10,
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerProfile: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: "#333",
  },
  headerAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  title: { color: "white", fontSize: 18, fontWeight: "600" },

  list: { flex: 1 },
  listContent: {
    paddingVertical: 10,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: "70%",
    padding: 12,
    borderRadius: 14,
    marginVertical: 6,
  },
  myMessage: { alignSelf: "flex-end" },
  theirMessage: { alignSelf: "flex-start", backgroundColor: "#333" },
  messageText: { color: "white", fontSize: 15 },

  chatBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 6,
    marginVertical: 10,
  },
  input: { flex: 1, color: "white", paddingVertical: 10, fontSize: 15 },
  sendButton: {
    padding: 10,
    borderRadius: 20,
    marginLeft: 10,
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: "50%",
  },
  emptyText: {
    color: "#888",
    fontSize: 15,
    textAlign: "center",
  },
});
