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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, AVPlaybackStatus } from 'expo-av';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ALBUM_SIZE   = SCREEN_WIDTH * 0.52;
const RING_PADDING = 22;
const RING_SIZE    = ALBUM_SIZE + RING_PADDING * 2;
const BAR_COUNT    = 38;

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration?: number;
  coverUri?: string;
}

interface Props {
  song: Song;
  onBack: () => void;
}

function formatTime(secs: number) {
  if (isNaN(secs) || secs < 0) return '00:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Generate a static base sine wave shape for the bars so the center is naturally taller
const BAR_HEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) => {
  return Math.sin((i / BAR_COUNT) * Math.PI * 3 + Math.PI) * 0.45 + 0.55;
});

export default function SongPlayerScreen({ song, onBack }: Props) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 
  const [currentTime, setCurrentTime] = useState(0);
  const [realDuration, setRealDuration] = useState(song.duration || 0);

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const spinRef    = useRef<Animated.CompositeAnimation | null>(null);
  
  const [waveformLevels, setWaveformLevels] = useState<number[]>(
    Array(BAR_COUNT).fill(0)
  );

  const progress = realDuration > 0 ? currentTime / realDuration : 0;

  useEffect(() => {
    let soundObj: Audio.Sound | null = null;

    const loadAudio = async () => {
      try {
        setIsLoading(true);
        const token = await AsyncStorage.getItem("token");
        const streamRes = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}songs/${song.id}/stream`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!streamRes.ok) throw new Error("Failed to fetch stream URL");
        const streamData = await streamRes.json();

        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: streamData.streamUrl },
          { 
            shouldPlay: true, 
            isMeteringEnabled: true,          
            progressUpdateIntervalMillis: 100 
          },
          (status: AVPlaybackStatus) => {
            if (status.isLoaded) {
              if (isLoading) setIsLoading(false);

              setCurrentTime(status.positionMillis / 1000);
              if (status.durationMillis) {
                setRealDuration(status.durationMillis / 1000);
              }
              setIsPlaying(status.isPlaying);

              // ✅ FIXED VISUALIZER LOGIC
              if (status.isPlaying) {
  let level = 0;

  if (status.metering !== undefined) {
    const db = Math.max(-60, status.metering);
    const normalized = (db + 60) / 60;
    level = Math.pow(normalized, 1.4);
  } else {
    level = Math.random() * 0.6 + 0.2;
  }

  setWaveformLevels(prev => {
    // newest sample enters from the RIGHT, old values shift LEFT
    const next = [...prev];
    next.shift();
    next.push(level);
    return next;
  });
} else {
  setWaveformLevels(Array(BAR_COUNT).fill(0));
}
            }
          }
        );

        setSound(newSound);
        soundObj = newSound;

      } catch (error) {
        console.error("Error loading audio:", error);
        setIsLoading(false);
      }
    };

    loadAudio();

    return () => {
      if (soundObj) {
        soundObj.unloadAsync(); 
      }
    };
  }, [song.id]);

  useEffect(() => {
    if (isPlaying) {
      spinRef.current = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1, duration: 6000,
          easing: Easing.linear, useNativeDriver: true,
        })
      );
      spinRef.current.start();
    } else {
      spinRef.current?.stop();
    }
  }, [isPlaying]);

  const SIZE = RING_SIZE + 10;
  const cx   = SIZE / 2;
  const cy   = SIZE / 2;
  const r    = RING_SIZE / 2;
  const toRad = (d: number) => (d * Math.PI) / 180;

  const START_ANGLE = 160; 
  const END_ANGLE   = 20;  
  const TOTAL_DEG   = 140;  

  const startX = cx + r * Math.cos(toRad(START_ANGLE));
  const startY = cy + r * Math.sin(toRad(START_ANGLE));
  const endX   = cx + r * Math.cos(toRad(END_ANGLE));
  const endY   = cy + r * Math.sin(toRad(END_ANGLE));

  const trackPath = `M ${startX} ${startY} A ${r} ${r} 0 0 0 ${endX} ${endY}`;

  let progressPath = '';
  if (progress >= 1) {
    progressPath = trackPath;
  } else if (progress > 0) {
    const progAngle = START_ANGLE - TOTAL_DEG * progress;
    const progX = cx + r * Math.cos(toRad(progAngle));
    const progY = cy + r * Math.sin(toRad(progAngle));
    progressPath = `M ${startX} ${startY} A ${r} ${r} 0 0 0 ${progX} ${progY}`;
  }

  const spinInterpolate = rotateAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '180deg', '360deg']
  });

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
          <Path d={trackPath} stroke="#444" strokeWidth={3} fill="none" strokeLinecap="round" />
          {progress > 0 && (
            <Path d={progressPath} stroke="#FFFFFF" strokeWidth={3} fill="none" strokeLinecap="round" />
          )}
          <Circle cx={startX} cy={startY} r={6} fill="#1C1C1C" stroke={progress > 0 ? '#FFFFFF' : '#555'} strokeWidth={2.5} />
          <Circle cx={endX} cy={endY} r={6} fill="#1C1C1C" stroke={progress >= 1 ? '#FFFFFF' : '#555'} strokeWidth={2.5} />
        </Svg>

        <Animated.View style={[styles.albumCircle, { 
          width: ALBUM_SIZE, height: ALBUM_SIZE, borderRadius: ALBUM_SIZE / 2,
          transform: [{ rotate: spinInterpolate }] 
        }]}>
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

      <View style={styles.infoArea}>
        <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
        <Text style={styles.artistName} numberOfLines={1}>{song.artist}</Text>
      </View>

      <View style={styles.waveformContainer}>
        <View style={styles.waveform}>
          {BAR_HEIGHTS.map((h, i) => {
            // Base scale is 1. When loud, scale stretches up to 20x for center bars (4px -> ~80px)
            const maxScale = 1 + (h * 18);
            
            const level = waveformLevels[i] ?? 0;
            const scaleY = 1 + level * (maxScale - 1);

            return (
              <Animated.View
                key={i}
                style={[
                  styles.bar,
                  {
                    height: 4, // 👈 Locked base height to 4px
                    backgroundColor: '#FFFFFF',
                    transform: [{ scaleY }], // 👈 Scales dynamically from the center
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.bottomSection}>
        <View style={styles.dividerLine} />
        <Text style={styles.timeText}>
          {formatTime(currentTime)} / {formatTime(realDuration)}
        </Text>

        <View style={styles.outerPill}>
          <TouchableOpacity 
            style={styles.skipBtn} 
            activeOpacity={0.7} 
            onPress={() => sound?.setPositionAsync(0)}
          >
            <Text style={styles.skipText}>|{'<'}</Text>
          </TouchableOpacity>

          <View style={styles.innerPill}>
            {isLoading ? (
              <View style={styles.loadingWrapper}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            ) : (
              <>
                <TouchableOpacity style={styles.pillHalf} onPress={() => sound?.pauseAsync()} activeOpacity={0.8}>
                  <Ionicons name="pause" size={17} color={isPlaying ? '#FFFFFF' : '#888'} />
                </TouchableOpacity>
                <View style={styles.pillDivider} />
                <TouchableOpacity style={styles.pillHalf} onPress={() => sound?.playAsync()} activeOpacity={0.8}>
                  <Ionicons name="play" size={17} color={!isPlaying ? '#FFFFFF' : '#888'} />
                </TouchableOpacity>
              </>
            )}
          </View>

          <TouchableOpacity
            style={styles.skipBtn}
            activeOpacity={0.7}
            onPress={() => sound?.setPositionAsync(Math.min((realDuration * 1000) - 1000, (currentTime * 1000) + 15000))}
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
  albumPlaceholder: { backgroundColor: '#2C2C2E', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' },
  vinylHole: {
    position: 'absolute', width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#1C1C1C', borderWidth: 1.5, borderColor: '#3A3A3C',
  },
  infoArea: { width: '100%', alignItems: 'center', paddingHorizontal: 32, marginBottom: 28 },
  songTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2, textAlign: 'center', marginBottom: 6 },
  artistName: { fontSize: 14, color: '#888', textAlign: 'center', letterSpacing: 0.2 },
  waveformContainer: { width: '100%', paddingHorizontal: 14, height: 90, justifyContent: 'center' },
  waveform: { flexDirection: 'row', alignItems: 'center', height: '100%', gap: 3 },
  bar: { flex: 1, borderRadius: 3 },
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
    height: 44, width: 140, position: 'relative',
    borderWidth: 2, borderColor: '#FFFFFF',
    borderRadius: 999,
  },
  pillHalf: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%', zIndex: 1 },
  pillDivider: { width: 1, height: 18, backgroundColor: '#555', zIndex: 1 },
  loadingWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});