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
import Svg, { Circle, Path } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ALBUM_SIZE   = SCREEN_WIDTH * 0.52;
const RING_PADDING = 22;
const RING_SIZE    = ALBUM_SIZE + RING_PADDING * 2;
const BAR_COUNT    = 38;

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
  const wave = Math.sin((i / BAR_COUNT) * Math.PI * 3) * 0.45 + 0.55;
  const rand = Math.random() * 0.35;
  return Math.max(0.12, Math.min(1, wave * 0.6 + rand * 0.4));
});

export default function SongPlayerScreen({ song, onBack }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const spinRef    = useRef<Animated.CompositeAnimation | null>(null);
  const waveRef    = useRef<Animated.CompositeAnimation | null>(null);
  const pulseAnims = useRef<Animated.Value[]>(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(1))
  );

  const progress = song.duration > 0 ? currentTime / song.duration : 0;

  useEffect(() => {
    if (isPlaying) {
      spinRef.current = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1, duration: 6000,
          easing: Easing.linear, useNativeDriver: true,
        })
      );
      spinRef.current.start();
      startWave();
    } else {
      spinRef.current?.stop();
      spinRef.current = null;
      waveRef.current?.stop();
      waveRef.current = null;
      pulseAnims.current.forEach(a => a.setValue(1));
    }
    return () => { spinRef.current?.stop(); waveRef.current?.stop(); };
  }, [isPlaying]);

  const startWave = () => {
    waveRef.current = Animated.loop(
      Animated.parallel(
        pulseAnims.current.map(anim =>
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 0.15 + Math.random() * 0.85,
              duration: 180 + Math.random() * 220,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.4 + Math.random() * 0.6,
              duration: 180 + Math.random() * 220,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        )
      )
    );
    waveRef.current.start();
  };

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setCurrentTime(t => {
        if (t >= song.duration - 1) { setIsPlaying(false); return 0; }
        return t + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isPlaying, song.duration]);

  // ── Arc geometry ──────────────────────────────────────────────
  const SIZE = RING_SIZE + 10;
  const cx   = SIZE / 2;
  const cy   = SIZE / 2;
  const r    = RING_SIZE / 2;
  const toRad = (d: number) => (d * Math.PI) / 180;

  // SVG angles: 0°=right, 90°=BOTTOM, 180°=left, 270°=top
  // Bottom-left dot ≈ 120° (7 o'clock), Bottom-right dot ≈ 60° (5 o'clock)
  // Short arc from 120° → 90° (very bottom) → 60° = counter-clockwise, 60° span
  const START_ANGLE = 160; // bottom-left
  const END_ANGLE   = 20;  // bottom-right
  const TOTAL_DEG   = 140;  // counter-clockwise span through 90° (bottom)

  const startX = cx + r * Math.cos(toRad(START_ANGLE));
  const startY = cy + r * Math.sin(toRad(START_ANGLE));
  const endX   = cx + r * Math.cos(toRad(END_ANGLE));
  const endY   = cy + r * Math.sin(toRad(END_ANGLE));

  // Grey track: short arc counter-clockwise through the very bottom
  const trackPath = `M ${startX} ${startY} A ${r} ${r} 0 0 0 ${endX} ${endY}`;

  // Progress sweeps counter-clockwise from 120° toward 60°
  let progressPath = '';
  if (progress >= 1) {
    progressPath = trackPath;
  } else if (progress > 0) {
    const progAngle = START_ANGLE - TOTAL_DEG * progress;
    const progX = cx + r * Math.cos(toRad(progAngle));
    const progY = cy + r * Math.sin(toRad(progAngle));
    progressPath = `M ${startX} ${startY} A ${r} ${r} 0 0 0 ${progX} ${progY}`;
  }
  // ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1C" />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
          <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.albumArea, { width: SIZE, height: SIZE }]}>
        <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
          {/* Grey track arc — bottom */}
          <Path d={trackPath} stroke="#444" strokeWidth={3} fill="none" strokeLinecap="round" />
          {/* White progress arc */}
          {progress > 0 && (
            <Path d={progressPath} stroke="#FFFFFF" strokeWidth={3} fill="none" strokeLinecap="round" />
          )}
          {/* Start dot — hollow white ring */}
          <Circle cx={startX} cy={startY} r={6} fill="#1C1C1C" stroke={progress > 0 ? '#FFFFFF' : '#555'} strokeWidth={2.5} />
          {/* End dot — hollow white ring */}
          <Circle cx={endX} cy={endY} r={6} fill="#1C1C1C" stroke={progress >= 1 ? '#FFFFFF' : '#555'} strokeWidth={2.5} />
        </Svg>

        <View style={[styles.albumCircle, { width: ALBUM_SIZE, height: ALBUM_SIZE, borderRadius: ALBUM_SIZE / 2 }]}>
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
        </View>
      </View>

      <View style={styles.infoArea}>
        <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
        <Text style={styles.artistName} numberOfLines={1}>{song.artist}</Text>
      </View>

      <View style={styles.waveformContainer}>
        <View style={styles.waveform}>
          {BAR_HEIGHTS.map((h, i) => (
            <Animated.View
              key={i}
              style={[
                styles.bar,
                {
                  height: h * 80,
                  backgroundColor: '#FFFFFF',
                  transform: [{ scaleY: pulseAnims.current[i] }],
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.bottomSection}>
        <View style={styles.dividerLine} />
        <Text style={styles.timeText}>
          {formatTime(currentTime)} / {formatTime(song.duration)}
        </Text>

        <View style={styles.outerPill}>
          <TouchableOpacity style={styles.skipBtn} activeOpacity={0.7} onPress={() => setCurrentTime(0)}>
            <Text style={styles.skipText}>|{'<'}</Text>
          </TouchableOpacity>

          <View style={styles.innerPill}>
            <TouchableOpacity style={styles.pillHalf} onPress={() => setIsPlaying(false)} activeOpacity={0.8}>
              <Ionicons name="pause" size={17} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.pillDivider} />
            <TouchableOpacity style={styles.pillHalf} onPress={() => setIsPlaying(true)} activeOpacity={0.8}>
              <Ionicons name="play" size={17} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.skipBtn}
            activeOpacity={0.7}
            onPress={() => setCurrentTime(Math.min(song.duration - 1, currentTime + 15))}
          >
            <Text style={styles.skipText}>{'>'}|</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1C1C', alignItems: 'center' },
  topBar: {
    width: '100%', flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8,
  },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  albumArea: { marginTop: 16, marginBottom: 28, alignItems: 'center', justifyContent: 'center' },
  albumCircle: {
    position: 'absolute', overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#2C2C2E',
  },
  albumPlaceholder: { backgroundColor: '#2C2C2E', alignItems: 'center', justifyContent: 'center' },
  vinylHole: {
    position: 'absolute', width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#1C1C1C', borderWidth: 1.5, borderColor: '#3A3A3C',
  },
  infoArea: { width: '100%', alignItems: 'center', paddingHorizontal: 32, marginBottom: 28 },
  songTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2, textAlign: 'center', marginBottom: 6 },
  artistName: { fontSize: 14, color: '#888', textAlign: 'center', letterSpacing: 0.2 },
  waveformContainer: { width: '100%', paddingHorizontal: 14, height: 90, justifyContent: 'center' },
  waveform: { flexDirection: 'row', alignItems: 'center', height: '100%', gap: 3 },
  bar: { flex: 1, borderRadius: 3, minHeight: 4 },
  bottomSection: { width: '100%', alignItems: 'center', paddingBottom: 24 },
  dividerLine: { width: '100%', height: 1, backgroundColor: '#FFFFFF', marginBottom: 24 },
  timeText: { color: '#888', fontSize: 12, letterSpacing: 0.6, marginBottom: 6 },
  outerPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent',
    paddingHorizontal: 18, paddingVertical: 6, gap: 16,
  },
  skipBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  skipText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  innerPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent',
    height: 44, width: 140, position: 'relative',
    borderWidth: 2, borderColor: '#FFFFFF',
    borderRadius: 999,
  },
  pillHalf: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%', zIndex: 1 },
  pillDivider: { width: 1, height: 18, backgroundColor: '#555', zIndex: 1 },
});