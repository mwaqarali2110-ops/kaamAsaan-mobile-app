import React, { useEffect, useRef } from 'react';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import Svg, { Line, Path } from 'react-native-svg';

const cartLogo = require('../../../assets/onboarding/Splash-Screen-Cart-1-transparent.png');
const AnimatedPath = Animated.createAnimatedComponent(Path);

const SPLASH_DURATION_MS = 4800;
const CART_SLIDE_DURATION_MS = 1000;
const SPARK_START_DELAY_MS = 190;
const BRAND_ENTRANCE_DELAY_MS = 550;
// The overlay space must match the cart artwork's aspect ratio (876x940 px)
// exactly, otherwise the SVG and the letterboxed image scale differently and
// the current drifts off the artwork. 150x161 = the artwork ratio; artwork
// pixels convert at x0.1712.
const CART_BASE_WIDTH = 150;
const CART_BASE_HEIGHT = 161;
const CART_ASPECT = CART_BASE_HEIGHT / CART_BASE_WIDTH;
const CURRENT_LOOP_MS = 1800;
// Traced over the cart artwork: front tyre -> across all four tyres -> up the
// rear frame -> along the basket rim -> up the handle -> then discharges
// upward through the lightning bolt.
const CART_CURRENT_PATH =
  'M33.5 151 C39 153.7 46 153.7 52 151.5 C70 154.2 95 154.2 111 151 L124 146.5 C126 137.6 126.5 127.6 125 118.7 C130 102 133.5 83.2 135 65.5 C97 57.7 58 52.1 20 51 C15 45.5 11.5 38.8 10.5 32.2 C22 57.7 44 82.1 67 93.2 C74 68.8 78 55.5 84 44.4 C89 31.1 93 17.8 95 5.5';
// Dash cycle (dash + gap) exceeds the path length so exactly one pulse travels
// the cart per loop, and the loop offset is one full cycle so it never jumps.
const CURRENT_DASH_PATTERN = '30 520';
const CURRENT_DASH_CYCLE = 550;
const CURRENT_DASH_HIDDEN_OFFSET = 30;
const VOLTAGE_PULSE_BASE = {
  top: 4,
  left: 65,
  width: 46,
  height: 70
};
const WHEEL_GLOW_SPOTS = [
  { top: 140, left: 22, width: 42, height: 20 },
  { top: 137, left: 100, width: 35, height: 20 }
];

export const SplashScreen = ({ onDone }: { onDone: () => void }) => {
  const { width, height } = useWindowDimensions();
  const hasCompletedRef = useRef(false);

  const logoWidth = Math.min(112, Math.max(95, width * 0.285));
  const logoHeight = logoWidth * CART_ASPECT;
  const brandFontSize = Math.min(43, Math.max(34, width * 0.105));
  const taglineFontSize = Math.min(12.5, Math.max(10.5, width * 0.03));
  const waveHeight = Math.min(164, Math.max(132, height * 0.18));
  const cartScaleX = logoWidth / CART_BASE_WIDTH;
  const cartScaleY = logoHeight / CART_BASE_HEIGHT;
  const voltagePulseTop = VOLTAGE_PULSE_BASE.top * cartScaleY;
  const voltagePulseLeft = VOLTAGE_PULSE_BASE.left * cartScaleX;
  const voltagePulseWidth = VOLTAGE_PULSE_BASE.width * cartScaleX;
  const voltagePulseHeight = VOLTAGE_PULSE_BASE.height * cartScaleY;

  const cartTranslateX = useSharedValue(0);
  const currentDashOffset = useSharedValue(CURRENT_DASH_HIDDEN_OFFSET);
  const wheelGlowOpacity = useSharedValue(0);
  const wheelGlowScale = useSharedValue(0.9);
  const voltagePulseOpacity = useSharedValue(0);
  const voltagePulseScale = useSharedValue(0.95);
  const voltageTrembleX = useSharedValue(0);
  const voltageTrembleY = useSharedValue(0);
  const voltageTrembleRotate = useSharedValue(0);
  const sparkOneOpacity = useSharedValue(0);
  const sparkOneScale = useSharedValue(0.7);
  const sparkTwoOpacity = useSharedValue(0);
  const sparkTwoScale = useSharedValue(0.7);
  const brandOpacity = useSharedValue(0);
  const brandTranslateY = useSharedValue(16);

  const cartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cartTranslateX.value }]
  }));

  const currentAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: currentDashOffset.value
  }));

  const wheelGlowStyle = useAnimatedStyle(() => ({
    opacity: wheelGlowOpacity.value,
    transform: [{ scale: wheelGlowScale.value }]
  }));

  const voltagePulseStyle = useAnimatedStyle(() => ({
    opacity: voltagePulseOpacity.value,
    transform: [
      { translateX: voltageTrembleX.value },
      { translateY: voltageTrembleY.value },
      { rotateZ: `${voltageTrembleRotate.value}deg` },
      { scale: voltagePulseScale.value }
    ]
  }));

  const sparkOneStyle = useAnimatedStyle(() => ({
    opacity: sparkOneOpacity.value,
    transform: [{ scale: sparkOneScale.value }, { rotateZ: '-24deg' }]
  }));

  const sparkTwoStyle = useAnimatedStyle(() => ({
    opacity: sparkTwoOpacity.value,
    transform: [{ scale: sparkTwoScale.value }, { rotateZ: '28deg' }]
  }));

  const brandEntranceStyle = useAnimatedStyle(() => ({
    opacity: brandOpacity.value,
    transform: [{ translateY: brandTranslateY.value }]
  }));

  useEffect(() => {
    const completeSplash = () => {
      if (hasCompletedRef.current) return;
      hasCompletedRef.current = true;
      onDone();
    };

    const startOffset = -Math.max(width * 0.95, logoWidth + 150);

    cartTranslateX.value = startOffset;
    currentDashOffset.value = CURRENT_DASH_HIDDEN_OFFSET;
    wheelGlowOpacity.value = 0;
    wheelGlowScale.value = 0.9;
    voltagePulseOpacity.value = 0;
    voltagePulseScale.value = 0.95;
    voltageTrembleX.value = 0;
    voltageTrembleY.value = 0;
    voltageTrembleRotate.value = 0;
    sparkOneOpacity.value = 0;
    sparkOneScale.value = 0.7;
    sparkTwoOpacity.value = 0;
    sparkTwoScale.value = 0.7;
    brandOpacity.value = 0;
    brandTranslateY.value = 16;

    cartTranslateX.value = withTiming(0, {
      duration: CART_SLIDE_DURATION_MS,
      easing: Easing.out(Easing.cubic)
    });

    brandOpacity.value = withDelay(
      BRAND_ENTRANCE_DELAY_MS,
      withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) })
    );
    brandTranslateY.value = withDelay(
      BRAND_ENTRANCE_DELAY_MS,
      withTiming(0, { duration: 650, easing: Easing.out(Easing.cubic) })
    );

    const voltageTimer = setTimeout(() => {
      currentDashOffset.value = withRepeat(
        withTiming(CURRENT_DASH_HIDDEN_OFFSET - CURRENT_DASH_CYCLE, {
          duration: CURRENT_LOOP_MS,
          easing: Easing.linear
        }),
        -1,
        false
      );

      wheelGlowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 140, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 360, easing: Easing.inOut(Easing.cubic) }),
          withTiming(0, { duration: 1300 })
        ),
        -1,
        false
      );

      wheelGlowScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 140, easing: Easing.out(Easing.cubic) }),
          withTiming(0.9, { duration: 360, easing: Easing.inOut(Easing.cubic) }),
          withTiming(0.9, { duration: 1300 })
        ),
        -1,
        false
      );

      voltagePulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1180 }),
          withTiming(0.7, { duration: 140, easing: Easing.out(Easing.cubic) }),
          withTiming(0.18, { duration: 260, easing: Easing.inOut(Easing.cubic) }),
          withTiming(0, { duration: 220 })
        ),
        -1,
        false
      );

      voltagePulseScale.value = withRepeat(
        withSequence(
          withTiming(0.95, { duration: 1180 }),
          withTiming(1.14, { duration: 140, easing: Easing.out(Easing.cubic) }),
          withTiming(1, { duration: 480, easing: Easing.inOut(Easing.cubic) })
        ),
        -1,
        false
      );

      voltageTrembleX.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1200 }),
          withTiming(1.2, { duration: 70, easing: Easing.linear }),
          withTiming(-1.1, { duration: 76, easing: Easing.linear }),
          withTiming(0.7, { duration: 68, easing: Easing.linear }),
          withTiming(0, { duration: 386, easing: Easing.linear })
        ),
        -1,
        false
      );

      voltageTrembleY.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1200 }),
          withTiming(-0.8, { duration: 72, easing: Easing.linear }),
          withTiming(0.65, { duration: 78, easing: Easing.linear }),
          withTiming(0, { duration: 450, easing: Easing.linear })
        ),
        -1,
        false
      );

      voltageTrembleRotate.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1200 }),
          withTiming(0.8, { duration: 70, easing: Easing.linear }),
          withTiming(-0.75, { duration: 76, easing: Easing.linear }),
          withTiming(0.3, { duration: 70, easing: Easing.linear }),
          withTiming(0, { duration: 384, easing: Easing.linear })
        ),
        -1,
        false
      );

      sparkOneOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1240 }),
          withTiming(0.9, { duration: 100, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 260, easing: Easing.inOut(Easing.cubic) }),
          withTiming(0, { duration: 200 })
        ),
        -1,
        false
      );

      sparkOneScale.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 1240 }),
          withTiming(1.15, { duration: 100, easing: Easing.out(Easing.cubic) }),
          withTiming(0.7, { duration: 460, easing: Easing.inOut(Easing.cubic) })
        ),
        -1,
        false
      );

      sparkTwoOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1320 }),
          withTiming(0.82, { duration: 95, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 175, easing: Easing.inOut(Easing.cubic) }),
          withTiming(0, { duration: 210 })
        ),
        -1,
        false
      );

      sparkTwoScale.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 1320 }),
          withTiming(1.12, { duration: 95, easing: Easing.out(Easing.cubic) }),
          withTiming(0.7, { duration: 385, easing: Easing.inOut(Easing.cubic) })
        ),
        -1,
        false
      );
    }, CART_SLIDE_DURATION_MS + SPARK_START_DELAY_MS);

    const finishTimer = setTimeout(completeSplash, SPLASH_DURATION_MS);

    return () => {
      clearTimeout(voltageTimer);
      clearTimeout(finishTimer);
      cancelAnimation(cartTranslateX);
      cancelAnimation(currentDashOffset);
      cancelAnimation(wheelGlowOpacity);
      cancelAnimation(wheelGlowScale);
      cancelAnimation(voltagePulseOpacity);
      cancelAnimation(voltagePulseScale);
      cancelAnimation(voltageTrembleX);
      cancelAnimation(voltageTrembleY);
      cancelAnimation(voltageTrembleRotate);
      cancelAnimation(sparkOneOpacity);
      cancelAnimation(sparkOneScale);
      cancelAnimation(sparkTwoOpacity);
      cancelAnimation(sparkTwoScale);
      cancelAnimation(brandOpacity);
      cancelAnimation(brandTranslateY);
    };
  }, [
    brandOpacity,
    brandTranslateY,
    cartTranslateX,
    currentDashOffset,
    logoWidth,
    onDone,
    sparkOneOpacity,
    sparkOneScale,
    sparkTwoOpacity,
    sparkTwoScale,
    voltagePulseOpacity,
    voltagePulseScale,
    voltageTrembleRotate,
    voltageTrembleX,
    voltageTrembleY,
    wheelGlowOpacity,
    wheelGlowScale,
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
        <Animated.View style={[styles.cartWrapper, { width: logoWidth, height: logoHeight }, cartAnimatedStyle]}>
          <Image source={cartLogo} style={[styles.cartImage, { width: logoWidth, height: logoHeight }]} resizeMode="contain" />

          <Svg
            style={StyleSheet.absoluteFill}
            width="100%"
            height="100%"
            viewBox={`0 0 ${CART_BASE_WIDTH} ${CART_BASE_HEIGHT}`}
            pointerEvents="none"
          >
            <AnimatedPath
              animatedProps={currentAnimatedProps}
              d={CART_CURRENT_PATH}
              fill="none"
              stroke="#F5B400"
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={CURRENT_DASH_PATTERN}
              opacity={0.16}
            />
            <AnimatedPath
              animatedProps={currentAnimatedProps}
              d={CART_CURRENT_PATH}
              fill="none"
              stroke="#FFF1A8"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={CURRENT_DASH_PATTERN}
            />
          </Svg>

          {WHEEL_GLOW_SPOTS.map((spot, index) => (
            <Animated.View
              key={`wheel-glow-${index}`}
              pointerEvents="none"
              style={[
                styles.wheelGlow,
                wheelGlowStyle,
                {
                  top: spot.top * cartScaleY,
                  left: spot.left * cartScaleX,
                  width: spot.width * cartScaleX,
                  height: spot.height * cartScaleY
                }
              ]}
            />
          ))}

          <Animated.View
            pointerEvents="none"
            style={[
              styles.voltagePulse,
              voltagePulseStyle,
              {
                top: voltagePulseTop,
                left: voltagePulseLeft,
                width: voltagePulseWidth,
                height: voltagePulseHeight
              }
            ]}
          />

          <Animated.View
            pointerEvents="none"
            style={[
              styles.voltageSpark,
              styles.voltageSparkTop,
              sparkOneStyle,
              {
                top: voltagePulseTop + voltagePulseHeight * 0.12,
                left: voltagePulseLeft + voltagePulseWidth * 0.72
              }
            ]}
          />

          <Animated.View
            pointerEvents="none"
            style={[
              styles.voltageSpark,
              styles.voltageSparkLower,
              sparkTwoStyle,
              {
                top: voltagePulseTop + voltagePulseHeight * 0.7,
                left: voltagePulseLeft + voltagePulseWidth * 0.18
              }
            ]}
          />
        </Animated.View>

        <Animated.View style={brandEntranceStyle}>
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
        </Animated.View>
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
  cartWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18
  },
  cartImage: {
    flexShrink: 0
  },
  wheelGlow: {
    position: 'absolute',
    zIndex: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(245, 180, 0, 0.32)',
    shadowColor: '#F5B400',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 5
  },
  voltagePulse: {
    position: 'absolute',
    zIndex: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(245, 180, 0, 0.18)',
    shadowColor: '#F5B400',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5
  },
  voltageSpark: {
    position: 'absolute',
    zIndex: 6,
    width: 3,
    height: 11,
    borderRadius: 999,
    backgroundColor: '#FFF1A8',
    shadowColor: '#F5B400',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 4,
    elevation: 5
  },
  voltageSparkTop: {
    height: 12
  },
  voltageSparkLower: {
    height: 10,
    backgroundColor: '#FFC928'
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
