import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const partialRef = useRef("");

  const barAnims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(10)),
  ).current;

  const micPulse = useRef(new Animated.Value(1)).current;

  // ✅ USEFOCUSEFFECT: Only runs when the user is actively looking at this screen!
  useFocusEffect(
    useCallback(() => {
      let isActive = true; // Flag to stop recursive loops cleanly

      barAnims.forEach((anim, i) => {
        const animate = () => {
          if (!isActive) return; // Kills the loop if we left the screen

          Animated.sequence([
            Animated.timing(anim, {
              toValue: Math.random() * 35 + 15,
              duration: 450 + i * 20,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: Math.random() * 10 + 10,
              duration: 450 + i * 15,
              useNativeDriver: false,
            }),
          ]).start(({ finished }) => {
            // Only continue the loop if it wasn't interrupted by navigating away
            if (finished && isActive) {
              animate();
            }
          });
        };
        animate();
      });

      // Cleanup function: runs the moment you navigate away
      return () => {
        isActive = false;
        barAnims.forEach((anim) => anim.stopAnimation());
      };
    }, []),
  );

  // Mic pulse animation
  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(micPulse, {
            toValue: 1.15,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(micPulse, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      micPulse.setValue(1);
    }
  }, [isRecording]);

  // --- Speech Recognition Logic ---
  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results[0]?.transcript ?? "";
    partialRef.current = transcript;
    setText((prev) => {
      const base = prev.replace(/ *\[.*?\]$/, "");
      return transcript ? `${base} [${transcript}]` : base;
    });
  });

  useSpeechRecognitionEvent("end", () => {
    setIsRecording(false);
    setText((prev) => {
      const final = partialRef.current;
      const base = prev.replace(/ *\[.*?\]$/, "");
      partialRef.current = "";
      if (!final) return base;
      return base ? `${base} ${final}` : final;
    });
  });

  useSpeechRecognitionEvent("error", (event) => {
    setIsRecording(false);
    setText((prev) => prev.replace(/ *\[.*?\]$/, ""));
    if (event.error !== "aborted") {
      Alert.alert(
        "Speech error",
        event.message ?? "Could not recognise speech.",
      );
    }
  });

  const handleMicPress = async () => {
    if (isRecording) {
      ExpoSpeechRecognitionModule.stop();
      setIsRecording(false);
      return;
    }

    const { granted } =
      await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      Alert.alert("Permission denied", "Microphone access is needed.");
      return;
    }

    partialRef.current = "";
    setIsRecording(true);

    ExpoSpeechRecognitionModule.start({
      lang: "en-US",
      interimResults: true,
      continuous: false,
      requiresOnDeviceRecognition: false,
    });
  };

  const handleSearchMood = async () => {
    const cleanText = text.replace(/ *\[.*?\]$/, "").trim();
    if (!cleanText) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      let backendUrl =
        process.env.EXPO_PUBLIC_BACKEND_URL || "http://192.168.1.100:3000";
      backendUrl = backendUrl.replace(/\/+$/, "").replace(/\/api$/, "");

      const response = await fetch(`${backendUrl}/api/songs/suggest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: cleanText }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push({
          pathname: "/mood-results",
          params: {
            songs: JSON.stringify(data.suggestions),
            moodScores: JSON.stringify(data.moodScores || {}),
            moodText: cleanText,
          },
        });
        setText("");
      } else {
        Alert.alert("Error", data.error || "Failed to find songs");
      }
    } catch (error) {
      Alert.alert("Error", "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.navigate("index" as never)}>
          <Ionicons name="chevron-back" size={28} color="#EAEAEA" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="search" size={24} color="#EAEAEA" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>How's your mood today?</Text>

      <View style={styles.inputBox}>
        <TextInput
          placeholder="Type or tap the mic to speak…"
          placeholderTextColor="#777"
          style={styles.input}
          multiline
          value={text}
          onChangeText={setText}
          editable={!isRecording}
        />
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={handleSearchMood}
          disabled={loading || isRecording}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.sendText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.visualizer}>
        {barAnims.map((anim, i) => (
          <View key={i} style={styles.barWrapper}>
            <Animated.View style={[styles.bar, { height: anim }]} />
            <Animated.View style={[styles.bar, { height: anim }]} />
          </View>
        ))}
      </View>

      <View style={styles.micWrapper}>
        <Animated.View style={{ transform: [{ scale: micPulse }] }}>
          <TouchableOpacity
            style={[styles.micButton, isRecording && styles.micButtonRecording]}
            onPress={handleMicPress}
          >
            <MaterialIcons
              name={isRecording ? "stop" : "mic"}
              size={36}
              color="#000"
            />
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.micHint}>
          {isRecording ? "Tap to stop" : "Tap to speak"}
        </Text>
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
    flex: 1,
    textAlignVertical: "top",
  },
  sendBtn: {
    alignSelf: "flex-end",
    backgroundColor: "#EAEAEA",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 70,
    alignItems: "center",
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
    marginVertical: -1,
  },
  micWrapper: {
    alignItems: "center",
    marginTop: 30,
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#EAEAEA",
    justifyContent: "center",
    alignItems: "center",
  },
  micButtonRecording: {
    backgroundColor: "#FF4D4D",
  },
  micHint: {
    color: "#888",
    fontSize: 12,
    marginTop: 8,
  },
});
