import { MoodItem } from '@/constants/moods';
import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Large wheel — center sits at right edge so only left half shows
const WHEEL_SIZE = SCREEN_WIDTH * 1.92;
const RADIUS = WHEEL_SIZE / 2;

// Bubble images on outer ring
const BUBBLE_SIZE = 72;
const BUBBLE_RADIUS = RADIUS - BUBBLE_SIZE / 2 - 12;

// Label sits inward from bubble along the radius
const LABEL_RADIUS = BUBBLE_RADIUS - BUBBLE_SIZE / 2 - 28;

const NUM_ITEMS = 14;
const ANGLE_STEP = (2 * Math.PI) / NUM_ITEMS;

interface SpinWheelProps {
  moods: MoodItem[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
}

export function SpinWheel({ moods, activeIndex, onIndexChange }: SpinWheelProps) {
  const items = [...moods, ...moods];

  const rotation = useRef(new Animated.Value(0)).current;
  const currentRotation = useRef(0);
  const lastY = useRef(0);
  const lastTimestamp = useRef(0);
  const velocityRef = useRef(0);
  const spinAnimation = useRef<Animated.CompositeAnimation | null>(null);

  const getIndexFromRotation = useCallback(
    (rad: number) => {
      const normalized = ((rad % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const index = Math.round(normalized / ANGLE_STEP) % NUM_ITEMS;
      return index % moods.length;
    },
    [moods.length]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        if (spinAnimation.current) spinAnimation.current.stop();
        lastY.current = evt.nativeEvent.pageY;
        lastTimestamp.current = Date.now();
        velocityRef.current = 0;
      },

      onPanResponderMove: (evt) => {
        const y = evt.nativeEvent.pageY;
        const dy = y - lastY.current;

        // Vertical drag → rotation. Slow & controlled.
        const delta = (-dy / SCREEN_HEIGHT) * Math.PI * 0.75;

        currentRotation.current += delta;
        rotation.setValue(currentRotation.current);

        const now = Date.now();
        const dt = now - lastTimestamp.current;
        if (dt > 0) {
          velocityRef.current = delta / (dt / 1000);
        }
        lastTimestamp.current = now;
        lastY.current = y;
      },

      onPanResponderRelease: () => {
        const velocity = velocityRef.current;
        // Gentle momentum — clamp hard so it never spins wildly
        const momentum = Math.max(-1.5, Math.min(1.5, velocity * 0.2));
        const targetRotation = currentRotation.current + momentum;

        // Snap to nearest slice
        const snappedSteps = Math.round(targetRotation / ANGLE_STEP);
        const snappedRotation = snappedSteps * ANGLE_STEP;

        spinAnimation.current = Animated.spring(rotation, {
          toValue: snappedRotation,
          useNativeDriver: true,
          tension: 30,
          friction: 14,
        });

        spinAnimation.current.start(({ finished }) => {
          if (finished) {
            currentRotation.current = snappedRotation;
            rotation.setValue(snappedRotation);
            onIndexChange(getIndexFromRotation(-snappedRotation));
          }
        });
      },
    })
  ).current;

  return (
    <View style={styles.clipContainer} {...panResponder.panHandlers}>
      {/* Wheel positioned so center is at right edge of screen */}
      <View style={[styles.wheelContainer, { left: SCREEN_WIDTH - RADIUS }]}>

        {/* Background disc */}
        <View style={styles.outerRing} />

        {/* Center hub */}
        <View style={styles.innerHub} />

        {/* Rotating layer */}
        <Animated.View
          style={[
            styles.wheel,
            {
              transform: [
                {
                  rotate: rotation.interpolate({
                    inputRange: [-10000, 10000],
                    outputRange: ['-10000rad', '10000rad'],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Slice divider lines */}
          {items.map((_, i) => {
            const angleDeg = (i * ANGLE_STEP * 180) / Math.PI;
            return (
              <View
                key={`line-${i}`}
                style={[
                  styles.dividerLine,
                  { transform: [{ rotate: `${angleDeg}deg` }] },
                ]}
              />
            );
          })}

          {/* Mood items */}
          {items.map((mood, i) => {
            const angle = -Math.PI / 2 + i * ANGLE_STEP;

            // Bubble top-left position
            const bx = RADIUS + BUBBLE_RADIUS * Math.cos(angle) - BUBBLE_SIZE / 2;
            const by = RADIUS + BUBBLE_RADIUS * Math.sin(angle) - BUBBLE_SIZE / 2;

            // Label center position
            const lx = RADIUS + LABEL_RADIUS * Math.cos(angle);
            const ly = RADIUS + LABEL_RADIUS * Math.sin(angle);

            // Rotate text so it runs along the radius from outside → center
            const labelAngleDeg = (angle * 180) / Math.PI + 90;

            const isActive = i % moods.length === activeIndex;

            return (
              <View key={`${mood.id}-${i}`}>
                {/* Bubble */}
                <View
                  style={[
                    styles.bubble,
                    {
                      left: bx,
                      top: by,
                      borderWidth: isActive ? 3 : 0,
                      borderColor: isActive ? '#FFFFFF' : 'transparent',
                    },
                  ]}
                >
                  <Image
                    source={mood.image}
                    style={styles.bubbleImage}
                    resizeMode="cover"
                  />
                  {!isActive && <View style={styles.dimOverlay} />}
                </View>

                {/* Label along radius */}
                <View
                  style={[
                    styles.labelWrapper,
                    {
                      left: lx - 50,
                      top: ly - 10,
                      transform: [{ rotate: `${labelAngleDeg}deg` }],
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.label,
                      { color: isActive ? '#FFFFFF' : '#5A5A5A' },
                    ]}
                    numberOfLines={1}
                  >
                    {mood.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </Animated.View>
      </View>

      {/* White selector dot at 9 o'clock = left edge = top of visible left arc */}
      <View style={styles.selectorDot} />
    </View>
  );
}

const styles = StyleSheet.create({
  clipContainer: {
    width: SCREEN_WIDTH,
    height: WHEEL_SIZE,
    overflow: 'hidden',
  },
  wheelContainer: {
    position: 'absolute',
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
  },
  outerRing: {
    position: 'absolute',
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: RADIUS,
    backgroundColor: '#222222',
    borderWidth: 1.5,
    borderColor: '#3A3A3A',
  },
  innerHub: {
    position: 'absolute',
    width: RADIUS * 0.32,
    height: RADIUS * 0.32,
    borderRadius: RADIUS * 0.16,
    backgroundColor: '#1A1A1A',
    borderWidth: 1.5,
    borderColor: '#444',
    left: RADIUS - RADIUS * 0.16,
    top: RADIUS - RADIUS * 0.16,
    zIndex: 10,
  },
  wheel: {
    position: 'absolute',
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
  },
  dividerLine: {
    position: 'absolute',
    width: RADIUS * 0.88,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#343434',
    left: RADIUS,
    top: RADIUS,
  },
  bubble: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    overflow: 'hidden',
  },
  bubbleImage: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  labelWrapper: {
    position: 'absolute',
    width: 100,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  selectorDot: {
    position: 'absolute',
    top: RADIUS - 11,
    left: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    zIndex: 30,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 12,
  },
});