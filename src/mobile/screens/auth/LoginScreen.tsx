import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Animated, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react-native';
import { loginSchema, type LoginForm } from '@/schemas/auth.schema';
import { useAuthStore } from '@/store/useAuthStore';

const logoImage = require('../../../assets/home/kaamasaan-cart.png');

type LoginFieldProps = TextInputProps & {
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  error?: string;
  inputRef?: React.Ref<TextInput>;
  secure?: boolean;
};

const LoginField = ({
  label,
  Icon,
  error,
  inputRef,
  secure,
  ...props
}: LoginFieldProps) => {
  const [visible, setVisible] = useState(false);
  const isSecure = secure && !visible;

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, error && styles.inputWrapError]}>
        <View style={styles.inputIcon}>
          <Icon size={16} color="#C28B00" strokeWidth={2.2} />
        </View>
        <TextInput
          {...props}
          ref={inputRef}
          defaultValue=""
          secureTextEntry={isSecure}
          placeholderTextColor="#A7B0BE"
          style={styles.input}
        />
        {secure ? (
          <Pressable style={styles.eyeButton} onPress={() => setVisible((next) => !next)} accessibilityLabel={visible ? 'Hide password' : 'Show password'}>
            {visible ? <EyeOff size={17} color="#8B97A8" strokeWidth={2.1} /> : <Eye size={17} color="#8B97A8" strokeWidth={2.1} />}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const AuthMessage = ({ text, tone = 'error' }: { text?: string | null; tone?: 'error' | 'success' }) => (
  text ? <Text style={[styles.message, tone === 'success' && styles.messageSuccess]}>{text}</Text> : null
);

const AnimatedSignInButton = ({ loading, onPress }: { loading?: boolean; onPress: () => void }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      friction: 6,
      tension: 120,
      useNativeDriver: true
    }).start();
  };

  return (
    <Animated.View style={[styles.buttonShadow, { transform: [{ scale }] }]}>
      <Pressable
        disabled={loading}
        onPress={onPress}
        onPressIn={() => animateTo(0.98)}
        onPressOut={() => animateTo(1)}
        style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
      >
        <View style={styles.buttonGlow} />
        <Text style={styles.primaryButtonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
        <ArrowRight color="#172031" size={20} strokeWidth={2.6} style={styles.primaryButtonIcon} />
      </Pressable>
    </Animated.View>
  );
};

const SocialButton = ({ provider, icon, color }: { provider: string; icon: string; color: string }) => (
  <Pressable style={({ pressed }) => [styles.socialButton, pressed && styles.socialButtonPressed]}>
    <View style={[styles.socialIcon, { backgroundColor: `${color}12` }]}>
      <Text style={[styles.socialIconText, { color }]}>{icon}</Text>
    </View>
    <Text style={styles.socialText}>Continue with {provider}</Text>
  </Pressable>
);

export const LoginScreen = ({ navigation, route }: any) => {
  const signIn = useAuthStore((state) => state.signIn);
  const clearError = useAuthStore((state) => state.clearError);
  const storeError = useAuthStore((state) => state.error);
  const loading = useAuthStore((state) => state.loading);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginForm, string>>>({});
  const credentialsRef = useRef<LoginForm>({ email: '', password: '' });
  const passwordInputRef = useRef<TextInput>(null);
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, { toValue: 1, duration: 520, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 540, delay: 120, useNativeDriver: true }),
      Animated.spring(cardTranslate, { toValue: 0, friction: 8, tension: 70, delay: 120, useNativeDriver: true })
    ]).start();
    return () => clearError();
  }, [cardOpacity, cardTranslate, clearError, heroOpacity]);

  const submit = async () => {
    setError('');
    setFieldErrors({});

    const result = loginSchema.safeParse({
      email: credentialsRef.current.email.trim(),
      password: credentialsRef.current.password
    });

    if (!result.success) {
      const nextErrors = result.error.flatten().fieldErrors;
      setFieldErrors({
        email: nextErrors.email?.[0],
        password: nextErrors.password?.[0]
      });
      return;
    }

    try {
      const { email, password } = result.data;
      await signIn(email, password);
      navigation.replace(route.params?.redirectTo ?? 'MainTabs');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Invalid email or password.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView enabled={Platform.OS === 'ios'} style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="always"
          removeClippedSubviews={false}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.hero, { opacity: heroOpacity }]}>
            <View style={styles.logoCircle}>
              <Image source={logoImage} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.appName}>KaamAsaan</Text>
            <Text style={styles.tagline}>Pakistan's No.1 Solar Marketplace</Text>
            <View style={styles.goldDivider} />
          </Animated.View>

          <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ translateY: cardTranslate }] }]}>
            <AuthMessage text={route.params?.message} tone="success" />
            <AuthMessage text={error || storeError} />

            <LoginField
              label="Email Address"
              Icon={Mail}
              error={fieldErrors.email}
              placeholder="your email@example.com"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              blurOnSubmit={false}
              keyboardType="email-address"
              onChangeText={(value) => {
                credentialsRef.current.email = value;
              }}
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              returnKeyType="next"
              textContentType={Platform.OS === 'ios' ? 'emailAddress' : 'none'}
            />
            <LoginField
              label="Password"
              Icon={LockKeyhole}
              error={fieldErrors.password}
              inputRef={passwordInputRef}
              placeholder="••••••••"
              autoCapitalize="none"
              autoComplete="password"
              onChangeText={(value) => {
                credentialsRef.current.password = value;
              }}
              onSubmitEditing={submit}
              returnKeyType="done"
              textContentType={Platform.OS === 'ios' ? 'password' : 'none'}
              secure
            />

            <AnimatedSignInButton loading={loading} onPress={submit} />

            <View style={styles.securityNote}>
              <ShieldCheck color="#7C8797" size={13} strokeWidth={2.2} />
              <Text style={styles.securityText}>Secure login • Your data is protected</Text>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialStack}>
              <SocialButton provider="Google" icon="G" color="#4285F4" />
              <SocialButton provider="Facebook" icon="f" color="#1877F2" />
            </View>

            <Pressable style={styles.forgotButton} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </Pressable>

            <View style={styles.signupRow}>
              <Text style={styles.signupMuted}>Don't have an account?</Text>
              <Pressable onPress={() => navigation.navigate('Signup', { redirectTo: route.params?.redirectTo })}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </Pressable>
            </View>
          </Animated.View>

          <Text style={styles.footer}>Powering Smart Solar Decisions</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F3E8'
  },
  fill: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14
  },
  hero: {
    alignItems: 'center',
    marginBottom: 14
  },
  logoCircle: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7E2',
    borderWidth: 1,
    borderColor: '#F4D67E',
    shadowColor: '#8C6A16',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5
  },
  logo: {
    width: 42,
    height: 42
  },
  appName: {
    marginTop: 10,
    color: '#172031',
    fontSize: 30,
    fontWeight: '900'
  },
  tagline: {
    marginTop: 5,
    color: '#7A8596',
    fontSize: 12.5,
    fontWeight: '800'
  },
  goldDivider: {
    width: 24,
    height: 3,
    borderRadius: 99,
    backgroundColor: '#F5C542',
    marginTop: 10
  },
  card: {
    width: '91%',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EFE3CF',
    backgroundColor: '#FFFFFF',
    padding: 20,
    shadowColor: '#403622',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 9
  },
  fieldBlock: {
    marginBottom: 12
  },
  label: {
    color: '#172031',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 8
  },
  inputWrap: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E4DDD2',
    backgroundColor: '#FFFDF8',
    paddingHorizontal: 12
  },
  inputWrapFocused: {
    borderColor: '#F5C542',
    backgroundColor: '#FFFBF0',
    shadowColor: '#F5C542',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 2
  },
  inputWrapError: {
    borderColor: '#E46B61'
  },
  inputIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF4CE'
  },
  input: {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: 10,
    color: '#172031',
    fontSize: 14.5,
    fontWeight: '800'
  },
  eyeButton: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center'
  },
  errorText: {
    marginTop: 5,
    color: '#C2413B',
    fontSize: 10.5,
    fontWeight: '800'
  },
  message: {
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    padding: 10,
    color: '#B42318',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17
  },
  messageSuccess: {
    backgroundColor: '#ECFDF3',
    color: '#027A48'
  },
  buttonShadow: {
    marginTop: 4,
    shadowColor: '#9A6C00',
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6
  },
  primaryButton: {
    height: 54,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4BF22'
  },
  primaryButtonDisabled: {
    opacity: 0.65
  },
  buttonGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 27,
    backgroundColor: '#FFD95A'
  },
  primaryButtonText: {
    color: '#172031',
    fontSize: 15.5,
    fontWeight: '900'
  },
  primaryButtonIcon: {
    position: 'absolute',
    right: 18
  },
  securityNote: {
    marginTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5
  },
  securityText: {
    color: '#7C8797',
    fontSize: 10.5,
    fontWeight: '800'
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 17,
    marginBottom: 12
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EFE7DA'
  },
  dividerText: {
    color: '#99A2AF',
    fontSize: 10.5,
    fontWeight: '900'
  },
  socialStack: {
    gap: 9
  },
  socialButton: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8DFD2',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6A5A3B',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3
  },
  socialButtonPressed: {
    transform: [{ scale: 0.99 }],
    backgroundColor: '#FFFCF5'
  },
  socialIcon: {
    position: 'absolute',
    left: 15,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  socialIconText: {
    fontSize: 16,
    fontWeight: '900'
  },
  socialText: {
    color: '#273449',
    fontSize: 13.5,
    fontWeight: '900'
  },
  forgotButton: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11
  },
  forgotText: {
    color: '#7D8796',
    fontSize: 12,
    fontWeight: '900'
  },
  signupRow: {
    borderTopWidth: 1,
    borderTopColor: '#EFE7DA',
    paddingTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  signupMuted: {
    color: '#3C475A',
    fontSize: 12,
    fontWeight: '800'
  },
  signupLink: {
    color: '#0F70D7',
    fontSize: 12,
    fontWeight: '900'
  },
  footer: {
    marginTop: 12,
    textAlign: 'center',
    color: '#7D735F',
    fontSize: 11,
    fontWeight: '900'
  }
});
