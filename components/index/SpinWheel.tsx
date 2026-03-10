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

const WHEEL_SIZE = SCREEN_WIDTH * 2.0;
const RADIUS = WHEEL_SIZE / 2;

const BUBBLE_SIZE = 90;
// Bubble sits near the outer edge
const BUBBLE_RADIUS = RADIUS - BUBBLE_SIZE / 2 - 14;
// Label starts well inside the bubble toward center
const LABEL_START_RADIUS = BUBBLE_RADIUS - BUBBLE_SIZE / 2 - 50; // shifted inward
const LABEL_WIDTH = RADIUS * 0.42;

const NUM_ITEMS = 14;
const ANGLE_STEP = (2 * Math.PI) / NUM_ITEMS;
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

  const getIndexFromRotation = useCallback(
    (rad: number) => {
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
        // Drag UP = clockwise (positive), drag DOWN = counter-clockwise (negative)
        const delta = (-dy / SCREEN_HEIGHT) * Math.PI * 0.9;
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

  return (
    <View style={styles.clipContainer} {...panResponder.panHandlers}>
      <View style={[styles.wheelContainer, { left: SCREEN_WIDTH - RADIUS }]}>
        {/* Background disc — no border, just dark fill */}
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
            const isActive = i % moods.length === activeIndex;

            // Bubble top-left
            const bx = RADIUS + BUBBLE_RADIUS * Math.cos(angle) - BUBBLE_SIZE / 2;
            const by = RADIUS + BUBBLE_RADIUS * Math.sin(angle) - BUBBLE_SIZE / 2;

            // Label: positioned at LABEL_START_RADIUS along the radius
            // The label View's left edge starts here and extends inward
            // We rotate the whole label View by the item's angle
            // so text flows from bubble toward center along the radius line
            const labelCenterX = RADIUS + LABEL_START_RADIUS * Math.cos(angle);
            const labelCenterY = RADIUS + LABEL_START_RADIUS * Math.sin(angle);

            // Rotate label so it lies along the radius
            // angle is measured from positive x-axis
            // We want text to read from outer → inner (left to right along radius inward)
            // So rotate by angle + 180° (flip so it reads inward not outward)
            let textAngleDeg = (angle * 180) / Math.PI + 180;

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
                      borderColor: '#FFFFFF',
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

                {/* Radial label — hidden when active (pill covers it) */}
                {!isActive && (
                  <View
                    style={[
                      styles.labelWrapper,
                      {
                        width: LABEL_WIDTH,
                        left: labelCenterX - LABEL_WIDTH,
                        top: labelCenterY - 10,
                        transform: [{ rotate: `${textAngleDeg}deg` }],
                        // anchor rotation from the right edge (outer end)
                        transformOrigin: 'right center',
                      },
                    ]}
                  >
                    <Text style={styles.label} numberOfLines={1}>
                      {mood.label}
                    </Text>
                  </View>
                )}
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
    backgroundColor: '#202020',
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
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  labelWrapper: {
    position: 'absolute',
    alignItems: 'flex-end', // text anchored toward outer ring
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#606060',
    textAlign: 'right',
  },
});