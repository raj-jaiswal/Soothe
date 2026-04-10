import SootheLogo from "@/components/auth/SootheLogo";
import Feather from "@expo/vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";
const API_BASE = `${BACKEND_URL}api`;

const WAVE_HEIGHTS = [24, 38, 52, 44, 60, 44, 52, 38, 24];

const LoginScreen: React.FC = () => {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<"id" | "pw" | null>(null);
  const [errors, setErrors] = useState<{
    id?: string;
    pw?: string;
    general?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  // Spinner rotation
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (loading) {
      spinLoop.current = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      spinLoop.current.start();
    } else {
      spinLoop.current?.stop();
      spinAnim.setValue(0);
    }
  }, [loading]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const validate = () => {
    const e: { id?: string; pw?: string } = {};
    if (!identifier.trim()) e.id = "Enter your username";
    if (password.length < 6) e.pw = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: identifier, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Map server errors to the right field
        const msg: string = data.error ?? "Login failed";
        if (
          msg.toLowerCase().includes("password") ||
          msg.toLowerCase().includes("credentials")
        ) {
          setErrors({ pw: msg });
        } else if (
          msg.toLowerCase().includes("user") ||
          msg.toLowerCase().includes("found")
        ) {
          setErrors({ id: msg });
        } else if (
          msg.toLowerCase().includes("verify") ||
          msg.toLowerCase().includes("email")
        ) {
          setErrors({ general: msg });
        } else {
          setErrors({ general: msg });
        }
        return;
      }

      if (data.token) {
        await AsyncStorage.setItem("token", data.token);
      }

      router.replace("/(tabs)");
    } catch {
      setErrors({ general: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />

      <View style={styles.glowLeft} pointerEvents="none" />
      <View style={styles.glowRight} pointerEvents="none" />

      <View style={styles.waveRow} pointerEvents="none">
        {WAVE_HEIGHTS.map((h, i) => (
          <View
            key={i}
            style={[styles.waveBar, { height: h, opacity: 0.06 + i * 0.01 }]}
          />
        ))}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Animated.View
          style={[
            styles.inner,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <SootheLogo size={28} color="#a78bfa" />
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>
              Welcome{"\n"}
              <Text style={styles.titleAccent}>back</Text>
            </Text>
            <Text style={styles.subtitle}>Your music missed you 🎵</Text>
          </View>

          {/* General error banner */}
          {!!errors.general && (
            <View style={styles.errorBanner}>
              <Feather
                name="alert-circle"
                size={14}
                color="#ef4444"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.errorBannerText}>{errors.general}</Text>
            </View>
          )}

          {/* Identifier field */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Username</Text>
            <View
              style={[
                styles.inputRow,
                focusedField === "id" && styles.inputRowFocused,
                errors.id && styles.inputRowError,
              ]}
            >
              <Feather
                name="user"
                size={16}
                color={focusedField === "id" ? "#a78bfa" : "#555"}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="your_username or email"
                placeholderTextColor="#444"
                value={identifier}
                onChangeText={(v) => {
                  setIdentifier(v);
                  setErrors((e) => ({
                    ...e,
                    id: undefined,
                    general: undefined,
                  }));
                }}
                onFocus={() => setFocusedField("id")}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            {!!errors.id && <Text style={styles.errorText}>{errors.id}</Text>}
          </View>

          {/* Password field */}
          <View style={[styles.fieldWrapper, { marginTop: 16 }]}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View
              style={[
                styles.inputRow,
                focusedField === "pw" && styles.inputRowFocused,
                errors.pw && styles.inputRowError,
              ]}
            >
              <Feather
                name="lock"
                size={16}
                color={focusedField === "pw" ? "#a78bfa" : "#555"}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Your password"
                placeholderTextColor="#444"
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setErrors((e) => ({
                    ...e,
                    pw: undefined,
                    general: undefined,
                  }));
                }}
                onFocus={() => setFocusedField("pw")}
                onBlur={() => setFocusedField(null)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                activeOpacity={0.7}
                style={styles.eyeBtn}
              >
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={16}
                  color="#555"
                />
              </TouchableOpacity>
            </View>
            {!!errors.pw && <Text style={styles.errorText}>{errors.pw}</Text>}
          </View>

          {/* Forgot password */}
          <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Login button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.85 }]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            <LinearGradient
              colors={["#9333ea", "#7c3aed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.loginGradient}
            >
              {loading ? (
                <>
                  <Animated.View
                    style={{ transform: [{ rotate: spin }], marginRight: 10 }}
                  >
                    <Feather name="loader" size={18} color="#fff" />
                  </Animated.View>
                  <Text style={styles.loginText}>Logging in…</Text>
                </>
              ) : (
                <>
                  <Text style={styles.loginText}>Log In</Text>
                  <Feather
                    name="arrow-right"
                    size={18}
                    color="#fff"
                    style={{ marginLeft: 8 }}
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Switch to sign up */}
          <TouchableOpacity
            style={styles.signUpLink}
            onPress={() => router.replace("/signup")}
            activeOpacity={0.7}
          >
            <Text style={styles.signUpLinkText}>
              New here?{" "}
              <Text style={styles.signUpLinkAccent}>Create an account</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0f0f0f" },
  glowLeft: {
    position: "absolute",
    top: 100,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(139,92,246,0.14)",
  },
  glowRight: {
    position: "absolute",
    bottom: 120,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(109,40,217,0.12)",
  },
  waveRow: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
  },
  waveBar: {
    width: 14,
    backgroundColor: "#8B5CF6",
    borderRadius: 7,
    marginHorizontal: 5,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 48,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1e1e1e",
    alignItems: "center",
    justifyContent: "center",
  },
  titleSection: { marginBottom: 36 },
  title: {
    fontSize: 40,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1.2,
    lineHeight: 48,
    marginBottom: 8,
  },
  titleAccent: { color: "#a78bfa" },
  subtitle: { fontSize: 14, color: "#666" },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorBannerText: { fontSize: 13, color: "#ef4444", flex: 1 },

  fieldWrapper: { gap: 6 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#2a2a2a",
    paddingHorizontal: 14,
    height: 54,
  },
  inputRowFocused: { borderColor: "#7c3aed", backgroundColor: "#1c1628" },
  inputRowError: { borderColor: "#ef4444" },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: "#FFFFFF", fontSize: 15 },
  eyeBtn: { padding: 4 },
  errorText: { fontSize: 11, color: "#ef4444", marginLeft: 4 },

  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: 10,
    marginBottom: 28,
    padding: 4,
  },
  forgotText: { fontSize: 13, color: "#a78bfa", fontWeight: "600" },

  loginBtn: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    marginBottom: 24,
  },
  loginGradient: {
    paddingVertical: 17,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    borderRadius: 16,
  },
  loginText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#2a2a2a" },
  dividerText: { fontSize: 12, color: "#555", fontWeight: "500" },

  signUpLink: { alignItems: "center", padding: 8 },
  signUpLinkText: { fontSize: 14, color: "#666" },
  signUpLinkAccent: { color: "#a78bfa", fontWeight: "700" },
});

export default LoginScreen;
