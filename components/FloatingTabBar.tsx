import { useAppTheme } from "@/components/context/ThemeContext"; // <-- IMPORT ADDED
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const { activeSong } = useSongPlayer();
  const { currentMood } = useAppTheme(); // <-- HOOK ADDED

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

  useEffect(() => {
    const route = state.routes[state.index].name;

    // Ignore mic (no animation)
    if (route === "mic") return;

    if (!TABS.some((t) => t.key === route)) return;

    const current = activeTabRef.current;

    // If already same, do nothing
    if (current === route) return;

    // 🔥 Animate bubble when navigation happens externally
    activeTabRef.current = route;
    setActiveTab(route);

    Animated.spring(bubbleX, {
      toValue: getTabCenterX(route),
      useNativeDriver: false,
      stiffness: 180,
      damping: 20,
    }).start();

    Animated.timing(iconOpacity[current], {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();

    Animated.timing(iconOpacity[route], {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [state]);

  const handlePress = useCallback(
    (key: string) => {
      const currentRoute = state.routes[state.index].name;

      // 🎯 SPECIAL CASE: middle button toggle
      if (key === "index") {
        let target = "index";

        if (currentRoute === "index") {
          target = "mic";
        } else if (currentRoute === "mic") {
          target = "index";
        }

        // 🚫 NO animation, just navigate
        navigation.navigate(target);
        return;
      }

      // ✅ Normal tabs (with animation)
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
    [bubbleX, bubbleBottom, iconOpacity, navigation, state],
  );

  // ✅ return null when song is open — fully unmounts the tab bar
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
            {
              left: bubbleX,
              bottom: bubbleBottom,
              backgroundColor: currentMood.colors[1], // <-- DYNAMIC COLOR
              shadowColor: currentMood.colors[1], // <-- DYNAMIC SHADOW
            },
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
              {/* Note: I left the inactive icon color hardcoded to #1A1A1A so it remains visible against the white bar */}
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
    // Background and shadow colors are now applied dynamically inline
    elevation: 4,
    zIndex: 10,
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
