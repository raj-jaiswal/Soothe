import SectionHeader from '@/components/explore/SectionHeader';
import RecentSongCard from '@/components/explore/RecentSongCard';
import PlaylistCard from '@/components/explore/PlaylistCard';
import ArtistCard from '@/components/explore/ArtistCard';
import { RECENT_SONGS, TOP_PLAYLISTS, TOP_ARTISTS } from '@/constants/explore/exploreMockData';
import { Song, Playlist, Artist } from '@/constants/explore/ExploreTypes';
import { useSongPlayer } from '@/components/index/SongPlayerContext';
import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const MOODS = ['All', 'Chill', 'Happy', 'Sad', 'Focus', 'Hype'];

// ── See All Modal ──────────────────────────────────────────────
type SeeAllType = 'songs' | 'playlists' | 'artists' | null;

interface SeeAllModalProps {
  type: SeeAllType;
  onClose: () => void;
  onSongPress: (song: Song) => void;
  onPlaylistPress: (playlist: Playlist) => void;
  onArtistPress: (artist: Artist) => void;
}

const SeeAllModal: React.FC<SeeAllModalProps> = ({
  type, onClose, onSongPress, onPlaylistPress, onArtistPress,
}) => {
  const title =
    type === 'songs' ? 'Recent Songs' :
    type === 'playlists' ? 'Top Playlists' : 'Top Artists';

  return (
    <Modal visible={!!type} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <Pressable style={modalStyles.backdropPress} onPress={onClose} />
        <View style={modalStyles.sheet}>
          {/* Handle */}
          <View style={modalStyles.handle} />

          {/* Header */}
          <View style={modalStyles.sheetHeader}>
            <Text style={modalStyles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Feather name="x" size={22} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Content */}
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
                  <View>
                    <Text style={modalStyles.rowTitle}>{song.title}</Text>
                    <Text style={modalStyles.rowSub}>{song.artist}</Text>
                  </View>
                </View>
                <Text style={modalStyles.rowMeta}>{song.duration}</Text>
              </TouchableOpacity>
            ))}

            {type === 'playlists' && TOP_PLAYLISTS.map((pl) => (
              <TouchableOpacity
                key={pl.id}
                style={modalStyles.row}
                onPress={() => { onPlaylistPress(pl); onClose(); }}
                activeOpacity={0.75}
              >
                <View style={modalStyles.rowLeft}>
                  <Image source={{ uri: pl.coverArt }} style={modalStyles.rowThumb} />
                  <View>
                    <Text style={modalStyles.rowTitle}>{pl.name}</Text>
                    <Text style={modalStyles.rowSub}>by {pl.curator} · {pl.songCount} songs</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={18} color="#555" />
              </TouchableOpacity>
            ))}

            {type === 'artists' && TOP_ARTISTS.map((artist) => (
              <TouchableOpacity
                key={artist.id}
                style={modalStyles.row}
                onPress={() => { onArtistPress(artist); onClose(); }}
                activeOpacity={0.75}
              >
                <View style={modalStyles.rowLeft}>
                  <Image source={{ uri: artist.profileImage }} style={[modalStyles.rowThumb, modalStyles.rowThumbCircle]} />
                  <View>
                    <Text style={modalStyles.rowTitle}>{artist.name}</Text>
                    <Text style={modalStyles.rowSub}>{artist.genre}</Text>
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
}

const SearchResults: React.FC<SearchResultsProps> = ({ query, onSongPress }) => {
  const q = query.toLowerCase();

  const matchedSongs = RECENT_SONGS.filter(
    (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
  );
  const matchedPlaylists = TOP_PLAYLISTS.filter(
    (p) => p.name.toLowerCase().includes(q) || p.curator?.toLowerCase().includes(q)
  );
  const matchedArtists = TOP_ARTISTS.filter(
    (a) => a.name.toLowerCase().includes(q) || a.genre.toLowerCase().includes(q)
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
                <View>
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
                <Image source={{ uri: pl.coverArt }} style={modalStyles.rowThumb} />
                <View>
                  <Text style={modalStyles.rowTitle}>{pl.name}</Text>
                  <Text style={modalStyles.rowSub}>by {pl.curator} · {pl.songCount} songs</Text>
                </View>
              </View>
            </View>
          ))}
        </>
      )}

      {matchedArtists.length > 0 && (
        <>
          <Text style={searchStyles.groupTitle}>Artists</Text>
          {matchedArtists.map((artist) => (
            <View key={artist.id} style={modalStyles.row}>
              <View style={modalStyles.rowLeft}>
                <Image source={{ uri: artist.profileImage }} style={[modalStyles.rowThumb, modalStyles.rowThumbCircle]} />
                <View>
                  <Text style={modalStyles.rowTitle}>{artist.name}</Text>
                  <Text style={modalStyles.rowSub}>{artist.genre}</Text>
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
  const [activeMood, setActiveMood] = useState('All');
  const [seeAllType, setSeeAllType] = useState<SeeAllType>(null);

  const { openSong } = useSongPlayer();

  const isSearching = searchQuery.trim().length > 0;

  const handleSongPress = (song: Song) => {
    openSong({
      id:       song.id,
      title:    song.title,
      artist:   song.artist,
      duration: parseInt(song.duration) || 240,
      coverUri: song.albumArt,
    });
  };

  const handlePlaylistPress = (playlist: Playlist) => {
    console.log('Playlist pressed:', playlist.name);
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
            <Text style={styles.searchIconText}>
              <Feather name="search" size={24} color="white" />
            </Text>
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

        {/* ── Search Results (replaces everything below when typing) ── */}
        {isSearching ? (
          <SearchResults query={searchQuery} onSongPress={handleSongPress} />
        ) : (
          <>
            {/* ── Mood Chips ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.moodRow}
            >
              {MOODS.map((mood) => (
                <TouchableOpacity
                  key={mood}
                  style={[styles.moodChip, activeMood === mood && styles.moodChipActive]}
                  onPress={() => setActiveMood(mood)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.moodChipText, activeMood === mood && styles.moodChipTextActive]}>
                    {mood}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

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
              <FlatList
                data={TOP_PLAYLISTS}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => (
                  <PlaylistCard playlist={item} onPress={handlePlaylistPress} />
                )}
              />
            </View>

            {/* ── Top Artists ── */}
            <View style={styles.section}>
              <SectionHeader title="Top Artists" onSeeAll={() => setSeeAllType('artists')} />
              <FlatList
                data={TOP_ARTISTS}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => (
                  <ArtistCard artist={item} onPress={handleArtistPress} />
                )}
              />
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, marginBottom: 16,
  },
  greeting:       { fontSize: 30, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  subGreeting:    { fontSize: 13, color: '#888888', marginTop: 2 },
  searchIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center',
  },
  searchIconText: { fontSize: 16 },
  searchWrapper: {
    marginHorizontal: 20, marginBottom: 18, backgroundColor: '#252525',
    borderRadius: 14, paddingHorizontal: 16, height: 46, justifyContent: 'center',
    flexDirection: 'row', alignItems: 'center',
  },
  searchInput:    { flex: 1, color: '#FFFFFF', fontSize: 14, fontWeight: '400' },
  moodRow:        { paddingHorizontal: 20, paddingBottom: 4, marginBottom: 22, gap: 8 },
  moodChip:       { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: '#252525', marginRight: 8 },
  moodChipActive: { backgroundColor: '#8B5CF6' },
  moodChipText:   { fontSize: 13, color: '#888888', fontWeight: '600' },
  moodChipTextActive: { color: '#FFFFFF' },
  section:        { marginBottom: 28 },
  horizontalList: { paddingHorizontal: 20 },
  fadeOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 190,
  },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1, justifyContent: 'flex-end',
  },
  backdropPress: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#222222',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12,
    maxHeight: '75%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#444', alignSelf: 'center', marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18, fontWeight: '700', color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2a2a2a',
  },
  rowLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1,
  },
  rowThumb: {
    width: 44, height: 44, borderRadius: 8, backgroundColor: '#333',
  },
  rowThumbCircle: {
    borderRadius: 22,
  },
  rowTitle: {
    fontSize: 14, fontWeight: '600', color: '#FFFFFF',
  },
  rowSub: {
    fontSize: 12, color: '#888', marginTop: 2,
  },
  rowMeta: {
    fontSize: 12, color: '#555',
  },
});

const searchStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  groupTitle: {
    fontSize: 13, fontWeight: '700', color: '#8B5CF6',
    marginTop: 16, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1,
  },
  empty: {
    alignItems: 'center', marginTop: 60, gap: 12,
  },
  emptyText: {
    color: '#555', fontSize: 14,
  },
});

export default ExploreScreen;