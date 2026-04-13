import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
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
import ShareWithFriendMenu from "./ShareWithFriendMenu";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";

type SongActionSong = {
  id: string;
  title: string;
  artist: string;
  cover?: string;
  coverUri?: string;
};

type PlaylistOption = {
  id: string;
  name: string;
  songs: string[];
};

type Props = {
  visible: boolean;
  song: SongActionSong | null;
  onClose: () => void;
};

export default function SongActionsMenu({ visible, song, onClose }: Props) {
  const [playlistVisible, setPlaylistVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistOption[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);

  const cover = song?.cover || song?.coverUri || "https://via.placeholder.com/100";

  const getToken = async () => AsyncStorage.getItem("token");

  const closeAll = () => {
    setPlaylistVisible(false);
    onClose();
  };

  const addToFavourites = async () => {
    if (!song) return;

    try {
      const token = await getToken();
      if (!token) {
        Alert.alert("Login required", "Please log in again.");
        return;
      }

      const res = await fetch(`${BACKEND_URL}favourites/${song.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {}

      if (!res.ok) {
        Alert.alert("Failed", data.error || "Could not add to favourites.");
        return;
      }

      Alert.alert("Added", `"${song.title}" added to favourites.`);
      closeAll();
    } catch (err) {
      console.log("Error adding favourite:", err);
      Alert.alert("Error", "Something went wrong while adding to favourites.");
    }
  };

  const openPlaylistPicker = async () => {
    if (!song) return;

    try {
      setPlaylistVisible(true);
      setLoadingPlaylists(true);

      const token = await getToken();
      if (!token) {
        Alert.alert("Login required", "Please log in again.");
        setPlaylistVisible(false);
        return;
      }

      const res = await fetch(`${BACKEND_URL}personal-playlists/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();
      let data: any = [];
      try {
        data = text ? JSON.parse(text) : [];
      } catch {}

      if (!res.ok) {
        Alert.alert("Failed", data.error || "Could not load playlists.");
        setPlaylistVisible(false);
        return;
      }

      setPlaylists(
        (Array.isArray(data) ? data : []).map((playlist: any) => ({
          id: playlist.playlistId,
          name: playlist.nameOfPlaylist || "Untitled Playlist",
          songs: playlist.songs || [],
        })),
      );
    } catch (err) {
      console.log("Error loading playlists:", err);
      Alert.alert("Error", "Something went wrong while loading playlists.");
      setPlaylistVisible(false);
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const addToPlaylist = async (playlist: PlaylistOption) => {
    if (!song) return;

    if (playlist.songs.some((songId) => String(songId) === String(song.id))) {
      Alert.alert("Already Added", `"${song.title}" is already in this playlist.`);
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        Alert.alert("Login required", "Please log in again.");
        return;
      }

      const res = await fetch(`${BACKEND_URL}personal-playlists/${playlist.id}/songs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ songId: song.id }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {}

      if (!res.ok) {
        Alert.alert("Failed", data.error || "Could not add song to playlist.");
        return;
      }

      Alert.alert("Added", `"${song.title}" added to "${playlist.name}".`);
      closeAll();
    } catch (err) {
      console.log("Error adding song to playlist:", err);
      Alert.alert("Error", "Something went wrong while adding to playlist.");
    }
  };

  return (
    <>
      <Modal visible={visible && !playlistVisible && !shareVisible} transparent animationType="slide" onRequestClose={onClose}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            {song && (
              <View style={styles.songPreview}>
                <Image source={{ uri: cover }} style={styles.songCover} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
                  <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.actionRow} onPress={openPlaylistPicker}>
              <View style={styles.actionIcon}>
                <Ionicons name="list" size={18} color="#aaa" />
              </View>
              <Text style={styles.actionLabel}>Add to Playlist</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow} onPress={addToFavourites}>
              <View style={styles.actionIcon}>
                <Ionicons name="heart" size={18} color="#aaa" />
              </View>
              <Text style={styles.actionLabel}>Add to Favourites</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow} onPress={() => setShareVisible(true)}>
              <View style={styles.actionIcon}>
                <Ionicons name="share-social" size={18} color="#aaa" />
              </View>
              <Text style={styles.actionLabel}>Share with Friend</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={playlistVisible} transparent animationType="slide" onRequestClose={closeAll}>
        <Pressable style={styles.overlay} onPress={closeAll}>
          <Pressable style={[styles.sheet, { maxHeight: "75%" }]} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.title}>Choose Playlist</Text>

            {loadingPlaylists ? (
              <ActivityIndicator size="small" color="#fff" style={{ marginVertical: 18 }} />
            ) : playlists.length === 0 ? (
              <Text style={styles.emptyText}>No playlists yet. Create one first.</Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {playlists.map((playlist) => (
                  <TouchableOpacity
                    key={playlist.id}
                    style={styles.actionRow}
                    onPress={() => addToPlaylist(playlist)}
                  >
                    <View style={styles.actionIcon}>
                      <Ionicons name="musical-notes" size={18} color="#aaa" />
                    </View>
                    <Text style={styles.actionLabel}>{playlist.name}</Text>
                    <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <ShareWithFriendMenu
  visible={shareVisible}
  title="Share Song"
  messageText={
    song
      ? JSON.stringify({
          type: "song",
          id: song.id,
          title: song.title,
          artist: song.artist,
          cover: song.cover || song.coverUri || "",
        })
      : ""
  }
  onClose={() => {
    setShareVisible(false);
    onClose();
  }}
/>

    </>
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
  songPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  songCover: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#2A2A2A",
  },
  songTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  songArtist: {
    color: "#888",
    fontSize: 13,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 18,
  },
});
