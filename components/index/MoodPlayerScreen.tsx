import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MOOD_SONGS from './moodSongs';
import SongPlayerScreen from './SongPlayerScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COVER_SIZE = SCREEN_WIDTH - 48;

const MOOD_COVER: Record<string, any> = {
  anxious:  require('@/assets/images/index_page/anxious.png'),
  angry:    require('@/assets/images/index_page/angry.png'),
  calm:     require('@/assets/images/index_page/calm.png'),
  love:     require('@/assets/images/index_page/love.png'),
  upbeat:   require('@/assets/images/index_page/upbeat.png'),
  euphoric: require('@/assets/images/index_page/euphoric.png'),
  grief:    require('@/assets/images/index_page/grief.png'),
};

const MOOD_ACCENT: Record<string, string> = {
  anxious:  '#7B61FF',
  angry:    '#FF4D4D',
  calm:     '#4DA6FF',
  love:     '#E0508A',
  upbeat:   '#4DCC6E',
  euphoric: '#FF9F40',
  grief:    '#8888BB',
};

interface MoodPlayerScreenProps {
  moodId: string;
  moodLabel: string;
  onBack: () => void;
}

export default function MoodPlayerScreen({ moodId, moodLabel, onBack }: MoodPlayerScreenProps) {
  const [activeSong, setActiveSong] = useState<null | {
    id: string;
    title: string;
    artist: string;
    cover: string;
    duration: number;
  }>(null);

  const key    = moodId.toLowerCase();
  const songs  = MOOD_SONGS[key] ?? [];
  const accent = MOOD_ACCENT[key] ?? '#7C3AED';
  const cover  = MOOD_COVER[key]  ?? 'https://picsum.photos/seed/default/400/400';

  // ── If a song is tapped, show the full-screen player ──
  if (activeSong) {
    return (
      <SongPlayerScreen
        song={{
          id:       activeSong.id,
          title:    activeSong.title,
          artist:   activeSong.artist,
          duration: activeSong.duration ?? 240,
          coverUri: activeSong.cover,
        }}
        onBack={() => setActiveSong(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#111111" />

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={styles.topBarRight}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={16} color="#888" />
          </View>
          <TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="search" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Large cover art */}
        <Image source={cover} style={styles.coverArt} resizeMode="cover" />

        {/* Mood title */}
        <Text style={styles.moodTitle}>{moodLabel}</Text>

        {/* Song list — tap any row to open SongPlayerScreen */}
        {songs.map(song => (
          <TouchableOpacity
            key={song.id}
            style={styles.songRow}
            onPress={() => setActiveSong(song)}
            activeOpacity={0.7}
          >
            <Image source={{ uri: song.cover }} style={styles.songCover} />
            <View style={styles.songInfo}>
              <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
              <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
            </View>
            <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="ellipsis-vertical" size={18} color="#555" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={{ height: 30 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#111111' },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12,
  },
  topBarRight:   { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center',
  },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 4, alignItems: 'center' },
  coverArt: {
    width: COVER_SIZE, height: COVER_SIZE,
    borderRadius: 20, backgroundColor: '#2A2A2A', marginBottom: 24,
  },
  moodTitle: {
    fontSize: 28, fontWeight: '700', color: '#fff',
    letterSpacing: 0.4, marginBottom: 24, alignSelf: 'center',
  },
  songRow: {
    flexDirection: 'row', alignItems: 'center',
    width: '100%', paddingVertical: 10, gap: 14,
  },
  songCover:  { width: 52, height: 52, borderRadius: 10, backgroundColor: '#2A2A2A' },
  songInfo:   { flex: 1 },
  songTitle:  { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 4 },
  songArtist: { fontSize: 13, color: '#666' },
});