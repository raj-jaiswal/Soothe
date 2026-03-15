import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView
} from "react-native";

import { PieChart } from "react-native-gifted-charts";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { useSongPlayer } from '@/components/index/SongPlayerContext';

const { openSong } = useSongPlayer();

// on any song tap:
openSong({ id: '1', title: 'Song', artist: 'Artist', duration: 240, coverUri: '...' });

const radialData = [17, 13, 3, 18, 15, 13];
const colors = [
  "#e9d5ff",
  "#d8b4fe",
  "#c084fc",
  "#a855f7",
  "#9333ea",
  "#7e22ce"
];

 const polarToCartesian = (
  cx: number,
  cy: number,
  r: number,
  angle: number
) => {
  const rad = ((angle - 90) * Math.PI) / 180;

  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
};

const describeArc = (
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number
) => {

  const corner = 3; // controls roundness

  const startOuter = polarToCartesian(cx, cy, outerR, startAngle + corner);
  const endOuter = polarToCartesian(cx, cy, outerR, endAngle - corner);

  const startInner = polarToCartesian(cx, cy, innerR, endAngle - corner);
  const endInner = polarToCartesian(cx, cy, innerR, startAngle + corner);

  return `
    M ${startOuter.x} ${startOuter.y}
    A ${outerR} ${outerR} 0 0 1 ${endOuter.x} ${endOuter.y}
    L ${startInner.x} ${startInner.y}
    A ${innerR} ${innerR} 0 0 0 ${endInner.x} ${endInner.y}
    Z
  `;
};
export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <ScrollView>

        {/* HEADER */}

        <View style={styles.header}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d"
            }}
            style={styles.avatar}
          />

          <Text style={styles.name}>Sravan</Text>

          <Text style={styles.bio}>
            Playing with my piano since 3AM
          </Text>

          <View style={styles.friendBtn}>
            <Text style={{ color: "#000" }}>6 Friends</Text>
          </View>

          <View style={styles.icons}>
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Ionicons name="settings-outline" size={20} color="#fff" />
          </View>
        </View>

        {/* CHART */}
<View style={styles.chartContainer}>
<Svg width={300} height={300}>
  {radialData.map((value, index) => {

    const maxValue = Math.max(...radialData);

    const center = 150;
    const angleStep = 360 / radialData.length;

    const innerRadius = 50;
    const outerRadius = 80 + (value / maxValue) * 70;

    const startAngle = index * angleStep + 2;
    const endAngle = (index + 1) * angleStep +2;

    return (
      <Path
  key={index}
  d={describeArc(center, center, innerRadius, outerRadius, startAngle, endAngle)}
  fill={colors[index]}
  stroke="#0f0f0f"
  strokeWidth={6}
  strokeLinejoin="round"
/>
    );
  })}

</Svg>
</View>
        <Text style={styles.songCount}>67 Songs this week</Text>

        {/* TOP SONGS */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Top Songs</Text>

          {["Saath Nibhana Saathiya", "Blinding Lights", "Heat Waves"].map(
            (song, index) => (
              <View key={index} style={styles.songRow}>
                <Image
                  source={{
                    uri: "https://picsum.photos/60"
                  }}
                  style={styles.songImage}
                />

                <View>
                  <Text style={styles.songName}>{song}</Text>
                  <Text style={styles.artist}>Artist</Text>
                </View>
              </View>
            )
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#0f0f0f"
  },

  header: {
    alignItems: "center",
    marginTop: 50
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#c084fc"
  },

  name: {
    color: "#fff",
    fontSize: 22,
    marginTop: 10,
    fontWeight: "600"
  },

  bio: {
    color: "#aaa",
    marginTop: 4
  },

  friendBtn: {
    marginTop: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20
  },

  icons: {
    position: "absolute",
    right: 20,
    top: 0,
    flexDirection: "row",
    gap: 15
  },

  chartContainer: {
  marginTop: 30,
  alignItems: "center"
},

  songCount: {
    textAlign: "center",
    color: "#fff",
    marginTop: 10,
    fontSize: 16
  },

  section: {
    marginTop: 30,
    paddingHorizontal: 20
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 15
  },

  songRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15
  },

  songImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12
  },

  songName: {
    color: "#fff",
    fontSize: 15
  },

  artist: {
    color: "#aaa",
    fontSize: 12
  },

  bottomNav: {
    height: 70,
    backgroundColor: "#1a1a1a",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center"
  },

  profileButton: {
    backgroundColor: "#c084fc",
    padding: 15,
    borderRadius: 30
  }

});