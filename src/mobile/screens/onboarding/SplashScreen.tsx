import React, { useEffect, useRef } from 'react';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import Svg, { Line, Path } from 'react-native-svg';

const cartLogo = require('../../../assets/onboarding/Splash-Screen-Cart-1-transparent.png');

const SPLASH_DURATION_MS = 4800;
const CART_SLIDE_DURATION_MS = 1000;
const SPARK_START_DELAY_MS = 190;

export const SplashScreen = ({ onDone }: { onDone: () => void }) => {
  const { width, height } = useWindowDimensions();
  const hasCompletedRef = useRef(false);

  const logoWidth = Math.min(112, Math.max(95, width * 0.285));
  const logoHeight = logoWidth * 1.18;
  const brandFontSize = Math.min(43, Math.max(34, width * 0.105));
  const taglineFontSize = Math.min(12.5, Math.max(10.5, width * 0.03));
  const waveHeight = Math.min(164, Math.max(132, height * 0.18));

  const cartTranslateX = useSharedValue(0);
  const sparkGlowOpacity = useSharedValue(0);
  const sparkGlowScale = useSharedValue(0.88);
  const sparkOpacity = useSharedValue(0);
  const sparkScale = useSharedValue(0.82);
  const sparkRotate = useSharedValue(-4);

  const cartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cartTranslateX.value }]
  }));

  const sparkGlowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sparkGlowOpacity.value,
    transform: [{ scale: sparkGlowScale.value }]
  }));

  const sparkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sparkOpacity.value,
    transform: [{ scale: sparkScale.value }, { rotateZ: `${sparkRotate.value}deg` }]
  }));

  useEffect(() => {
    const completeSplash = () => {
      if (hasCompletedRef.current) return;
      hasCompletedRef.current = true;
      onDone();
    };

    const startOffset = -Math.max(width * 0.95, logoWidth + 150);

    cartTranslateX.value = startOffset;
    sparkGlowOpacity.value = 0;
    sparkGlowScale.value = 0.88;
    sparkOpacity.value = 0;
    sparkScale.value = 0.82;
    sparkRotate.value = -4;

    cartTranslateX.value = withTiming(0, {
      duration: CART_SLIDE_DURATION_MS,
      easing: Easing.out(Easing.cubic)
    });

    const sparkTimer = setTimeout(() => {
      sparkGlowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.26, { duration: 180, easing: Easing.out(Easing.quad) }),
          withTiming(0.12, { duration: 150, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.2, { duration: 130, easing: Easing.out(Easing.quad) }),
          withTiming(0.08, { duration: 1140, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );

      sparkGlowScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 200, easing: Easing.out(Easing.cubic) }),
          withTiming(0.96, { duration: 160, easing: Easing.inOut(Easing.quad) }),
          withTiming(1.03, { duration: 120, easing: Easing.out(Easing.quad) }),
          withTiming(0.92, { duration: 1140, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );

      sparkOpacity.value = withRepeat(
        withSequence(
          withTiming(0.94, { duration: 120, easing: Easing.out(Easing.quad) }),
          withTiming(0.34, { duration: 90, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.82, { duration: 110, easing: Easing.out(Easing.quad) }),
          withTiming(0.18, { duration: 1280, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );

      sparkScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 130, easing: Easing.out(Easing.cubic) }),
          withTiming(0.9, { duration: 90, easing: Easing.inOut(Easing.quad) }),
          withTiming(1.02, { duration: 110, easing: Easing.out(Easing.quad) }),
          withTiming(0.9, { duration: 1270, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );

      sparkRotate.value = withRepeat(
        withSequence(
          withTiming(3, { duration: 140, easing: Easing.out(Easing.quad) }),
          withTiming(-2, { duration: 120, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 90, easing: Easing.out(Easing.quad) }),
          withTiming(-1, { duration: 1250, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );
    }, CART_SLIDE_DURATION_MS + SPARK_START_DELAY_MS);

    const finishTimer = setTimeout(completeSplash, SPLASH_DURATION_MS);

    return () => {
      clearTimeout(sparkTimer);
      clearTimeout(finishTimer);
      cancelAnimation(cartTranslateX);
      cancelAnimation(sparkGlowOpacity);
      cancelAnimation(sparkGlowScale);
      cancelAnimation(sparkOpacity);
      cancelAnimation(sparkScale);
      cancelAnimation(sparkRotate);
    };
  }, [
    cartTranslateX,
    logoWidth,
    onDone,
    sparkGlowOpacity,
    sparkGlowScale,
    sparkOpacity,
    sparkRotate,
    sparkScale,
    width
  ]);

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar style="dark" />

      <View style={styles.background}>
        <View style={styles.warmBase} />
        <Svg width="100%" height="34%" style={styles.sunRays} viewBox="0 0 390 260" preserveAspectRatio="none">
          {Array.from({ length: 9 }).map((_, index) => (
            <Line
              key={index}
              x1="390"
              y1="0"
              x2={118 + index * 34}
              y2="260"
              stroke="#FFFFFF"
              strokeWidth="1.2"
              opacity="0.24"
            />
          ))}
        </Svg>

        <Svg width="70%" height="22%" style={styles.gridPattern} viewBox="0 0 260 150" preserveAspectRatio="none">
          {Array.from({ length: 8 }).map((_, index) => (
            <Line key={`h-${index}`} x1="0" y1={index * 22} x2="260" y2={index * 8 + 35} stroke="#FFFFFF" strokeWidth="1" opacity="0.34" />
          ))}
          {Array.from({ length: 8 }).map((_, index) => (
            <Line key={`v-${index}`} x1={index * 38} y1="0" x2={index * 14 + 32} y2="150" stroke="#FFFFFF" strokeWidth="1" opacity="0.28" />
          ))}
        </Svg>
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.logoWrap, cartAnimatedStyle]}>
          <Image source={cartLogo} style={{ width: logoWidth, height: logoHeight }} resizeMode="contain" />

          <Animated.View
            pointerEvents="none"
            style={[
              styles.sparkGlow,
              sparkGlowAnimatedStyle,
              {
                left: logoWidth * 0.45,
                top: logoHeight * 0.07
              }
            ]}
          />

          <Animated.View
            pointerEvents="none"
            style={[
              styles.spark,
              sparkAnimatedStyle,
              {
                left: logoWidth * 0.44,
                top: logoHeight * 0.055
              }
            ]}
          >
            <View style={styles.sparkCore} />
            <View style={[styles.sparkRay, styles.sparkRayVertical]} />
            <View style={[styles.sparkRay, styles.sparkRayHorizontal]} />
            <View style={[styles.sparkRay, styles.sparkRayDiagonalA]} />
            <View style={[styles.sparkRay, styles.sparkRayDiagonalB]} />
          </Animated.View>
        </Animated.View>

        <View style={styles.brandWrap}>
          <Text style={[styles.brandText, { fontSize: brandFontSize }]}>
            <Text style={styles.brandNavy}>Kaam</Text>
            <Text style={styles.brandGold}>Asaan</Text>
          </Text>
        </View>

        <View style={styles.taglineWrap}>
          <View style={styles.taglineLine} />
          <Text style={[styles.tagline, { fontSize: taglineFontSize }]}>Pakistan No.1 Smart Solar Marketplace</Text>
          <View style={styles.taglineLine} />
        </View>
      </View>

      <View style={[styles.waveWrap, { height: waveHeight }]}>
        <Svg width="100%" height="100%" viewBox="0 0 390 160" preserveAspectRatio="none">
          <Path d="M0 86 C82 122 147 76 225 56 C298 37 344 58 390 37 L390 160 L0 160 Z" fill="#F8D77A" opacity="0.52" />
          <Path d="M0 108 C82 128 151 91 222 72 C300 50 343 69 390 52 L390 160 L0 160 Z" fill="#F5B400" opacity="0.48" />
          <Path d="M0 92 C80 122 145 82 223 62 C298 42 344 62 390 42" stroke="#FFFFFF" strokeWidth="3" opacity="0.72" fill="none" />
          <Path d="M0 126 C74 141 146 116 230 96 C307 77 346 86 390 72 L390 160 L0 160 Z" fill="#F2A900" opacity="0.58" />
        </Svg>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#FFF4DC'
  },
  background: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },
  warmBase: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#FFF4DC'
  },
  sunRays: {
    position: 'absolute',
    right: 0,
    top: 0
  },
  gridPattern: {
    position: 'absolute',
    left: -18,
    bottom: 52,
    opacity: 0.5
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 44
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18
  },
  sparkGlow: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 210, 84, 0.36)'
  },
  spark: {
    position: 'absolute',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sparkCore: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 222, 110, 0.95)'
  },
  sparkRay: {
    position: 'absolute',
    width: 2.5,
    height: 16,
    borderRadius: 999,
    backgroundColor: '#F5A400'
  },
  sparkRayVertical: {
    transform: [{ rotate: '0deg' }]
  },
  sparkRayHorizontal: {
    transform: [{ rotate: '90deg' }]
  },
  sparkRayDiagonalA: {
    transform: [{ rotate: '45deg' }]
  },
  sparkRayDiagonalB: {
    transform: [{ rotate: '-45deg' }]
  },
  brandWrap: {
    alignItems: 'center'
  },
  brandText: {
    lineHeight: 48,
    fontWeight: '900',
    letterSpacing: -0.6
  },
  brandNavy: {
    color: '#08213F'
  },
  brandGold: {
    color: '#E8A000'
  },
  taglineWrap: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  taglineLine: {
    width: 25,
    height: 1.2,
    borderRadius: 999,
    backgroundColor: '#E8A000'
  },
  tagline: {
    flexShrink: 1,
    color: '#10213A',
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '700'
  },
  waveWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0
  }
});
