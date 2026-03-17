import { Ionicons } from '@expo/vector-icons';
import React from 'react';
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
import { useSongPlayer } from './SongPlayerContext';
import MOOD_SONGS from './moodSongs';

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

interface MoodPlayerScreenProps {
  moodId: string;
  moodLabel: string;
  onBack: () => void;
}

export default function MoodPlayerScreen({ moodId, moodLabel, onBack }: MoodPlayerScreenProps) {
  const { openSong } = useSongPlayer(); // ✅ use context instead of local state

  const key   = moodId.toLowerCase();
  const songs = MOOD_SONGS[key] ?? [];
  const cover = MOOD_COVER[key] ?? 'https://picsum.photos/seed/default/400/400';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#111111" />

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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Image source={cover} style={styles.coverArt} resizeMode="cover" />

        <Text style={styles.moodTitle}>{moodLabel}</Text>

        {songs.map(song => (
          <TouchableOpacity
            key={song.id}
            style={styles.songRow}
            onPress={() => openSong({  // ✅ calls context openSong → triggers Modal
              id:       song.id,
              title:    song.title,
              artist:   song.artist,
              duration: song.duration ?? 240,
              coverUri: song.cover,
            })}
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