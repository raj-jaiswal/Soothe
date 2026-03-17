import React, { useState, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import SootheLogo from '@/components/auth/SootheLogo';

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
  { key: 'name',     label: 'Full Name',    placeholder: 'Your full name',        icon: 'user'      },
  { key: 'age',      label: 'Age',          placeholder: 'Your age',              icon: 'calendar', keyboardType: 'numeric', maxLength: 3 },
  { key: 'username', label: 'Username',     placeholder: 'Pick a unique handle',  icon: 'at-sign'   },
  { key: 'email',    label: 'Email',        placeholder: 'your@email.com',        icon: 'mail',     keyboardType: 'email-address' },
  { key: 'phone',    label: 'Phone',        placeholder: '+91 00000 00000',       icon: 'phone',    keyboardType: 'phone-pad' },
  { key: 'password', label: 'Password',     placeholder: 'Create a strong password', icon: 'lock',  secureTextEntry: true },
];

const SignUpScreen: React.FC = () => {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name?.trim())     newErrors.name     = 'Name is required';
    if (!form.age?.trim() || isNaN(Number(form.age)) || Number(form.age) < 1 || Number(form.age) > 120)
                                newErrors.age      = 'Enter a valid age';
    if (!form.username?.trim()) newErrors.username = 'Username is required';
    if (!form.email?.includes('@')) newErrors.email = 'Enter a valid email';
    if (!form.phone?.trim())    newErrors.phone    = 'Phone is required';
    if ((form.password?.length ?? 0) < 6) newErrors.password = 'Min 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = () => {
    if (validate()) {
      // TODO: connect to your auth backend
      console.log('Sign up with:', form);
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />

      {/* Purple glow top */}
      <View style={styles.glowTop} pointerEvents="none" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
            <Text style={styles.title}>Create your{'\n'}
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
                      autoCapitalize={field.key === 'email' || field.key === 'username' || field.key === 'password' ? 'none' : 'words'}
                    />
                    {isPassword && (
                      <TouchableOpacity
                        onPress={() => setShowPassword((v) => !v)}
                        activeOpacity={0.7}
                        style={styles.eyeBtn}
                      >
                        <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color="#555" />
                      </TouchableOpacity>
                    )}
                  </View>
                  {hasError && (
                    <Text style={styles.errorText}>{errors[field.key]}</Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* Sign Up button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSignUp}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#9333ea', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitGradient}
            >
              <Text style={styles.submitText}>Create Account</Text>
              <Feather name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Already have account */}
          <TouchableOpacity
            style={styles.switchLink}
            onPress={() => router.replace('/login')}
            activeOpacity={0.7}
          >
            <Text style={styles.switchText}>
              Already have an account?{' '}
              <Text style={styles.switchAccent}>Log in</Text>
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  glowTop: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(139,92,246,0.18)',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingTop: 4,
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
    marginBottom: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    lineHeight: 42,
    marginBottom: 8,
  },
  titleAccent: {
    color: '#a78bfa',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  /* Form */
  form: {
    gap: 16,
    marginBottom: 24,
  },
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
    height: 52,
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
    fontWeight: '400',
  },
  eyeBtn: {
    padding: 4,
  },
  errorText: {
    fontSize: 11,
    color: '#ef4444',
    marginLeft: 4,
  },

  /* Submit */
  submitBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    marginBottom: 16,
  },
  submitGradient: {
    paddingVertical: 17,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderRadius: 16,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  /* Switch link */
  switchLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchText: {
    fontSize: 14,
    color: '#666',
  },
  switchAccent: {
    color: '#a78bfa',
    fontWeight: '700',
  },
});

export default SignUpScreen;
