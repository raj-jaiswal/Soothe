import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import SootheLogo from '@/components/auth/SootheLogo';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  icon: keyof typeof Feather.glyphMap;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  secureTextEntry?: boolean;
  maxLength?: number;
}

const FIELDS: FieldConfig[] = [
  { key: 'name',     label: 'Full Name',  placeholder: 'Your full name',           icon: 'user'     },
  { key: 'username', label: 'Username',   placeholder: 'Pick a unique handle',     icon: 'at-sign'  },
  { key: 'email',    label: 'Email',      placeholder: 'your@email.com',           icon: 'mail',    keyboardType: 'email-address' },
  { key: 'password', label: 'Password',   placeholder: 'Create a strong password', icon: 'lock',    secureTextEntry: true },
];

// ─── OTP Modal ────────────────────────────────────────────────────────────────

interface OtpModalProps {
  visible: boolean;
  username: string;
  onVerified: () => void;
  onClose: () => void;
}

const OtpModal: React.FC<OtpModalProps> = ({ visible, username, onVerified, onClose }) => {
  const [otp, setOtp]           = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  // Reset state whenever the modal reopens
  useEffect(() => {
    if (visible) { setOtp(''); setError(''); setSuccess(false); setLoading(false); }
  }, [visible]);

  const handleVerify = async () => {
    if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, otp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Verification failed'); return; }
      setSuccess(true);
      // Short success flash, then navigate
      setTimeout(onVerified, 700);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          {/* Close */}
          <TouchableOpacity style={modal.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Feather name="x" size={18} color="#888" />
          </TouchableOpacity>

          {/* Icon */}
          <View style={modal.iconWrap}>
            <LinearGradient colors={['#9333ea', '#7c3aed']} style={modal.iconGradient}>
              <Feather name="mail" size={22} color="#fff" />
            </LinearGradient>
          </View>

          <Text style={modal.heading}>Check your email</Text>
          <Text style={modal.subheading}>
            We sent a 6-digit code to your email.{'\n'}It expires in 5 minutes.
          </Text>

          {/* OTP input */}
          <View style={[modal.inputRow, error ? modal.inputRowError : null]}>
            <Feather name="shield" size={16} color={error ? '#ef4444' : '#a78bfa'} style={{ marginRight: 10 }} />
            <TextInput
              style={modal.input}
              placeholder="000000"
              placeholderTextColor="#444"
              value={otp}
              onChangeText={(v) => { setOtp(v.replace(/\D/g, '').slice(0, 6)); setError(''); }}
              keyboardType="numeric"
              maxLength={6}
              autoFocus
            />
          </View>
          {!!error && <Text style={modal.errorText}>{error}</Text>}

          {/* Verify button */}
          <TouchableOpacity
            style={modal.verifyBtn}
            onPress={handleVerify}
            activeOpacity={0.85}
            disabled={loading || success}
          >
            <LinearGradient
              colors={success ? ['#22c55e', '#16a34a'] : ['#9333ea', '#7c3aed']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={modal.verifyGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : success ? (
                <>
                  <Feather name="check-circle" size={17} color="#fff" />
                  <Text style={[modal.verifyText, { marginLeft: 8 }]}>Verified!</Text>
                </>
              ) : (
                <Text style={modal.verifyText}>Verify OTP</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const SignUpScreen: React.FC = () => {
  const router = useRouter();
  const [form, setForm]                 = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors]             = useState<Record<string, string>>({});
  const [loading, setLoading]           = useState(false);
  const [otpVisible, setOtpVisible]     = useState(false);

  // Spinner rotation
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinLoop  = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (loading) {
      spinLoop.current = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true,
        })
      );
      spinLoop.current.start();
    } else {
      spinLoop.current?.stop();
      spinAnim.setValue(0);
    }
  }, [loading]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name?.trim())              e.name     = 'Name is required';
    if (!form.username?.trim())          e.username = 'Username is required';
    if (!form.email?.includes('@'))      e.email    = 'Enter a valid email';
    if ((form.password?.length ?? 0) < 6) e.password = 'Min 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullname: form.name,
          username: form.username,
          email:    form.email,
          password: form.password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Surface server-side field errors
        if (data.error?.toLowerCase().includes('username')) {
          setErrors((prev) => ({ ...prev, username: data.error }));
        } else if (data.error?.toLowerCase().includes('email')) {
          setErrors((prev) => ({ ...prev, email: data.error }));
        } else {
          setErrors((prev) => ({ ...prev, name: data.error ?? 'Signup failed' }));
        }
        return;
      }

      // Success → show OTP modal
      setOtpVisible(true);
    } catch {
      setErrors((prev) => ({ ...prev, name: 'Network error. Please try again.' }));
    } finally {
      setLoading(false);
    }
  };

  const handleVerified = () => {
    setOtpVisible(false);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />

      {/* Purple glow */}
      <View style={styles.glowTop} pointerEvents="none" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <Feather name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <SootheLogo size={28} color="#a78bfa" />
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>
              Create your{'\n'}
              <Text style={styles.titleAccent}>account</Text>
            </Text>
            <Text style={styles.subtitle}>Join millions finding their perfect sound</Text>
          </View>

          {/* Fields */}
          <View style={styles.form}>
            {FIELDS.map((field) => {
              const isFocused  = focusedField === field.key;
              const hasError   = !!errors[field.key];
              const isPassword = field.key === 'password';

              return (
                <View key={field.key} style={styles.fieldWrapper}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <View style={[
                    styles.inputRow,
                    isFocused && styles.inputRowFocused,
                    hasError  && styles.inputRowError,
                  ]}>
                    <Feather
                      name={field.icon}
                      size={16}
                      color={isFocused ? '#a78bfa' : '#555'}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder={field.placeholder}
                      placeholderTextColor="#444"
                      value={form[field.key] ?? ''}
                      onChangeText={(val) => {
                        setForm((prev) => ({ ...prev, [field.key]: val }));
                        if (errors[field.key]) setErrors((e) => ({ ...e, [field.key]: '' }));
                      }}
                      onFocus={() => setFocusedField(field.key)}
                      onBlur={() => setFocusedField(null)}
                      keyboardType={field.keyboardType ?? 'default'}
                      secureTextEntry={isPassword && !showPassword}
                      maxLength={field.maxLength}
                      autoCapitalize={
                        field.key === 'email' || field.key === 'username' || field.key === 'password'
                          ? 'none'
                          : 'words'
                      }
                    />
                    {isPassword && (
                      <TouchableOpacity onPress={() => setShowPassword((v) => !v)} activeOpacity={0.7} style={styles.eyeBtn}>
                        <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color="#555" />
                      </TouchableOpacity>
                    )}
                  </View>
                  {hasError && <Text style={styles.errorText}>{errors[field.key]}</Text>}
                </View>
              );
            })}
          </View>

          {/* Create Account button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.85 }]}
            onPress={handleSignUp}
            activeOpacity={0.85}
            disabled={loading}
          >
            <LinearGradient
              colors={['#9333ea', '#7c3aed']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.submitGradient}
            >
              {loading ? (
                <>
                  <Animated.View style={{ transform: [{ rotate: spin }], marginRight: 10 }}>
                    <Feather name="loader" size={18} color="#fff" />
                  </Animated.View>
                  <Text style={styles.submitText}>Creating account…</Text>
                </>
              ) : (
                <>
                  <Text style={styles.submitText}>Create Account</Text>
                  <Feather name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Already have account */}
          <TouchableOpacity style={styles.switchLink} onPress={() => router.replace('/login')} activeOpacity={0.7}>
            <Text style={styles.switchText}>
              Already have an account?{' '}
              <Text style={styles.switchAccent}>Log in</Text>
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* OTP Modal */}
      <OtpModal
        visible={otpVisible}
        username={form.username ?? ''}
        onVerified={handleVerified}
        onClose={() => setOtpVisible(false)}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea:         { flex: 1, backgroundColor: '#0f0f0f' },
  glowTop:          { position: 'absolute', top: -60, right: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(139,92,246,0.18)' },
  scroll:           { paddingHorizontal: 24, paddingTop: 8 },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, paddingTop: 4 },
  backBtn:          { width: 40, height: 40, borderRadius: 12, backgroundColor: '#1e1e1e', alignItems: 'center', justifyContent: 'center' },
  titleSection:     { marginBottom: 32 },
  title:            { fontSize: 34, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1, lineHeight: 42, marginBottom: 8 },
  titleAccent:      { color: '#a78bfa' },
  subtitle:         { fontSize: 14, color: '#666', lineHeight: 20 },
  form:             { gap: 16, marginBottom: 24 },
  fieldWrapper:     { gap: 6 },
  fieldLabel:       { fontSize: 12, fontWeight: '600', color: '#888', letterSpacing: 0.5, textTransform: 'uppercase' },
  inputRow:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 14, borderWidth: 1.5, borderColor: '#2a2a2a', paddingHorizontal: 14, height: 52 },
  inputRowFocused:  { borderColor: '#7c3aed', backgroundColor: '#1c1628' },
  inputRowError:    { borderColor: '#ef4444' },
  inputIcon:        { marginRight: 10 },
  input:            { flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '400' },
  eyeBtn:           { padding: 4 },
  errorText:        { fontSize: 11, color: '#ef4444', marginLeft: 4 },
  submitBtn:        { borderRadius: 16, overflow: 'hidden', shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12, marginBottom: 16 },
  submitGradient:   { paddingVertical: 17, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', borderRadius: 16 },
  submitText:       { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
  switchLink:       { alignItems: 'center', paddingVertical: 8 },
  switchText:       { fontSize: 14, color: '#666' },
  switchAccent:     { color: '#a78bfa', fontWeight: '700' },
});

const modal = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet:          { backgroundColor: '#161616', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40, alignItems: 'center', borderTopWidth: 1, borderColor: '#2a2a2a' },
  closeBtn:       { position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
  iconWrap:       { marginBottom: 16 },
  iconGradient:   { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  heading:        { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8, textAlign: 'center' },
  subheading:     { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  inputRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 14, borderWidth: 1.5, borderColor: '#2a2a2a', paddingHorizontal: 16, height: 54, width: '100%', marginBottom: 6 },
  inputRowError:  { borderColor: '#ef4444' },
  input:          { flex: 1, color: '#fff', fontSize: 22, fontWeight: '700', letterSpacing: 8 },
  errorText:      { fontSize: 12, color: '#ef4444', alignSelf: 'flex-start', marginBottom: 16, marginLeft: 4 },
  verifyBtn:      { borderRadius: 14, overflow: 'hidden', width: '100%', marginTop: 8, shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 10 },
  verifyGradient: { paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', borderRadius: 14 },
  verifyText:     { fontSize: 15, fontWeight: '700', color: '#fff' },
});

export default SignUpScreen;