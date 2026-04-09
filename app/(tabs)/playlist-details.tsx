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

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const PlaylistDetails = () => {
  const { playlistId } = useLocalSearchParams();
  const router = useRouter();
  const { openSong } = useSongPlayer();

  const [playlist, setPlaylist] = useState<any>(null);
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlaylist = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const res = await fetch(`${BASE_URL}public-playlists/${playlistId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setPlaylist(data);

      // fetch songs
      const songPromises = data.songIds.map((id: string) =>
        fetch(`${BASE_URL}songs/${id}/metadata`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((res) => res.json()),
      );

      const songsData = await Promise.all(songPromises);
      const cleaned = songsData.map((s) => s.metadata);

      setSongs(cleaned);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!playlistId) return;

    setLoading(true); // 👈 ADD THIS
    setSongs([]); // 👈 optional (prevents old songs flash)
    setPlaylist(null);

    fetchPlaylist();
  }, [playlistId]);

  const handleSongPress = (song: any) => {
    openSong({
      id: song.song_ID,
      title: song.name,
      artist: song.artist,
      duration: 240,
      coverUri: "https://picsum.photos/300", // placeholder
    });
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}></Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>{playlist?.name}</Text>
      </View>

      {/* Songs */}
      <FlatList
        data={songs}
        keyExtractor={(item) => item.song_ID}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.songItem}
            onPress={() => handleSongPress(item)}
          >
            <Image
              source={{ uri: "https://picsum.photos/200" }}
              style={styles.image}
            />
            <View>
              <Text style={styles.songName}>{item.name}</Text>
              <Text style={styles.artist}>{item.artist}</Text>
            </View>
          </TouchableOpacity>
        )}
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
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  songName: {
    color: "white",
    fontSize: 14,
  },
  artist: {
    color: "#888",
    fontSize: 12,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#111",
  },
  loadingText: {
    color: "#888",
    marginTop: 10,
    fontSize: 13,
  },
});
