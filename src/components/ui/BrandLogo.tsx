import React, { useMemo } from 'react';
import { StyleSheet, Text, type ImageStyle, type StyleProp, type TextStyle } from 'react-native';
import { SafeImage } from '@/components/ui/SafeImage';
import type { BrandIdentity } from '@/utils/brandLogo';
import { resolveBrandLogo } from '@/utils/brandLogo';

type BrandLogoProps = {
  brand: BrandIdentity;
  productLogoUrl?: string | null;
  style: StyleProp<ImageStyle>;
  fallbackTextStyle?: StyleProp<TextStyle>;
  onError?: () => void;
};

export const BrandLogo = ({
  brand,
  productLogoUrl,
  style,
  fallbackTextStyle,
  onError
}: BrandLogoProps) => {
  const resolved = useMemo(
    () => resolveBrandLogo({ brand, productLogoUrl }),
    [brand, productLogoUrl]
  );

  return (
    <SafeImage
      source={resolved.remoteSource}
      fallbackSource={resolved.localSource}
      style={style}
      resizeMode="contain"
      onError={onError}
      fallback={(
        <Text
          style={[styles.fallback, fallbackTextStyle]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.58}
        >
          {resolved.fallbackLabel}
        </Text>
      )}
    />
  );
};

const styles = StyleSheet.create({
  fallback: {
    color: '#0F1E33',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center'
  }
});
