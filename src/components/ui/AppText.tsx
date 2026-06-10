import React from 'react';
import { Text, TextProps } from 'react-native';

type AppTextProps = TextProps & {
  variant?: 'title' | 'subtitle' | 'body' | 'caption' | 'label';
};

const variants = {
  title: 'text-3xl font-extrabold text-kaam-navy',
  subtitle: 'text-base font-semibold text-kaam-muted',
  body: 'text-sm text-kaam-navy',
  caption: 'text-xs text-kaam-muted',
  label: 'text-xs font-bold uppercase tracking-wide text-kaam-muted'
};

export const AppText = ({ variant = 'body', className = '', ...props }: AppTextProps) => (
  <Text className={`${variants[variant]} ${className}`} {...props} />
);
