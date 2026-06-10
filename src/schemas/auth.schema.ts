import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const signupSchema = z.object({
  full_name: z.string().min(2, 'Enter your full name'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  city: z.string().min(2, 'Enter your city'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string().min(6, 'Confirm your password')
}).refine((values) => values.password === values.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password']
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address')
});

export type LoginForm = z.infer<typeof loginSchema>;
export type SignupForm = z.infer<typeof signupSchema>;
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
