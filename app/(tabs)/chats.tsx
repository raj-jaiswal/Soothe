import "react-native-get-random-values";

import ChatListItem from "@/components/chats/ChatListItem";
import StoriesRow from "@/components/chats/StoriesRow";
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
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";

export default function Chats() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myUsername, setMyUsername] = useState("");

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
        // Decrypt preview messages
        const decryptedChats = data.map((chat: any) => {
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
        setChats(decryptedChats);
      }
    } catch (error) {
      console.error("Failed to fetch chats", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, []),
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
        <Ionicons name="person-add" size={24} color="white" />
      </View>

      <StoriesRow />
      <View style={styles.divider} />

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
