import { useAppTheme } from "@/components/context/ThemeContext";
import { useSongPlayer } from "@/components/index/SongPlayerContext";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

type Song = {
  id: string;
  title: string;
  artist: string;
  cover: string;
  size?: string;
  isFavourite?: boolean;
};
type Playlist = {
  id: string;
  name: string;
  songs: Song[];
  cover: string;
  mood: string;
  pinned?: boolean;
};
type Section = "favourites" | "downloads" | null;
type SortMode = "default" | "az";
type SheetAction = {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const ALL_SONGS: Song[] = [
  {
    id: "1",
    title: "Kabira",
    artist: "Pritam, Tochi Raina",
    cover: "https://picsum.photos/seed/kabira/60/60",
  },
  {
    id: "2",
    title: "Tum Hi Ho",
    artist: "Arijit Singh",
    cover: "https://picsum.photos/seed/tumhiho/60/60",
  },
  {
    id: "3",
    title: "Oh Saathi",
    artist: "Atif Aslam, Arko",
    cover: "https://picsum.photos/seed/osaathi/60/60",
  },
  {
    id: "4",
    title: "Ek Ladki Ko Dekha",
    artist: "Darshan Raval",
    cover: "https://picsum.photos/seed/ekladki/60/60",
  },
  {
    id: "5",
    title: "Two Oruguitas",
    artist: "Sebastián Yatra",
    cover: "https://picsum.photos/seed/orugu/60/60",
  },
  {
    id: "6",
    title: "Saath Nibhana Saathiya",
    artist: "Falguni Pathak",
    cover: "https://picsum.photos/seed/saath/60/60",
  },
  {
    id: "7",
    title: "Channa Mereya",
    artist: "Arijit Singh",
    cover: "https://picsum.photos/seed/channa/60/60",
  },
];

const INITIAL_FAVOURITES: Song[] = [
  ALL_SONGS[0],
  ALL_SONGS[1],
  ALL_SONGS[2],
  ALL_SONGS[3],
];
const INITIAL_DOWNLOADS: Song[] = [
  { ...ALL_SONGS[4], size: "4.2 MB" },
  { ...ALL_SONGS[5], size: "3.8 MB" },
  { ...ALL_SONGS[6], size: "5.1 MB" },
];
const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: "1",
    name: "Late Night Drives",
    mood: "Calm",
    pinned: true,
    cover: "https://picsum.photos/seed/latenight/60/60",
    songs: [ALL_SONGS[0], ALL_SONGS[2]],
  },
  {
    id: "2",
    name: "Morning Energy",
    mood: "Upbeat",
    cover: "https://picsum.photos/seed/morning/60/60",
    songs: [ALL_SONGS[1], ALL_SONGS[3]],
  },
  {
    id: "3",
    name: "Heartbreak Anthems",
    mood: "Grief",
    cover: "https://picsum.photos/seed/heart/60/60",
    songs: [ALL_SONGS[4], ALL_SONGS[5], ALL_SONGS[6]],
  },
];
const MOODS = [
  "Calm",
  "Love",
  "Upbeat",
  "Grief",
  "Euphoric",
  "Angry",
  "Anxious",
];

// ─── Context Bottom Sheet ─────────────────────────────────────────────────────

const ContextSheet = ({
  visible,
  song,
  actions,
  onClose,
}: {
  visible: boolean;
  song: Song | null;
  actions: SheetAction[];
  onClose: () => void;
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <Pressable style={styles.modalSheet} onPress={() => {}}>
        <View style={styles.modalHandle} />
        {song && (
          <>
            <View style={styles.sheetSongPreview}>
              <Image
                source={{ uri: song.cover }}
                style={styles.sheetSongCover}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetSongTitle} numberOfLines={1}>
                  {song.title}
                </Text>
                <Text style={styles.sheetSongArtist} numberOfLines={1}>
                  {song.artist}
                </Text>
              </View>
            </View>
            <View style={styles.sheetDivider} />
          </>
        )}
        {actions.map((action, i) => (
          <TouchableOpacity
            key={i}
            style={styles.sheetAction}
            onPress={() => {
              action.onPress();
              onClose();
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.sheetActionIcon,
                action.danger && styles.sheetActionIconDanger,
              ]}
            >
              <Ionicons
                name={action.icon as any}
                size={18}
                color={action.danger ? "#FF4D4D" : "#aaa"}
              />
            </View>
            <Text
              style={[
                styles.sheetActionLabel,
                action.danger && styles.sheetActionLabelDanger,
              ]}
            >
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Pressable>
    </Pressable>
  </Modal>
);

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader = ({
  icon,
  label,
  count,
  expanded,
  onToggle,
  accent,
  accentColor,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  accent?: boolean;
  accentColor: string;
}) => (
  <TouchableOpacity
    style={[
      styles.sectionHeader,
      accent && { borderLeftWidth: 3, borderLeftColor: accentColor },
    ]}
    onPress={onToggle}
    activeOpacity={0.75}
  >
    <View style={styles.sectionHeaderLeft}>
      <View
        style={[
          styles.sectionIconWrap,
          accent && { backgroundColor: `${accentColor}22` },
        ]}
      >
        {icon}
      </View>
      <View>
        <Text style={styles.sectionLabel}>{label}</Text>
        <Text style={styles.sectionCount}>{count} songs</Text>
      </View>
    </View>
    <Ionicons
      name={expanded ? "chevron-up" : "chevron-down"}
      size={18}
      color="#aaa"
    />
  </TouchableOpacity>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";

export default function PlaylistScreen() {
  const router = useRouter();
  const { openSong } = useSongPlayer();
  const { currentMood } = useAppTheme();

  const getToken = async () => {
    return await AsyncStorage.getItem("token");
  };

  const [expanded, setExpanded] = useState<Section>(null);
  const [favourites, setFavourites] = useState<Song[]>([]);
  const [downloads, setDownloads] = useState<Song[]>(INITIAL_DOWNLOADS);
  const [playlists, setPlaylists] = useState<Playlist[]>(INITIAL_PLAYLISTS);
  const [allSongsFromBackend, setAllSongsFromBackend] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(
    null,
  );

  const [createVisible, setCreateVisible] = useState(false);
  const [renameVisible, setRenameVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);
  const [addToPlaylistVisible, setAddToPlaylistVisible] = useState(false);
  const [addSongToPlaylistVisible, setAddSongToPlaylistVisible] =
    useState(false);
  const [addSongToFavouritesVisible, setAddSongToFavouritesVisible] =
    useState(false);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [sheetActions, setSheetActions] = useState<SheetAction[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(
    null,
  );

  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [selectedMood, setSelectedMood] = useState("Calm");
  const [renameText, setRenameText] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const songs = await fetchAllSongs();
        await fetchPlaylists(songs);
      } catch (err) {
        console.log("Error initializing playlist screen:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const fetchAllSongs = async () => {
    try {
      const token = await getToken();
      if (!token) {
        console.log("No token found for songs fetch");
        return [];
      }

      const res = await fetch(`${BACKEND_URL}songs`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();

      if (!res.ok) return [];

      const data = text ? JSON.parse(text) : [];

      const formattedSongs: Song[] = (data || []).map((s: any) => ({
        id: String(s.song_ID || s.songId || s.id),
        title: s.title || s.name || "Untitled",
        artist: s.artist || s.artistName || "Unknown Artist",
        cover:
          s.cover ||
          s.image ||
          s.coverArt ||
          s.posterURL ||
          "https://via.placeholder.com/100",
        audioUrl: s.songURL || s.audioUrl || s.url || "",
        isFavourite: Boolean(s.isFavourite || s.favorite || s.favourite),
      }));
      setAllSongsFromBackend(formattedSongs);
      setFavourites(formattedSongs.filter((song) => song.isFavourite));
      return formattedSongs;
    } catch (err) {
      console.log("Error fetching songs:", err);
      return [];
    }
  };

  const fetchPlaylists = async (songPool: Song[] = allSongsFromBackend) => {
    try {
      const token = await getToken();

      const res = await fetch(`${BACKEND_URL}personal-playlists/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        console.log("Fetch failed:", data);
        return;
      }

      const formatted = data.map((p: any) => {
        const hydratedSongs = (p.songs || [])
          .map((songId: string) =>
            songPool.find((s) => String(s.id) === String(songId)),
          )
          .filter(Boolean);

        return {
          id: p.playlistId,
          name: p.nameOfPlaylist,
          songs: hydratedSongs,
          cover: hydratedSongs[0]?.cover || "https://via.placeholder.com/100",
          mood: p.moods?.[0] || "Custom",
          pinned: false,
        };
      });
      setPlaylists(formatted);
    } catch (err) {
      console.log("Error fetching playlists:", err);
    }
  };

  const handleSongPress = (song: Song) => {
    openSong({
      id: song.id,
      title: song.title,
      artist: song.artist,
      duration: 240,
      coverUri: song.cover,
    });
  };

  const toggle = (section: Section) =>
    setExpanded((prev) => (prev === section ? null : section));
  const togglePlaylistExpand = (id: string) =>
    setExpandedPlaylistId((prev) => (prev === id ? null : id));

  const toggleFavourite = async (song: Song) => {
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert("Login required", "Please log in again.");
        return;
      }

      const alreadyFavourite = favourites.some(
        (f) => String(f.id) === String(song.id),
      );

      const res = await fetch(`${BACKEND_URL}favourites/${song.id}`, {
        method: alreadyFavourite ? "DELETE" : "POST",
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
        Alert.alert("Failed", data.error || "Could not update favourite.");
        return;
      }

      if (alreadyFavourite) {
        setFavourites((prev) =>
          prev.filter((s) => String(s.id) !== String(song.id)),
        );
      } else {
        setFavourites((prev) => [...prev, { ...song, size: undefined }]);
      }
    } catch (err) {
      console.log("Error toggling favourite:", err);
      Alert.alert("Error", "Something went wrong while updating favourite.");
    }
  };

  const openFavouriteSongSheet = (song: Song) => {
    setSelectedSong(song);
    setSheetActions([
      {
        icon: "heart-dislike",
        label: "Remove from Favourites",
        onPress: async () => {
          await toggleFavourite(song);
          Alert.alert("Removed!", `"${song.title}" removed from Favourites.`);
        },
        danger: true,
      },
      {
        icon: "list",
        label: "Add to Playlist",
        onPress: () => {
          setSelectedSong(song);
          setAddToPlaylistVisible(true);
        },
      },
    ]);
    setSheetVisible(true);
  };

  const removeDownload = (id: string) =>
    setDownloads((prev) => prev.filter((s) => s.id !== id));

  const openDownloadSongSheet = (song: Song) => {
    setSelectedSong(song);
    setSheetActions([
      {
        icon: "trash",
        label: "Remove Download",
        onPress: () => removeDownload(song.id),
        danger: true,
      },
      {
        icon: favourites.find((f) => String(f.id) === String(song.id))
          ? "heart-dislike"
          : "heart",
        label: favourites.find((f) => String(f.id) === String(song.id))
          ? "Remove from Favourites"
          : "Add to Favourites",
        onPress: () => {
          const alreadyFavourite = favourites.find(
            (f) => String(f.id) === String(song.id),
          );

          toggleFavourite({ ...song, size: undefined });

          if (alreadyFavourite) {
            Alert.alert("Removed!", `"${song.title}" removed from Favourites.`);
          } else {
            Alert.alert("Added!", `"${song.title}" added to Favourites.`);
          }
        },
      },
      {
        icon: "list",
        label: "Add to Playlist",
        onPress: () => {
          setSelectedSong(song);
          setAddToPlaylistVisible(true);
        },
      },
      {
        icon: "share-social",
        label: "Share with Friend",
        onPress: () =>
          Alert.alert("Shared!", `"${song.title}" shared to chat.`),
      },
    ]);
    setSheetVisible(true);
  };

  const togglePin = (id: string) =>
    setPlaylists((prev) =>
      prev.map((p) => (p.id === id ? { ...p, pinned: !p.pinned } : p)),
    );

  const deletePlaylist = (id: string) => {
    Alert.alert("Delete Playlist", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await getToken();

            if (!token) {
              console.log("No token found for delete");
              Alert.alert("Error", "User not authenticated");
              return;
            }

            const res = await fetch(`${BACKEND_URL}personal-playlists/${id}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            const text = await res.text();
            console.log("delete playlist status:", res.status);
            console.log("delete playlist body:", text);

            let data: any = {};
            try {
              data = text ? JSON.parse(text) : {};
            } catch {}

            if (!res.ok) {
              Alert.alert("Failed", data.error || "Could not delete playlist.");
              return;
            }

            setPlaylists((prev) => prev.filter((p) => p.id !== id));

            if (expandedPlaylistId === id) {
              setExpandedPlaylistId(null);
            }

            Alert.alert("Deleted", "Playlist deleted successfully");
          } catch (err) {
            console.log("Error deleting playlist:", err);
            Alert.alert("Error", "Something went wrong while deleting.");
          }
        },
      },
    ]);
  };

  const renamePlaylist = () => {
    if (!renameText.trim() || !selectedPlaylist) return;
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === selectedPlaylist.id ? { ...p, name: renameText.trim() } : p,
      ),
    );
    setRenameVisible(false);
  };

  const removeSongFromPlaylist = (playlistId: string, songId: string) => {
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId
          ? { ...p, songs: p.songs.filter((s) => s.id !== songId) }
          : p,
      ),
    );
  };

  const addSongToPlaylist = async (playlistId: string, song: Song) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    if (playlist.songs.find((s) => s.id === song.id)) {
      Alert.alert(
        "Already Added",
        `"${song.title}" is already in this playlist.`,
      );
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Login required", "Please log in again.");
        return;
      }

      console.log("Adding song to playlist", {
        playlistId,
        songId: song.id,
        title: song.title,
      });

      const res = await fetch(
        `${BACKEND_URL}personal-playlists/${playlistId}/songs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            songId: song.id,
          }),
        },
      );

      const text = await res.text();
      console.log("add song response status:", res.status);
      console.log("add song response body:", text);

      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {}

      if (!res.ok) {
        Alert.alert("Failed", data.error || "Could not add song to playlist.");
        return;
      }

      setPlaylists((prev) =>
        prev.map((p) =>
          p.id === playlistId ? { ...p, songs: [...p.songs, song] } : p,
        ),
      );

      Alert.alert("Added!", `"${song.title}" added to "${playlist.name}".`);
      setAddSongToPlaylistVisible(false);
      setAddToPlaylistVisible(false);

      await fetchPlaylists();
    } catch (err) {
      console.log("Error adding song to playlist:", err);
      Alert.alert("Error", "Something went wrong while adding the song.");
    }
  };
  const openPlaylistSongSheet = (playlist: Playlist, song: Song) => {
    setSelectedSong(song);
    setSelectedPlaylist(playlist);
    setSheetActions([
      {
        icon: "remove-circle",
        label: "Remove from Playlist",
        onPress: () => removeSongFromPlaylist(playlist.id, song.id),
        danger: true,
      },
      {
        icon: favourites.find((f) => String(f.id) === String(song.id))
          ? "heart-dislike"
          : "heart",
        label: favourites.find((f) => String(f.id) === String(song.id))
          ? "Remove from Favourites"
          : "Add to Favourites",
        onPress: () => {
          const alreadyFavourite = favourites.find(
            (f) => String(f.id) === String(song.id),
          );

          toggleFavourite(song);

          if (alreadyFavourite) {
            Alert.alert("Removed!", `"${song.title}" removed from Favourites.`);
          } else {
            Alert.alert("Added!", `"${song.title}" added to Favourites.`);
          }
        },
      },
      {
        icon: "share-social",
        label: "Share with Friend",
        onPress: () =>
          Alert.alert("Shared!", `"${song.title}" shared to chat.`),
      },
    ]);
    setSheetVisible(true);
  };

  const openPlaylistSheet = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setSheetActions([
      {
        icon: "pin",
        label: playlist.pinned ? "Unpin Playlist" : "Pin to Top",
        onPress: () => togglePin(playlist.id),
      },
      {
        icon: "musical-notes",
        label: "Add Songs",
        onPress: () => {
          setSelectedPlaylist(playlist);
          setAddSongToPlaylistVisible(true);
        },
      },
      {
        icon: "pencil",
        label: "Rename Playlist",
        onPress: () => {
          setRenameText(playlist.name);
          setRenameVisible(true);
        },
      },
      {
        icon: "trash",
        label: "Delete Playlist",
        onPress: () => deletePlaylist(playlist.id),
        danger: true,
      },
    ]);
    setSheetVisible(true);
  };

  const handleCreate = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      const token = await getToken();

      const res = await fetch(`${BACKEND_URL}personal-playlists/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nameOfPlaylist: newPlaylistName.trim(),
          moods: [selectedMood],
          songs: [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.log("Create failed:", data);
        return;
      }

      const newPlaylist = {
        id: data.playlistId,
        name: data.nameOfPlaylist,
        songs: data.songs || [],
        cover: "https://picsum.photos/60/60",
        mood: (data.moods && data.moods[0]) || "Calm",
        pinned: false,
      };

      setPlaylists((prev) => [...prev, newPlaylist]);
      setNewPlaylistName("");
      setSelectedMood("Calm");
      setCreateVisible(false);
    } catch (err) {
      console.log("Error creating playlist:", err);
    }
  };

  const sortedPlaylists = (() => {
    let list = [...playlists];
    if (sortMode === "az") {
      list = [
        ...list
          .filter((p) => p.pinned)
          .sort((a, b) => a.name.localeCompare(b.name)),
        ...list
          .filter((p) => !p.pinned)
          .sort((a, b) => a.name.localeCompare(b.name)),
      ];
    } else {
      list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    }
    if (searchQuery.trim())
      list = list.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    return list;
  })();

  const filteredFavourites = searchQuery
    ? favourites.filter((s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : favourites;
  const songsNotInFavourites = allSongsFromBackend.filter(
    (s) => !favourites.find((f) => String(f.id) === String(s.id)),
  );
  const songsNotInPlaylist = selectedPlaylist
    ? allSongsFromBackend.filter(
        (s) =>
          !selectedPlaylist.songs.find((ps) => String(ps.id) === String(s.id)),
      )
    : [];
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={currentMood.colors[1]} />
        <Text style={styles.loaderText}>Loading your library...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Library</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push("/search")}
            style={styles.headerBtn}
          >
            <Feather name="search" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setSortVisible(true)}
          >
            <Ionicons name="funnel-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {searchVisible && (
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search songs or playlists..."
            placeholderTextColor="#555"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={16} color="#555" />
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Favourites */}
        <SectionHeader
          icon={
            <Ionicons name="heart" size={18} color={currentMood.colors[1]} />
          }
          label="Favourites"
          count={filteredFavourites.length}
          expanded={expanded === "favourites"}
          onToggle={() => toggle("favourites")}
          accent
          accentColor={currentMood.colors[1]}
        />
        {expanded === "favourites" && (
          <View style={styles.expandedSection}>
            <TouchableOpacity
              style={styles.addSongBtn}
              onPress={() => setAddSongToFavouritesVisible(true)}
            >
              <Ionicons
                name="add-circle-outline"
                size={16}
                color={currentMood.colors[1]}
              />
              <Text
                style={[
                  styles.addSongBtnText,
                  { color: currentMood.colors[1] },
                ]}
              >
                Add Songs
              </Text>
            </TouchableOpacity>
            {filteredFavourites.length === 0 ? (
              <Text style={styles.emptyText}>No favourites yet</Text>
            ) : (
              filteredFavourites.map((song) => (
                <TouchableOpacity
                  key={song.id}
                  style={styles.songRow}
                  onPress={() => handleSongPress(song)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: song.cover }}
                    style={styles.songCover}
                  />
                  <View style={styles.songInfo}>
                    <Text style={styles.songTitle} numberOfLines={1}>
                      {song.title}
                    </Text>
                    <Text style={styles.songArtist} numberOfLines={1}>
                      {song.artist}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => toggleFavourite(song)}
                    hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="heart"
                      size={20}
                      color={currentMood.colors[1]}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => openFavouriteSongSheet(song)}
                    hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                  >
                    <Ionicons name="ellipsis-vertical" size={18} color="#555" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <View style={styles.divider} />

        {/* Playlists Header */}
        <View style={styles.playlistsHeader}>
          <View>
            <Text style={styles.playlistsTitle}>My Playlists</Text>
            {sortMode === "az" && (
              <Text
                style={[styles.sortBadge, { color: currentMood.colors[1] }]}
              >
                Sorted A–Z
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.createBtn,
              { backgroundColor: currentMood.colors[1] },
            ]}
            onPress={() => setCreateVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.createBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Playlist Cards */}
        {sortedPlaylists.length === 0 ? (
          <Text style={styles.emptyText}>No playlists found</Text>
        ) : (
          sortedPlaylists.map((playlist) => (
            <View key={playlist.id}>
              <TouchableOpacity
                style={[
                  styles.playlistCard,
                  playlist.pinned && {
                    borderWidth: 1,
                    borderColor: `${currentMood.colors[1]}44`,
                  },
                  expandedPlaylistId === playlist.id &&
                    styles.playlistCardExpanded,
                ]}
                onPress={() => togglePlaylistExpand(playlist.id)}
                activeOpacity={0.75}
              >
                {playlist.pinned && (
                  <View
                    style={[
                      styles.pinnedBadge,
                      { backgroundColor: `${currentMood.colors[1]}22` },
                    ]}
                  >
                    <Ionicons
                      name="pin"
                      size={10}
                      color={currentMood.colors[1]}
                    />
                  </View>
                )}
                <Image
                  source={{ uri: playlist.cover }}
                  style={styles.playlistCover}
                />
                <View style={styles.playlistInfo}>
                  <Text style={styles.playlistName}>{playlist.name}</Text>
                  <Text style={styles.playlistMeta}>
                    {playlist.songs.length} songs · {playlist.mood}
                  </Text>
                </View>
                <View style={styles.playlistRight}>
                  <Ionicons
                    name="play-circle"
                    size={30}
                    color={currentMood.colors[1]}
                  />
                  <TouchableOpacity
                    onPress={() => openPlaylistSheet(playlist)}
                    hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                  >
                    <Ionicons name="ellipsis-vertical" size={18} color="#555" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {/* Songs inside playlist */}
              {expandedPlaylistId === playlist.id && (
                <View style={styles.playlistSongsSection}>
                  <TouchableOpacity
                    style={styles.addSongBtn}
                    onPress={() => {
                      setSelectedPlaylist(playlist);
                      setAddSongToPlaylistVisible(true);
                    }}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={16}
                      color={currentMood.colors[1]}
                    />
                    <Text
                      style={[
                        styles.addSongBtnText,
                        { color: currentMood.colors[1] },
                      ]}
                    >
                      Add Songs
                    </Text>
                  </TouchableOpacity>
                  {playlist.songs.length === 0 ? (
                    <Text style={styles.emptyText}>
                      No songs yet — add some!
                    </Text>
                  ) : (
                    playlist.songs.map((song, index) => (
                      <TouchableOpacity
                        key={`${playlist.id}-${song.id}-${index}`}
                        style={styles.songRow}
                        onPress={() => handleSongPress(song)}
                        activeOpacity={0.7}
                      >
                        <Image
                          source={{ uri: song.cover }}
                          style={styles.songCover}
                        />
                        <View style={styles.songInfo}>
                          <Text style={styles.songTitle} numberOfLines={1}>
                            {song.title}
                          </Text>
                          <Text style={styles.songArtist} numberOfLines={1}>
                            {song.artist}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() =>
                            removeSongFromPlaylist(playlist.id, song.id)
                          }
                          hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                        >
                          <Ionicons
                            name="remove-circle-outline"
                            size={20}
                            color="#555"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => openPlaylistSongSheet(playlist, song)}
                          hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                        >
                          <Ionicons
                            name="ellipsis-vertical"
                            size={18}
                            color="#555"
                          />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Context Sheet */}
      <ContextSheet
        visible={sheetVisible}
        song={selectedSong}
        actions={sheetActions}
        onClose={() => setSheetVisible(false)}
      />

      {/* Create Playlist Modal */}
      <Modal
        visible={createVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCreateVisible(false)}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Create Playlist</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Playlist name..."
              placeholderTextColor="#555"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus
            />
            <Text style={styles.modalSubtitle}>Pick a mood</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 20 }}
            >
              <View style={styles.modalMoodRow}>
                {MOODS.map((mood) => (
                  <TouchableOpacity
                    key={mood}
                    style={[
                      styles.moodChip,
                      selectedMood === mood && {
                        backgroundColor: `${currentMood.colors[1]}22`,
                        borderColor: currentMood.colors[1],
                      },
                    ]}
                    onPress={() => setSelectedMood(mood)}
                  >
                    <Text
                      style={[
                        styles.moodChipText,
                        selectedMood === mood && {
                          color: currentMood.colors[1],
                          fontWeight: "600",
                        },
                      ]}
                    >
                      {mood}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity
              style={[
                styles.modalCreateBtn,
                !newPlaylistName.trim() && styles.modalCreateBtnDisabled,
                { backgroundColor: currentMood.colors[1] },
              ]}
              onPress={handleCreate}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCreateBtnText}>Create</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Rename Modal */}
      <Modal
        visible={renameVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRenameVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setRenameVisible(false)}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Rename Playlist</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="New name..."
              placeholderTextColor="#555"
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
            />
            <TouchableOpacity
              style={[
                styles.modalCreateBtn,
                !renameText.trim() && styles.modalCreateBtnDisabled,
                { backgroundColor: currentMood.colors[1] },
              ]}
              onPress={renamePlaylist}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCreateBtnText}>Save</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Sort Modal */}
      <Modal
        visible={sortVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSortVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSortVisible(false)}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Sort Playlists</Text>
            {(["default", "az"] as SortMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={styles.sheetAction}
                onPress={() => {
                  setSortMode(mode);
                  setSortVisible(false);
                }}
              >
                <View style={styles.sheetActionIcon}>
                  <Ionicons
                    name={mode === "az" ? "text" : "swap-vertical"}
                    size={18}
                    color="#aaa"
                  />
                </View>
                <Text style={styles.sheetActionLabel}>
                  {mode === "default" ? "Default order" : "A – Z"}
                </Text>
                {sortMode === mode && (
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={currentMood.colors[1]}
                    style={{ marginLeft: "auto" }}
                  />
                )}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add song to playlist */}
      <Modal
        visible={addToPlaylistVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddToPlaylistVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setAddToPlaylistVisible(false)}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add to Playlist</Text>
            {playlists.length === 0 ? (
              <Text style={styles.emptyText}>
                No playlists yet. Create one first!
              </Text>
            ) : (
              playlists.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.sheetAction}
                  onPress={() =>
                    selectedSong && addSongToPlaylist(p.id, selectedSong)
                  }
                >
                  <Image
                    source={{ uri: p.cover }}
                    style={styles.sheetPlaylistThumb}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetActionLabel}>{p.name}</Text>
                    <Text style={styles.sheetActionSub}>
                      {p.songs.length} songs · {p.mood}
                    </Text>
                  </View>
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color={currentMood.colors[1]}
                  />
                </TouchableOpacity>
              ))
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add songs to a specific playlist */}
      <Modal
        visible={addSongToPlaylistVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddSongToPlaylistVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setAddSongToPlaylistVisible(false)}
        >
          <Pressable
            style={[styles.modalSheet, { maxHeight: "75%" }]}
            onPress={() => {}}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Songs</Text>
            <Text style={styles.modalSubtitle}>
              to {selectedPlaylist?.name}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {songsNotInPlaylist.length === 0 ? (
                <Text style={styles.emptyText}>All songs already added!</Text>
              ) : (
                songsNotInPlaylist.map((song) => (
                  <TouchableOpacity
                    key={song.id}
                    style={styles.sheetAction}
                    onPress={() =>
                      selectedPlaylist &&
                      addSongToPlaylist(selectedPlaylist.id, song)
                    }
                  >
                    <Image
                      source={{ uri: song.cover }}
                      style={styles.sheetPlaylistThumb}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sheetActionLabel}>{song.title}</Text>
                      <Text style={styles.sheetActionSub}>{song.artist}</Text>
                    </View>
                    <Ionicons
                      name="add-circle-outline"
                      size={20}
                      color={currentMood.colors[1]}
                    />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal
        visible={addSongToFavouritesVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddSongToFavouritesVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setAddSongToFavouritesVisible(false)}
        >
          <Pressable
            style={[styles.modalSheet, { maxHeight: "75%" }]}
            onPress={() => {}}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Songs to Favourites</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {songsNotInFavourites.length === 0 ? (
                <Text style={styles.emptyText}>
                  All songs are already in favourites!
                </Text>
              ) : (
                songsNotInFavourites.map((song) => (
                  <TouchableOpacity
                    key={song.id}
                    style={styles.sheetAction}
                    onPress={async () => {
                      await toggleFavourite(song);
                      setAddSongToFavouritesVisible(false);
                      Alert.alert(
                        "Added!",
                        `"${song.title}" added to Favourites.`,
                      );
                    }}
                  >
                    <Image
                      source={{ uri: song.cover }}
                      style={styles.sheetPlaylistThumb}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sheetActionLabel}>{song.title}</Text>
                      <Text style={styles.sheetActionSub}>{song.artist}</Text>
                    </View>
                    <Ionicons
                      name="add-circle-outline"
                      size={20}
                      color={currentMood.colors[1]}
                    />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a1a" },
  loaderContainer: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 12,
    color: "#aaa",
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  headerActions: { flexDirection: "row", gap: 8 },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#242424",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#242424",
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#fff" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#242424",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 2,
  },
  sectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#2e2e2e",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: { fontSize: 15, fontWeight: "600", color: "#fff" },
  sectionCount: { fontSize: 12, color: "#777", marginTop: 1 },
  expandedSection: {
    backgroundColor: "#1f1f1f",
    borderRadius: 14,
    marginBottom: 8,
    paddingVertical: 4,
    overflow: "hidden",
  },
  emptyText: {
    color: "#555",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 16,
  },
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  songCover: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: "#333",
  },
  songInfo: { flex: 1 },
  songTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  songArtist: { fontSize: 12, color: "#777" },
  sizeTag: {
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sizeText: { fontSize: 11, color: "#888" },
  divider: { height: 1, backgroundColor: "#2a2a2a", marginVertical: 16 },
  playlistsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  playlistsTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  sortBadge: { fontSize: 11, marginTop: 2 },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  createBtnText: { fontSize: 13, fontWeight: "600", color: "#fff" },
  playlistCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#242424",
    borderRadius: 16,
    padding: 12,
    marginBottom: 2,
    gap: 12,
  },
  playlistCardExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  pinnedBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    borderRadius: 6,
    padding: 3,
  },
  playlistCover: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: "#333",
  },
  playlistInfo: { flex: 1 },
  playlistName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  playlistMeta: { fontSize: 12, color: "#777" },
  playlistRight: { alignItems: "center", gap: 8 },
  playlistSongsSection: {
    backgroundColor: "#1c1c1c",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    marginBottom: 10,
    paddingVertical: 6,
    overflow: "hidden",
  },
  addSongBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  addSongBtnText: { fontSize: 13, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#242424",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#444",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  modalSubtitle: { fontSize: 13, color: "#777", marginBottom: 14 },
  modalInput: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#fff",
    marginBottom: 16,
  },
  modalMoodRow: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  moodChip: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  moodChipText: { fontSize: 13, color: "#aaa" },
  modalCreateBtn: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
  },
  modalCreateBtnDisabled: { opacity: 0.4 },
  modalCreateBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  sheetSongPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  sheetSongCover: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#333",
  },
  sheetSongTitle: { fontSize: 15, fontWeight: "600", color: "#fff" },
  sheetSongArtist: { fontSize: 12, color: "#777", marginTop: 2 },
  sheetDivider: { height: 1, backgroundColor: "#333", marginBottom: 12 },
  sheetAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
  },
  sheetActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetActionIconDanger: { backgroundColor: "#FF4D4D18" },
  sheetActionLabel: { fontSize: 15, color: "#ddd" },
  sheetActionLabelDanger: { color: "#FF4D4D" },
  sheetActionSub: { fontSize: 12, color: "#666", marginTop: 1 },
  sheetPlaylistThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#333",
  },
});
