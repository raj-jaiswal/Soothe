import { useAppTheme } from "@/components/context/ThemeContext";
import { useSongPlayer } from "@/components/index/SongPlayerContext";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SectionList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL?.endsWith("/")
  ? process.env.EXPO_PUBLIC_BACKEND_URL
  : `${process.env.EXPO_PUBLIC_BACKEND_URL}/`;

// --- Types ---
type Song = {
  id: string;
  title: string;
  artist: string;
  coverUri: string;
  duration: number;
};
type Playlist = {
  id: string;
  name: string;
  description: string;
  image: string;
  isPublic: boolean;
};
type User = { id: string; name: string; handle: string; profileImage?: string };

export default function GlobalSearchScreen() {
  const router = useRouter();
  const { currentMood } = useAppTheme();
  const { openSong } = useSongPlayer();

  // --- State ---
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [myUsername, setMyUsername] = useState("");

  // Data Stores
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [allPlaylists, setAllPlaylists] = useState<Playlist[]>([]);
  const [myFriends, setMyFriends] = useState<User[]>([]);
  const [userResults, setUserResults] = useState<User[]>([]);
  const [processingUser, setProcessingUser] = useState<string | null>(null);

  // --- Debounce ---
  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedQuery(query.trim().toLowerCase()),
      500,
    );
    return () => clearTimeout(timer);
  }, [query]);

  // --- Initial Data Fetch (Songs, Playlists, Friends) ---
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          const decoded: any = jwtDecode(token);
          setMyUsername(decoded.username);
        }

        const headers = { Authorization: `Bearer ${token}` };

        // Fetch concurrently
        const [songsRes, publicPlRes, personalPlRes, friendsRes] =
          await Promise.all([
            fetch(`${BACKEND_URL}songs`, { headers }).catch(() => null),
            fetch(`${BACKEND_URL}public-playlists`, { headers }).catch(
              () => null,
            ),
            fetch(`${BACKEND_URL}personal-playlists/`, { headers }).catch(
              () => null,
            ),
            fetch(`${BACKEND_URL}friends`, { headers }).catch(() => null),
          ]);

        // Parse Songs
        if (songsRes?.ok) {
          const songsData = await songsRes.json();
          setAllSongs(
            (songsData || []).map((s: any) => ({
              id: String(s.song_ID || s.songId || s.id),
              title: s.title || s.name || "Untitled",
              artist: s.artist || s.artistName || "Unknown Artist",
              coverUri:
                s.cover ||
                s.image ||
                s.coverArt ||
                "https://via.placeholder.com/100",
              duration: 240, // default or parsed
            })),
          );
        }

        // Parse Playlists (Combining Public and Personal)
        const playlists: Playlist[] = [];
        if (publicPlRes?.ok) {
          const pubData = await publicPlRes.json();
          const pubList = Array.isArray(pubData)
            ? pubData
            : pubData?.items || [];
          playlists.push(
            ...pubList.map((p: any) => ({
              id: p.playlistId || p.PK?.replace(/^PLAYLIST#/, ""),
              name: p.name || "Public Playlist",
              description: p.description || "Public",
              image: p.image || "https://via.placeholder.com/100",
              isPublic: true,
            })),
          );
        }
        if (personalPlRes?.ok) {
          const perData = await personalPlRes.json();
          playlists.push(
            ...(perData || []).map((p: any) => ({
              id: p.playlistId,
              name: p.nameOfPlaylist || "My Playlist",
              description: "Personal",
              image: "https://via.placeholder.com/100", // Update if personal has covers
              isPublic: false,
            })),
          );
        }
        setAllPlaylists(playlists);

        // Parse Friends
        if (friendsRes?.ok) {
          const friendsData = await friendsRes.json();
          setMyFriends(friendsData.friends || []);
        }
      } catch (err) {
        console.error("Error fetching initial search data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // --- Remote User Search ---
  useEffect(() => {
    const searchRemoteUsers = async () => {
      if (!debouncedQuery) {
        setUserResults([]);
        return;
      }
      setSearchLoading(true);
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await fetch(
          `${BACKEND_URL}friends/search?q=${debouncedQuery}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (res.ok) {
          const data = await res.json();
          setUserResults(data || []);
        }
      } catch (err) {
        console.error("User search failed", err);
      } finally {
        setSearchLoading(false);
      }
    };

    searchRemoteUsers();
  }, [debouncedQuery]);

  // --- Local Filtering Logic ---
  const sections = useMemo(() => {
    if (!debouncedQuery) return [];

    const matchedSongs = allSongs.filter(
      (s) =>
        s.title.toLowerCase().includes(debouncedQuery) ||
        s.artist.toLowerCase().includes(debouncedQuery),
    );

    const matchedPlaylists = allPlaylists.filter(
      (p) =>
        p.name.toLowerCase().includes(debouncedQuery) ||
        p.description.toLowerCase().includes(debouncedQuery),
    );

    const dataSections = [];
    if (matchedSongs.length > 0)
      dataSections.push({ title: "Songs", data: matchedSongs, type: "song" });
    if (matchedPlaylists.length > 0)
      dataSections.push({
        title: "Playlists",
        data: matchedPlaylists,
        type: "playlist",
      });
    if (userResults.length > 0)
      dataSections.push({ title: "People", data: userResults, type: "user" });

    return dataSections;
  }, [debouncedQuery, allSongs, allPlaylists, userResults]);

  // --- Actions ---
  const handleSongPress = (song: Song) => {
    // Explicitly map the payload so the SongPlayerContext gets exactly what it needs
    openSong({
      id: song.id,
      title: song.title,
      artist: song.artist,
      duration: song.duration || 240,
      coverUri: song.coverUri || "https://picsum.photos/300",
    });
  };

  const handlePlaylistPress = (playlist: Playlist) => {
    router.push({
      pathname: "/(tabs)/playlist-details",
      params: {
        playlistId: playlist.id,
        // Pass the type so the details page knows which API to fetch from
        type: playlist.isPublic ? "public" : "personal",
      },
    });
  };

  const handleUserAction = async (user: User) => {
    const isFriend = myFriends.some((f) => f.id === user.id);
    if (isFriend) {
      // Open Chat
      const chatId = [myUsername, user.id].sort().join("_");
      router.push({
        pathname: "/messages/[id]",
        params: {
          id: chatId,
          name: user.name || user.handle,
          recipientUsername: user.id,
          profileImage: user.profileImage || "",
        },
      });
    } else {
      // Send Request
      try {
        setProcessingUser(user.id);
        const token = await AsyncStorage.getItem("token");
        const res = await fetch(`${BACKEND_URL}friends/request`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ receiverUsername: user.id }),
        });
        if (res.ok) alert("Friend request sent!");
      } catch (err) {
        console.error(err);
      } finally {
        setProcessingUser(null);
      }
    }
  };

  // --- Renderers ---
  const renderItem = ({ item, section }: any) => {
    if (section.type === "song") {
      return (
        <TouchableOpacity
          style={styles.row}
          onPress={() => handleSongPress(item)}
          activeOpacity={0.7}
        >
          <Image source={{ uri: item.coverUri }} style={styles.thumb} />
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {item.artist}
            </Text>
          </View>
          <Feather name="play" size={18} color={currentMood.colors[1]} />
        </TouchableOpacity>
      );
    }

    if (section.type === "playlist") {
      return (
        <TouchableOpacity
          style={styles.row}
          onPress={() => handlePlaylistPress(item)}
          activeOpacity={0.7}
        >
          <Image source={{ uri: item.image }} style={styles.thumb} />
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {item.description}
            </Text>
          </View>
          <Ionicons name="albums-outline" size={18} color="#888" />
        </TouchableOpacity>
      );
    }

    if (section.type === "user") {
      const isFriend = myFriends.some((f) => f.id === item.id);
      const isProcessing = processingUser === item.id;

      return (
        <TouchableOpacity
          style={styles.row}
          onPress={() => handleUserAction(item)}
          activeOpacity={0.7}
        >
          {item.profileImage ? (
            <Image
              source={{ uri: item.profileImage }}
              style={[styles.thumb, styles.circleThumb]}
            />
          ) : (
            <View
              style={[
                styles.thumb,
                styles.circleThumb,
                {
                  backgroundColor: "#333",
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>
                {item.name?.charAt(0) || item.handle?.charAt(0) || "?"}
              </Text>
            </View>
          )}
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {item.name || item.handle}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {item.handle}
            </Text>
          </View>

          <Pressable
            style={[
              styles.actionBtn,
              isFriend ? styles.chatBtn : styles.addBtn,
              { backgroundColor: isFriend ? "#333" : currentMood.colors[1] },
            ]}
            onPress={() => handleUserAction(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionBtnText}>
                {isFriend ? "Message" : "Add"}
              </Text>
            )}
          </Pressable>
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header & Search Input */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search songs, playlists, people..."
              placeholderTextColor="#888"
              value={query}
              onChangeText={setQuery}
              autoFocus
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")}>
                <Feather name="x-circle" size={18} color="#888" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Loading States & Results */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={currentMood.colors[1]} />
            <Text style={styles.loadingText}>Initializing search...</Text>
          </View>
        ) : debouncedQuery.length > 0 &&
          sections.length === 0 &&
          !searchLoading ? (
          <View style={styles.center}>
            <Feather name="search" size={40} color="#444" />
            <Text style={styles.loadingText}>
              No results found for "{debouncedQuery}"
            </Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            renderSectionHeader={({ section: { title } }) => (
              <Text
                style={[styles.sectionTitle, { color: currentMood.colors[1] }]}
              >
                {title}
              </Text>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#181818" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: { padding: 4 },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#242424",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: { flex: 1, color: "white", fontSize: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { color: "#888", fontSize: 14 },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f1f1f",
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  thumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: "#333" },
  circleThumb: { borderRadius: 24 },
  info: { flex: 1 },
  title: { color: "white", fontSize: 15, fontWeight: "600", marginBottom: 4 },
  subtitle: { color: "#888", fontSize: 13 },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: "center",
  },
  addBtn: {},
  chatBtn: { borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  actionBtnText: { color: "white", fontSize: 13, fontWeight: "600" },
});
