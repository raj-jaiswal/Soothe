import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import SongActionsMenu from './SongActionsMenu';
import { useSongPlayer } from './SongPlayerContext';


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
  const { openSong } = useSongPlayer();

  // ✅ New State for dynamic data
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActionSong, setSelectedActionSong] = useState<any | null>(null);
const [actionsVisible, setActionsVisible] = useState(false);


  const key = moodId.toLowerCase();
  const cover = MOOD_COVER[key] ?? { uri: 'https://picsum.photos/seed/default/400/400' };

  // ✅ Fetch data on mount
// ✅ Fetch data on mount
  useEffect(() => {
    let isMounted = true; // Prevents state updates if user leaves screen early

    const fetchMoodData = async () => {
      try {
        setLoading(true);
        setSongs([]); // Clear previous songs
        
        const token = await AsyncStorage.getItem("token");
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // 1. Fetch Playlist to get songIds
        const playlistUrl = `${process.env.EXPO_PUBLIC_BACKEND_URL}public-playlists/mood_${key}`;
        const playlistRes = await fetch(playlistUrl, { headers });
        
        if (!playlistRes.ok) throw new Error('Failed to fetch playlist');
        const playlistData = await playlistRes.json();

        if (!playlistData || !playlistData.songIds) {
          if (isMounted) setLoading(false);
          return;
        }

        // 🛑 Stop the main loading spinner now so the UI (cover art/title) renders immediately
        if (isMounted) setLoading(false);

        // 2. Fetch metadata for each song individually and append to state as they arrive
        playlistData.songIds.forEach(async (songId: string) => {
          try {
            // 👇 NOW USING THE METADATA ROUTE 👇
            const songUrl = `${process.env.EXPO_PUBLIC_BACKEND_URL}songs/${songId}/metadata`;
            const songRes = await fetch(songUrl, { headers });
            
            if (!songRes.ok) return;
            const data = await songRes.json();

            if (isMounted) {
              setSongs(prevSongs => {
                // Prevent duplicates in case React StrictMode fires twice
                if (prevSongs.some(s => s.id === data.metadata.song_ID)) return prevSongs;
                
                return [...prevSongs, {
                  id: data.metadata.song_ID,
                  title: data.metadata.name,
                  artist: data.metadata.artist,
                  cover: data.metadata.coverURL || 'https://picsum.photos/seed/default/100/100',
                }];
              });
            }
          } catch (err) {
            console.error(`Failed to fetch metadata for song ${songId}:`, err);
          }
        });

      } catch (error) {
        console.error("Error fetching mood playlist:", error);
        if (isMounted) setLoading(false);
      }
    };

    fetchMoodData();

    return () => {
      isMounted = false; // Cleanup function
    };
  }, [key]);

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

        {/* ✅ Render loading spinner or songs */}
        {loading ? (
          <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
        ) : (
          songs.map(song => (
            <TouchableOpacity
              key={song.id}
              style={styles.songRow}
              onPress={() => openSong({
                id:       song.id,
                title:    song.title,
                artist:   song.artist,
                duration: 240, // Update if you add duration to your DB schema
                coverUri: song.cover,
                // streamUrl: song.streamUrl // Uncomment if your audio player needs the actual playable URL!
              })}
              activeOpacity={0.7}
            >
              <Image source={{ uri: song.cover }} style={styles.songCover} />
              <View style={styles.songInfo}>
                <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
                <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
              </View>
              <TouchableOpacity
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
  onPress={() => {
    setSelectedActionSong(song);
    setActionsVisible(true);
  }}
>
  <Ionicons name="ellipsis-vertical" size={18} color="#555" />
</TouchableOpacity>

            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 70 }} />
      </ScrollView>
      <SongActionsMenu
  visible={actionsVisible}
  song={selectedActionSong}
  onClose={() => setActionsVisible(false)}
/>

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