import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


const BAR_COUNT = 11;

export default function MicScreen() {
  const router = useRouter();

  const navigation = useNavigation();

  // 🔥 Animated values for bars
  const barAnims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(10)),
  ).current;

  useEffect(() => {
    const animateBars = () => {
      const animations = barAnims.map((anim) =>
        Animated.sequence([
          Animated.timing(anim, {
            toValue: Math.random() * 35 + 10, // random height
            duration: 400,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: Math.random() * 35 + 10,
            duration: 400,
            useNativeDriver: false,
          }),
        ]),
      );

      Animated.parallel(animations).start(() => animateBars());
    };

    animateBars();
  }, []);

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.navigate("index" as never)}>
          <Ionicons name="chevron-back" size={28} color="#EAEAEA" />
        </TouchableOpacity>

        <TouchableOpacity>
          <Ionicons name="search" size={24} color="#EAEAEA" />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={styles.title}>How’s your mood today?</Text>

      {/* Input Box */}
      <View style={styles.inputBox}>
        <TextInput
          placeholder="Type Instead."
          placeholderTextColor="#777"
          style={styles.input}
          multiline
        />

        <TouchableOpacity style={styles.sendBtn}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* 🔥 Animated Visualizer */}
      <View style={styles.visualizer}>
        {barAnims.map((anim, i) => (
          <View key={i} style={styles.barWrapper}>
            <Animated.View style={[styles.bar, { height: anim }]} />
            <Animated.View style={[styles.bar, { height: anim }]} />
          </View>
        ))}
      </View>

      {/* Mic Button */}
      <View style={styles.micWrapper}>
        <TouchableOpacity style={styles.micButton}>
          <MaterialIcons name="mic" size={36} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1C1C1C",
    paddingHorizontal: 20,
    paddingTop: 50,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    color: "#EAEAEA",
    fontSize: 34,
    fontWeight: "600",
    marginTop: 30,
    marginBottom: 30,
  },

  inputBox: {
    backgroundColor: "#111",
    borderRadius: 25,
    padding: 20,
    height: 240,
    justifyContent: "space-between",
  },

  input: {
    color: "#EAEAEA",
    fontSize: 16,
  },

  sendBtn: {
    alignSelf: "flex-end",
    backgroundColor: "#EAEAEA",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
  },

  sendText: {
    color: "#000",
    fontWeight: "600",
  },

  visualizer: {
    height: 100,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    gap: 6,
  },

  barWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },

  bar: {
    width: 6,
    backgroundColor: "#EAEAEA",
    borderRadius: 3,
    marginVertical: -2,
  },

  micWrapper: {
    alignItems: "center",
    marginTop: 40,
  },

  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#EAEAEA",
    justifyContent: "center",
    alignItems: "center",
  },
});
