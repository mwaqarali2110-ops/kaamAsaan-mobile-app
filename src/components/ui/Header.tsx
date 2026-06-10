import React from 'react';
import { Pressable, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { AppText } from './AppText';
import { colors } from '@/constants/colors';

type HeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

export const Header = ({ title, subtitle, onBack, right }: HeaderProps) => (
  <View className="flex-row items-center gap-3 px-4 py-3">
    {onBack ? (
      <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-white" onPress={onBack}>
        <ArrowLeft size={19} color={colors.navy} />
      </Pressable>
    ) : null}
    <View className="flex-1">
      <AppText className="text-base font-extrabold" variant="body">{title}</AppText>
      {subtitle ? <AppText variant="caption">{subtitle}</AppText> : null}
    </View>
    {right}
  </View>
);
