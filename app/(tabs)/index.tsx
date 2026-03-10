import { ActiveMoodCard } from '@/components/index/ActiveMoodCard';
import { SpinWheel, WHEEL_RADIUS } from '@/components/index/SpinWheel';
import { MOODS } from '@/constants/moods';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  LayoutChangeEvent,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Must match ActiveMoodCard CARD_HEIGHT
const CARD_HEIGHT = 72;

export default function HomeScreen() {
  const [activeIndex, setActiveIndex] = useState(3);
  const [headerHeight, setHeaderHeight] = useState(0);
  const activeMood = MOODS[activeIndex];

  const onHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    setHeaderHeight(e.nativeEvent.layout.height);
  }, []);

  // wheelArea starts AFTER the header
  // 9 o'clock Y inside wheelArea = WHEEL_RADIUS
  // So pill top inside wheelArea = WHEEL_RADIUS - CARD_HEIGHT / 2
  // No need to subtract header here because pillOverlay is
  // positioned relative to wheelArea, not the whole screen
  const pillTop = WHEEL_RADIUS - CARD_HEIGHT / 2;

  // 9 o'clock X on screen = SCREEN_WIDTH - WHEEL_RADIUS
  const pillLeft = SCREEN_WIDTH - WHEEL_RADIUS;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1E" />

      {/* Header */}
      <View style={styles.header} onLayout={onHeaderLayout}>
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

      {/* Wheel area — starts below header, pill is relative to this */}
      <View style={styles.wheelArea}>
        <SpinWheel
          moods={MOODS}
          activeIndex={activeIndex}
          onIndexChange={setActiveIndex}
        />

        <View
          style={[styles.pillOverlay, { top: pillTop, left: pillLeft }]}
          pointerEvents="none"
        >
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
    paddingBottom: 8,
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
    right: 16,
    height: CARD_HEIGHT + 60,
    justifyContent: 'center',
  },
});