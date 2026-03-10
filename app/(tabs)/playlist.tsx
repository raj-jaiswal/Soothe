import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  TextInput,
  Modal,
  Pressable,
  Animated,
} from "react-native";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const FAVOURITES = [
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
];

const DOWNLOADS = [
  {
    id: "1",
    title: "Two Oruguitas",
    artist: "Sebastián Yatra",
    cover: "https://picsum.photos/seed/orugu/60/60",
    size: "4.2 MB",
  },
  {
    id: "2",
    title: "Saath Nibhana Saathiya",
    artist: "Falguni Pathak",
    cover: "https://picsum.photos/seed/saath/60/60",
    size: "3.8 MB",
  },
  {
    id: "3",
    title: "Channa Mereya",
    artist: "Arijit Singh",
    cover: "https://picsum.photos/seed/channa/60/60",
    size: "5.1 MB",
  },
];

const PLAYLISTS = [
  {
    id: "1",
    name: "Late Night Drives",
    count: 12,
    cover: "https://picsum.photos/seed/latenight/60/60",
    mood: "Calm",
  },
  {
    id: "2",
    name: "Morning Energy",
    count: 8,
    cover: "https://picsum.photos/seed/morning/60/60",
    mood: "Upbeat",
  },
  {
    id: "3",
    name: "Heartbreak Anthems",
    count: 15,
    cover: "https://picsum.photos/seed/heart/60/60",
    mood: "Grief",
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = "favourites" | "downloads" | null;

// ─── Sub-components ───────────────────────────────────────────────────────────

const SongRow = ({
  title,
  artist,
  cover,
  rightElement,
}: {
  title: string;
  artist: string;
  cover: string;
  rightElement?: React.ReactNode;
}) => (
  <View style={styles.songRow}>
    <Image source={{ uri: cover }} style={styles.songCover} />
    <View style={styles.songInfo}>
      <Text style={styles.songTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.songArtist} numberOfLines={1}>
        {artist}
      </Text>
    </View>
    {rightElement ?? (
      <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="ellipsis-vertical" size={18} color="#888" />
      </TouchableOpacity>
    )}
  </View>
);

const SectionHeader = ({
  icon,
  label,
  count,
  expanded,
  onToggle,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  accent?: boolean;
}) => (
  <TouchableOpacity
    style={[styles.sectionHeader, accent && styles.sectionHeaderAccent]}
    onPress={onToggle}
    activeOpacity={0.75}
  >
    <View style={styles.sectionHeaderLeft}>
      <View style={[styles.sectionIconWrap, accent && styles.sectionIconWrapAccent]}>
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

export default function PlaylistScreen() {
  const [expanded, setExpanded] = useState<Section>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [playlists, setPlaylists] = useState(PLAYLISTS);

  const toggle = (section: Section) =>
    setExpanded((prev) => (prev === section ? null : section));

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    setPlaylists((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: newPlaylistName.trim(),
        count: 0,
        cover: `https://picsum.photos/seed/${Date.now()}/60/60`,
        mood: "Mixed",
      },
    ]);
    setNewPlaylistName("");
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Library</Text>
        <TouchableOpacity>
          <Ionicons name="search" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Favourites Expandable ── */}
        <SectionHeader
          icon={<Ionicons name="heart" size={18} color="#7C3AED" />}
          label="Favourites"
          count={FAVOURITES.length}
          expanded={expanded === "favourites"}
          onToggle={() => toggle("favourites")}
          accent
        />
        {expanded === "favourites" && (
          <View style={styles.expandedSection}>
            {FAVOURITES.map((song) => (
              <SongRow
                key={song.id}
                title={song.title}
                artist={song.artist}
                cover={song.cover}
                rightElement={
                  <Ionicons name="heart" size={18} color="#7C3AED" />
                }
              />
            ))}
          </View>
        )}

        {/* ── Downloads Expandable ── */}
        <SectionHeader
          icon={<Ionicons name="arrow-down-circle" size={18} color="#8B6EFF" />}
          label="Downloads"
          count={DOWNLOADS.length}
          expanded={expanded === "downloads"}
          onToggle={() => toggle("downloads")}
        />
        {expanded === "downloads" && (
          <View style={styles.expandedSection}>
            {DOWNLOADS.map((song) => (
              <SongRow
                key={song.id}
                title={song.title}
                artist={song.artist}
                cover={song.cover}
                rightElement={
                  <View style={styles.sizeTag}>
                    <Text style={styles.sizeText}>{song.size}</Text>
                  </View>
                }
              />
            ))}
          </View>
        )}

        {/* ── Divider ── */}
        <View style={styles.divider} />

        {/* ── Playlists Header ── */}
        <View style={styles.playlistsHeader}>
          <Text style={styles.playlistsTitle}>My Playlists</Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.createBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* ── Playlist Cards ── */}
        {playlists.map((playlist) => (
          <TouchableOpacity
            key={playlist.id}
            style={styles.playlistCard}
            activeOpacity={0.75}
          >
            <Image
              source={{ uri: playlist.cover }}
              style={styles.playlistCover}
            />
            <View style={styles.playlistInfo}>
              <Text style={styles.playlistName}>{playlist.name}</Text>
              <Text style={styles.playlistMeta}>
                {playlist.count} songs · {playlist.mood}
              </Text>
            </View>
            <View style={styles.playlistRight}>
              <View style={styles.moodPill}>
                <Text style={styles.moodPillText}>{playlist.mood}</Text>
              </View>
              <Ionicons name="play-circle" size={30} color="#7C3AED" />
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Create Playlist Modal ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
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
            <View style={styles.modalMoodRow}>
              {["Calm", "Love", "Upbeat", "Grief"].map((mood) => (
                <TouchableOpacity key={mood} style={styles.moodChip}>
                  <Text style={styles.moodChipText}>{mood}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[
                styles.modalCreateBtn,
                !newPlaylistName.trim() && styles.modalCreateBtnDisabled,
              ]}
              onPress={handleCreatePlaylist}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCreateBtnText}>Create</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  // Section Headers
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
  sectionHeaderAccent: {
    borderLeftWidth: 3,
    borderLeftColor: "#7C3AED",
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#2e2e2e",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionIconWrapAccent: {
    backgroundColor: "#7C3AED22",
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  sectionCount: {
    fontSize: 12,
    color: "#777",
    marginTop: 1,
  },

  // Expanded Section
  expandedSection: {
    backgroundColor: "#1f1f1f",
    borderRadius: 14,
    marginBottom: 8,
    paddingVertical: 4,
    overflow: "hidden",
  },

  // Song Row
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  songCover: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: "#333",
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  songArtist: {
    fontSize: 12,
    color: "#777",
  },
  sizeTag: {
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sizeText: {
    fontSize: 11,
    color: "#888",
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: "#2a2a2a",
    marginVertical: 16,
  },

  // Playlists
  playlistsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  playlistsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },

  playlistCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#242424",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  playlistCover: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: "#333",
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  playlistMeta: {
    fontSize: 12,
    color: "#777",
  },
  playlistRight: {
    alignItems: "center",
    gap: 8,
  },
  moodPill: {
    backgroundColor: "#7C3AED22",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  moodPillText: {
    fontSize: 10,
    color: "#7C3AED",
    fontWeight: "600",
  },

  // Modal
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
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#fff",
    marginBottom: 16,
  },
  modalMoodRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 20,
  },
  moodChip: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  moodChipText: {
    fontSize: 13,
    color: "#aaa",
  },
  modalCreateBtn: {
    backgroundColor: "#7C3AED",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
  },
  modalCreateBtnDisabled: {
    opacity: 0.4,
  },
  modalCreateBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});