import SectionHeader from '@/components/explore/SectionHeader';
import RecentSongCard from '@/components/explore/RecentSongCard';
import PlaylistCard from '@/components/explore/PlaylistCard';
import ArtistCard from '@/components/explore/ArtistCard';
import { RECENT_SONGS, TOP_PLAYLISTS, TOP_ARTISTS } from '@/constants/explore/exploreMockData';
import { Song, Playlist, Artist } from '@/constants/explore/ExploreTypes';
import { useSongPlayer } from '@/components/index/SongPlayerContext';
import React, { useState } from 'react';
import Feather from '@expo/vector-icons/Feather';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const MOODS = ['All', 'Chill', 'Happy', 'Sad', 'Focus', 'Hype'];

const ExploreScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMood, setActiveMood] = useState('All');

  // ✅ Correct — hooks inside the component
  const { openSong } = useSongPlayer();

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
        </View>

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
          <SectionHeader title="Recent Songs" onSeeAll={() => console.log('See all recent songs')} />
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
          <SectionHeader title="Top Playlists" onSeeAll={() => console.log('See all playlists')} />
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
          <SectionHeader title="Top Artists" onSeeAll={() => console.log('See all artists')} />
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
      </ScrollView>

      <LinearGradient
        colors={['transparent', 'rgba(34,34,34,1)', '#181818']}
        style={styles.fadeOverlay}
        pointerEvents="none"
      />
    </SafeAreaView>
  );
};

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
  },
  searchInput:    { color: '#FFFFFF', fontSize: 14, fontWeight: '400' },
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

export default ExploreScreen;