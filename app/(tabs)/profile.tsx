// profile.tsx
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { useSongPlayer } from "@/components/index/SongPlayerContext";

type Mood = { label: string; count: number; angleDeg: number };

const MOODS: Mood[] = [
  { label: "Love", count: 17, angleDeg: 315 },
  { label: "Upbeat", count: 13, angleDeg: 0 },
  { label: "Grief", count: 3, angleDeg: 45 },
  { label: "Calm", count: 15, angleDeg: 90 },
  { label: "Anxious", count: 16, angleDeg: 135 },
  { label: "Anger", count: 3, angleDeg: 180 },
  { label: "Euphoric", count: 13, angleDeg: 225 },
  { label: "Sad", count: 15, angleDeg: 270 },
];

const TOP_SONGS = [
  { id: "1", title: "Saath Nibhana Saathiya", artist: "Falguni Pathak", duration: 240 },
  { id: "2", title: "Tere Bin Nahi Lagda", artist: "Nusrat Fateh Ali Khan", duration: 300 },
  { id: "3", title: "Kun Faya Kun", artist: "A.R. Rahman", duration: 360 },
];

const rad = (d: number) => (d * Math.PI) / 180;
const pt = (cx: number, cy: number, r: number, a: number) => ({
  x: cx + Math.cos(a) * r,
  y: cy + Math.sin(a) * r,
});

export default function MusicProfile() {
  const [ready, setReady] = useState(false);
  const { openSong } = useSongPlayer();

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 160);
    return () => clearTimeout(t);
  }, []);

  const SCREEN_W = Math.min(Dimensions.get("window").width, 420);
  const NAV_HEIGHT = 80;
  const TOP_PADDING = 36;
  const SVG_SIZE = Math.min(360, SCREEN_W - 36);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: TOP_PADDING,
          paddingBottom: NAV_HEIGHT + 28,
          alignItems: "center",
          width: "100%",
        }}
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.avatarOuter}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarEmoji}>🎩</Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <Pressable style={styles.iconBtn}>
              <View style={styles.iconStub}>
                <AntDesign name="edit" size={24} color="white" />
              </View>
            </Pressable>
            <Pressable style={styles.iconBtn}>
              <View style={styles.iconStub}>
                <FontAwesome name="gear" size={24} color="white" />
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.profileTextBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>Sravan</Text>
            <Text style={styles.handle}>(~savvu)</Text>
          </View>
          <View style={styles.bioRow}>
            <Text style={styles.bio}>
              Playing with my piano{"\n"}
              since 3AM
            </Text>
            <Pressable style={styles.friendsBtn}>
              <Text style={styles.friendsBtnText}>0 Friends</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={{ marginTop: 8, marginBottom: 6 }}>
          <MoodWheel size={SVG_SIZE} ready={ready} />
        </View>

        <View style={{ alignItems: "center", marginTop: 8 }}>
          <Text style={styles.counterNum}>67</Text>
          <Text style={styles.counterLabel}>Songs this week</Text>
        </View>

        <View style={styles.songsSection}>
          <Text style={styles.sectionTitle}>Your Top Songs</Text>
          <View style={{ height: 12 }} />
          {TOP_SONGS.map((song) => (
            <SongRow
              key={song.id}
              title={song.title}
              subtitle={song.artist}
              onPress={() => openSong(song)}
            />
          ))}
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MoodWheel({ size = 320, ready = true }: { size?: number; ready?: boolean }) {
  const S = size;
  const CX = S / 2;
  const CY = S / 2;
  const RO = S * 0.45;
  const RI = RO * 1;
  const P_MIN = RI * 0.35;
  const P_INNER = S * 0.035;
  const HALF = 21.5;
  const CR = Math.max(6, S * 0.02);

  function petalPath(angleDeg: number, pOuter: number) {
    const aL = rad(angleDeg - HALF);
    const aR = rad(angleDeg + HALF);
    const OL = pt(CX, CY, pOuter, aL);
    const OR = pt(CX, CY, pOuter, aR);
    const dOuter = CR / pOuter;
    const OL_arc = pt(CX, CY, pOuter, aL + dOuter);
    const OR_arc = pt(CX, CY, pOuter, aR - dOuter);
    const IL = pt(CX, CY, P_INNER, aL);
    const IR = pt(CX, CY, P_INNER, aR);
    const dInner = CR / P_INNER;
    const IL_arc = pt(CX, CY, P_INNER, aL + dInner);
    const IR_arc = pt(CX, CY, P_INNER, aR - dInner);
    const lLen = Math.hypot(IL.x - OL.x, IL.y - OL.y) || 1;
    const rLen = Math.hypot(IR.x - OR.x, IR.y - OR.y) || 1;
    const OL_s = { x: OL.x + ((IL.x - OL.x) / lLen) * CR, y: OL.y + ((IL.y - OL.y) / lLen) * CR };
    const OR_s = { x: OR.x + ((IR.x - OR.x) / rLen) * CR, y: OR.y + ((IR.y - OR.y) / rLen) * CR };
    const IL_s = { x: IL.x + ((OL.x - IL.x) / lLen) * CR, y: IL.y + ((OL.y - IL.y) / lLen) * CR };
    const IR_s = { x: IR.x + ((OR.x - IR.x) / rLen) * CR, y: IR.y + ((OR.y - IR.y) / rLen) * CR };
    return [
      `M ${OL_arc.x} ${OL_arc.y}`,
      `A ${pOuter} ${pOuter} 0 0 1 ${OR_arc.x} ${OR_arc.y}`,
      `Q ${OR.x} ${OR.y} ${OR_s.x} ${OR_s.y}`,
      `L ${IR_s.x} ${IR_s.y}`,
      `Q ${IR.x} ${IR.y} ${IR_arc.x} ${IR_arc.y}`,
      `A ${P_INNER} ${P_INNER} 0 0 0 ${IL_arc.x} ${IL_arc.y}`,
      `Q ${IL.x} ${IL.y} ${IL_s.x} ${IL_s.y}`,
      `L ${OL_s.x} ${OL_s.y}`,
      `Q ${OL.x} ${OL.y} ${OL_arc.x} ${OL_arc.y}`,
      "Z",
    ].join(" ");
  }

  function ringPath(angleDeg: number, rInner: number) {
    const gap = 1.5;
    const a1 = rad(angleDeg - 22.5 + gap);
    const a2 = rad(angleDeg + 22.5 - gap);
    const RCR = Math.max(6, S * 0.017);
    const dRO = RCR / RO;
    const dRI = Math.min(RCR / rInner, rad(19 - gap) * 0.4);
    const o1 = pt(CX, CY, RO, a1), o2 = pt(CX, CY, RO, a2);
    const i1 = pt(CX, CY, rInner, a1), i2 = pt(CX, CY, rInner, a2);
    const o1a = pt(CX, CY, RO, a1 + dRO), o2a = pt(CX, CY, RO, a2 - dRO);
    const i1a = pt(CX, CY, rInner, a1 + dRI), i2a = pt(CX, CY, rInner, a2 - dRI);
    const lLen = Math.hypot(i1.x - o1.x, i1.y - o1.y) || 1;
    const rLen = Math.hypot(i2.x - o2.x, i2.y - o2.y) || 1;
    const o1s = { x: o1.x + ((i1.x - o1.x) / lLen) * RCR, y: o1.y + ((i1.y - o1.y) / lLen) * RCR };
    const o2s = { x: o2.x + ((i2.x - o2.x) / rLen) * RCR, y: o2.y + ((i2.y - o2.y) / rLen) * RCR };
    const i1s = { x: i1.x - ((i1.x - o1.x) / lLen) * RCR, y: i1.y - ((i1.y - o1.y) / lLen) * RCR };
    const i2s = { x: i2.x - ((i2.x - o2.x) / rLen) * RCR, y: i2.y - ((i2.y - o2.y) / rLen) * RCR };
    return [
      `M ${o1a.x} ${o1a.y}`,
      `A ${RO} ${RO} 0 0 1 ${o2a.x} ${o2a.y}`,
      `Q ${o2.x} ${o2.y} ${o2s.x} ${o2s.y}`,
      `L ${i2s.x} ${i2s.y}`,
      `Q ${i2.x} ${i2.y} ${i2a.x} ${i2a.y}`,
      `A ${rInner} ${rInner} 0 0 0 ${i1a.x} ${i1a.y}`,
      `Q ${i1.x} ${i1.y} ${i1s.x} ${i1s.y}`,
      `L ${o1s.x} ${o1s.y}`,
      `Q ${o1.x} ${o1.y} ${o1a.x} ${o1a.y}`,
      "Z",
    ].join(" ");
  }

  const maxCount = Math.max(...MOODS.map((m) => m.count));
  function pOuterFromCount(count: number) {
    const t = count / maxCount;
    return P_MIN + t * (RI - P_MIN);
  }

  return (
    <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
      <Circle cx={CX} cy={CY} r={RO} />
      {MOODS.map((m, i) => {
        const pOuter = pOuterFromCount(m.count);
        return (
          <Path key={`ring-${i}`} d={ringPath(m.angleDeg, pOuter)} fill="#3f3f3f" opacity={0.95} strokeWidth={Math.max(1, S * 0.004)} />
        );
      })}
      <Circle cx={CX} cy={CY} r={P_MIN} fill="#111" />
      {MOODS.map((m, i) => {
        const pOuter = pOuterFromCount(m.count);
        const gid = `g${i}`;
        const angleR = rad(m.angleDeg);
        const g1 = pt(CX, CY, pOuter, angleR);
        const g2 = pt(CX, CY, P_INNER, angleR);
        const LABEL_R = RO * 0.7;
        const labelP = pt(CX, CY, LABEL_R, angleR);
        return (
          <G key={`petal-${i}`} opacity={ready ? 1 : 0}>
            <Defs>
              <LinearGradient id={gid} x1={g1.x} y1={g1.y} x2={g2.x} y2={g2.y} gradientUnits="userSpaceOnUse">
                <Stop offset="0%" stopColor="#fff" stopOpacity="1" />
                <Stop offset="45%" stopColor="#edd9ff" stopOpacity="1" />
                <Stop offset="78%" stopColor="#c084fc" stopOpacity="1" />
                <Stop offset="100%" stopColor="#9333ea" stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Path d={petalPath(m.angleDeg, pOuter)} fill="rgba(0,0,0,0.45)" opacity={0.22} transform={`translate(${S * 0.006}, ${S * 0.006})`} />
            <Path d={petalPath(m.angleDeg, pOuter)} fill={`url(#${gid})`} stroke="#00000055" strokeWidth={Math.max(0.8, S * 0.003)} />
            <SvgText x={labelP.x} y={labelP.y - 8} fontSize={Math.max(14, S * 0.05)} fontWeight="700" fill="#111" textAnchor="middle">
              {String(m.count)}
            </SvgText>
            <SvgText x={labelP.x} y={labelP.y + 12} fontSize={Math.max(11, S * 0.035)} fill="#111" textAnchor="middle">
              {m.label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

function SongRow({ title, subtitle, onPress }: { title: string; subtitle?: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.songRow} onPress={onPress}>
      <View style={styles.albumCircle}>
        <Text>🎵</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.songTitle}>{title}</Text>
        {subtitle ? <Text style={styles.songSubtitle}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { width: "92%", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 20 },
  avatarOuter: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: "#fff", justifyContent: "center", alignItems: "center" },
  avatarInner: { width: 96, height: 96, borderRadius: 48, overflow: "hidden", justifyContent: "center", alignItems: "center", backgroundColor: "#333" },
  avatarEmoji: { fontSize: 40 },
  headerIcons: { flexDirection: "row", gap: 16, marginTop: 10 },
  profileTextBlock: { width: "92%", marginTop: 12 },
  nameRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  name: { fontSize: 32, fontWeight: "800", color: "#fff" },
  handle: { color: "#aaa", fontSize: 16 },
  bioRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  bio: { color: "#ccc", fontSize: 15 },
  friendsBtn: { backgroundColor: "#fff", paddingHorizontal: 18, paddingVertical: 8, borderRadius: 24 },
  friendsBtnText: { color: "#111", fontWeight: "600" },
  safe: { flex: 1, backgroundColor: "#151515" },
  container: { flex: 1 },
  headerContainer: { width: "92%", flexDirection: "row", alignItems: "flex-start", gap: 12 },
  avatarArea: { width: 120, alignItems: "center" },
  avatarBorderOuter: { width: 112, height: 112, borderRadius: 56, borderWidth: 4, borderColor: "#fff", alignItems: "center", justifyContent: "center", backgroundColor: "#2b2b2b" },
  avatarBorderInner: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: "#111", alignItems: "center", justifyContent: "center", overflow: "hidden", backgroundColor: "#2f2f2f" },
  infoArea: { flex: 1, paddingRight: 8 },
  actionsArea: { width: 56, alignItems: "center", justifyContent: "flex-start", gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "transparent", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  iconStub: { borderRadius: 3 },
  divider: { width: "92%", height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginTop: 18, marginBottom: 6 },
  counterNum: { color: "#fff", fontSize: 32, fontWeight: "800" },
  counterLabel: { color: "#d1d1d1", marginTop: 6 },
  songsSection: { width: "92%", marginTop: 18 },
  sectionTitle: { fontSize: 24, color: "#fff", fontWeight: "800" },
  songRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  albumCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#2a2a2a", alignItems: "center", justifyContent: "center", marginRight: 12, borderWidth: 2, borderColor: "rgba(255,255,255,0.06)" },
  songTitle: { color: "#e2e2e2", fontSize: 15, fontWeight: "600" },
  songSubtitle: { color: "#9a9a9a", fontSize: 12, marginTop: 4 },
});