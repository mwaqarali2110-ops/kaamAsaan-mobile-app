import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { textRoles } from '@/constants/typography';

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
        <ArrowLeft size={20} color={colors.navy} />
      </Pressable>
    ) : null}
    <View className="flex-1">
      <Text style={{ fontSize: textRoles.screenTitle.fontSize, fontWeight: textRoles.screenTitle.fontWeight, color: colors.navy }}>{title}</Text>
      {subtitle ? <Text style={{ fontSize: textRoles.subtitle.fontSize, fontWeight: textRoles.subtitle.fontWeight, color: colors.muted, marginTop: 2 }}>{subtitle}</Text> : null}
    </View>
    {right}
  </View>
);
