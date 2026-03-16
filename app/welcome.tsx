import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";

const logoXml = `<svg width="175" height="166" viewBox="0 0 175 166" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="80.1724" y="30.9236" width="13.8406" height="134.6" rx="6.92032" fill="white"/>
<rect width="13.8406" height="132.094" rx="6.92032" transform="matrix(-1 0 0 1 73.9698 15.7471)" fill="white"/>
<rect x="100.215" y="15.7471" width="13.8406" height="132.094" rx="6.92032" fill="white"/>
<rect width="13.8406" height="128.08" rx="6.92032" transform="matrix(-1 0 0 1 53.9269 0)" fill="white"/>
<rect x="120.258" width="13.8406" height="128.08" rx="6.92032" fill="white"/>
<rect width="13.8406" height="106.288" rx="6.92032" transform="matrix(-1 0 0 1 33.8839 0)" fill="white"/>
<rect x="140.301" width="13.8406" height="106.288" rx="6.92032" fill="white"/>
<rect width="13.8406" height="63.0462" rx="6.92032" transform="matrix(-1 0 0 1 13.8406 12.2572)" fill="white"/>
<rect x="160.345" y="12.2572" width="13.8406" height="63.0462" rx="6.92032" fill="white"/>
</svg>`;

const WelcomeScreen: React.FC = () => {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    "Poppins-Bold": require("@/assets/fonts/Poppins-Bold.ttf"),
    CalligraphyBrilliant: require("@/assets/fonts/CalligraphyBrilliant.otf"),
  });

  const topAnim = useRef(new Animated.Value(0)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const btnsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.spring(topAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 55,
        friction: 9,
      }),
      Animated.spring(taglineAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 55,
        friction: 9,
      }),
      Animated.spring(btnsAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 55,
        friction: 9,
      }),
    ]).start();
  }, []);

  const fadeUp = (anim: Animated.Value, offset = 36) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [offset, 0],
        }),
      },
    ],
  });

  const poppins = fontsLoaded ? "Poppins-Bold" : undefined;
  const calligraphy = fontsLoaded ? "CalligraphyBrilliant" : undefined;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Subtle purple glow */}
      <View style={styles.glowBlob} pointerEvents="none" />

      {/* ── TOP: Logo + brand name ── */}
      <Animated.View style={[styles.topSection, fadeUp(topAnim, 24)]}>
        <Text style={[styles.brandName, { fontFamily: poppins }]}>Sooothe</Text>
        <SvgXml xml={logoXml} width={102} height={98} />
      </Animated.View>

      {/* ── MIDDLE: spacer ── */}
      <View style={styles.spacer} />

      {/* ── BOTTOM CONTENT: welcome + tagline + buttons ── */}
      <View style={styles.bottomContent}>
        {/* Welcome label */}
        <Animated.View style={fadeUp(taglineAnim, 20)}>
          <Text style={styles.welcomeLabel}>Welcome</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={[styles.taglineBlock, fadeUp(taglineAnim, 28)]}>
          <Text style={[styles.taglineBold, { fontFamily: poppins }]}>
            EXPERIENCE THE
          </Text>

          <View style={styles.taglineLine2}>
            <Text style={[styles.taglineScript, { fontFamily: calligraphy }]}>
              Vibes{" "}
            </Text>
            <Text style={[styles.taglineBold, { fontFamily: poppins }]}>
              TUNED JUST
            </Text>
          </View>

          <Text style={[styles.taglineBold, { fontFamily: poppins }]}>
            FOR YOU
          </Text>
        </Animated.View>

        {/* Buttons */}
        <Animated.View style={[styles.buttons, fadeUp(btnsAnim, 24)]}>
          <TouchableOpacity
            style={styles.signUpBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/signup")}
          >
            <LinearGradient
              colors={["#b94fff", "#a339ff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.signUpGradient}
            >
              <Text style={[styles.signUpText, { fontFamily: poppins }]}>
                Create Account
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginBtn}
            activeOpacity={0.75}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.loginText}>
              Already have an account?{" "}
              <Text style={styles.loginAccent}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  glowBlob: {
    position: "absolute",
    bottom: 160,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(163,57,255,0.12)",
  },
  topSection: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 120,
    gap: 12,
  },
  brandName: {
    fontSize: 52,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  spacer: {
    flex: 1,
  },
  bottomContent: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  welcomeLabel: {
    fontSize: 15,
    color: "#a339ff",
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  taglineBlock: {
    marginBottom: 36,
  },
  taglineBold: {
    fontSize: 38,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    lineHeight: 46,
  },
  taglineLine2: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  taglineScript: {
    fontSize: 46,
    color: "#FFFFFF",
    lineHeight: 52,
    includeFontPadding: false,
  },
  buttons: {
    gap: 12,
  },
  signUpBtn: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#a339ff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  signUpGradient: {
    paddingVertical: 17,
    alignItems: "center",
    borderRadius: 16,
  },
  signUpText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  loginBtn: {
    paddingVertical: 14,
    alignItems: "center",
  },
  loginText: {
    fontSize: 14,
    color: "#666",
  },
  loginAccent: {
    color: "#a339ff",
    fontWeight: "700",
  },
});

export default WelcomeScreen;