import "react-native-get-random-values";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CryptoJS from "crypto-js";
import { jwtDecode } from "jwt-decode";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";

type Friend = {
  id: string;
  name: string;
  handle?: string;
  profileImage?: string;
};

type Props = {
  visible: boolean;
  title: string;
  messageText: string;
  onClose: () => void;
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

export default function ShareWithFriendMenu({
  visible,
  title,
  messageText,
  onClose,
}: Props) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharingWith, setSharingWith] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;

    const loadFriends = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          Alert.alert("Login required", "Please log in again.");
          onClose();
          return;
        }

        const res = await fetch(`${BACKEND_URL}friends`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const text = await res.text();
        let data: any = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {}

        if (!res.ok) {
          Alert.alert("Failed", data.error || "Could not load friends.");
          onClose();
          return;
        }

        setFriends(data.friends || []);
      } catch (err) {
        console.log("Error loading friends:", err);
        Alert.alert("Error", "Something went wrong while loading friends.");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    loadFriends();
  }, [visible]);

  const shareWithFriend = async (friend: Friend) => {
    try {
      setSharingWith(friend.id);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Login required", "Please log in again.");
        return;
      }

      const decoded: any = jwtDecode(token);
      const myUsername = decoded.username;
      const sharedKey = [myUsername, friend.id].sort().join("_");
      const ciphertext = CryptoJS.AES.encrypt(messageText, sharedKey).toString();

      const res = await fetch(`${BACKEND_URL}chats/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientUsername: friend.id,
          ciphertext,
          iv: "default",
          messageType: "text",
        }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {}

      if (!res.ok) {
        Alert.alert("Failed", data.error || "Could not share.");
        return;
      }

      Alert.alert("Shared", `Sent to ${friend.name}.`);
      onClose();
    } catch (err) {
      console.log("Error sharing:", err);
      Alert.alert("Error", "Something went wrong while sharing.");
    } finally {
      setSharingWith(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { maxHeight: "75%" }]} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>

          {loading ? (
            <ActivityIndicator size="small" color="#fff" style={{ marginVertical: 18 }} />
          ) : friends.length === 0 ? (
            <Text style={styles.emptyText}>No friends yet.</Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {friends.map((friend) => (
                <TouchableOpacity
                  key={friend.id}
                  style={styles.friendRow}
                  onPress={() => shareWithFriend(friend)}
                  disabled={sharingWith !== null}
                >
                  {friend.profileImage ? (
                    <Image source={{ uri: friend.profileImage }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarText}>{getInitials(friend.name)}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.friendName} numberOfLines={1}>{friend.name}</Text>
                    <Text style={styles.friendHandle} numberOfLines={1}>{friend.handle || `@${friend.id}`}</Text>
                  </View>
                  {sharingWith === friend.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="send" size={18} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#1C1C1C",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    paddingBottom: 34,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#444",
    alignSelf: "center",
    marginBottom: 18,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#2A2A2A",
  },
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  friendName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  friendHandle: {
    color: "#888",
    fontSize: 13,
    marginTop: 2,
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 18,
  },
});
