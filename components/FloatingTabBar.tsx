import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useRef, useState } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import SootheLogo from "../assets/images/soothe-logo.svg";
import { useSongPlayer } from "./index/SongPlayerContext";

const TABS = [
  {
    key: "explore",
    icon: (color: string, size: number) => (
      <MaterialIcons name="dashboard" size={size} color={color} />
    ),
  },
  {
    key: "playlist",
    icon: (color: string, size: number) => (
      <MaterialCommunityIcons name="playlist-music" size={size} color={color} />
    ),
  },
  {
    key: "index",
    icon: (color: string, size: number) => (
      <SootheLogo fill={color} width={size} height={size} />
    ),
  },
  {
    key: "chats",
    icon: (color: string, size: number) => (
      <MaterialIcons name="message" size={size} color={color} />
    ),
  },
  {
    key: "profile",
    icon: (color: string, size: number) => (
      <MaterialCommunityIcons name="account" size={size} color={color} />
    ),
  },
];

const BUBBLE_SIZE = 65;
const TAB_COUNT = TABS.length;

export default function FloatingTabBar({ state, descriptors, navigation }) {
  // ✅ LINE 1: get activeSong from context
  const { activeSong } = useSongPlayer();

  const [activeTab, setActiveTab] = useState("index");

  const activeTabRef = useRef("index");
  const bubbleX = useRef(new Animated.Value(0)).current;
  const bubbleBottom = useRef(new Animated.Value(20)).current;

  const iconOpacity = useRef(
    Object.fromEntries(
      TABS.map((t) => [t.key, new Animated.Value(t.key === "index" ? 1 : 0)]),
    ),
  ).current;

  const containerWidth = useRef(0);
  const initialized = useRef(false);
  const runningAnim = useRef<Animated.CompositeAnimation | null>(null);

  const getTabCenterX = (key: string) => {
    const tabWidth = containerWidth.current / TAB_COUNT;
    const index = TABS.findIndex((t) => t.key === key);
    return tabWidth * index + tabWidth / 2 - BUBBLE_SIZE / 2;
  };

  const initBubble = useCallback((width: number) => {
    if (initialized.current) return;
    initialized.current = true;
    containerWidth.current = width;
    bubbleX.setValue(getTabCenterX("index"));
  }, []);

  const handlePress = useCallback(
    (key: string) => {
      const current = activeTabRef.current;
      if (key === current) return;

      if (runningAnim.current) {
        runningAnim.current.stop();
        runningAnim.current = null;
      }

      TABS.forEach((t) => {
        if (t.key !== key && t.key !== current) {
          iconOpacity[t.key].setValue(0);
        }
      });

      activeTabRef.current = key;
      setActiveTab(key);

      const anim = Animated.parallel([
        Animated.spring(bubbleX, {
          toValue: getTabCenterX(key),
          useNativeDriver: false,
          stiffness: 180,
          damping: 20,
          mass: 0.8,
        }),
        Animated.spring(bubbleBottom, {
          toValue: 20,
          useNativeDriver: false,
          stiffness: 180,
          damping: 20,
        }),
        Animated.timing(iconOpacity[current], {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.timing(iconOpacity[key], {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }),
      ]);

      runningAnim.current = anim;
      anim.start(({ finished }) => {
        if (finished) runningAnim.current = null;
      });

      navigation.navigate(key);
    },
    [bubbleX, bubbleBottom, iconOpacity, navigation],
  );

  // ✅ LINE 2: return null when song is open — fully unmounts the tab bar
  if (activeSong) return null;

  return (
    <View style={styles.wrapper}>
      <View
        style={styles.container}
        onLayout={(e) => initBubble(e.nativeEvent.layout.width)}
      >
        <Animated.View
          style={[
            styles.slidingBubble,
            { left: bubbleX, bottom: bubbleBottom },
          ]}
        >
          <TouchableOpacity
            style={styles.bubbleTouchArea}
            onPress={() => handlePress(activeTabRef.current)}
            activeOpacity={0.8}
          >
            {TABS.map((tab) => {
              const size = tab.key === "index" ? 28 : 22;
              return (
                <Animated.View
                  key={tab.key}
                  style={[
                    StyleSheet.absoluteFill,
                    styles.iconCenter,
                    { opacity: iconOpacity[tab.key] },
                  ]}
                  pointerEvents="none"
                >
                  {tab.icon("#FFFFFF", size)}
                </Animated.View>
              );
            })}
          </TouchableOpacity>
        </Animated.View>

        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const size = tab.key === "index" ? 28 : 22;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.iconButton}
              onPress={() => handlePress(tab.key)}
              activeOpacity={0.7}
              disabled={isActive}
            >
              {!isActive && tab.icon("#1A1A1A", size)}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 25,
    left: 20,
    right: 20,
    alignItems: "center",
    zIndex: 10,
    elevation: 10,
  },
  container: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    height: 60,
    borderRadius: 35,
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    paddingHorizontal: 10,
  },
  iconButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    zIndex: 3,
  },
  slidingBubble: {
    position: "absolute",
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: "#7B2FF7",
    elevation: 4,
    zIndex: 10,
    shadowColor: "#7B2FF7",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
  },
  bubbleTouchArea: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
});