import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const DEFAULT_SAFE_BOTTOM_PADDING = 12;

export const getSafeBottomPadding = (
  bottomInset: number,
  minimumPadding = DEFAULT_SAFE_BOTTOM_PADDING
) => Math.max(bottomInset, minimumPadding);

export const getFixedFooterContentPadding = (
  footerContentHeight: number,
  bottomInset: number,
  trailingSpace = 20,
  minimumBottomPadding = DEFAULT_SAFE_BOTTOM_PADDING
) => footerContentHeight + getSafeBottomPadding(bottomInset, minimumBottomPadding) + trailingSpace;

type SafeBottomActionBarProps = ViewProps & {
  minimumBottomPadding?: number;
};

export const SafeBottomActionBar = ({
  children,
  minimumBottomPadding = DEFAULT_SAFE_BOTTOM_PADDING,
  style,
  ...viewProps
}: SafeBottomActionBarProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      {...viewProps}
      style={[style, { paddingBottom: getSafeBottomPadding(insets.bottom, minimumBottomPadding) }]}
    >
      {children}
    </View>
  );
};
