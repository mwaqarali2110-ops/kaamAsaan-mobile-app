import React, { useEffect, useState } from 'react';
import { Mail } from 'lucide-react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { AuthField, AuthMessage, AuthShell, AuthSubmit } from './AuthComponents';
import { forgotPasswordSchema, type ForgotPasswordForm } from '@/schemas/auth.schema';
import { useAuthStore } from '@/store/useAuthStore';

export const ForgotPasswordScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const requestPasswordReset = useAuthStore((state) => state.requestPasswordReset);
  const clearError = useAuthStore((state) => state.clearError);
  const loading = useAuthStore((state) => state.loading);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const form = useForm<ForgotPasswordForm>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } });

  useEffect(() => () => clearError(), [clearError]);

  const submit = form.handleSubmit(async ({ email }) => {
    setError('');
    setMessage('');
    try {
      await requestPasswordReset(email);
      setMessage(t('auth.forgot.sent'));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('auth.forgot.unable'));
    }
  });

  return (
    <AuthShell title={t('auth.forgot.title')} subtitle={t('auth.forgot.subtitle')} onBack={() => navigation.goBack()}>
      <AuthMessage text={message} tone="success" />
      <AuthMessage text={error} />
      <AuthField control={form.control} name="email" label={t('auth.signup.email')} Icon={Mail} placeholder={t('auth.signup.emailPlaceholder')} autoCapitalize="none" keyboardType="email-address" />
      <AuthSubmit title={t('auth.forgot.send')} loading={loading} onPress={submit} />
    </AuthShell>
  );
};
