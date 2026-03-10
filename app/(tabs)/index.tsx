import { ActiveMoodCard } from '@/components/index/ActiveMoodCard';
import { SpinWheel } from '@/components/index/SpinWheel';
import { MOODS } from '@/constants/moods';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Must match WHEEL_SIZE in SpinWheel.tsx
const WHEEL_SIZE = SCREEN_WIDTH * 2.0;
const WHEEL_RADIUS = WHEEL_SIZE / 2;

export default function HomeScreen() {
  const [activeIndex, setActiveIndex] = useState(3);
  const activeMood = MOODS[activeIndex];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1E" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Good Morning <Text style={styles.greetingBold}>Sravan</Text>
          </Text>
          <Text style={styles.subtitle}>How's your mood today?</Text>
        </View>
        <TouchableOpacity style={styles.searchButton} activeOpacity={0.7}>
          <Ionicons name="search" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Wheel area ── */}
      <View style={styles.wheelArea}>
        {/* The wheel — fills the area, clips to left half */}
        <View style={styles.wheelWrapper}>
          <SpinWheel
            moods={MOODS}
            activeIndex={activeIndex}
            onIndexChange={setActiveIndex}
          />
        </View>

        {/* Pill card — overlaid, perfectly vertically centered = 9 o'clock */}
        <View style={styles.pillOverlay} pointerEvents="none">
          <ActiveMoodCard
            mood={activeMood}
            onPlay={() => console.log(`Playing: ${activeMood.label}`)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  greetingBold: {
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    color: '#888888',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  searchButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  wheelWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center', // vertically center the wheel
  },
  pillOverlay: {
    // Sits exactly at the vertical center = 9 o'clock on the wheel
    position: 'absolute',
    left: 0,
    right: 40,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});