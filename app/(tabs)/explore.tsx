import { useAppTheme } from "@/components/context/ThemeContext";
import RecentSongCard from "@/components/explore/RecentSongCard";
import SectionHeader from "@/components/explore/SectionHeader";
import { useSongPlayer } from "@/components/index/SongPlayerContext";
import { Artist, Song } from "@/constants/explore/ExploreTypes";
import Feather from "@expo/vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MAX_TOP_PLAYLISTS = 10;
const MAX_RECENT_SONGS = 10;

type SeeAllType = "songs" | "playlists" | "artists" | null;

type PlaylistSource = {
  PK?: string;
  SK?: string;
  createdAt?: string;
  description?: string;
  name?: string;
  playlistId?: string;
  songCount?: number;
  songIds?: string[];
  type?: string;
  image?: string;
  curator?: string;
  userName?: string;
  ownerName?: string;
};

type PublicPlaylistUI = {
  id: string;
  playlistId: string;
  name: string;
  description: string;
  songCount: number;
  type: string;
  image: string;
  source: PlaylistSource;
};

type HistoryEntry = {
  artist?: string;
  duration?: number;
  name?: string;
  songId?: string;
  timestamp?: string;
};

type RecentSongUI = Song & {
  timestamp?: string;
};

const getApiBaseUrl = () => {
  const raw = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";
  if (!raw) return "";
  return raw.endsWith("/") ? raw : `${raw}/`;
};

const buildApiUrl = (endpoint: string) =>
  `${getApiBaseUrl()}${endpoint.replace(/^\//, "")}`;

const getPlaceholderImage = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/600`;

const normalizePlaylist = (item: PlaylistSource): PublicPlaylistUI => {
  const playlistId =
    item.playlistId ||
    item.PK?.replace(/^PLAYLIST#/, "") ||
    item.name?.toLowerCase().replace(/\s+/g, "_") ||
    `playlist_${Math.random().toString(36).slice(2, 8)}`;

  return {
    id: playlistId,
    playlistId,
    name: item.name || "Untitled Playlist",
    description: item.description || "Public playlist",
    songCount: Number(item.songCount || item.songIds?.length || 0),
    type: item.type || "public",
    image: item.image || getPlaceholderImage(playlistId),
    source: item,
  };
};

const normalizeRecentSong = (item: HistoryEntry): RecentSongUI | null => {
  if (!item?.songId) return null;

  return {
    id: item.songId,
    title: item.name || "Untitled Song",
    artist: item.artist || "Unknown Artist",
    duration: Number(item.duration || 240),
    albumArt: getPlaceholderImage(item.songId),
    timestamp: item.timestamp,
  };
};

const formatRelativeTime = (timestamp?: string) => {
  if (!timestamp) return "Recently played";

  const playedAt = new Date(timestamp).getTime();
  if (Number.isNaN(playedAt)) return "Recently played";

  const diffMs = Date.now() - playedAt;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

interface PlaylistPreviewCardProps {
  playlist: PublicPlaylistUI;
  onPress: (playlist: PublicPlaylistUI) => void;
}

const PlaylistPreviewCard: React.FC<PlaylistPreviewCardProps> = ({
  playlist,
  onPress,
}) => {
  const { currentMood } = useAppTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(playlist)}
      style={playlistCardStyles.card}
    >
      <ImageBackground
        source={{ uri: playlist.image }}
        style={playlistCardStyles.cover}
        imageStyle={playlistCardStyles.coverImage}
      >
        <View style={playlistCardStyles.overlay} />
        <View
          style={[
            playlistCardStyles.badge,
            { backgroundColor: currentMood.colors[1] },
          ]}
        >
          <Text style={playlistCardStyles.badgeText}>
            {playlist.songCount} songs
          </Text>
        </View>
      </ImageBackground>

      <Text style={playlistCardStyles.title} numberOfLines={1}>
        {playlist.name}
      </Text>
      <Text style={playlistCardStyles.subtitle} numberOfLines={1}>
        {playlist.description}
      </Text>
    </TouchableOpacity>
  );
};

interface SeeAllModalProps {
  type: SeeAllType;
  onClose: () => void;
  onSongPress: (song: Song) => void;
  onPlaylistPress: (playlist: PublicPlaylistUI) => void;
  onArtistPress: (artist: Artist) => void;
  playlists: PublicPlaylistUI[];
  artistPlaylists: PublicPlaylistUI[];
  recentSongs: RecentSongUI[];
  recentSongsLoading: boolean;
  recentSongsError: string | null;
  playlistsLoading: boolean;
  playlistsError: string | null;
}

const SeeAllModal: React.FC<SeeAllModalProps> = ({
  type,
  onClose,
  onSongPress,
  onPlaylistPress,
  onArtistPress,
  playlists,
  artistPlaylists,
  recentSongs,
  recentSongsLoading,
  recentSongsError,
  playlistsLoading,
  playlistsError,
}) => {
  const { currentMood } = useAppTheme();

  const title =
    type === "songs"
      ? "Recent Songs"
      : type === "playlists"
        ? "Top Playlists"
        : "Top Artists";

  return (
    <Modal
      visible={!!type}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={modalStyles.backdrop}>
        <Pressable style={modalStyles.backdropPress} onPress={onClose} />
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />

          <View style={modalStyles.sheetHeader}>
            <Text style={modalStyles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Feather name="x" size={22} color="#888" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {type === "songs" && (
              <>
                {recentSongsLoading && (
                  <View style={modalStyles.loadingRow}>
                    <ActivityIndicator color={currentMood.colors[1]} />
                    <Text style={modalStyles.loadingText}>
                      Loading recent songs...
                    </Text>
                  </View>
                )}

                {!recentSongsLoading && recentSongsError ? (
                  <View style={modalStyles.emptyState}>
                    <Feather
                      name="alert-triangle"
                      size={26}
                      color={currentMood.colors[1]}
                    />
                    <Text style={modalStyles.emptyTitle}>
                      Could not load recent songs
                    </Text>
                    <Text style={modalStyles.emptySub}>{recentSongsError}</Text>
                  </View>
                ) : null}

                {!recentSongsLoading && !recentSongsError && recentSongs.length === 0 ? (
                  <View style={modalStyles.emptyState}>
                    <Feather
                      name="clock"
                      size={26}
                      color={currentMood.colors[1]}
                    />
                    <Text style={modalStyles.emptyTitle}>No recent songs yet</Text>
                    <Text style={modalStyles.emptySub}>
                      Play a few songs and they will appear here.
                    </Text>
                  </View>
                ) : null}

                {!recentSongsLoading &&
                  !recentSongsError &&
                  recentSongs.map((song) => (
                    <TouchableOpacity
                      key={song.id}
                      style={modalStyles.row}
                      onPress={() => {
                        onSongPress(song);
                        onClose();
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={modalStyles.rowLeft}>
                        <Image
                          source={{ uri: song.albumArt }}
                          style={modalStyles.rowThumb}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={modalStyles.rowTitle}>{song.title}</Text>
                          <Text style={modalStyles.rowSub}>{song.artist}</Text>
                        </View>
                      </View>
                      <Text style={modalStyles.rowMeta}>
                        {formatRelativeTime(song.timestamp)}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </>
            )}

            {type === "playlists" && (
              <>
                {playlistsLoading && (
                  <View style={modalStyles.loadingRow}>
                    <ActivityIndicator color={currentMood.colors[1]} />
                    <Text style={modalStyles.loadingText}>
                      Loading playlists...
                    </Text>
                  </View>
                )}

                {!playlistsLoading && playlistsError ? (
                  <View style={modalStyles.emptyState}>
                    <Feather
                      name="alert-triangle"
                      size={26}
                      color={currentMood.colors[1]}
                    />
                    <Text style={modalStyles.emptyTitle}>
                      Could not load playlists
                    </Text>
                    <Text style={modalStyles.emptySub}>{playlistsError}</Text>
                  </View>
                ) : null}

                {!playlistsLoading &&
                  !playlistsError &&
                  playlists.map((pl) => (
                    <TouchableOpacity
                      key={pl.id}
                      style={modalStyles.row}
                      onPress={() => {
                        onPlaylistPress(pl);
                        onClose();
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={modalStyles.rowLeft}>
                        <Image
                          source={{ uri: pl.image }}
                          style={modalStyles.rowThumb}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={modalStyles.rowTitle}>{pl.name}</Text>
                          <Text style={modalStyles.rowSub}>
                            {getPlaylistSubtitle(pl)}
                          </Text>
                        </View>
                      </View>
                      <Feather name="chevron-right" size={18} color="#555" />
                    </TouchableOpacity>
                  ))}
              </>
            )}

            {type === "artists" &&
              artistPlaylists.map((pl) => (
                <TouchableOpacity
                  key={pl.id}
                  style={modalStyles.row}
                  onPress={() => {
                    onArtistPress({ name: pl.name } as Artist);
                    onClose();
                  }}
                  activeOpacity={0.75}
                >
                  <View style={modalStyles.rowLeft}>
                    <Image
                      source={{ uri: pl.image }}
                      style={[modalStyles.rowThumb, modalStyles.rowThumbCircle]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={modalStyles.rowTitle}>{pl.name}</Text>
                      <Text style={modalStyles.rowSub}>
                        {getPlaylistSubtitle(pl)}
                      </Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={18} color="#555" />
                </TouchableOpacity>
              ))}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

interface SearchResultsProps {
  query: string;
  onSongPress: (song: Song) => void;
  playlists: PublicPlaylistUI[];
  songs: RecentSongUI[];
}

const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  onSongPress,
  playlists,
  songs,
}) => {
  const { currentMood } = useAppTheme();
  const q = query.toLowerCase();

  const matchedSongs = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q),
  );

  const matchedPlaylists = playlists.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q),
  );

  const matchedArtists = playlists.filter(
    (p) =>
      p.type === "artist" &&
      (p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)),
  );

  const hasResults =
    matchedSongs.length + matchedPlaylists.length + matchedArtists.length > 0;

  if (!hasResults) {
    return (
      <View style={searchStyles.empty}>
        <Feather name="search" size={36} color="#444" />
        <Text style={searchStyles.emptyText}>No results for "{query}"</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={searchStyles.container}
      showsVerticalScrollIndicator={false}
    >
      {matchedSongs.length > 0 && (
        <>
          <Text
            style={[searchStyles.groupTitle, { color: currentMood.colors[1] }]}
          >
            Songs
          </Text>
          {matchedSongs.map((song) => (
            <TouchableOpacity
              key={song.id}
              style={modalStyles.row}
              onPress={() => onSongPress(song)}
              activeOpacity={0.75}
            >
              <View style={modalStyles.rowLeft}>
                <Image
                  source={{ uri: song.albumArt }}
                  style={modalStyles.rowThumb}
                />
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.rowTitle}>{song.title}</Text>
                  <Text style={modalStyles.rowSub}>{song.artist}</Text>
                </View>
              </View>
              <Text style={modalStyles.rowMeta}>Song</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {matchedPlaylists.length > 0 && (
        <>
          <Text
            style={[searchStyles.groupTitle, { color: currentMood.colors[1] }]}
          >
            Playlists
          </Text>
          {matchedPlaylists.map((pl) => (
            <View key={pl.id} style={modalStyles.row}>
              <View style={modalStyles.rowLeft}>
                <Image
                  source={{ uri: pl.image }}
                  style={modalStyles.rowThumb}
                />
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.rowTitle}>{pl.name}</Text>
                  <Text style={modalStyles.rowSub}>{getPlaylistSubtitle(pl)}</Text>
                </View>
              </View>
            </View>
          ))}
        </>
      )}

      {matchedArtists.length > 0 && (
        <>
          <Text
            style={[searchStyles.groupTitle, { color: currentMood.colors[1] }]}
          >
            Artists
          </Text>
          {matchedArtists.map((pl) => (
            <View key={pl.id} style={modalStyles.row}>
              <View style={modalStyles.rowLeft}>
                <Image
                  source={{ uri: pl.image }}
                  style={[modalStyles.rowThumb, modalStyles.rowThumbCircle]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.rowTitle}>{pl.name}</Text>
                  <Text style={modalStyles.rowSub}>{getPlaylistSubtitle(pl)}</Text>
                </View>
              </View>
            </View>
          ))}
        </>
      )}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
};

const ExploreScreen: React.FC = () => {
  const { currentMood } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [seeAllType, setSeeAllType] = useState<SeeAllType>(null);
  const [publicPlaylists, setPublicPlaylists] = useState<PublicPlaylistUI[]>([]);
  const [recentSongs, setRecentSongs] = useState<RecentSongUI[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [playlistsError, setPlaylistsError] = useState<string | null>(null);
  const [recentSongsLoading, setRecentSongsLoading] = useState(false);
  const [recentSongsError, setRecentSongsError] = useState<string | null>(null);

  const { openSong } = useSongPlayer();
  const router = useRouter();

  const isSearching = searchQuery.trim().length > 0;

  const loadPublicPlaylists = useCallback(async () => {
    try {
      setPlaylistsLoading(true);
      setPlaylistsError(null);

      const token = await AsyncStorage.getItem("token");
      const headers: Record<string, string> = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
        headers["x-auth-token"] = token;
      }

      const response = await fetch(buildApiUrl("public-playlists"), {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
          text || `Failed to fetch playlists (${response.status})`,
        );
      }

      const data = await response.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.playlists)
          ? data.playlists
          : Array.isArray(data?.items)
            ? data.items
            : [];

      const normalized = list.map(normalizePlaylist);
      normalized.sort((a, b) => {
        const diff = (b.songCount || 0) - (a.songCount || 0);
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name);
      });

      setPublicPlaylists(normalized);
    } catch (error: any) {
      setPlaylistsError(error?.message || "Unable to load playlists");
      setPublicPlaylists([]);
    } finally {
      setPlaylistsLoading(false);
    }
  }, []);

  const loadRecentSongs = useCallback(async () => {
    try {
      setRecentSongsLoading(true);
      setRecentSongsError(null);

      const token = await AsyncStorage.getItem("token");
      const headers: Record<string, string> = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
        headers["x-auth-token"] = token;
      }

      const response = await fetch(buildApiUrl("user/me/history"), {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
          text || `Failed to fetch recent songs (${response.status})`,
        );
      }

      const data = await response.json();
      const history: HistoryEntry[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.history)
          ? data.history
          : Array.isArray(data?.songHistory)
            ? data.songHistory
            : Array.isArray(data?.items)
              ? data.items
              : [];

      const sortedUnique = history
        .slice()
        .sort((a, b) => {
          const timeA = new Date(a.timestamp || 0).getTime();
          const timeB = new Date(b.timestamp || 0).getTime();
          return timeB - timeA;
        })
        .filter((item, index, arr) =>
          index === arr.findIndex((entry) => entry.songId === item.songId),
        )
        .slice(0, MAX_RECENT_SONGS)
        .map(normalizeRecentSong)
        .filter((song): song is RecentSongUI => Boolean(song));

      setRecentSongs(sortedUnique);
    } catch (error: any) {
      setRecentSongsError(error?.message || "Unable to load recent songs");
      setRecentSongs([]);
    } finally {
      setRecentSongsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPublicPlaylists();
    loadRecentSongs();
  }, [loadPublicPlaylists, loadRecentSongs]);

  useFocusEffect(
    useCallback(() => {
      loadRecentSongs();
    }, [loadRecentSongs])
  );

  const topPlaylists = useMemo(
    () => publicPlaylists.slice(0, MAX_TOP_PLAYLISTS),
    [publicPlaylists],
  );

  const artistPlaylists = useMemo(() => {
    return publicPlaylists
      .filter((p) => p.type === "artist")
      .slice(0, MAX_TOP_PLAYLISTS);
  }, [publicPlaylists]);

  const handleSongPress = (song: Song) => {
    setRecentSongs(prev => {
      const newSong = {
        ...song,
        timestamp: new Date().toISOString(),
      };

      const filtered = prev.filter(s => s.id !== song.id);

      return [newSong, ...filtered].slice(0, 10);
    });

    openSong({
      id: song.id,
      title: song.title,
      artist: song.artist,
      duration: Number.parseInt(String(song.duration), 10) || 240,
      coverUri: song.albumArt,
    });
  };

  const handlePlaylistPress = (playlist: PublicPlaylistUI) => {
    router.push({
      pathname: "/(tabs)/playlist-details",
      params: { playlistId: playlist.playlistId },
    });
  };

  const handleArtistPress = (artist: Artist) => {
    console.log("Artist pressed:", artist.name);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#181818" />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Explore</Text>
            <Text style={styles.subGreeting}>What's new today 🎵</Text>
          </View>
          <TouchableOpacity style={styles.searchIconBtn} activeOpacity={0.7}>
            <Feather name="search" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Artists, songs, playlists…"
            placeholderTextColor="#555"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {isSearching && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              activeOpacity={0.7}
            >
              <Feather name="x-circle" size={18} color="#555" />
            </TouchableOpacity>
          )}
        </View>

        {isSearching ? (
          <SearchResults
            query={searchQuery}
            onSongPress={handleSongPress}
            playlists={publicPlaylists}
            songs={recentSongs}
          />
        ) : (
          <>
            <View style={styles.section}>
              <SectionHeader
                title="Recent Songs"
                onSeeAll={() => setSeeAllType("songs")}
              />
              {recentSongsLoading && recentSongs.length === 0 ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color={currentMood.colors[1]} />
                  <Text style={styles.loadingText}>Loading recent songs...</Text>
                </View>
              ) : recentSongsError && recentSongs.length === 0 ? (
                <View style={styles.loadingBox}>
                  <Feather
                    name="alert-triangle"
                    size={18}
                    color={currentMood.colors[1]}
                  />
                  <Text style={styles.loadingText}>{recentSongsError}</Text>
                </View>
              ) : recentSongs.length === 0 ? (
                <View style={styles.loadingBox}>
                  <Feather
                    name="clock"
                    size={18}
                    color={currentMood.colors[1]}
                  />
                  <Text style={styles.loadingText}>
                    Your recent songs will appear here.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={recentSongs}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                  renderItem={({ item }) => (
                    <RecentSongCard song={item} onPress={handleSongPress} />
                  )}
                />
              )}
            </View>

            <View style={styles.section}>
              <SectionHeader
                title="Top Playlists"
                onSeeAll={() => setSeeAllType("playlists")}
              />

              {playlistsLoading && topPlaylists.length === 0 ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color={currentMood.colors[1]} />
                  <Text style={styles.loadingText}>Loading playlists...</Text>
                </View>
              ) : playlistsError && topPlaylists.length === 0 ? (
                <View style={styles.loadingBox}>
                  <Feather
                    name="alert-triangle"
                    size={18}
                    color={currentMood.colors[1]}
                  />
                  <Text style={styles.loadingText}>{playlistsError}</Text>
                </View>
              ) : (
                <FlatList
                  data={topPlaylists}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                  renderItem={({ item }) => (
                    <PlaylistPreviewCard
                      playlist={item}
                      onPress={handlePlaylistPress}
                    />
                  )}
                  ListEmptyComponent={
                    !playlistsLoading ? (
                      <View style={styles.loadingBox}>
                        <Text style={styles.loadingText}>
                          No public playlists found.
                        </Text>
                      </View>
                    ) : null
                  }
                />
              )}
            </View>

            <View style={styles.section}>
              <SectionHeader
                title="Top Artists"
                onSeeAll={() => setSeeAllType("artists")}
              />

              {playlistsLoading && artistPlaylists.length === 0 ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color={currentMood.colors[1]} />
                  <Text style={styles.loadingText}>Loading artists...</Text>
                </View>
              ) : playlistsError && artistPlaylists.length === 0 ? (
                <View style={styles.loadingBox}>
                  <Feather
                    name="alert-triangle"
                    size={18}
                    color={currentMood.colors[1]}
                  />
                  <Text style={styles.loadingText}>{playlistsError}</Text>
                </View>
              ) : (
                <FlatList
                  data={artistPlaylists}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                  renderItem={({ item }) => (
                    <PlaylistPreviewCard
                      playlist={item}
                      onPress={handlePlaylistPress}
                    />
                  )}
                  ListEmptyComponent={
                    !playlistsLoading ? (
                      <View style={styles.loadingBox}>
                        <Text style={styles.loadingText}>
                          No artist playlists found.
                        </Text>
                      </View>
                    ) : null
                  }
                />
              )}
            </View>

            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>

      <LinearGradient
        colors={["transparent", "rgba(34,34,34,1)", "#181818"]}
        style={styles.fadeOverlay}
        pointerEvents="none"
      />

      <SeeAllModal
        type={seeAllType}
        onClose={() => setSeeAllType(null)}
        onSongPress={handleSongPress}
        onPlaylistPress={handlePlaylistPress}
        onArtistPress={handleArtistPress}
        playlists={publicPlaylists}
        artistPlaylists={artistPlaylists}
        recentSongs={recentSongs}
        recentSongsLoading={recentSongsLoading}
        recentSongsError={recentSongsError}
        playlistsLoading={playlistsLoading}
        playlistsError={playlistsError}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#181818" },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  greeting: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  subGreeting: { fontSize: 13, color: "#888888", marginTop: 2 },
  searchIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrapper: {
    marginHorizontal: 20,
    marginBottom: 18,
    backgroundColor: "#252525",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 46,
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: { flex: 1, color: "#FFFFFF", fontSize: 14, fontWeight: "400" },
  moodRow: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    marginBottom: 22,
    gap: 8,
  },
  moodChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#252525",
    marginRight: 8,
  },
  moodChipText: { fontSize: 13, color: "#888888", fontWeight: "600" },
  moodChipTextActive: { color: "#FFFFFF" },
  section: { marginBottom: 28 },
  horizontalList: { paddingHorizontal: 20 },
  fadeOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 190,
  },
  loadingBox: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: "#999",
    fontSize: 13,
  },
});

const playlistCardStyles = StyleSheet.create({
  card: {
    width: 152,
    marginRight: 14,
  },
  cover: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 18,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 12,
    backgroundColor: "#2A2A2A",
  },
  coverImage: {
    borderRadius: 18,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.20)",
  },
  badge: {
    alignSelf: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    zIndex: 1,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 10,
  },
  subtitle: {
    color: "#888",
    fontSize: 12,
    marginTop: 4,
  },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdropPress: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    backgroundColor: "#222222",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: "75%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#444",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  rowThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#333",
  },
  rowThumbCircle: {
    borderRadius: 22,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  rowSub: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  rowMeta: {
    fontSize: 12,
    color: "#555",
  },
  loadingRow: {
    paddingVertical: 18,
    alignItems: "center",
    gap: 10,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 22,
    gap: 8,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  emptySub: {
    color: "#888",
    fontSize: 12,
    textAlign: "center",
  },
});

const searchStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  empty: {
    alignItems: "center",
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    color: "#555",
    fontSize: 14,
  },
});

export default ExploreScreen;
