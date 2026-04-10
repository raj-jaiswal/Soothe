import SectionHeader from '@/components/explore/SectionHeader';
import RecentSongCard from '@/components/explore/RecentSongCard';
import { RECENT_SONGS } from '@/constants/explore/exploreMockData';
import { Song, Artist } from '@/constants/explore/ExploreTypes';
import { useSongPlayer } from '@/components/index/SongPlayerContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Feather from '@expo/vector-icons/Feather';
import {
  View,
  Text,
  Image,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
  Pressable,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';


const MAX_TOP_PLAYLISTS = 10;

type SeeAllType = 'songs' | 'playlists' | 'artists' | null;

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

const getApiBaseUrl = () => {
  const raw = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';
  if (!raw) return '';
  return raw.endsWith('/') ? raw : `${raw}/`;
};

const buildApiUrl = (endpoint: string) => `${getApiBaseUrl()}${endpoint.replace(/^\//, '')}`;

const getPlaceholderImage = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/600`;

const normalizePlaylist = (item: PlaylistSource): PublicPlaylistUI => {
  const playlistId =
    item.playlistId ||
    item.PK?.replace(/^PLAYLIST#/, '') ||
    item.name?.toLowerCase().replace(/\s+/g, '_') ||
    `playlist_${Math.random().toString(36).slice(2, 8)}`;

  return {
    id: playlistId,
    playlistId,
    name: item.name || 'Untitled Playlist',
    description: item.description || 'Public playlist',
    songCount: Number(item.songCount || item.songIds?.length || 0),
    type: item.type || 'public',
    image: item.image || getPlaceholderImage(playlistId),
    source: item,
  };
};

const getPlaylistSubtitle = (playlist: PublicPlaylistUI) => {
  const curator =
    playlist.source.curator ||
    playlist.source.userName ||
    playlist.source.ownerName ||
    'Public';
  return `${curator} · ${playlist.songCount} songs`;
};

interface PlaylistPreviewCardProps {
  playlist: PublicPlaylistUI;
  onPress: (playlist: PublicPlaylistUI) => void;
}

const PlaylistPreviewCard: React.FC<PlaylistPreviewCardProps> = ({ playlist, onPress }) => {
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
        <View style={playlistCardStyles.badge}>
          <Text style={playlistCardStyles.badgeText}>{playlist.songCount} songs</Text>
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

// ── See All Modal ──────────────────────────────────────────────
interface SeeAllModalProps {
  type: SeeAllType;
  onClose: () => void;
  onSongPress: (song: Song) => void;
  onPlaylistPress: (playlist: PublicPlaylistUI) => void;
  onArtistPress: (artist: Artist) => void;
  playlists: PublicPlaylistUI[];
  artistPlaylists: PublicPlaylistUI[];
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
  playlistsLoading,
  playlistsError,
}) => {
  const title =
    type === 'songs' ? 'Recent Songs' :
    type === 'playlists' ? 'Top Playlists' : 'Top Artists';

  return (
    <Modal visible={!!type} animationType="slide" transparent onRequestClose={onClose}>
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
            {type === 'songs' && RECENT_SONGS.map((song) => (
              <TouchableOpacity
                key={song.id}
                style={modalStyles.row}
                onPress={() => { onSongPress(song); onClose(); }}
                activeOpacity={0.75}
              >
                <View style={modalStyles.rowLeft}>
                  <Image source={{ uri: song.albumArt }} style={modalStyles.rowThumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={modalStyles.rowTitle}>{song.title}</Text>
                    <Text style={modalStyles.rowSub}>{song.artist}</Text>
                  </View>
                </View>
                <Text style={modalStyles.rowMeta}>{song.duration}</Text>
              </TouchableOpacity>
            ))}

            {type === 'playlists' && (
              <>
                {playlistsLoading && (
                  <View style={modalStyles.loadingRow}>
                    <ActivityIndicator color="#8B5CF6" />
                    <Text style={modalStyles.loadingText}>Loading playlists...</Text>
                  </View>
                )}

                {!playlistsLoading && playlistsError ? (
                  <View style={modalStyles.emptyState}>
                    <Feather name="alert-triangle" size={26} color="#8B5CF6" />
                    <Text style={modalStyles.emptyTitle}>Could not load playlists</Text>
                    <Text style={modalStyles.emptySub}>{playlistsError}</Text>
                  </View>
                ) : null}

                {!playlistsLoading && !playlistsError && playlists.map((pl) => (
                  <TouchableOpacity
                    key={pl.id}
                    style={modalStyles.row}
                    onPress={() => { onPlaylistPress(pl); onClose(); }}
                    activeOpacity={0.75}
                  >
                    <View style={modalStyles.rowLeft}>
                      <Image source={{ uri: pl.image }} style={modalStyles.rowThumb} />
                      <View style={{ flex: 1 }}>
                        <Text style={modalStyles.rowTitle}>{pl.name}</Text>
                        <Text style={modalStyles.rowSub}>{getPlaylistSubtitle(pl)}</Text>
                      </View>
                    </View>
                    <Feather name="chevron-right" size={18} color="#555" />
                  </TouchableOpacity>
                ))}
              </>
            )}

            {type === 'artists' && artistPlaylists.map((pl) => (
              <TouchableOpacity
                key={pl.id}
                style={modalStyles.row}
                onPress={() => { onPlaylistPress(pl); onClose(); }}
                activeOpacity={0.75}
              >
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

// ── Search Results ─────────────────────────────────────────────
interface SearchResultsProps {
  query: string;
  onSongPress: (song: Song) => void;
  playlists: PublicPlaylistUI[];
}

const SearchResults: React.FC<SearchResultsProps> = ({ query, onSongPress, playlists }) => {
  const q = query.toLowerCase();

  const matchedSongs = RECENT_SONGS.filter(
    (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
  );

  const matchedPlaylists = playlists.filter(
    (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
  );

  const matchedArtists = playlists.filter(
    (p) =>
      p.type === 'artist' &&
      (p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q))
  );

  const hasResults = matchedSongs.length + matchedPlaylists.length + matchedArtists.length > 0;

  if (!hasResults) {
    return (
      <View style={searchStyles.empty}>
        <Feather name="search" size={36} color="#444" />
        <Text style={searchStyles.emptyText}>No results for "{query}"</Text>
      </View>
    );
  }

  return (
    <ScrollView style={searchStyles.container} showsVerticalScrollIndicator={false}>
      {matchedSongs.length > 0 && (
        <>
          <Text style={searchStyles.groupTitle}>Songs</Text>
          {matchedSongs.map((song) => (
            <TouchableOpacity
              key={song.id}
              style={modalStyles.row}
              onPress={() => onSongPress(song)}
              activeOpacity={0.75}
            >
              <View style={modalStyles.rowLeft}>
                <Image source={{ uri: song.albumArt }} style={modalStyles.rowThumb} />
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.rowTitle}>{song.title}</Text>
                  <Text style={modalStyles.rowSub}>{song.artist}</Text>
                </View>
              </View>
              <Text style={modalStyles.rowMeta}>{song.duration}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {matchedPlaylists.length > 0 && (
        <>
          <Text style={searchStyles.groupTitle}>Playlists</Text>
          {matchedPlaylists.map((pl) => (
            <View key={pl.id} style={modalStyles.row}>
              <View style={modalStyles.rowLeft}>
                <Image source={{ uri: pl.image }} style={modalStyles.rowThumb} />
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
          <Text style={searchStyles.groupTitle}>Artists</Text>
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

// ── Main Screen ────────────────────────────────────────────────
const ExploreScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [seeAllType, setSeeAllType] = useState<SeeAllType>(null);
  const [publicPlaylists, setPublicPlaylists] = useState<PublicPlaylistUI[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [playlistsError, setPlaylistsError] = useState<string | null>(null);

  const { openSong } = useSongPlayer();

  const router = useRouter();

  const isSearching = searchQuery.trim().length > 0;

  const loadPublicPlaylists = useCallback(async () => {
    try {
      setPlaylistsLoading(true);
      setPlaylistsError(null);

      const token = await AsyncStorage.getItem('token');
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }

      const response = await fetch(buildApiUrl('public-playlists'), {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || `Failed to fetch playlists (${response.status})`);
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
      setPlaylistsError(error?.message || 'Unable to load playlists');
      setPublicPlaylists([]);
    } finally {
      setPlaylistsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPublicPlaylists();
  }, [loadPublicPlaylists]);

  const topPlaylists = useMemo(
    () => publicPlaylists.slice(0, MAX_TOP_PLAYLISTS),
    [publicPlaylists]
  );

  const artistPlaylists = useMemo(() => {
    return publicPlaylists
      .filter((p) => p.type === 'artist')   
      .slice(0, MAX_TOP_PLAYLISTS);
  }, [publicPlaylists]);

  const handleSongPress = (song: Song) => {
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
      pathname: '/(tabs)/playlist-details',
      params: { playlistId: playlist.playlistId },
    });
  };

  const handleArtistPress = (artist: Artist) => {
    console.log('Artist pressed:', artist.name);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#181818" />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Explore</Text>
            <Text style={styles.subGreeting}>What's new today 🎵</Text>
          </View>
          <TouchableOpacity style={styles.searchIconBtn} activeOpacity={0.7}>
            <Feather name="search" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* ── Search Bar ── */}
        <View style={styles.searchWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Artists, songs, playlists…"
            placeholderTextColor="#555"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {isSearching && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Feather name="x-circle" size={18} color="#555" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Search Results ── */}
        {isSearching ? (
          <SearchResults
            query={searchQuery}
            onSongPress={handleSongPress}
            playlists={publicPlaylists}
          />
        ) : (
          <>

            {/* ── Recent Songs ── */}
            <View style={styles.section}>
              <SectionHeader title="Recent Songs" onSeeAll={() => setSeeAllType('songs')} />
              <FlatList
                data={RECENT_SONGS}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => (
                  <RecentSongCard song={item} onPress={handleSongPress} />
                )}
              />
            </View>

            {/* ── Top Playlists ── */}
            <View style={styles.section}>
              <SectionHeader title="Top Playlists" onSeeAll={() => setSeeAllType('playlists')} />

              {playlistsLoading && topPlaylists.length === 0 ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color="#8B5CF6" />
                  <Text style={styles.loadingText}>Loading playlists...</Text>
                </View>
              ) : playlistsError && topPlaylists.length === 0 ? (
                <View style={styles.loadingBox}>
                  <Feather name="alert-triangle" size={18} color="#8B5CF6" />
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
                    <PlaylistPreviewCard playlist={item} onPress={handlePlaylistPress} />
                  )}
                  ListEmptyComponent={
                    !playlistsLoading ? (
                      <View style={styles.loadingBox}>
                        <Text style={styles.loadingText}>No public playlists found.</Text>
                      </View>
                    ) : null
                  }
                />
              )}
            </View>

            {/* ── Top Artists ── */}
            <View style={styles.section}>
              <SectionHeader title="Top Artists" onSeeAll={() => setSeeAllType('artists')} />

              {playlistsLoading && artistPlaylists.length === 0 ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color="#8B5CF6" />
                  <Text style={styles.loadingText}>Loading artists...</Text>
                </View>
              ) : playlistsError && artistPlaylists.length === 0 ? (
                <View style={styles.loadingBox}>
                  <Feather name="alert-triangle" size={18} color="#8B5CF6" />
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
                        <Text style={styles.loadingText}>No artist playlists found.</Text>
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
        colors={['transparent', 'rgba(34,34,34,1)', '#181818']}
        style={styles.fadeOverlay}
        pointerEvents="none"
      />

      {/* ── See All Modal ── */}
      <SeeAllModal
        type={seeAllType}
        onClose={() => setSeeAllType(null)}
        onSongPress={handleSongPress}
        onPlaylistPress={handlePlaylistPress}
        onArtistPress={handleArtistPress}
        playlists={publicPlaylists}
        artistPlaylists={artistPlaylists}
        playlistsLoading={playlistsLoading}
        playlistsError={playlistsError}
      />
    </SafeAreaView>
  );
};

// ── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea:       { flex: 1, backgroundColor: '#181818' },
  scroll:         { flex: 1 },
  scrollContent:  { paddingTop: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  greeting:       { fontSize: 30, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  subGreeting:    { fontSize: 13, color: '#888888', marginTop: 2 },
  searchIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center',
  },
  searchWrapper: {
    marginHorizontal: 20, marginBottom: 18, backgroundColor: '#252525',
    borderRadius: 14, paddingHorizontal: 16, height: 46, justifyContent: 'center',
    flexDirection: 'row', alignItems: 'center',
  },
  searchInput:    { flex: 1, color: '#FFFFFF', fontSize: 14, fontWeight: '400' },
  moodRow:        { paddingHorizontal: 20, paddingBottom: 4, marginBottom: 22, gap: 8 },
  moodChip:       {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#252525', marginRight: 8,
  },
  moodChipActive: { backgroundColor: '#8B5CF6' },
  moodChipText:   { fontSize: 13, color: '#888888', fontWeight: '600' },
  moodChipTextActive: { color: '#FFFFFF' },
  section:        { marginBottom: 28 },
  horizontalList: { paddingHorizontal: 20 },
  fadeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 190,
  },
  loadingBox: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#999',
    fontSize: 13,
  },
});

const playlistCardStyles = StyleSheet.create({
  card: {
    width: 152,
    marginRight: 14,
  },
  cover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 12,
    backgroundColor: '#2A2A2A',
  },
  coverImage: {
    borderRadius: 18,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.20)',
  },
  badge: {
    alignSelf: 'flex-end',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    zIndex: 1,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  subtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropPress: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#222222',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '75%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#444',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  rowThumbCircle: {
    borderRadius: 22,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rowSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  rowMeta: {
    fontSize: 12,
    color: '#555',
  },
  loadingRow: {
    paddingVertical: 18,
    alignItems: 'center',
    gap: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
    gap: 8,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
});

const searchStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B5CF6',
    marginTop: 16,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    color: '#555',
    fontSize: 14,
  },
});

export default ExploreScreen;