import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useSongPlayer } from "@/components/index/SongPlayerContext";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { openSong } = useSongPlayer();
  const router = useRouter();

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${BACKEND_URL}user/me/history`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Listening History</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#c084fc" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {history.length > 0 ? (
            <View style={styles.songsSection}>
              {history.map((song, i) => (
                <SongRow
                  key={`history-${song.songId || song.id}-${i}`}
                  title={song.name || song.title}
                  subtitle={song.artist}
                  onPress={() =>
                    openSong({
                      id: song.songId || song.id,
                      title: song.name || song.title,
                      artist: song.artist,
                      duration: song.duration,
                    })
                  }
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No listening history yet.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SongRow({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.songRow} onPress={onPress}>
      <View style={styles.albumCircle}>
        <Text>🎵</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.songTitle}>{title}</Text>
        {subtitle ? <Text style={styles.songSubtitle}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#151515" },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.03)",
  },
  backBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: "center",
    width: "100%",
  },
  songsSection: { width: "92%" },
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#1c1c1c",
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
  },
  albumCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  songTitle: { color: "#f0f0f0", fontSize: 16, fontWeight: "700", marginBottom: 2 },
  songSubtitle: { color: "#a0a0a0", fontSize: 13, fontWeight: "500" },
  emptyState: {
    marginTop: 60,
    alignItems: "center",
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "500",
  },
});
