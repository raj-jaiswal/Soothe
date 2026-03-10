import { StyleSheet, TouchableOpacity, View, Animated } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import SootheLogo from "../assets/images/soothe-logo.svg";
import { useRef, useState } from "react";

const TABS = [
  {
    key: "explore",
    icon: (color: string) => (
      <MaterialIcons name="dashboard" size={24} color={color} />
    ),
  },
  {
    key: "playlist",
    icon: (color: string) => (
      <MaterialCommunityIcons name="playlist-music" size={24} color={color} />
    ),
  },
  {
    key: "index",
    icon: (color: string) => <SootheLogo fill={color} width={32} height={32} />,
  },
  {
    key: "chats",
    icon: (color: string) => (
      <MaterialIcons name="message" size={24} color={color} />
    ),
  },
  {
    key: "profile",
    icon: (color: string) => (
      <MaterialCommunityIcons name="account" size={24} color={color} />
    ),
  },
];

export default function FloatingTabBar({ state, descriptors, navigation }) {
  const [activeTab, setActiveTab] = useState("index");
  const animations = useRef(
    Object.fromEntries(
      TABS.map((t) => [t.key, new Animated.Value(t.key === "index" ? 1 : 0)])
    )
  ).current;

  const handlePress = (key: string) => {
    Animated.spring(animations[activeTab], {
      toValue: 0,
      useNativeDriver: false,
    }).start();

    Animated.spring(animations[key], {
      toValue: 1,
      useNativeDriver: false,
    }).start();

    setActiveTab(key);
    navigation.navigate(key);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {TABS.map((tab) => {
          const isCenter = tab.key === "index";
          const isActive = activeTab === tab.key;

          const bgColor = animations[tab.key].interpolate({
            inputRange: [0, 1],
            outputRange: ["transparent", "#7B2FF7"],
          });

          const bottom = animations[tab.key].interpolate({
            inputRange: [0, 1],
            outputRange: [0, 30],
          });

          const size = animations[tab.key].interpolate({
            inputRange: [0, 1],
            outputRange: [44, 65],
          });

          // Center slot — always reserves space
          if (isCenter) {
            return (
              <View key={tab.key} style={styles.iconButton}>
                {!isActive && (
                  <TouchableOpacity onPress={() => handlePress(tab.key)}>
                    <SootheLogo fill="black" width={24} height={24} />
                  </TouchableOpacity>
                )}
              </View>
            );
          }

          // Active non-center tab — floating bubble
          if (isActive) {
            return (
              <Animated.View
                key={tab.key}
                style={[
                  styles.activeBubble,
                  {
                    bottom,
                    width: size,
                    height: size,
                    backgroundColor: bgColor,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.touchArea}
                  onPress={() => handlePress(tab.key)}
                >
                  {tab.icon("white")}
                </TouchableOpacity>
              </Animated.View>
            );
          }

          // Inactive non-center tab — flat icon
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.iconButton}
              onPress={() => handlePress(tab.key)}
            >
              {tab.icon("black")}
            </TouchableOpacity>
          );
        })}

        {/* Active center bubble — rendered outside map to float above */}
        {activeTab === "index" && (
          <Animated.View
            style={[
              styles.activeBubble,
              {
                bottom: animations["index"].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 30],
                }),
                width: animations["index"].interpolate({
                  inputRange: [0, 1],
                  outputRange: [44, 65],
                }),
                height: animations["index"].interpolate({
                  inputRange: [0, 1],
                  outputRange: [44, 65],
                }),
                backgroundColor: "#7B2FF7",
              },
            ]}
          >
            <TouchableOpacity
              style={styles.touchArea}
              onPress={() => handlePress("index")}
            >
              <SootheLogo fill="white" width={32} height={32} />
            </TouchableOpacity>
          </Animated.View>
        )}
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
  },

  container: {
    flexDirection: "row",
    backgroundColor: "#F2F2F2",
    height: 60,
    borderRadius: 35,
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    paddingHorizontal: 10,
  },

  iconButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },

  activeBubble: {
    position: "absolute",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    elevation: 12,
    zIndex: 10,
  },

  touchArea: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
});