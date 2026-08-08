import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Animated, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { loginSchema, type LoginForm } from '@/schemas/auth.schema';
import { useAuthStore } from '@/store/useAuthStore';

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
          <Icon size={19} color="#D99A00" strokeWidth={2.2} />
        </View>
        <TextInput
          {...props}
          ref={inputRef}
          defaultValue=""
          secureTextEntry={isSecure}
          placeholderTextColor="#94A3B8"
          style={styles.input}
        />
        {secure ? (
          <Pressable style={styles.eyeButton} onPress={() => setVisible((next) => !next)} accessibilityLabel={visible ? 'Hide password' : 'Show password'}>
            {visible ? <EyeOff size={20} color="#8B97A8" strokeWidth={2.1} /> : <Eye size={20} color="#8B97A8" strokeWidth={2.1} />}
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
  const { t } = useTranslation();
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
        <Text style={styles.primaryButtonText}>{loading ? t('auth.login.signingIn') : t('auth.login.signIn')}</Text>
        <ArrowRight color="#0F172A" size={22} strokeWidth={2.6} style={styles.primaryButtonIcon} />
      </Pressable>
    </Animated.View>
  );
};

export const LoginScreen = ({ navigation, route }: any) => {
  const { t } = useTranslation();
  const signIn = useAuthStore((state) => state.signIn);
  const clearError = useAuthStore((state) => state.clearError);
  const storeError = useAuthStore((state) => state.error);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginForm, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    if (isSubmitting) return;

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

    setIsSubmitting(true);
    try {
      const { email, password } = result.data;
      await signIn(email, password);
      navigation.reset({
        index: 0,
        routes: [{ name: route.params?.redirectTo ?? 'MainTabs' }]
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('auth.login.invalid'));
    } finally {
      setIsSubmitting(false);
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
            <Text style={styles.loginHeading} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>
              <Text style={styles.headingDark}>Start your </Text>
              <Text style={styles.headingGold}>solar journey!</Text>
            </Text>
            <Text style={styles.tagline}>Sign in or create your account to continue</Text>
            <View style={styles.goldDivider} />
          </Animated.View>

          <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ translateY: cardTranslate }] }]}>
            <AuthMessage text={route.params?.message} tone="success" />
            <AuthMessage text={error || storeError} />

            <LoginField
              label={t('auth.login.email')}
              Icon={Mail}
              error={fieldErrors.email}
              placeholder={t('auth.login.emailPlaceholder')}
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
              label={t('auth.login.password')}
              Icon={LockKeyhole}
              error={fieldErrors.password}
              inputRef={passwordInputRef}
              placeholder={t('auth.login.passwordPlaceholder')}
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

            <AnimatedSignInButton loading={isSubmitting} onPress={submit} />

            <View style={styles.securityNote}>
              <ShieldCheck color="#64748B" size={14} strokeWidth={2.2} />
              <Text style={styles.securityText}>Secure login • Your data is protected</Text>
            </View>

            <Pressable style={styles.forgotButton} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>{t('auth.login.forgotPassword')}</Text>
            </Pressable>

            <View style={styles.signupRow}>
              <Text style={styles.signupMuted}>{t('auth.login.noAccount')}</Text>
              <Pressable onPress={() => navigation.navigate('Signup', { redirectTo: route.params?.redirectTo })}>
                <Text style={styles.signupLink}>{t('auth.login.signup')}</Text>
              </Pressable>
            </View>
          </Animated.View>

          <Text style={styles.footer}>Compare panels, inverters, batteries and book trusted services.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFBF2'
  },
  fill: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 90
  },
  hero: {
    width: '100%',
    alignItems: 'flex-start'
  },
  loginHeading: {
    color: '#0F172A',
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '900',
    marginTop: 6
  },
  headingDark: {
    color: '#0F172A'
  },
  headingGold: {
    color: '#EAB308'
  },
  tagline: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600'
  },
  goldDivider: {
    width: 42,
    height: 4,
    borderRadius: 99,
    backgroundColor: '#F5B400',
    marginTop: 12,
    marginBottom: 18
  },
  card: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFE3CF',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginTop: 0,
    shadowColor: '#403622',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4
  },
  fieldBlock: {
    marginBottom: 10
  },
  label: {
    color: '#0F172A',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    marginBottom: 7
  },
  inputWrap: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8DED0',
    backgroundColor: '#FFFCF5',
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
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF4CE'
  },
  input: {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: 10,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600'
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
    marginTop: 18,
    shadowColor: '#9A6C00',
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6
  },
  primaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#F5B400'
  },
  primaryButtonDisabled: {
    opacity: 0.65
  },
  primaryButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800'
  },
  primaryButtonIcon: {
    marginLeft: 0
  },
  securityNote: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5
  },
  securityText: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600'
  },
  forgotButton: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    marginTop: 18,
    marginBottom: 12,
    paddingVertical: 0
  },
  forgotText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700'
  },
  signupRow: {
    borderTopWidth: 1,
    borderTopColor: '#EFE7DA',
    marginTop: 10,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  signupMuted: {
    color: '#0F172A',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700'
  },
  signupLink: {
    color: '#0F79B2',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800'
  },
  footer: {
    marginTop: 12,
    marginBottom: 45,
    paddingHorizontal: 12,
    textAlign: 'center',
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600'
  }
});
