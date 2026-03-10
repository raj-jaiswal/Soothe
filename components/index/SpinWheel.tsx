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

const WHEEL_SIZE = SCREEN_WIDTH * 1.8;
const RADIUS = WHEEL_SIZE / 2;

const BUBBLE_SIZE = 90;
// Distance from wheel center to bubble center
const BUBBLE_R = RADIUS - BUBBLE_SIZE / 2 - 14;

// Label sits inward from bubble inner edge, with a small gap
// bubble inner edge from center = BUBBLE_R - BUBBLE_SIZE/2
// We place label center at some radius inward from there
const LABEL_H = 20;          // label text height
const LABEL_W = RADIUS * 0.40; // label width (long enough)
const GAP = 16;              // gap between bubble inner edge and label outer edge
// Label center radius = bubble inner edge - gap - half label width
const LABEL_R = (BUBBLE_R - BUBBLE_SIZE / 2) - GAP - LABEL_W / 2;

const NUM_ITEMS = 14;
const ANGLE_STEP = (2 * Math.PI) / NUM_ITEMS;

// Selection point: 9 o'clock = π
// Item i sits at angle: i * ANGLE_STEP + currentRotation
// We want item at 9 o'clock when: i * ANGLE_STEP + rotation = π
// So: rotation = π - i * ANGLE_STEP  →  i = (π - rotation) / ANGLE_STEP
const SELECTION_ANGLE = Math.PI;

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
  const lastTimestamp = useRef(Date.now());
  const velocityRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const springAnim = useRef<Animated.CompositeAnimation | null>(null);

  const getIndexFromRotation = useCallback(
    (rad: number) => {
      // Which item index is closest to SELECTION_ANGLE?
      const raw = (SELECTION_ANGLE - rad) / ANGLE_STEP;
      const index = ((Math.round(raw) % NUM_ITEMS) + NUM_ITEMS) % NUM_ITEMS;
      return index % moods.length;
    },
    [moods.length]
  );

  const snapToNearest = useCallback(
    (fromRotation: number) => {
      // Snap so that the nearest item lands exactly at π (9 o'clock)
      const raw = (SELECTION_ANGLE - fromRotation) / ANGLE_STEP;
      const snappedSteps = Math.round(raw);
      // rotation = π - snappedIndex * ANGLE_STEP
      const snappedRotation = SELECTION_ANGLE - snappedSteps * ANGLE_STEP;

      springAnim.current = Animated.spring(rotation, {
        toValue: snappedRotation,
        useNativeDriver: true,
        tension: 35,
        friction: 16,
      });
      springAnim.current.start(({ finished }) => {
        if (finished) {
          currentRotation.current = snappedRotation;
          rotation.setValue(snappedRotation);
          onIndexChange(getIndexFromRotation(snappedRotation));
        }
      });
    },
    [rotation, onIndexChange, getIndexFromRotation]
  );

  const runMomentum = useCallback(
    (vel: number) => {
      if (Math.abs(vel) < 0.004) {
        snapToNearest(currentRotation.current);
        return;
      }
      const nextVel = vel * 0.93;
      currentRotation.current += vel * 0.016;
      rotation.setValue(currentRotation.current);
      onIndexChange(getIndexFromRotation(currentRotation.current));
      animFrameRef.current = requestAnimationFrame(() => runMomentum(nextVel));
    },
    [rotation, onIndexChange, getIndexFromRotation, snapToNearest]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (springAnim.current) springAnim.current.stop();
        lastY.current = evt.nativeEvent.pageY;
        lastTimestamp.current = Date.now();
        velocityRef.current = 0;
      },

      onPanResponderMove: (evt) => {
        const y = evt.nativeEvent.pageY;
        const dy = y - lastY.current;
        // Up = clockwise (+), Down = counter-clockwise (-)
        const delta = (-dy / SCREEN_HEIGHT) * Math.PI * 2.2;
        currentRotation.current += delta;
        rotation.setValue(currentRotation.current);
        onIndexChange(getIndexFromRotation(currentRotation.current));
        const now = Date.now();
        const dt = Math.max(now - lastTimestamp.current, 1);
        velocityRef.current = delta / (dt / 1000);
        lastTimestamp.current = now;
        lastY.current = y;
      },

      onPanResponderRelease: () => {
        const v = Math.max(-12, Math.min(12, velocityRef.current));
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = requestAnimationFrame(() => runMomentum(v));
      },
    })
  ).current;

  return (
    <View style={styles.clipContainer} {...panResponder.panHandlers}>
      <View style={[styles.wheelContainer, { left: SCREEN_WIDTH - RADIUS }]}>
        {/* Background disc */}
        <View style={styles.outerRing} />

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
          {items.map((mood, i) => {
            const angle = i * ANGLE_STEP;
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);
            const isActive = i % moods.length === activeIndex;

            // ── Bubble: same polar math ──
            // center of bubble = (RADIUS + BUBBLE_R * cosA,  RADIUS + BUBBLE_R * sinA)
            const bx = RADIUS + BUBBLE_R * cosA - BUBBLE_SIZE / 2;
            const by = RADIUS + BUBBLE_R * sinA - BUBBLE_SIZE / 2;

            // ── Label: same polar math, different radius ──
            // center of label = (RADIUS + LABEL_R * cosA,  RADIUS + LABEL_R * sinA)
            const lx = RADIUS + LABEL_R * cosA - LABEL_W / 2;
            const ly = RADIUS + LABEL_R * sinA - LABEL_H / 2;

            // Text rotated to lie along the radius line
            // angle=0 → 3 o'clock, text should read outward along that line
            // rotate text by angle + 90° so it's perpendicular to the radius... 
            // Actually we want text ALONG radius: rotate by angle so baseline is along radius
            // Then flip 180° so first letter is closer to bubble (outer side)
            const textAngleDeg = (angle * 180) / Math.PI + 180;

            return (
              <View key={`${mood.id}-${i}`}>
                {/* Bubble */}
                <View
                  style={[
                    styles.bubble,
                    { left: bx, top: by, opacity: isActive ? 1 : 0.6 },
                  ]}
                >
                  <Image source={mood.image} style={styles.bubbleImage} resizeMode="cover" />
                </View>

                {/* Label — exact same center calculation as bubble, just LABEL_R */}
                <View
                  style={[
                    styles.labelWrapper,
                    {
                      left: lx,
                      top: ly,
                      width: LABEL_W,
                      height: LABEL_H,
                      // Rotate around the center of this view
                      transform: [{ rotate: `${textAngleDeg}deg` }],
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.label,
                      { color: isActive ? '#BBBBBB' : '#4A4A4A' },
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
    backgroundColor: '#1E1E1E',
  },
  wheel: {
    position: 'absolute',
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
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
  labelWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});