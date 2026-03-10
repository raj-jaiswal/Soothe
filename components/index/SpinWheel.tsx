import { MoodItem } from '@/constants/moods';
import { LinearGradient } from 'expo-linear-gradient';
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

// ─────────────────────────────────────────────
// 🎛️  TUNING PARAMS — change these to adjust feel
// ─────────────────────────────────────────────

// How far the wheel rotates per finger swipe (higher = faster drag response)
const DRAG_SPEED = 2;

// How fast momentum decays after release (0.99 = long coast, 0.85 = stops quickly)
const MOMENTUM_DECAY = 0.95;

// Max velocity allowed on release (higher = faster flings possible)
const MAX_VELOCITY = 100;

// Spring tension when snapping to nearest item (higher = snappier)
const SNAP_TENSION = 75;

// Spring friction when snapping to nearest item (lower = more bouncy)
const SNAP_FRICTION = 5;

// ─────────────────────────────────────────────
// 🎨 GRADIENT PARAMS
// ─────────────────────────────────────────────

// Background color of your screen — must match to blend seamlessly
const BG_COLOR = '#1C1C1E';

// Height of top and bottom fade in pixels — increase for stronger effect
const FADE_HEIGHT = 180;

// ─────────────────────────────────────────────

export const WHEEL_SIZE = SCREEN_WIDTH * 1.8;
export const WHEEL_RADIUS = WHEEL_SIZE / 2;

const BUBBLE_SIZE = 90;
const BUBBLE_R = WHEEL_RADIUS - BUBBLE_SIZE / 2 - 14;

const LABEL_H = 20;
const LABEL_W = WHEEL_RADIUS * 0.40;
const GAP = 20;
const LABEL_R = (BUBBLE_R - BUBBLE_SIZE / 2) - GAP - LABEL_W / 2 + WHEEL_RADIUS * 0.01;

const NUM_ITEMS = 14;
const ANGLE_STEP = (2 * Math.PI) / NUM_ITEMS;

const SELECTION_ANGLE = Math.PI;

const INITIAL_INDEX = 3;
const INITIAL_ROTATION = SELECTION_ANGLE - INITIAL_INDEX * ANGLE_STEP;

interface SpinWheelProps {
  moods: MoodItem[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
}

export function SpinWheel({ moods, activeIndex, onIndexChange }: SpinWheelProps) {
  const items = [...moods, ...moods];

  const rotation = useRef(new Animated.Value(INITIAL_ROTATION)).current;
  const currentRotation = useRef(INITIAL_ROTATION);
  const lastY = useRef(0);
  const lastTimestamp = useRef(Date.now());
  const velocityRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const springAnim = useRef<Animated.CompositeAnimation | null>(null);

  const getIndexFromRotation = useCallback(
    (rad: number) => {
      const raw = (SELECTION_ANGLE - rad) / ANGLE_STEP;
      const index = ((Math.round(raw) % NUM_ITEMS) + NUM_ITEMS) % NUM_ITEMS;
      return index % moods.length;
    },
    [moods.length]
  );

  const snapToNearest = useCallback(
    (fromRad: number) => {
      const raw = (SELECTION_ANGLE - fromRad) / ANGLE_STEP;
      const n = Math.round(raw);
      const snapped = SELECTION_ANGLE - n * ANGLE_STEP;

      if (springAnim.current) springAnim.current.stop();
      springAnim.current = Animated.spring(rotation, {
        toValue: snapped,
        useNativeDriver: true,
        tension: SNAP_TENSION,
        friction: SNAP_FRICTION,
      });
      springAnim.current.start(({ finished }) => {
        if (finished) {
          currentRotation.current = snapped;
          rotation.setValue(snapped);
          onIndexChange(getIndexFromRotation(snapped));
        }
      });
    },
    [rotation, onIndexChange, getIndexFromRotation]
  );

  const runMomentum = useCallback(
    (vel: number) => {
      if (Math.abs(vel) < 0.005) {
        snapToNearest(currentRotation.current);
        return;
      }
      const nextVel = vel * MOMENTUM_DECAY;
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
        const delta = (-dy / SCREEN_HEIGHT) * Math.PI * DRAG_SPEED;
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
        const v = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, velocityRef.current));
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = requestAnimationFrame(() => runMomentum(v));
      },
    })
  ).current;

  return (
    <View style={styles.clipContainer} {...panResponder.panHandlers}>
      <View style={[styles.wheelContainer, { left: SCREEN_WIDTH - WHEEL_RADIUS }]}>
        <View style={styles.outerRing} />

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

            const bx = WHEEL_RADIUS + BUBBLE_R * cosA - BUBBLE_SIZE / 2;
            const by = WHEEL_RADIUS + BUBBLE_R * sinA - BUBBLE_SIZE / 2;

            const lx = WHEEL_RADIUS + LABEL_R * cosA - LABEL_W / 2;
            const ly = WHEEL_RADIUS + LABEL_R * sinA - LABEL_H / 2;
            const textAngleDeg = (angle * 180) / Math.PI + 180;

            const imageRotationDeg = (i * (360 / NUM_ITEMS)) - 180;

            return (
              <View key={`${mood.id}-${i}`}>
                <View style={[styles.bubble, { left: bx, top: by, opacity: isActive ? 1 : 0.6 }]}>
                  <Image
                    source={mood.image}
                    style={[
                      styles.bubbleImage,
                      { transform: [{ rotate: `${imageRotationDeg}deg` }] },
                    ]}
                    resizeMode="cover"
                  />
                </View>

                <View
                  style={[
                    styles.labelWrapper,
                    {
                      left: lx,
                      top: ly,
                      width: LABEL_W,
                      height: LABEL_H,
                      transform: [{ rotate: `${textAngleDeg}deg` }],
                    },
                  ]}
                >
                  <Text style={[styles.label, { color: isActive ? '#BBBBBB' : '#4A4A4A' }]} numberOfLines={1}>
                    {mood.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </Animated.View>
      </View>

      {/* Top fade — icons fade into background */}
      <LinearGradient
        colors={[BG_COLOR, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.fade, { top: 0 }]}
        pointerEvents="none"
      />

      {/* Bottom fade — icons fade into background */}
      <LinearGradient
        colors={['transparent', BG_COLOR]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.fade, { bottom: 0 }]}
        pointerEvents="none"
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
    borderRadius: WHEEL_RADIUS,
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
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: FADE_HEIGHT,
    zIndex: 10,
  },
});