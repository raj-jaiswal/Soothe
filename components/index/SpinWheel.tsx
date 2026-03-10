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

// Large wheel — center sits beyond right edge so left half is visible
const WHEEL_SIZE = SCREEN_WIDTH * 2.0;
const RADIUS = WHEEL_SIZE / 2;

const BUBBLE_SIZE = 72;
const BUBBLE_RADIUS = RADIUS - BUBBLE_SIZE / 2 - 14;
const LABEL_RADIUS = BUBBLE_RADIUS - BUBBLE_SIZE / 2 - 26;

const NUM_ITEMS = 14;
const ANGLE_STEP = (2 * Math.PI) / NUM_ITEMS;

// 9 o'clock = π radians from positive x-axis
// Items start at angle 0 (3 o'clock) and we want index 0 at 9 o'clock (π)
// So initial offset = π
const SELECTION_ANGLE = Math.PI; // 9 o'clock

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

  // Which index is at the 9 o'clock (left/selection) position?
  const getIndexFromRotation = useCallback(
    (rad: number) => {
      // The item that started at angle (i * ANGLE_STEP) is now at
      // (i * ANGLE_STEP + rad). We want the item closest to SELECTION_ANGLE (π).
      // So: i * ANGLE_STEP + rad ≡ π  →  i = (π - rad) / ANGLE_STEP
      const raw = (SELECTION_ANGLE - rad) / ANGLE_STEP;
      const index = ((Math.round(raw) % NUM_ITEMS) + NUM_ITEMS) % NUM_ITEMS;
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
        // Drag down = spin clockwise (positive rotation)
        // Drag up   = spin counter-clockwise (negative rotation)
        const delta = (dy / SCREEN_HEIGHT) * Math.PI * 0.9;

        currentRotation.current += delta;
        rotation.setValue(currentRotation.current);

        const now = Date.now();
        const dt = now - lastTimestamp.current;
        if (dt > 0) velocityRef.current = delta / (dt / 1000);
        lastTimestamp.current = now;
        lastY.current = y;
      },

      onPanResponderRelease: () => {
        const velocity = velocityRef.current;
        const momentum = Math.max(-1.2, Math.min(1.2, velocity * 0.18));
        const targetRotation = currentRotation.current + momentum;

        // Snap: we want (SELECTION_ANGLE - targetRotation) to be a multiple of ANGLE_STEP
        const raw = (SELECTION_ANGLE - targetRotation) / ANGLE_STEP;
        const snappedSteps = Math.round(raw);
        const snappedRotation = SELECTION_ANGLE - snappedSteps * ANGLE_STEP;

        spinAnimation.current = Animated.spring(rotation, {
          toValue: snappedRotation,
          useNativeDriver: true,
          tension: 28,
          friction: 14,
        });

        spinAnimation.current.start(({ finished }) => {
          if (finished) {
            currentRotation.current = snappedRotation;
            rotation.setValue(snappedRotation);
            onIndexChange(getIndexFromRotation(snappedRotation));
          }
        });
      },
    })
  ).current;

  // Y position of 9 o'clock on screen (left edge of wheel = SCREEN_WIDTH - RADIUS from left of container)
  // Since container left = SCREEN_WIDTH - RADIUS, the wheel center is at x=RADIUS in container coords
  // 9 o'clock point in container: x = RADIUS + RADIUS*cos(π) = RADIUS - RADIUS = 0 → left=0
  // y = RADIUS + RADIUS*sin(π) = RADIUS + 0 = RADIUS
  const selectionY = RADIUS; // vertical center of 9 o'clock

  return (
    <View style={styles.clipContainer} {...panResponder.panHandlers}>
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
          {/* Slice divider lines — from center outward */}
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
            // Each item's fixed angle on the wheel
            const angle = i * ANGLE_STEP;

            const bx = RADIUS + BUBBLE_RADIUS * Math.cos(angle) - BUBBLE_SIZE / 2;
            const by = RADIUS + BUBBLE_RADIUS * Math.sin(angle) - BUBBLE_SIZE / 2;

            const lx = RADIUS + LABEL_RADIUS * Math.cos(angle);
            const ly = RADIUS + LABEL_RADIUS * Math.sin(angle);

            // Label runs along radius toward center
            // +90 so text baseline faces center
            const labelAngleDeg = (angle * 180) / Math.PI + 90;

            const isActive = i % moods.length === activeIndex;

            return (
              <View key={`${mood.id}-${i}`}>
                <View
                  style={[
                    styles.bubble,
                    {
                      left: bx,
                      top: by,
                      borderWidth: isActive ? 3 : 0,
                      borderColor: '#FFFFFF',
                    },
                  ]}
                >
                  <Image source={mood.image} style={styles.bubbleImage} resizeMode="cover" />
                  {!isActive && <View style={styles.dimOverlay} />}
                </View>

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
                      { color: isActive ? '#FFFFFF' : '#555555' },
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

      {/* White selector dot at 9 o'clock — left edge, vertically centered */}
      <View
        style={[
          styles.selectorDot,
          { top: selectionY - 11 },
        ]}
      />
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
    width: RADIUS * 0.3,
    height: RADIUS * 0.3,
    borderRadius: RADIUS * 0.15,
    backgroundColor: '#1A1A1A',
    borderWidth: 1.5,
    borderColor: '#444',
    left: RADIUS - RADIUS * 0.15,
    top: RADIUS - RADIUS * 0.15,
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