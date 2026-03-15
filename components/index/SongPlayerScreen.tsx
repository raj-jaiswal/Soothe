import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ALBUM_SIZE   = SCREEN_WIDTH * 0.54;
const RING_PADDING = 18;
const RING_SIZE    = ALBUM_SIZE + RING_PADDING * 2;
const BAR_COUNT    = 40;

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number;
  coverUri?: string;
}

interface Props {
  song: Song;
  onBack: () => void;
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const BAR_HEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) => {
  const wave = Math.sin((i / BAR_COUNT) * Math.PI * 2.5) * 0.4 + 0.5;
  const rand = Math.random() * 0.4;
  return Math.max(0.1, Math.min(1, wave * 0.65 + rand * 0.35));
});

export default function SongPlayerScreen({ song, onBack }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const rotateAnim  = useRef(new Animated.Value(0)).current;
  const albumScale  = useRef(new Animated.Value(1)).current;
  const spinRef     = useRef<Animated.CompositeAnimation | null>(null);
  const waveRef     = useRef<Animated.CompositeAnimation | null>(null);

  // Keep bar anims in a ref so they're never null
  const pulseAnims  = useRef<Animated.Value[]>(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(1))
  );

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const progress = song.duration > 0 ? currentTime / song.duration : 0;

  // ── Start / stop everything when isPlaying changes ──
  useEffect(() => {
    if (isPlaying) {
      // Spin
      spinRef.current = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 5000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinRef.current.start();

      // Waveform loop
      startWave();
    } else {
      // Stop spin
      spinRef.current?.stop();
      spinRef.current = null;

      // Stop wave and reset bars
      waveRef.current?.stop();
      waveRef.current = null;
      pulseAnims.current.forEach(a => a.setValue(1));
    }

    return () => {
      spinRef.current?.stop();
      waveRef.current?.stop();
    };
  }, [isPlaying]);

  const startWave = () => {
    const anims = pulseAnims.current;
    waveRef.current = Animated.loop(
      Animated.parallel(
        anims.map(anim =>
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 0.2 + Math.random() * 0.9,
              duration: 200 + Math.random() * 250,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.5 + Math.random() * 0.5,
              duration: 200 + Math.random() * 250,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        )
      )
    );
    waveRef.current.start();
  };

  // ── Timer ──
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setCurrentTime(t => {
        if (t >= song.duration - 1) {
          setIsPlaying(false);
          return 0;
        }
        return t + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isPlaying, song.duration]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
          <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Album */}
      <View style={styles.albumArea}>
        <Animated.View
          style={[
            styles.ring,
            { width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2 },
            { transform: [{ rotate: spin }, { scale: albumScale }] },
          ]}
        >
          <View style={[styles.ringDot, styles.ringDotLeft]} />
          <View style={[styles.ringDot, styles.ringDotRight]} />
        </Animated.View>

        <Animated.View
          style={[
            styles.albumCircle,
            { width: ALBUM_SIZE, height: ALBUM_SIZE, borderRadius: ALBUM_SIZE / 2 },
            { transform: [{ scale: albumScale }] },
          ]}
        >
          {song.coverUri ? (
            <Image
              source={{ uri: song.coverUri }}
              style={{ width: ALBUM_SIZE, height: ALBUM_SIZE, borderRadius: ALBUM_SIZE / 2 }}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.albumPlaceholder, { width: ALBUM_SIZE, height: ALBUM_SIZE, borderRadius: ALBUM_SIZE / 2 }]}>
              <Ionicons name="musical-notes" size={52} color="#444" />
            </View>
          )}
          <View style={styles.vinylHole} />
        </Animated.View>
      </View>

      {/* Song info */}
      <View style={styles.infoArea}>
        <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
        <Text style={styles.artistName} numberOfLines={1}>{song.artist}</Text>
      </View>

      {/* Waveform */}
      <View style={styles.waveform}>
        {BAR_HEIGHTS.map((h, i) => {
          const played = i / BAR_COUNT <= progress;
          return (
            <Animated.View
              key={i}
              style={[
                styles.bar,
                {
                  height: h * 90,
                  backgroundColor: played ? '#FFFFFF' : '#3C3C3E',
                  transform: [{ scaleY: pulseAnims.current[i] }],
                },
              ]}
            />
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.timeText}>
          {formatTime(currentTime)} / {formatTime(song.duration)}
        </Text>

        {/* Outer pill wrapping all controls */}
        <View style={styles.outerPill}>
          <TouchableOpacity style={styles.skipBtn} activeOpacity={0.7} onPress={() => setCurrentTime(0)}>
            <Ionicons name="play-skip-back" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Inner pill with sliding white capsule */}
          <View style={styles.innerPill}>
            {/* Sliding white background capsule */}
            <View style={[styles.activeCapule, isPlaying ? styles.activeLeft : styles.activeRight]} />
            <TouchableOpacity style={styles.pillHalf} onPress={() => setIsPlaying(false)} activeOpacity={0.8}>
              <Ionicons name="pause" size={18} color={isPlaying ? "#1A1A1A" : "#aaa"} />
            </TouchableOpacity>
            <View style={styles.pillDivider} />
            <TouchableOpacity style={styles.pillHalf} onPress={() => setIsPlaying(true)} activeOpacity={0.8}>
              <Ionicons name="play" size={18} color={!isPlaying ? "#1A1A1A" : "#aaa"} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.skipBtn}
            activeOpacity={0.7}
            onPress={() => setCurrentTime(Math.min(song.duration - 1, currentTime + 15))}
          >
            <Ionicons name="play-skip-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A1A', alignItems: 'center' },

  topBar: {
    width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8,
  },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },

  albumArea: {
    marginTop: 12, marginBottom: 32,
    width: RING_SIZE + 10, height: RING_SIZE + 10,
    alignItems: 'center', justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    borderTopColor: 'transparent',
    borderTopWidth: 0,
  },
  ringDot: {
    position: 'absolute', width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#555', top: '50%', marginTop: -5,
  },
  ringDotLeft:  { left: -2 },
  ringDotRight: { right: -2 },
  albumCircle: {
    position: 'absolute', overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#2C2C2E',
  },
  albumPlaceholder: { backgroundColor: '#2C2C2E', alignItems: 'center', justifyContent: 'center' },
  vinylHole: {
    position: 'absolute', width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#1A1A1A', borderWidth: 1.5, borderColor: '#3A3A3C',
  },

  infoArea: { width: '100%', alignItems: 'center', paddingHorizontal: 32, marginBottom: 32 },
  songTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2, textAlign: 'center', marginBottom: 6 },
  artistName: { fontSize: 14, color: '#888', textAlign: 'center', letterSpacing: 0.2 },

  waveform: {
    flexDirection: 'row', alignItems: 'center',
    width: '100%', paddingHorizontal: 16, height: 100, gap: 3,
  },
  bar: { flex: 1, borderRadius: 3, minHeight: 5 },

  bottomBar: {
    width: '100%', borderTopWidth: 1, borderTopColor: '#FFFFFF',
    paddingTop: 14, paddingBottom: 90, alignItems: 'center', gap: 14,
  },
  timeText: { color: '#888', fontSize: 13, letterSpacing: 0.6 },

  /* Outer pill — white border, dark bg */
  outerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    paddingHorizontal: 25,
    paddingVertical: 6,
    gap: 4,
  },
  skipBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },

  /* Inner pill */
  innerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 999,
    height: 40,
    width: 100,
    position: 'relative',
  },
  pillHalf: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 1,
  },
  /* White protruding capsule — covers only the active half, taller than pill */
  activeCapule: {
    position: 'absolute',
    width: 52,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    zIndex: 0,
    top: -4,
  },
  activeLeft:  { left: -2 },
  activeRight: { right: -2 },
  pillActive:  {},
  pillDivider: { width: 1, height: 20, backgroundColor: '#555', zIndex: 1 },
});