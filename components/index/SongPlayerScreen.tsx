import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio, AVPlaybackStatus } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  PanResponder,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import SongActionsMenu from "./SongActionsMenu";


const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";
const API_BASE = `${BACKEND_URL}`;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ALBUM_SIZE = SCREEN_WIDTH * 0.52;
const RING_PADDING = 22;
const RING_SIZE = ALBUM_SIZE + RING_PADDING * 2;
const BAR_COUNT = 38;

const SIZE = RING_SIZE + 30;
const cx = SIZE / 2;
const cy = SIZE / 2;
const r = RING_SIZE / 2;
const START_ANGLE = 160;
const END_ANGLE = 20;
const TOTAL_DEG = 140;

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration?: number;
  coverUri?: string;
  moods?: string;
}

interface Props {
  song: Song;
  onBack: () => void;
}

function formatTime(secs: number) {
  if (isNaN(secs) || secs < 0) return "00:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const BAR_HEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) => {
  return Math.sin((i / BAR_COUNT) * Math.PI * 3 + Math.PI) * 0.45 + 0.55;
});

const BAR_PHASES = Array.from(
  { length: BAR_COUNT },
  (_, i) => i * 0.37 + Math.random() * 2,
);
const BAR_SPEEDS = Array.from(
  { length: BAR_COUNT },
  (_, i) => 0.8 + (i % 5) * 0.12,
);

function makeWaveformLevels(t: number, progress: number) {
  // Multiply t by 5 to make the overall envelope pulse 5x faster
  const fastT = t * 2;

  const musicEnvelope =
    0.25 +
    0.65 * Math.pow(Math.sin(fastT * 0.7) * 0.5 + 0.5, 1.8) +
    0.15 * Math.sin(progress * Math.PI * 2);

  return Array.from({ length: BAR_COUNT }, (_, i) => {
    // Multiply the internal frequencies to make individual bars dance faster
    const base =
      0.35 * Math.sin(fastT * BAR_SPEEDS[i] + BAR_PHASES[i]) +
      0.25 * Math.sin(fastT * 1.9 + i * 0.22) +
      0.15 * Math.sin(fastT * 3.1 + i * 0.11);

    const ripple = Math.abs(base);
    const uneven = 0.18 + 0.82 * ripple;
    const level = uneven * musicEnvelope * (0.75 + BAR_HEIGHTS[i] * 0.55);

    return Math.max(0.05, Math.min(1, level));
  });
}

export default function SongPlayerScreen({ song, onBack }: Props) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [realDuration, setRealDuration] = useState(song.duration || 0);
  const [actionsVisible, setActionsVisible] = useState(false);


  const isSeeking = useRef(false);
  const seekTargetTime = useRef(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const toggleAnim = useRef(new Animated.Value(isPlaying ? 1 : 0)).current;
  const spinRef = useRef<Animated.CompositeAnimation | null>(null);

  // 1. Convert to an array of Animated.Values to skip React re-renders
  const waveformAnims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0)),
  ).current;
  // 2. Store internal JS states for math calculation
  const currentLevels = useRef(Array(BAR_COUNT).fill(0)).current;

  const progress = realDuration > 0 ? currentTime / realDuration : 0;

  useEffect(() => {
    Animated.spring(toggleAnim, {
      toValue: isPlaying ? 1 : 0,
      useNativeDriver: true,
      bounciness: 6,
      speed: 14,
    }).start();
  }, [isPlaying, toggleAnim]);

  const thumbTranslateX = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 64],
  });

  const calculateProgress = (locationX: number, locationY: number) => {
    const dx = locationX - cx;
    const dy = locationY - cy;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (angle < 0) angle += 360;

    let diff = START_ANGLE - angle;
    if (diff < 0) diff += 360;

    let p = diff / TOTAL_DEG;
    if (p > 1) p = 1;
    if (p < 0 || p > 1.4) p = 0;
    return p;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        isSeeking.current = true;
        const p = calculateProgress(
          evt.nativeEvent.locationX,
          evt.nativeEvent.locationY,
        );
        seekTargetTime.current = p * realDuration;
        setCurrentTime(seekTargetTime.current);
      },
      onPanResponderMove: (evt) => {
        const p = calculateProgress(
          evt.nativeEvent.locationX,
          evt.nativeEvent.locationY,
        );
        seekTargetTime.current = p * realDuration;
        setCurrentTime(seekTargetTime.current);
      },
      onPanResponderRelease: async () => {
        if (soundRef.current) {
          try {
            const seekPosMillis = seekTargetTime.current * 1000;
            await soundRef.current.setPositionAsync(seekPosMillis);
            await soundRef.current.playAsync();

            setCurrentTime(seekTargetTime.current);
            setIsPlaying(true);
          } catch (e) {
            console.error("Seeking failed", e);
          }
        }

        setTimeout(() => {
          isSeeking.current = false;
        }, 800);
      },
    }),
  ).current;

  useEffect(() => {
    let isMounted = true;
    let soundObj: Audio.Sound | null = null;

    const loadAudio = async () => {
      try {
        setIsLoading(true);
        const token = await AsyncStorage.getItem("token");

        const streamRes = await fetch(`${API_BASE}songs/${song.id}/stream`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!isMounted) return;

        const streamData = await streamRes.json();

        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: streamData.streamUrl },
          {
            shouldPlay: true,
            progressUpdateIntervalMillis: 100,
          },
          (status: AVPlaybackStatus) => {
            if (status.isLoaded && isMounted) {
              setIsLoading(false);
              if (!isSeeking.current) {
                setCurrentTime(status.positionMillis / 1000);
                if (status.durationMillis)
                  setRealDuration(status.durationMillis / 1000);
                setIsPlaying(status.isPlaying);
              }
            }
          },
        );

        if (!isMounted) {
          newSound.unloadAsync();
          return;
        }

        setSound(newSound);
        soundRef.current = newSound;
        soundObj = newSound;
      } catch (error) {
        if (isMounted) {
          console.error("Audio Load Error:", error);
          setIsLoading(false);
        }
      }
    };

    loadAudio();

    return () => {
      isMounted = false;
      if (soundObj) {
        soundObj.unloadAsync();
      }
    };
  }, [song.id]);

  useEffect(() => {
    if (isPlaying) {
      spinRef.current = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 6000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      spinRef.current.start();
    } else {
      spinRef.current?.stop();
    }
  }, [isPlaying]);

  // 3. Utilize requestAnimationFrame instead of setInterval
  useEffect(() => {
    let reqId: number;

    const tick = () => {
      const t = Date.now() / 1000;
      const targetLevels = makeWaveformLevels(t, progress);

      for (let i = 0; i < BAR_COUNT; i++) {
        // CHANGED: 0.4 old value + 0.6 new value makes it snap to the new position much faster
        currentLevels[i] = currentLevels[i] * 0.4 + targetLevels[i] * 0.6;

        waveformAnims[i].setValue(currentLevels[i]);
      }

      reqId = requestAnimationFrame(tick);
    };

    if (isPlaying && !isLoading) {
      reqId = requestAnimationFrame(tick);
    } else {
      // Smooth decay when music pauses
      const decay = () => {
        let stillActive = false;
        for (let i = 0; i < BAR_COUNT; i++) {
          currentLevels[i] *= 0.85; // drop scale by 15% each frame
          if (currentLevels[i] > 0.01) stillActive = true;
          waveformAnims[i].setValue(currentLevels[i]);
        }
        if (stillActive) {
          reqId = requestAnimationFrame(decay);
        }
      };
      reqId = requestAnimationFrame(decay);
    }

    return () => {
      if (reqId) cancelAnimationFrame(reqId);
    };
  }, [isPlaying, isLoading, progress]);

  const toRad = (d: number) => (d * Math.PI) / 180;
  const startX = cx + r * Math.cos(toRad(START_ANGLE));
  const startY = cy + r * Math.sin(toRad(START_ANGLE));
  const endX = cx + r * Math.cos(toRad(END_ANGLE));
  const endY = cy + r * Math.sin(toRad(END_ANGLE));
  const trackPath = `M ${startX} ${startY} A ${r} ${r} 0 0 0 ${endX} ${endY}`;

  const currentAngle = START_ANGLE - TOTAL_DEG * progress;
  const knobX = cx + r * Math.cos(toRad(currentAngle));
  const knobY = cy + r * Math.sin(toRad(currentAngle));
  const progressPath = `M ${startX} ${startY} A ${r} ${r} 0 0 0 ${knobX} ${knobY}`;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1C" />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setActionsVisible(true)}>
  <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
</TouchableOpacity>

      </View>

      <View
        style={[
          styles.albumArea,
          {
            width: SIZE,
            height: SIZE,
            paddingBottom: 10,
            transform: [{ translateY: 10 }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Svg width={SIZE} height={SIZE} style={{ position: "absolute" }}>
          <Path
            d={trackPath}
            stroke="#444"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d={progressPath}
            stroke="#FFFFFF"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
          <Circle
            cx={startX}
            cy={startY}
            r={6}
            fill="#1C1C1C"
            stroke="#FFFFFF"
            strokeWidth={2.5}
          />
          <Circle
            cx={endX}
            cy={endY}
            r={6}
            fill="#1C1C1C"
            stroke={progress >= 0.99 ? "#FFFFFF" : "#555"}
            strokeWidth={2.5}
          />
          <Circle cx={knobX} cy={knobY} r={8} fill="#FFFFFF" />
        </Svg>

        <Animated.View
          style={[
            styles.albumCircle,
            {
              width: ALBUM_SIZE,
              height: ALBUM_SIZE,
              borderRadius: ALBUM_SIZE / 2,
              transform: [
                {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
              ],
            },
          ]}
        >
          {song.coverUri ? (
            <Image
              source={{ uri: song.coverUri }}
              style={{
                width: ALBUM_SIZE,
                height: ALBUM_SIZE,
                borderRadius: ALBUM_SIZE / 2,
              }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.albumPlaceholder,
                {
                  width: ALBUM_SIZE,
                  height: ALBUM_SIZE,
                  borderRadius: ALBUM_SIZE / 2,
                },
              ]}
            >
              <Ionicons name="musical-notes" size={52} color="#444" />
            </View>
          )}
          <View style={styles.vinylHole} />
        </Animated.View>
      </View>

      <View style={styles.infoArea}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={styles.artistName} numberOfLines={1}>
          {song.artist}
        </Text>
      </View>

      <View style={styles.waveformContainer}>
        <View style={styles.waveform}>
          {BAR_HEIGHTS.map((h, i) => (
            <Animated.View
              key={i}
              style={[
                styles.bar,
                {
                  height: 4,
                  backgroundColor: "#FFFFFF",
                  transform: [
                    {
                      // 4. Hook the Animated Value directly into the style
                      scaleY: waveformAnims[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1 + h * 18],
                      }),
                    },
                  ],
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
          {formatTime(currentTime)} / {formatTime(realDuration)}
        </Text>
        <View style={styles.outerPill}>
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() =>
              sound?.setPositionAsync(Math.max(0, currentTime * 1000 - 15000))
            }
          >
            <Feather name="chevrons-left" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.innerPill}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <View style={styles.pillDivider} />
                <Animated.View
                  style={[
                    styles.thumb,
                    { transform: [{ translateX: thumbTranslateX }] },
                  ]}
                />
                <TouchableOpacity
                  style={styles.pillHalf}
                  onPress={() => sound?.pauseAsync()}
                >
                  <Ionicons
                    name="pause"
                    size={20}
                    color={!isPlaying ? "#1C1C1C" : "#888"}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.pillHalf}
                  onPress={() => sound?.playAsync()}
                >
                  <Ionicons
                    name="play"
                    size={20}
                    color={isPlaying ? "#1C1C1C" : "#888"}
                  />
                </TouchableOpacity>
              </>
            )}
          </View>

          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() =>
              sound?.setPositionAsync(
                Math.min(
                  realDuration * 1000,
                  currentTime * 1000 + 15000,
                ),
              )
            }
          >
            <Feather name="chevrons-right" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      <SongActionsMenu
  visible={actionsVisible}
  song={song}
  onClose={() => setActionsVisible(false)}
/>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1C1C1C", alignItems: "center" },
  topBar: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  albumArea: {
    marginTop: 16,
    marginBottom: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  albumCircle: {
    position: "absolute",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2C2C2E",
  },
  albumPlaceholder: {
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  vinylHole: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1C1C1C",
    borderWidth: 1.5,
    borderColor: "#3A3A3C",
  },
  infoArea: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 32,
    marginBottom: 28,
  },
  songTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  artistName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#A0A0A0",
    textAlign: "center",
  },
  waveformContainer: {
    width: "100%",
    paddingHorizontal: 14,
    height: 90,
    justifyContent: "center",
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
    gap: 3,
  },
  bar: { flex: 1, borderRadius: 3 },
  bottomSection: { width: "100%", alignItems: "center", paddingBottom: 24 },
  dividerLine: {
    width: "100%",
    height: 1,
    backgroundColor: "#FFFFFF",
    marginBottom: 24,
  },
  timeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  outerPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 6,
    gap: 16,
  },
  skipBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  innerPill: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    width: 140,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 4,
    position: "relative",
  },
  pillDivider: {
    position: "absolute",
    left: "50%",
    top: 14,
    bottom: 14,
    width: 1.5,
    backgroundColor: "#555",
    transform: [{ translateX: -0.75 }],
  },
  thumb: {
    position: "absolute",
    left: 4,
    top: 4,
    bottom: 4,
    width: 64,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
  },
  pillHalf: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    zIndex: 2,
  },
});
