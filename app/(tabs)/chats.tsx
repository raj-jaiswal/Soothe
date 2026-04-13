import "react-native-get-random-values";

import ChatListItem from "@/components/chats/ChatListItem";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CryptoJS from "crypto-js";
import { useFocusEffect, useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import io, { Socket } from "socket.io-client";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";

export default function Chats() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myUsername, setMyUsername] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchChats = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return router.replace("/login");

      const decoded: any = jwtDecode(token);
      setMyUsername(decoded.username);

      const res = await fetch(`${BACKEND_URL}chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        // Fetch local read receipts for the unread dot
        const storedReceipts = await AsyncStorage.getItem("read_receipts");
        const readReceipts = storedReceipts ? JSON.parse(storedReceipts) : {};

        const processedChats = data.map((chat: any) => {
          // Compare the chat's latest timestamp to our locally saved "read" timestamp
          const lastReadTime = readReceipts[chat.id] || 0;
          chat.isUnread = chat.timeStamp > lastReadTime;

          if (chat.message === "Start a conversation...") return chat;

          try {
            const sharedKey = [decoded.username, chat.recipientUsername]
              .sort()
              .join("_");
            const bytes = CryptoJS.AES.decrypt(chat.message, sharedKey);
            chat.message =
              bytes.toString(CryptoJS.enc.Utf8) || "Encrypted Message";
          } catch (e) {
            chat.message = "Encrypted Message";
          }
          return chat;
        });

        setChats(processedChats);
        return { processedChats, token, username: decoded.username };
      }
    } catch (error) {
      console.error("Failed to fetch chats", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      let socketInstance: Socket | null = null;

      const init = async () => {
        const result = await fetchChats();
        if (!result || !isActive) return;

        // Establish ONE socket connection for the whole list
        socketInstance = io(BACKEND_URL.replace("/api/", ""), {
          auth: { token: result.token },
        });

        // Join the rooms for all active chats over this single connection
        result.processedChats.forEach((chat: any) => {
          socketInstance?.emit("join", { chatId: chat.id });
        });

        // Listen for new messages globally
        socketInstance.on("receiveMessage", async (msgRecord: any) => {
          setChats((prevChats) => {
            const updatedChats = [...prevChats];
            const chatIndex = updatedChats.findIndex(
              (c) => c.id === msgRecord.chatId,
            );

            if (chatIndex > -1) {
              const chat = updatedChats[chatIndex];

              // Decrypt the incoming live preview
              let decryptedText = "Encrypted Message";
              try {
                const sharedKey = [result.username, chat.recipientUsername]
                  .sort()
                  .join("_");
                const bytes = CryptoJS.AES.decrypt(
                  msgRecord.ciphertext,
                  sharedKey,
                );
                decryptedText = bytes.toString(CryptoJS.enc.Utf8);
              } catch (e) {
                console.error("Decryption failed", e);
              }

              // Update the chat object data
              chat.message = decryptedText;
              chat.timeStamp = msgRecord.timeStamp;

              // Only mark as unread if the message wasn't sent by us
              if (msgRecord.senderUsername !== result.username) {
                chat.isUnread = true;
              }

              // Move this chat to the top of the list
              updatedChats.splice(chatIndex, 1);
              updatedChats.unshift(chat);
            }
            return updatedChats;
          });
        });

        setSocket(socketInstance);
      };

      init();

      return () => {
        isActive = false;
        if (socketInstance) socketInstance.disconnect();
      };
    }, []),
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
        <TouchableOpacity
          onPress={() => {
            router.push("/friends");
          }}
        >
          <Ionicons name="person-add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#7B2FF7"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          // We don't need to pass isUnread as a prop anymore since we pass the whole 'item' (chat)
          // and ChatListItem pulls it directly via chat.isUnread
          renderItem={({ item }) => <ChatListItem chat={item} />}
          style={{ marginBottom: insets.bottom + 50 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={{ color: "#888", textAlign: "center", marginTop: 20 }}>
              No chats yet. Go to Friends to start one!
            </Text>
          }
        />
      )}
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
  title: { fontSize: 28, color: "white", fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#444", marginVertical: 20 },
});
