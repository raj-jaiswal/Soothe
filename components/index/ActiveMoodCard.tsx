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

// Card height
const CARD_HEIGHT = 72;
// Icon is bigger than the wheel bubble (90px) so it fully covers it
const IMAGE_SIZE = 110;

// Default grey gradient — used as base, mood color overlaid via opacity
const GREY_COLORS: [string, string, string] = ['#2A2A2A', '#383838', '#444444'];

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
      {/* Grey base pill — always present */}
      <LinearGradient
        colors={GREY_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.pill, StyleSheet.absoluteFillObject]}
      />

      {/* Mood colour overlay — fades over grey */}
      <LinearGradient
        colors={mood.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.pill, StyleSheet.absoluteFillObject, { opacity: 0.85 }]}
      />

      {/* Large icon — overflows pill, covers wheel bubble underneath */}
      <View style={styles.imageWrapper}>
        <View style={styles.imageCircle}>
          <Image source={mood.image} style={styles.image} resizeMode="cover" />
        </View>
        <View style={styles.imageRing} />
      </View>

      {/* Pill content */}
      <View style={styles.pillContent}>
        <Text style={styles.label} numberOfLines={1}>{mood.label}</Text>

        <TouchableOpacity
          activeOpacity={1}
          onPress={onPlay}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View style={[styles.playButton, { transform: [{ scale: playScale }] }]}>
            <Ionicons name="play" size={22} color="#1C1C1E" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: CARD_HEIGHT,
    marginHorizontal: 16,
    borderRadius: CARD_HEIGHT / 2,
    overflow: 'visible',
    position: 'relative',
  },
  pill: {
    borderRadius: CARD_HEIGHT / 2,
    height: CARD_HEIGHT,
  },
  imageWrapper: {
    position: 'absolute',
    left: -IMAGE_SIZE * 0.28,   // shifted left more — clear gap between pill edge and icon
    top: -(IMAGE_SIZE - CARD_HEIGHT) / 2,
    zIndex: 10,
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
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  pillContent: {
    position: 'absolute',
    left: IMAGE_SIZE * 0.9,    // pushed further right, clear of icon
    right: 10,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.4,
    flex: 1,
    marginRight: 8,
  },
  playButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
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