import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Playlist } from './ExploreTypes';

interface PlaylistCardProps {
  playlist: Playlist;
  onPress?: (playlist: Playlist) => void;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(playlist)}
      activeOpacity={0.75}
    >
      <View style={styles.imageWrapper}>
        <Image source={{ uri: playlist.coverArt }} style={styles.coverArt} />
        {/* Subtle gradient overlay at bottom */}
        <View style={styles.overlay} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{playlist.songCount} songs</Text>
        </View>
      </View>
      <Text style={styles.playlistName} numberOfLines={1}>
        {playlist.name}
      </Text>
      {playlist.curator && (
        <Text style={styles.curator} numberOfLines={1}>
          by {playlist.curator}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 155,
    marginRight: 14,
  },
  imageWrapper: {
    width: 155,
    height: 155,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
  },
  coverArt: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  badge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.85)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  playlistName: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  curator: {
    marginTop: 2,
    fontSize: 11,
    color: '#888888',
  },
});

export default PlaylistCard;
