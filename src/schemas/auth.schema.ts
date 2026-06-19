import { z } from 'zod';
import i18n from '@/i18n';

export const loginSchema = z.object({
  email: z.string().email({ message: i18n.t('auth.errors.validEmail') }),
  password: z.string().min(6, { message: i18n.t('auth.errors.passwordMin') })
});

export const signupSchema = z.object({
  full_name: z.string().min(2, { message: i18n.t('auth.errors.fullName') }),
  phone: z.string().min(10, { message: i18n.t('auth.errors.phone') }),
  city: z.string().min(2, { message: i18n.t('auth.errors.city') }),
  email: z.string().email({ message: i18n.t('auth.errors.validEmail') }),
  password: z.string().min(6, { message: i18n.t('auth.errors.passwordMin') }),
  confirm_password: z.string().min(6, { message: i18n.t('auth.errors.confirmPassword') })
}).refine((values) => values.password === values.confirm_password, {
  message: i18n.t('auth.errors.passwordsMatch'),
  path: ['confirm_password']
});

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: i18n.t('auth.errors.validEmail') })
});

export type LoginForm = z.infer<typeof loginSchema>;
export type SignupForm = z.infer<typeof signupSchema>;
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
