import { ActiveMoodCard } from '@/components/index/ActiveMoodCard';
import { SpinWheel } from '@/components/index/SpinWheel';
import { MOODS } from '@/constants/moods';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [activeIndex, setActiveIndex] = useState(3); // 'love' default
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

      {/* ── Spin Wheel (left half only) ── */}
      <View style={styles.wheelWrapper}>
        <SpinWheel
          moods={MOODS}
          activeIndex={activeIndex}
          onIndexChange={setActiveIndex}
        />
      </View>

      {/* ── Active mood pill card ── */}
      <View style={styles.cardWrapper}>
        <ActiveMoodCard
          mood={activeMood}
          onPlay={() => console.log(`Playing: ${activeMood.label}`)}
        />
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
  wheelWrapper: {
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardWrapper: {
    paddingBottom: 20,
    paddingTop: 12,
  },
});