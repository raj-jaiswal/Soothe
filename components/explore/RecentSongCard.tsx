import { useAppTheme } from "@/components/context/ThemeContext"; // <-- IMPORT ADDED
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Song } from "./ExploreTypes";

interface RecentSongCardProps {
  song: Song;
  onPress?: (song: Song) => void;
}

const formatPlays = (plays: number): string => {
  if (plays >= 1000000) return `${(plays / 1000000).toFixed(1)}M plays`;
  if (plays >= 1000) return `${(plays / 1000).toFixed(0)}K plays`;
  return `${plays} plays`;
};

const RecentSongCard: React.FC<RecentSongCardProps> = ({ song, onPress }) => {
  const { currentMood } = useAppTheme(); // <-- HOOK ADDED

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(song)}
      activeOpacity={0.75}
    >
      <Image source={{ uri: song.albumArt }} style={styles.albumArt} />
      {/* Dynamic play indicator bar at bottom of image */}
      <View
        style={[styles.playBar, { backgroundColor: currentMood.colors[1] }]}
      />
      <Text style={styles.songTitle} numberOfLines={1}>
        {song.title}
      </Text>
      <Text style={styles.artistName} numberOfLines={1}>
        {song.artist}
      </Text>
      {song.plays !== undefined && (
        <Text style={styles.plays}>{formatPlays(song.plays)}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 130,
    marginRight: 14,
    backgroundColor: "#222222",
    borderRadius: 16,
    overflow: "hidden",
    paddingBottom: 12,
  },
  albumArt: {
    width: 130,
    height: 130,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: "#333",
  },
  playBar: {
    height: 3,
    width: "60%",
    borderRadius: 2,
    marginTop: 10,
    marginHorizontal: 10,
    // Removed hardcoded background color
  },
  songTitle: {
    marginTop: 6,
    marginHorizontal: 10,
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  artistName: {
    marginTop: 2,
    marginHorizontal: 10,
    fontSize: 11,
    color: "#888888",
    fontWeight: "400",
  },
  plays: {
    marginTop: 4,
    marginHorizontal: 10,
    fontSize: 10,
    color: "#555555",
  },
});

export default RecentSongCard;
