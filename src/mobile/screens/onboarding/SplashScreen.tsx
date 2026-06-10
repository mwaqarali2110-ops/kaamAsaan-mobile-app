import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { ShoppingCart } from 'lucide-react-native';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';

export const SplashScreen = ({ onDone }: { onDone: () => void }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(progress, { toValue: 1, duration: 3000, useNativeDriver: true })
    ]).start();
    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, [onDone, opacity, progress, scale]);

  return (
    <View className="flex-1 items-center justify-center bg-kaam-cream px-6">
      <Animated.View style={{ opacity, transform: [{ scale }] }} className="items-center">
        <View className="h-20 w-20 items-center justify-center rounded-3xl border border-kaam-line bg-white shadow-sm">
          <ShoppingCart size={42} color={colors.amber} />
        </View>
        <AppText className="mt-5 text-3xl" variant="title">KaamAsaan</AppText>
        <View className="mt-2 h-1 w-10 rounded-full bg-kaam-yellow" />
        <AppText className="mt-3 text-center" variant="subtitle">Apni bijli ka control apne haath mein</AppText>
      </Animated.View>
      <View className="absolute bottom-10 h-1 w-40 overflow-hidden rounded-full bg-kaam-navy/10">
        <Animated.View style={{ transform: [{ scaleX: progress }] }} className="h-full w-full rounded-full bg-kaam-yellow" />
      </View>
    </View>
  );
};
