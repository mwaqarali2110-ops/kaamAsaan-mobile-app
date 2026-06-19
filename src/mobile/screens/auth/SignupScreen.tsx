import React, { useEffect, useState } from 'react';
import { Building2, LockKeyhole, Mail, Phone, User } from 'lucide-react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { AuthField, AuthLink, AuthMessage, AuthShell, AuthSubmit } from './AuthComponents';
import { signupSchema, type SignupForm } from '@/schemas/auth.schema';
import { useAuthStore } from '@/store/useAuthStore';

export const SignupScreen = ({ navigation, route }: any) => {
  const { t } = useTranslation();
  const signUp = useAuthStore((state) => state.signUp);
  const clearError = useAuthStore((state) => state.clearError);
  const storeError = useAuthStore((state) => state.error);
  const loading = useAuthStore((state) => state.loading);
  const [error, setError] = useState('');
  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { full_name: '', phone: '', city: '', email: '', password: '', confirm_password: '' }
  });

  useEffect(() => () => clearError(), [clearError]);

  const submit = form.handleSubmit(async ({ confirm_password: _confirm, ...values }) => {
    setError('');
    try {
      const result = await signUp(values);
      if (result.needsEmailConfirmation) {
        navigation.replace('Login', { redirectTo: route.params?.redirectTo, message: t('auth.signup.createdCheckEmail') });
      } else {
        navigation.replace(route.params?.redirectTo ?? 'MainTabs');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('auth.signup.unable'));
    }
  });

  return (
    <AuthShell title={t('auth.signup.title')} subtitle={t('auth.signup.subtitle')} onBack={() => navigation.goBack()}>
      <AuthMessage text={error || storeError} />
      <AuthField control={form.control} name="full_name" label={t('auth.signup.fullName')} Icon={User} placeholder={t('auth.signup.fullNamePlaceholder')} />
      <AuthField control={form.control} name="phone" label={t('auth.signup.phone')} Icon={Phone} placeholder={t('auth.signup.phonePlaceholder')} keyboardType="phone-pad" />
      <AuthField control={form.control} name="city" label={t('auth.signup.city')} Icon={Building2} placeholder={t('auth.signup.cityPlaceholder')} />
      <AuthField control={form.control} name="email" label={t('auth.signup.email')} Icon={Mail} placeholder={t('auth.signup.emailPlaceholder')} autoCapitalize="none" keyboardType="email-address" />
      <AuthField control={form.control} name="password" label={t('auth.signup.password')} Icon={LockKeyhole} placeholder={t('auth.signup.passwordPlaceholder')} secureTextEntry />
      <AuthField control={form.control} name="confirm_password" label={t('auth.signup.confirmPassword')} Icon={LockKeyhole} placeholder={t('auth.signup.confirmPasswordPlaceholder')} secureTextEntry />
      <AuthSubmit title={t('auth.signup.createAccount')} loading={loading} onPress={submit} />
      <AuthLink title={t('auth.signup.alreadyHaveAccount')} onPress={() => navigation.replace('Login', { redirectTo: route.params?.redirectTo })} />
    </AuthShell>
  );
};
