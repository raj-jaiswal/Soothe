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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COVER_SIZE = SCREEN_WIDTH - 48;

// ─── Mood config ──────────────────────────────────────────────────────────────
// Add a new mood here whenever you add a new genre file in moodSongs/

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

const MOOD_ICON: Record<string, string> = {
  anxious:  'pulse',
  angry:    'flame',
  calm:     'leaf',
  love:     'heart',
  upbeat:   'musical-notes',
  euphoric: 'star',
  grief:    'rainy',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface MoodPlayerScreenProps {
  moodId: string;
  moodLabel: string;
  onBack: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MoodPlayerScreen({ moodId, moodLabel, onBack }: MoodPlayerScreenProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);

  const key    = moodId.toLowerCase();
  const songs  = MOOD_SONGS[key] ?? [];
  const accent = MOOD_ACCENT[key] ?? '#7C3AED';
  const icon   = MOOD_ICON[key]   ?? 'musical-notes';
  const cover  = MOOD_COVER[key]  ?? 'https://picsum.photos/seed/default/400/400';

  const togglePlay = (id: string) => {
    setPlayingId(prev => (prev === id ? null : id));
    console.log(`▶️ Toggled: ${id}`);
  };

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

        {/* Song list */}
        {songs.map(song => {
          const isPlaying = playingId === song.id;
          return (
            <TouchableOpacity
              key={song.id}
              style={styles.songRow}
              onPress={() => togglePlay(song.id)}
              activeOpacity={0.7}
            >
              <Image source={{ uri: song.cover }} style={styles.songCover} />
              <View style={styles.songInfo}>
                <Text style={[styles.songTitle, isPlaying && { color: accent }]} numberOfLines={1}>
                  {song.title}
                </Text>
                <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
              </View>
              <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="ellipsis-vertical" size={18} color="#555" />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={{ height: 30 }} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  songCover:     { width: 52, height: 52, borderRadius: 10, backgroundColor: '#2A2A2A' },
  songInfo:      { flex: 1 },
  songTitle:     { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 4 },
  songArtist:    { fontSize: 13, color: '#666' },
  navBar:        { paddingHorizontal: 16, paddingBottom: 8, paddingTop: 8 },
  navBarInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1E1E1E', borderRadius: 40, paddingHorizontal: 16, paddingVertical: 10,
  },
  navBtn:        { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  navCenterPill: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    marginTop: -20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
});
