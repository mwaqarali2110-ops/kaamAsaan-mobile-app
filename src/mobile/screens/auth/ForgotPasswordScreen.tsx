import React, { useEffect, useState } from 'react';
import { Mail } from 'lucide-react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { AuthField, AuthMessage, AuthShell, AuthSubmit } from './AuthComponents';
import { forgotPasswordSchema, type ForgotPasswordForm } from '@/schemas/auth.schema';
import { useAuthStore } from '@/store/useAuthStore';

export const ForgotPasswordScreen = ({ navigation }: any) => {
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
      setMessage('Password reset instructions have been sent to your email.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to send the reset email.');
    }
  });

  return (
    <AuthShell title="Reset password" subtitle="Enter your email and we will send reset instructions." onBack={() => navigation.goBack()}>
      <AuthMessage text={message} tone="success" />
      <AuthMessage text={error} />
      <AuthField control={form.control} name="email" label="Email" Icon={Mail} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />
      <AuthSubmit title="Send Reset Email" loading={loading} onPress={submit} />
    </AuthShell>
  );
};
