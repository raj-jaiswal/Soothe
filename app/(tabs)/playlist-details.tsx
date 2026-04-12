import { useAppTheme } from "@/components/context/ThemeContext";
import { useSongPlayer } from "@/components/index/SongPlayerContext";
import Feather from "@expo/vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL?.endsWith("/")
  ? process.env.EXPO_PUBLIC_BACKEND_URL
  : `${process.env.EXPO_PUBLIC_BACKEND_URL}/`;

const PlaylistDetails = () => {
  // Grab the new 'type' parameter alongside playlistId
  const { playlistId, type } = useLocalSearchParams<{
    playlistId: string;
    type: "public" | "personal" | "favourites";
  }>();
  const router = useRouter();
  const { openSong } = useSongPlayer();
  const { currentMood } = useAppTheme();

  const [playlist, setPlaylist] = useState<any>(null);
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlaylistData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Handle Favourites
      if (type === "favourites") {
        setPlaylist({ name: "Favourites" });
        // Fetch all songs and filter (matching your PlaylistScreen logic)
        const res = await fetch(`${BASE_URL}songs`, { headers });
        const text = await res.text();
        const data = text ? JSON.parse(text) : [];
        const favs = data.filter(
          (s: any) => s.isFavourite || s.favorite || s.favourite,
        );
        setSongs(favs);
      }
      // 2. Handle Personal Playlists
      else if (type === "personal") {
        const res = await fetch(`${BASE_URL}personal-playlists/`, { headers });
        const data = await res.json();
        const targetPlaylist = data.find(
          (p: any) => String(p.playlistId) === String(playlistId),
        );

        if (targetPlaylist) {
          setPlaylist({ name: targetPlaylist.nameOfPlaylist || "My Playlist" });
          // Fetch metadata for each song ID in the personal playlist
          const songPromises = (targetPlaylist.songs || []).map((id: string) =>
            fetch(`${BASE_URL}songs/${id}/metadata`, { headers }).then((res) =>
              res.json(),
            ),
          );
          const songsData = await Promise.all(songPromises);
          setSongs(songsData.map((s) => s.metadata));
        } else {
          setPlaylist({ name: "Playlist Not Found" });
        }
      }
      // 3. Handle Public Playlists (Default)
      else {
        const res = await fetch(`${BASE_URL}public-playlists/${playlistId}`, {
          headers,
        });
        const data = await res.json();
        setPlaylist({ name: data.name });

        const songPromises = (data.songIds || []).map((id: string) =>
          fetch(`${BASE_URL}songs/${id}/metadata`, { headers }).then((res) =>
            res.json(),
          ),
        );
        const songsData = await Promise.all(songPromises);
        setSongs(songsData.map((s) => s.metadata));
      }
    } catch (err) {
      console.log("Error fetching playlist data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!playlistId && type !== "favourites") return;

    setLoading(true);
    setSongs([]);
    setPlaylist(null);

    fetchPlaylistData();
  }, [playlistId, type]);

  const handleSongPress = (song: any) => {
    // Graceful fallbacks handle both raw /songs objects and /metadata objects
    openSong({
      id: String(song.song_ID || song.songId || song.id),
      title: song.name || song.title || "Untitled",
      artist: song.artist || song.artistName || "Unknown Artist",
      duration: 240,
      coverUri:
        song.cover ||
        song.image ||
        song.coverArt ||
        "https://picsum.photos/300",
    });
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={currentMood.colors[1]} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>{playlist?.name}</Text>
      </View>

      {/* Songs */}
      <FlatList
        data={songs}
        keyExtractor={(item, index) => String(item.song_ID || item.id || index)}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.songItem}
            onPress={() => handleSongPress(item)}
            activeOpacity={0.7}
          >
            <Image
              source={{
                uri: item.cover || item.image || "https://picsum.photos/200",
              }}
              style={styles.image}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.songName} numberOfLines={1}>
                {item.name || item.title || "Untitled"}
              </Text>
              <Text style={styles.artist} numberOfLines={1}>
                {item.artist || item.artistName || "Unknown Artist"}
              </Text>
            </View>
            <Feather name="play" size={20} color={currentMood.colors[1]} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ marginTop: 40, alignItems: "center" }}>
            <Text style={{ color: "#888" }}>
              No songs in this playlist yet.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default PlaylistDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#181818",
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
  },
  songItem: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#333",
  },
  songName: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  artist: {
    color: "#888",
    fontSize: 13,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#181818",
  },
});
