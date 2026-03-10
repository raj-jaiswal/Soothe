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
const WHEEL_SIZE = SCREEN_WIDTH * 1.8;

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

      {/* ── Wheel + pill, starts immediately below header ── */}
      <View style={styles.wheelArea}>
        <SpinWheel
          moods={MOODS}
          activeIndex={activeIndex}
          onIndexChange={setActiveIndex}
        />

        {/* Pill overlaid at 9 o'clock — shifted right so name is visible */}
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
    paddingTop: 6,
    paddingBottom: 8,   // tight — wheel starts right here
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
    overflow: 'hidden',
    position: 'relative',
  },
  pillOverlay: {
    position: 'absolute',
    // Icon overflows left by IMAGE_SIZE*0.28 (~31px), so shift pill right by that amount
    // so the icon center lands exactly at x=0 (left edge of screen = 9 o'clock)
    left: 30,
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});