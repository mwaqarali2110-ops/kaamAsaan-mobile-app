import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/ui/AppText';

type InfoCardProps = {
  label?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
};

export const InfoCard = ({ label, title, subtitle, right, children }: InfoCardProps) => (
  <View className="rounded-3xl border border-kaam-line bg-white p-4 shadow-sm">
    <View className="flex-row items-start gap-3">
      <View className="flex-1">
        {label ? <AppText variant="label">{label}</AppText> : null}
        <AppText className="mt-1 text-lg font-extrabold" variant="body">{title}</AppText>
        {subtitle ? <AppText className="mt-1" variant="caption">{subtitle}</AppText> : null}
      </View>
      {right}
    </View>
    {children ? <View className="mt-3">{children}</View> : null}
  </View>
);
