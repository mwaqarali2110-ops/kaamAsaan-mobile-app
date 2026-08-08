import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  className?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  includeBottomInset?: boolean;
};

export const Screen = ({
  children,
  scroll = true,
  className = '',
  refreshing = false,
  onRefresh,
  includeBottomInset = true
}: ScreenProps) => {
  const content = <View className={`px-4 pb-8 ${className}`}>{children}</View>;

  return (
    <SafeAreaView
      className="flex-1 bg-kaam-cream"
      edges={includeBottomInset ? ['top', 'right', 'bottom', 'left'] : ['top', 'left', 'right']}
    >
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
