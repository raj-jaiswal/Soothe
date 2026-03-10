import { MoodItem } from '@/constants/moods';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface ActiveMoodCardProps {
  mood: MoodItem;
  onPlay: () => void;
}

const CARD_HEIGHT = 72;
const IMAGE_SIZE = CARD_HEIGHT + 16;

export function ActiveMoodCard({ mood, onPlay }: ActiveMoodCardProps) {
  const playScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(playScale, { toValue: 0.88, useNativeDriver: true, speed: 30 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(playScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  return (
    <View style={styles.container}>
      {/* Album art overflowing the pill */}
      <View style={styles.imageWrapper}>
        <View style={styles.imageCircle}>
          <Image source={mood.image} style={styles.image} resizeMode="cover" />
        </View>
        <View style={styles.imageRing} />
      </View>

      {/* Gradient pill */}
      <LinearGradient
        colors={mood.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.pill}
      >
        <Text style={styles.label}>{mood.label}</Text>

        <TouchableOpacity
          activeOpacity={1}
          onPress={onPlay}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View style={[styles.playButton, { transform: [{ scale: playScale }] }]}>
            <Ionicons name="play" size={20} color="#1C1C1E" />
          </Animated.View>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: CARD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  imageWrapper: {
    position: 'absolute',
    left: -6,
    zIndex: 2,
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCircle: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2,
    overflow: 'hidden',
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },
  imageRing: {
    position: 'absolute',
    width: IMAGE_SIZE + 4,
    height: IMAGE_SIZE + 4,
    borderRadius: (IMAGE_SIZE + 4) / 2,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  pill: {
    flex: 1,
    height: CARD_HEIGHT,
    borderRadius: CARD_HEIGHT / 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: IMAGE_SIZE + 8,
    paddingRight: 10,
    justifyContent: 'space-between',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});