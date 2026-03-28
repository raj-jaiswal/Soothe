import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";

type Person = {
  id: string; // Used as the username
  name: string;
  handle: string;
  note?: string;
};

type FriendsSection = {
  title: string;
  variant: "pending" | "friend" | "search";
  data: Person[];
};

type ProcessingTask = {
  id: string;
  type: "add" | "accept" | "reject";
} | null;

function getInitials(name?: string) {
  if (!name) return "?"; // Fallback for undefined/null names

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function FriendsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const [friends, setFriends] = useState<Person[]>([]);
  const [pending, setPending] = useState<Person[]>([]);
  const [searchResults, setSearchResults] = useState<Person[]>([]);

  const [loading, setLoading] = useState(true);

  // Track specific button actions for loading spinners
  const [processingTask, setProcessingTask] = useState<ProcessingTask>(null);

  // Custom Toast State
  const [toastMsg, setToastMsg] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Debounce user search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch Friends and Pending Requests on Mount
  useEffect(() => {
    fetchFriendsData();
  }, []);

  // Fetch Search Results when Query changes
  useEffect(() => {
    if (debouncedQuery.length > 0) {
      handleSearch(debouncedQuery);
    } else {
      setSearchResults([]);
    }
  }, [debouncedQuery]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setToastMsg(""));
      }, 2500);
    });
  };

  const getHeaders = async () => {
    const token = await AsyncStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchFriendsData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}friends`, {
        headers: await getHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setFriends(data.friends || []);
        setPending(
          (data.pending || []).map((p: Person) => ({
            ...p,
            note: "Sent you a request",
          })),
        );
      }
    } catch (error) {
      console.error("Failed to fetch friends", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (q: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}friends/search?q=${q}`, {
        headers: await getHeaders(),
      });
      const data = await res.json();
      if (res.ok) setSearchResults(data);
    } catch (error) {
      console.error("Search failed", error);
    }
  };

  const sendRequest = async (username: string) => {
    try {
      setProcessingTask({ id: username, type: "add" });
      const res = await fetch(`${BACKEND_URL}friends/request`, {
        method: "POST",
        headers: await getHeaders(),
        body: JSON.stringify({ receiverUsername: username }),
      });
      if (res.ok) {
        showToast("Friend request sent!");
        setQuery(""); // Clear search to return to main list
      }
    } catch (error) {
      console.error("Failed to send request", error);
    } finally {
      setProcessingTask(null);
    }
  };

  const acceptRequest = async (username: string) => {
    try {
      setProcessingTask({ id: username, type: "accept" });
      const res = await fetch(`${BACKEND_URL}friends/accept`, {
        method: "POST",
        headers: await getHeaders(),
        body: JSON.stringify({ senderUsername: username }),
      });
      if (res.ok) {
        showToast("Request accepted!");
        await fetchFriendsData(); // Refresh list
      }
    } catch (error) {
      console.error("Failed to accept request", error);
    } finally {
      setProcessingTask(null);
    }
  };

  const rejectRequest = async (username: string) => {
    try {
      setProcessingTask({ id: username, type: "reject" });
      const res = await fetch(`${BACKEND_URL}friends/reject`, {
        method: "POST",
        headers: await getHeaders(),
        body: JSON.stringify({ senderUsername: username }),
      });
      if (res.ok) {
        showToast("Request ignored");
        await fetchFriendsData(); // Refresh list
      }
    } catch (error) {
      console.error("Failed to reject request", error);
    } finally {
      setProcessingTask(null);
    }
  };

  const sections: FriendsSection[] = useMemo(() => {
    if (debouncedQuery.length > 0) {
      return [
        {
          title: "Search Results",
          variant: "search",
          data: searchResults,
        },
      ];
    }

    const s: FriendsSection[] = [];
    if (pending.length > 0) {
      s.push({ title: "Pending Requests", variant: "pending", data: pending });
    }
    s.push({ title: "Friends", variant: "friend", data: friends });

    return s;
  }, [debouncedQuery, pending, friends, searchResults]);

  const renderPersonRow = ({
    item,
    section,
  }: {
    item: Person;
    section: FriendsSection;
  }) => {
    const isAdding =
      processingTask?.id === item.id && processingTask?.type === "add";
    const isAccepting =
      processingTask?.id === item.id && processingTask?.type === "accept";
    const isRejecting =
      processingTask?.id === item.id && processingTask?.type === "reject";
    const isProcessingThisUser = processingTask?.id === item.id;

    const isAlreadyFriend = friends.some((f) => f.id === item.id);
    const isAlreadyPending = pending.some((p) => p.id === item.id);

    return (
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.name}>{item.name || item.handle}</Text>
          <Text style={styles.handle}>{item.handle}</Text>
          {item.note && <Text style={styles.note}>{item.note}</Text>}
        </View>

        {section.variant === "search" && (
          <>
            {isAlreadyFriend ? (
              <Text style={styles.statusText}>Friend</Text>
            ) : isAlreadyPending ? (
              <Text style={styles.statusText}>Pending</Text>
            ) : (
              <Pressable
                style={[
                  styles.acceptBtn,
                  isProcessingThisUser && { opacity: 0.7 },
                ]}
                onPress={() => sendRequest(item.id)}
                disabled={isProcessingThisUser}
              >
                {isAdding ? (
                  <ActivityIndicator size="small" color="#111" />
                ) : (
                  <Text style={styles.acceptBtnText}>Add</Text>
                )}
              </Pressable>
            )}
          </>
        )}

        {section.variant === "pending" && (
          <View style={styles.actionRow}>
            <Pressable
              style={[
                styles.acceptBtn,
                isProcessingThisUser && { opacity: 0.7 },
              ]}
              onPress={() => acceptRequest(item.id)}
              disabled={isProcessingThisUser}
            >
              {isAccepting ? (
                <ActivityIndicator size="small" color="#111" />
              ) : (
                <Text style={styles.acceptBtnText}>Accept</Text>
              )}
            </Pressable>
            <Pressable
              style={styles.cancelBtn}
              onPress={() => rejectRequest(item.id)}
              disabled={isProcessingThisUser}
            >
              {isRejecting ? (
                <ActivityIndicator size="small" color="#8b8b8b" />
              ) : (
                <Ionicons name="close-outline" size={22} color="#8b8b8b" />
              )}
            </Pressable>
          </View>
        )}

        {section.variant === "friend" && (
          <Ionicons name="chevron-forward" size={22} color="#8b8b8b" />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.container, { paddingBottom: insets.bottom + 18 }]}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </Pressable>

          <View style={styles.searchBar}>
            <Feather name="search" size={18} color="#bdbdbd" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Add friend"
              placeholderTextColor="#8d8d8d"
              style={styles.searchInput}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {loading && <ActivityIndicator size="small" color="#a78bfa" />}
          </View>
        </View>

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionTitle}>{section.title}</Text>
          )}
          renderItem={renderPersonRow}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          SectionSeparatorComponent={() => <View style={{ height: 22 }} />}
          ListEmptyComponent={
            !loading && query.length === 0 ? (
              <Text
                style={{ color: "#8d8d8d", textAlign: "center", marginTop: 20 }}
              >
                No friends yet. Search to add some!
              </Text>
            ) : null
          }
        />
      </View>

      {/* Toast Overlay */}
      {toastMsg ? (
        <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }]}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#151515",
    paddingTop: 12,
  },
  container: {
    flex: 1,
    backgroundColor: "#151515",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
    marginBottom: 18,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#222",
  },
  searchBar: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#222",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: "white",
    fontSize: 15,
    paddingVertical: 0,
  },
  listContent: {
    paddingBottom: 24,
  },
  sectionTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 14,
    marginTop: 6,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f1f1f",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#2c2c2c",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  avatarText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  textBlock: {
    flex: 1,
    paddingRight: 10,
  },
  name: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  handle: {
    color: "#a6a6a6",
    marginTop: 2,
    fontSize: 13,
  },
  note: {
    color: "#d0d0d0",
    marginTop: 5,
    fontSize: 12,
  },
  acceptBtn: {
    backgroundColor: "white",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70, // Prevents button from shrinking when loading spinner appears
    alignItems: "center",
  },
  acceptBtnText: {
    color: "#111",
    fontWeight: "700",
    fontSize: 13,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cancelBtn: {
    padding: 6,
    minWidth: 34,
    alignItems: "center",
  },
  statusText: {
    color: "#6b6b6b",
    fontSize: 13,
    fontWeight: "700",
    marginRight: 8,
  },
  toastContainer: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "#2c2c2c",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 100,
  },
  toastText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
