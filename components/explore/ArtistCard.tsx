import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Artist } from './ExploreTypes';

interface ArtistCardProps {
  artist: Artist;
  onPress?: (artist: Artist) => void;
}

const formatFollowers = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
  return `${count}`;
};

const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(artist)}
      activeOpacity={0.75}
    >
      {/* Outer ring — mimics the colourful avatar rings in the Chats screen */}
      <View style={styles.ringWrapper}>
        <Image source={{ uri: artist.profileImage }} style={styles.avatar} />
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {artist.name}
      </Text>
      <Text style={styles.genre} numberOfLines={1}>
        {artist.genre}
      </Text>
      <Text style={styles.followers}>
        {formatFollowers(artist.followers)} followers
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 100,
    marginRight: 16,
    alignItems: 'center',
  },
  ringWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 3,
    // Purple-to-violet ring (simulate the gradient rings in Chats)
    borderWidth: 2.5,
    borderColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#333',
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  genre: {
    fontSize: 10,
    color: '#888888',
    textAlign: 'center',
    marginTop: 2,
  },
  followers: {
    fontSize: 10,
    color: '#555555',
    textAlign: 'center',
    marginTop: 3,
  },
});

export default ArtistCard;
