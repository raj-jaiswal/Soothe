import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSongPlayer } from "@/components/index/SongPlayerContext";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";

/** Deterministic album art from Picsum, seeded from songId */
function getAlbumArt(songId: string, index: number) {
  const numericId = String(songId ?? "").replace(/\D/g, "") || String(index);
  const seed = (parseInt(numericId, 10) % 200) + 50;
  return `https://picsum.photos/seed/${seed}/80/80`;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { openSong, activeSong } = useSongPlayer();
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

  const handlePlay = (song: any) => {
    const songId = song.songId || song.id;
    openSong({
      id: songId,
      title: song.name || song.title,
      artist: song.artist,
      duration: song.duration,
      coverUri: getAlbumArt(songId, history.indexOf(song)),
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Listening History</Text>
        <View style={{ width: 40 }} />
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
              {history.map((song, i) => {
                const songId = song.songId || song.id || "";
                const title = song.name || song.title || "Unknown";
                const artist = song.artist || "";
                const isActive = activeSong?.id === songId;

                return (
                  <TouchableOpacity
                    key={`history-${songId}-${i}`}
                    style={[styles.songRow, isActive && styles.songRowActive]}
                    onPress={() => handlePlay(song)}
                    activeOpacity={0.75}
                  >
                    {/* Album art */}
                    <View style={styles.artWrap}>
                      <Image
                        source={{ uri: getAlbumArt(songId, i) }}
                        style={styles.albumArt}
                        resizeMode="cover"
                      />
                      {isActive && (
                        <View style={styles.playOverlay}>
                          <Ionicons name="volume-high" size={16} color="#fff" />
                        </View>
                      )}
                    </View>

                    {/* Text */}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.songTitle,
                          isActive && { color: "#c084fc" },
                        ]}
                        numberOfLines={1}
                      >
                        {title}
                      </Text>
                      <View
                        style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                      >
                        {artist ? (
                          <Text style={styles.songSubtitle} numberOfLines={1}>
                            {artist}
                          </Text>
                        ) : null}
                        {song.playCount > 1 && (
                          <View style={styles.countBadge}>
                            <Text style={styles.countText}>
                              {song.playCount} plays
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Play icon */}
                    <Ionicons
                      name={isActive ? "pause-circle" : "play-circle-outline"}
                      size={28}
                      color={isActive ? "#c084fc" : "rgba(255,255,255,0.2)"}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="musical-notes-outline" size={48} color="#444" />
              <Text style={styles.emptyText}>No listening history yet.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
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
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  backBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 60,
    alignItems: "center",
    width: "100%",
  },
  songsSection: { width: "92%" },
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#1c1c1c",
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    gap: 12,
  },
  songRowActive: {
    borderColor: "rgba(192,132,252,0.3)",
    backgroundColor: "#1e1828",
  },
  artWrap: { width: 52, height: 52, position: "relative" },
  albumArt: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#2a2a2a",
  },
  playOverlay: {
    position: "absolute",
    inset: 0,
    borderRadius: 12,
    backgroundColor: "rgba(192,132,252,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  songTitle: { color: "#f0f0f0", fontSize: 15, fontWeight: "700", marginBottom: 2 },
  songSubtitle: { color: "#888", fontSize: 12, fontWeight: "500" },
  emptyState: { marginTop: 80, alignItems: "center", gap: 12 },
  emptyText: { color: "#666", fontSize: 15, fontWeight: "500" },
  countBadge: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  countText: {
    color: "#aaa",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
