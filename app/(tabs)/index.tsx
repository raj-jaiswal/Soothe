import { useAppTheme } from "@/components/context/ThemeContext"; // <-- ADJUST PATH IF NEEDED
import { ActiveMoodCard } from "@/components/index/ActiveMoodCard";
import MoodPlayerScreen from "@/components/index/MoodPlayerScreen";
import { useSongPlayer } from "@/components/index/SongPlayerContext";
import { SpinWheel, WHEEL_RADIUS } from "@/components/index/SpinWheel";
import { MOODS } from "@/constants/moods";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";

import {
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CARD_HEIGHT = 72;
const PILL_VERTICAL_OFFSET = -60;
const MAX_RECENT = 10;
const MAX_SHOWN = 7;

export default function HomeScreen() {
  const { setAppMood } = useAppTheme();
  const router = useRouter();
  const { openSong } = useSongPlayer();

  const [username, setUsername] = useState("");
  const [greeting, setGreeting] = useState("Hello");

  const [activeIndex, setActiveIndex] = useState(3);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [headerBottom, setHeaderBottom] = useState(60);
  const [playerMood, setPlayerMood] = useState<{
    id: string;
    label: string;
  } | null>(null);

  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);
  const activeMood = MOODS[activeIndex];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/welcome");
        return;
      }

      try {
        const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";
        const API_BASE = `${BACKEND_URL}`;

        let res = await fetch(`${API_BASE}auth/verify-token`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          await AsyncStorage.removeItem("token");
          router.replace("/welcome");
          return;
        }

        res = await fetch(`${BACKEND_URL}user/me`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setUsername(data.fullname.split(' ')[0]);
        setGreeting(getGreeting());
      } catch (err) {
        console.log("Auth check failed:", err);
        // DO NOT redirect here
      }
    };

    checkAuth();
  }, []);

  // ✅ CLOSE SEARCH WHEN LEAVING SCREEN
  useFocusEffect(
    useCallback(() => {
      return () => {
        setSearchOpen(false);
        setSearchText("");
        dropdownAnim.setValue(0);
      };
    }, []),
  );

  const pillTop = WHEEL_RADIUS - CARD_HEIGHT / 2 + PILL_VERTICAL_OFFSET;
  const pillLeft = SCREEN_WIDTH - WHEEL_RADIUS;

  const openSearch = () => {
    setSearchOpen(true);
    Animated.spring(dropdownAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchText("");
    dropdownAnim.setValue(0);
    Keyboard.dismiss();
  };

  const submitSearch = () => {
    const trimmed = searchText.trim();
    if (!trimmed) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== trimmed);
      const updated = [trimmed, ...filtered];
      if (updated.length > MAX_RECENT) updated.pop();
      return updated;
    });

    closeSearch();
  };

  const deleteRecent = (item: string) => {
    setRecentSearches((prev) => prev.filter((s) => s !== item));
  };

  const selectRecent = (item: string) => {
    setSearchText(item);
    inputRef.current?.focus();
  };

  const dropdownOpacity = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const dropdownTranslateY = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0],
  });

  const openPlayer = () => {
    setPlayerMood({ id: activeMood.id, label: activeMood.label });
  };

  if (playerMood) {
    return (
      <MoodPlayerScreen
        moodId={playerMood.id}
        moodLabel={playerMood.label}
        onBack={() => setPlayerMood(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1E" />

      {/* tap outside closes search */}
      {searchOpen && (
        <TouchableWithoutFeedback onPress={closeSearch}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>
      )}

      <View
        style={styles.header}
        onLayout={(e) => {
          const { y, height } = e.nativeEvent.layout;
          setHeaderBottom(y + height);
        }}
      >
        {searchOpen ? (
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#888" />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search moods..."
              placeholderTextColor="#666"
              returnKeyType="search"
              onSubmitEditing={submitSearch}
              autoCorrect={false}
              autoFocus={true}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Ionicons name="close-circle" size={18} color="#888" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={closeSearch}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View>
              <Text style={styles.greeting}>
                {greeting} <Text style={styles.greetingBold}>{username}</Text>
              </Text>
              <Text style={styles.subtitle}>How's your mood today?</Text>
            </View>

            <TouchableOpacity onPress={() => router.push("/search")}>
              <Feather name="search" size={24} color="white" />
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.wheelArea}>
        <SpinWheel
          moods={MOODS}
          activeIndex={activeIndex}
          onIndexChange={setActiveIndex}
          onSettle={(index) => setAppMood(MOODS[index])}
        />
        <View style={[styles.pillOverlay, { top: pillTop, left: pillLeft }]}>
          <ActiveMoodCard mood={activeMood} onPlay={openPlayer} />
        </View>
      </View>

      {searchOpen && recentSearches.length > 0 && (
        <TouchableWithoutFeedback>
          <Animated.View
            style={[
              styles.dropdown,
              {
                top: headerBottom + 4,
                opacity: dropdownOpacity,
                transform: [{ translateY: dropdownTranslateY }],
              },
            ]}
          >
            <FlatList
              data={recentSearches.slice(0, MAX_SHOWN)}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.recentItem}
                  onPress={() => selectRecent(item)}
                >
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.recentText}>{item}</Text>
                  <TouchableOpacity onPress={() => deleteRecent(item)}>
                    <Ionicons name="close" size={16} color="#555" />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
          </Animated.View>
        </TouchableWithoutFeedback>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1C1C1E" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 56,
    zIndex: 10,
  },
  greeting: {
    fontSize: 22,
    color: "#FFFFFF",
    fontWeight: "400",
    letterSpacing: 0.3,
  },
  greetingBold: { fontWeight: "700" },
  subtitle: {
    fontSize: 13,
    color: "#888888",
    marginTop: 2,
    letterSpacing: 0.2,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: { flex: 1, color: "#FFFFFF", fontSize: 16 },
  cancelText: { color: "#888", fontSize: 15 },
  wheelArea: { flex: 1, overflow: "hidden", position: "relative" },
  pillOverlay: {
    position: "absolute",
    right: 16,
    height: CARD_HEIGHT + 120,
    justifyContent: "center",
  },
  dropdown: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "#2A2A2A",
    borderRadius: 14,
    zIndex: 200,
    overflow: "hidden",
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  recentText: { flex: 1, color: "#FFFFFF", fontSize: 15 },
});
