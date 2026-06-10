import React from 'react';
import { RefreshControl, SafeAreaView, ScrollView, View } from 'react-native';

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  className?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export const Screen = ({ children, scroll = true, className = '', refreshing = false, onRefresh }: ScreenProps) => {
  const content = <View className={`px-4 pb-8 ${className}`}>{children}</View>;

  return (
    <SafeAreaView className="flex-1 bg-kaam-cream">
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}
        >
          {content}
        </ScrollView>
      ) : content}
    </SafeAreaView>
  );
};
