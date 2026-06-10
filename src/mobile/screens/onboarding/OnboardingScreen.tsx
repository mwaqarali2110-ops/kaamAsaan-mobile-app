import React from 'react';
import { View } from 'react-native';
import { SunMedium } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { useAppStore } from '@/store/useAppStore';
import { colors } from '@/constants/colors';

export const OnboardingScreen = ({ navigation }: any) => {
  const setHasSeenOnboarding = useAppStore((state) => state.setHasSeenOnboarding);

  const finish = () => {
    setHasSeenOnboarding(true);
    navigation.replace('MainTabs');
  };

  return (
    <Screen scroll={false} className="flex-1 justify-between py-8">
      <View />
      <View className="items-center">
        <View className="h-24 w-24 items-center justify-center rounded-3xl bg-kaam-yellow">
          <SunMedium size={48} color={colors.navy} />
        </View>
        <AppText className="mt-8 text-center" variant="title">Plan solar with confidence</AppText>
        <AppText className="mt-3 px-5 text-center" variant="subtitle">
          Design your system, compare products, and book a survey from one clean mobile app.
        </AppText>
      </View>
      <View className="gap-3">
        <AppButton title="Get Started" onPress={finish} />
        <AppButton title="Skip" tone="secondary" onPress={finish} />
      </View>
    </Screen>
  );
};
