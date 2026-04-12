import { Feather, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import React, {
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  Circle,
  G,
  Line,
  Polygon,
  Text as SvgText,
} from "react-native-svg";
import { useAppTheme } from "@/components/context/ThemeContext";
import { useSongPlayer } from "@/components/index/SongPlayerContext";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────
type SuggestedSong = {
  songId: string;
  score: number;
  metadata: { title: string; artist: string; description: string; moods: string };
};
type MoodScores = Record<string, number>;

// ─── Constants ────────────────────────────────────────────────────────────────
const MOODS = ["love", "calm", "euphoric", "upbeat", "angry", "anxious", "grief"] as const;
const MOOD_COLORS: Record<string, string> = {
  love: "#FF6B9D", calm: "#74C7EC", euphoric: "#FFDD6B",
  upbeat: "#6BFFB8", angry: "#FF6B6B", anxious: "#C97FFF", grief: "#9E9E9E",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getAlbumArtUrl = (songId: string, index: number, size = 80) => {
  const numericId = songId.replace(/\D/g, "") || String(index);
  const seed = (parseInt(numericId, 10) % 200) + 50;
  return `https://picsum.photos/seed/${seed}/${size}/${size}`;
};

// ─── Radar Chart ─────────────────────────────────────────────────────────────
const RADAR_SIZE = Math.min(SCREEN_W - 48, 290);
const RC = RADAR_SIZE / 2;
const MAX_R = RADAR_SIZE * 0.33;

function polar(angle: number, radius: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: RC + radius * Math.cos(rad), y: RC + radius * Math.sin(rad) };
}

const MoodRadarChart = ({ scores, accentColor }: { scores: MoodScores; accentColor: string }) => {
  const step = 360 / MOODS.length;
  const grids = [1, 2, 3, 4].map(lvl =>
    MOODS.map((_, i) => { const p = polar(i * step, (MAX_R * lvl) / 4); return `${p.x},${p.y}`; }).join(" ")
  );
  const data = MOODS.map((m, i) => {
    const p = polar(i * step, (scores[m] ?? 0) * MAX_R);
    return `${p.x},${p.y}`;
  }).join(" ");

  return (
    <View style={radarStyles.wrap}>
      <Text style={radarStyles.heading}>Mood Analysis</Text>
      <Svg width={RADAR_SIZE} height={RADAR_SIZE}>
        {grids.map((pts, i) => (
          <Polygon key={i} points={pts} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
        ))}
        {MOODS.map((_, i) => {
          const o = polar(i * step, MAX_R);
          return <Line key={i} x1={RC} y1={RC} x2={o.x} y2={o.y} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />;
        })}
        <Polygon points={data} fill={accentColor} fillOpacity={0.25} stroke={accentColor} strokeWidth={2} strokeOpacity={0.9} />
        {MOODS.map((m, i) => {
          const p = polar(i * step, (scores[m] ?? 0) * MAX_R);
          return <Circle key={i} cx={p.x} cy={p.y} r={4} fill={MOOD_COLORS[m]} stroke="#fff" strokeWidth={1.5} />;
        })}
        {MOODS.map((m, i) => {
          const p = polar(i * step, MAX_R + 34);
          const pct = Math.round((scores[m] ?? 0) * 100);
          return (
            <G key={i}>
              <SvgText x={p.x} y={p.y - 4} textAnchor="middle" fontSize={12} fill="rgba(255,255,255,0.85)" fontWeight="800">
                {m.toUpperCase()}
              </SvgText>
              <SvgText x={p.x} y={p.y + 12} textAnchor="middle" fontSize={11} fill={MOOD_COLORS[m]} fontWeight="700">
                {pct}%
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

const radarStyles = StyleSheet.create({
  wrap: {
    alignItems: "center", marginBottom: 8, backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20, paddingVertical: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
  },
  heading: {
    color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: "700",
    letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10,
  },
});

// ─── Song Card ────────────────────────────────────────────────────────────────
const SongCard = ({
  song, index, onPress, accentColor, isActive,
}: {
  song: SuggestedSong; index: number; onPress: () => void;
  accentColor: string; isActive: boolean;
}) => {
  const slideAnim = useRef(new Animated.Value(24)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 380, delay: index * 70, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 380, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: fadeAnim }}>
      <Pressable
        style={[cardStyles.row, isActive && { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14 }]}
        onPress={onPress}
      >
        <View style={cardStyles.artWrap}>
          <Image source={{ uri: getAlbumArtUrl(song.songId, index) }} style={cardStyles.art} resizeMode="cover" />
          {isActive && (
            <View style={[cardStyles.overlay, { backgroundColor: accentColor + "cc" }]}>
              <Ionicons name="volume-high" size={18} color="#000" />
            </View>
          )}
        </View>
        <View style={cardStyles.info}>
          <Text style={[cardStyles.title, isActive && { color: accentColor }]} numberOfLines={1}>{song.metadata.title}</Text>
          <Text style={cardStyles.artist} numberOfLines={1}>{song.metadata.artist}</Text>
        </View>
        <View style={[cardStyles.badge, { borderColor: accentColor + "55" }]}>
          <Text style={[cardStyles.badgePct, { color: accentColor }]}>{(song.score * 100).toFixed(0)}%</Text>
          <Text style={cardStyles.badgeLbl}>match</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const cardStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  artWrap: { width: 56, height: 56, marginRight: 12 },
  art: { width: 56, height: 56, borderRadius: 12, backgroundColor: "#2a2a2a" },
  overlay: { position: "absolute", inset: 0, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  info: { flex: 1, marginRight: 8 },
  title: { color: "#e8e8e8", fontSize: 14, fontWeight: "600" },
  artist: { color: "#777", fontSize: 12, marginTop: 3 },
  badge: { alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, backgroundColor: "rgba(255,255,255,0.04)", minWidth: 52 },
  badgePct: { fontSize: 14, fontWeight: "800" },
  badgeLbl: { color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MoodResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentMood } = useAppTheme();
  const { openSong, activeSong } = useSongPlayer();

  const moodText      = params.moodText as string;
  const songsRaw      = params.songs as string;
  const moodScoresRaw = params.moodScores as string;

  const suggestions: SuggestedSong[] = useMemo(() => {
    try { return songsRaw ? JSON.parse(songsRaw) : []; } catch { return []; }
  }, [songsRaw]);

  const moodScores: MoodScores = useMemo(() => {
    try { return moodScoresRaw ? JSON.parse(moodScoresRaw) : {}; } catch { return {}; }
  }, [moodScoresRaw]);

  const accentColor = currentMood?.colors?.[1] ?? "#A78BFA";

  const handleSongPress = (song: SuggestedSong, index: number) => {
    openSong({
      id: song.songId,
      title: song.metadata.title,
      artist: song.metadata.artist,
      coverUri: getAlbumArtUrl(song.songId, index, 400),
      moods: song.metadata.moods,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          We found your{"\n"}
          <Text style={{ color: accentColor }}>Sound.</Text>
        </Text>
        <Text style={styles.subtitle}>"{moodText}"</Text>

        {Object.keys(moodScores).length > 0 && (
          <MoodRadarChart scores={moodScores} accentColor={accentColor} />
        )}

        <View style={styles.songsSection}>
          <Text style={styles.sectionTitle}>Suggested For You</Text>
          {suggestions.map((song, idx) => (
            <SongCard
              key={song.songId}
              song={song}
              index={idx}
              onPress={() => handleSongPress(song, idx)}
              accentColor={accentColor}
              isActive={activeSong?.id === song.songId}
            />
          ))}
          <View style={{ height: 20 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: "#151515" },
  header:        { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  backBtn:       { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  title:         { fontSize: 30, fontWeight: "800", color: "#fff", marginTop: 10, marginBottom: 6 },
  subtitle:      { color: "#666", fontSize: 14, fontStyle: "italic", marginBottom: 20 },
  songsSection:  { marginTop: 20 },
  sectionTitle:  { fontSize: 20, color: "#fff", fontWeight: "800", marginBottom: 10 },
});
