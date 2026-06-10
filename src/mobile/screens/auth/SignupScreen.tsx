import React, { useEffect, useState } from 'react';
import { Building2, LockKeyhole, Mail, Phone, User } from 'lucide-react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { AuthField, AuthLink, AuthMessage, AuthShell, AuthSubmit } from './AuthComponents';
import { signupSchema, type SignupForm } from '@/schemas/auth.schema';
import { useAuthStore } from '@/store/useAuthStore';

export const SignupScreen = ({ navigation, route }: any) => {
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
        navigation.replace('Login', { redirectTo: route.params?.redirectTo, message: 'Account created. Check your email, then log in.' });
      } else {
        navigation.replace(route.params?.redirectTo ?? 'MainTabs');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to create your account.');
    }
  });

  return (
    <AuthShell title="Create customer account" subtitle="Save your system plan and book surveys with KaamAsaan." onBack={() => navigation.goBack()}>
      <AuthMessage text={error || storeError} />
      <AuthField control={form.control} name="full_name" label="Full name" Icon={User} placeholder="Your full name" />
      <AuthField control={form.control} name="phone" label="Phone" Icon={Phone} placeholder="03XXXXXXXXX" keyboardType="phone-pad" />
      <AuthField control={form.control} name="city" label="City" Icon={Building2} placeholder="Lahore" />
      <AuthField control={form.control} name="email" label="Email" Icon={Mail} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />
      <AuthField control={form.control} name="password" label="Password" Icon={LockKeyhole} placeholder="Minimum 6 characters" secureTextEntry />
      <AuthField control={form.control} name="confirm_password" label="Confirm password" Icon={LockKeyhole} placeholder="Repeat your password" secureTextEntry />
      <AuthSubmit title="Create Account" loading={loading} onPress={submit} />
      <AuthLink title="Already have an account? Login" onPress={() => navigation.replace('Login', { redirectTo: route.params?.redirectTo })} />
    </AuthShell>
  );
};
