import React from 'react';
import { Pressable, PressableProps, Text } from 'react-native';

type AppButtonProps = PressableProps & {
  title: string;
  tone?: 'primary' | 'secondary' | 'dark' | 'ghost';
};

const tones = {
  primary: 'bg-kaam-yellow',
  secondary: 'bg-white border border-kaam-line',
  dark: 'bg-kaam-navy',
  ghost: 'bg-transparent'
};

const textTones = {
  primary: 'text-kaam-navy',
  secondary: 'text-kaam-navy',
  dark: 'text-white',
  ghost: 'text-kaam-navy'
};

export const AppButton = ({ title, tone = 'primary', className = '', disabled, ...props }: AppButtonProps) => (
  <Pressable
    className={`h-12 items-center justify-center rounded-2xl px-5 ${tones[tone]} ${disabled ? 'opacity-50' : ''} ${className}`}
    disabled={disabled}
    {...props}
  >
    <Text className={`text-sm font-extrabold ${textTones[tone]}`}>{title}</Text>
  </Pressable>
);
