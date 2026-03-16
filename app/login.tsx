import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import SootheLogo from '@/components/auth/SootheLogo';

const { width } = Dimensions.get('window');

// Mini waveform bars decoration
const WAVE_HEIGHTS = [24, 38, 52, 44, 60, 44, 52, 38, 24];

const LoginScreen: React.FC = () => {
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'id' | 'pw' | null>(null);
  const [errors, setErrors]         = useState<{ id?: string; pw?: string }>({});

  // Entrance animations
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const validate = () => {
    const newErrors: { id?: string; pw?: string } = {};
    if (!identifier.trim())    newErrors.id = 'Enter your username or email';
    if (password.length < 6)   newErrors.pw = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = () => {
    if (validate()) {
      console.log('Login with:', { identifier, password });
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />

      {/* Background purple glow blobs */}
      <View style={styles.glowLeft}  pointerEvents="none" />
      <View style={styles.glowRight} pointerEvents="none" />

      {/* Decorative waveform */}
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
              Welcome{'\n'}
              <Text style={styles.titleAccent}>back</Text>
            </Text>
            <Text style={styles.subtitle}>Your music missed you 🎵</Text>
          </View>

          {/* Identifier field */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Username or Email</Text>
            <View style={[
              styles.inputRow,
              focusedField === 'id' && styles.inputRowFocused,
              errors.id && styles.inputRowError,
            ]}>
              <Feather
                name="user"
                size={16}
                color={focusedField === 'id' ? '#a78bfa' : '#555'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="your_username or email"
                placeholderTextColor="#444"
                value={identifier}
                onChangeText={(v) => { setIdentifier(v); setErrors((e) => ({ ...e, id: undefined })); }}
                onFocus={() => setFocusedField('id')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            {errors.id && <Text style={styles.errorText}>{errors.id}</Text>}
          </View>

          {/* Password field */}
          <View style={[styles.fieldWrapper, { marginTop: 16 }]}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={[
              styles.inputRow,
              focusedField === 'pw' && styles.inputRowFocused,
              errors.pw && styles.inputRowError,
            ]}>
              <Feather
                name="lock"
                size={16}
                color={focusedField === 'pw' ? '#a78bfa' : '#555'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Your password"
                placeholderTextColor="#444"
                value={password}
                onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, pw: undefined })); }}
                onFocus={() => setFocusedField('pw')}
                onBlur={() => setFocusedField(null)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                activeOpacity={0.7}
                style={styles.eyeBtn}
              >
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color="#555" />
              </TouchableOpacity>
            </View>
            {errors.pw && <Text style={styles.errorText}>{errors.pw}</Text>}
          </View>

          {/* Forgot password */}
          <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Login button */}
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#9333ea', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.loginGradient}
            >
              <Text style={styles.loginText}>Log In</Text>
              <Feather name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
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
            onPress={() => router.replace('/signup')}
            activeOpacity={0.7}
          >
            <Text style={styles.signUpLinkText}>
              New here?{' '}
              <Text style={styles.signUpLinkAccent}>Create an account</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },

  /* Background decorations */
  glowLeft: {
    position: 'absolute',
    top: 100,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(139,92,246,0.14)',
  },
  glowRight: {
    position: 'absolute',
    bottom: 120,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(109,40,217,0.12)',
  },
  waveRow: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  waveBar: {
    width: 14,
    backgroundColor: '#8B5CF6',
    borderRadius: 7,
    marginHorizontal: 5,
  },

  /* Main content */
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    justifyContent: 'center',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 48,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1e1e1e',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Title */
  titleSection: {
    marginBottom: 36,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1.2,
    lineHeight: 48,
    marginBottom: 8,
  },
  titleAccent: {
    color: '#a78bfa',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },

  /* Fields */
  fieldWrapper: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#2a2a2a',
    paddingHorizontal: 14,
    height: 54,
  },
  inputRowFocused: {
    borderColor: '#7c3aed',
    backgroundColor: '#1c1628',
  },
  inputRowError: {
    borderColor: '#ef4444',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  eyeBtn: {
    padding: 4,
  },
  errorText: {
    fontSize: 11,
    color: '#ef4444',
    marginLeft: 4,
  },

  /* Forgot */
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginBottom: 28,
    padding: 4,
  },
  forgotText: {
    fontSize: 13,
    color: '#a78bfa',
    fontWeight: '600',
  },

  /* Login button */
  loginBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    marginBottom: 24,
  },
  loginGradient: {
    paddingVertical: 17,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderRadius: 16,
  },
  loginText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  /* Divider */
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2a2a2a',
  },
  dividerText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },

  /* Sign up link */
  signUpLink: {
    alignItems: 'center',
    padding: 8,
  },
  signUpLinkText: {
    fontSize: 14,
    color: '#666',
  },
  signUpLinkAccent: {
    color: '#a78bfa',
    fontWeight: '700',
  },
});

export default LoginScreen;
