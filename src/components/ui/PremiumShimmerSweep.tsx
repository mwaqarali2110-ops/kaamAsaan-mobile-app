import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Reanimated, {
  cancelAnimation,
  Easing as ReanimatedEasing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

const SHIMMER_DURATION = 1400;
const SPARK_START = 1080;
const SPARK_DURATION = 400;
const LOOP_DURATION = 4200;
const DEFAULT_HOST_WIDTH = 135;

type PremiumShimmerSweepProps = {
  showSparkle?: boolean;
};

/**
 * Shared premium sweep used by the Home Design System CTA and compact attention
 * rows. The host must clip its contents so the sweep never escapes its corners.
 */
export const PremiumShimmerSweep = ({ showSparkle = false }: PremiumShimmerSweepProps) => {
  const isFocused = useIsFocused();
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const shimmerProgress = useSharedValue(0);
  const sparkProgress = useSharedValue(0);
  const hostWidth = useSharedValue(DEFAULT_HOST_WIDTH);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    cancelAnimation(shimmerProgress);
    cancelAnimation(sparkProgress);
    shimmerProgress.value = 0;
    sparkProgress.value = 0;

    if (reduceMotion !== false || !isFocused) return;

    shimmerProgress.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: SHIMMER_DURATION,
          easing: ReanimatedEasing.inOut(ReanimatedEasing.quad),
        }),
        withDelay(LOOP_DURATION - SHIMMER_DURATION, withTiming(0, { duration: 0 }))
      ),
      -1,
      false
    );

    if (showSparkle) {
      sparkProgress.value = withRepeat(
        withSequence(
          withDelay(
            SPARK_START,
            withTiming(1, {
              duration: 160,
              easing: ReanimatedEasing.out(ReanimatedEasing.cubic),
            })
          ),
          withTiming(2, {
            duration: SPARK_DURATION - 160,
            easing: ReanimatedEasing.in(ReanimatedEasing.quad),
          }),
          withDelay(
            LOOP_DURATION - SPARK_START - SPARK_DURATION,
            withTiming(0, { duration: 0 })
          )
        ),
        -1,
        false
      );
    }

    return () => {
      cancelAnimation(shimmerProgress);
      cancelAnimation(sparkProgress);
    };
  }, [isFocused, reduceMotion, shimmerProgress, showSparkle, sparkProgress]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmerProgress.value, [0, 0.05, 0.9, 1], [0, 1, 1, 0]),
    transform: [
      { translateX: interpolate(shimmerProgress.value, [0, 1], [-56, hostWidth.value + 9]) },
      { rotate: '-21deg' },
    ],
  }));

  const sparkStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sparkProgress.value, [0, 1, 2], [0, 1, 0]),
    transform: [{ scale: interpolate(sparkProgress.value, [0, 1, 2], [0.85, 1.05, 0.95]) }],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    const measuredWidth = event.nativeEvent.layout.width;
    if (measuredWidth > 0) hostWidth.value = measuredWidth;
  };

  return (
    <>
      <View pointerEvents="none" style={styles.host} onLayout={handleLayout}>
        <Reanimated.View style={[styles.shimmer, shimmerStyle]}>
          <Svg width="100%" height="100%" preserveAspectRatio="none">
            <Defs>
              <SvgLinearGradient id="premium-shimmer-glow" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
                <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.26" />
                <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
              </SvgLinearGradient>
              <SvgLinearGradient id="premium-shimmer-beam" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
                <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.52" />
                <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
              </SvgLinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#premium-shimmer-glow)" />
            <Rect x="25%" width="50%" height="100%" fill="url(#premium-shimmer-beam)" />
            <Rect x="47%" width="6%" height="100%" fill="#FFFFFF" opacity="0.82" />
          </Svg>
        </Reanimated.View>
      </View>

      {showSparkle ? (
        <Reanimated.View pointerEvents="none" style={[styles.spark, sparkStyle]}>
          <Svg width="100%" height="100%" viewBox="0 0 34 34">
            <Defs>
              <RadialGradient id="premium-spark-glow" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.78" />
                <Stop offset="0.58" stopColor="#FFF7D1" stopOpacity="0.48" />
                <Stop offset="1" stopColor="#FFF0AA" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx="17" cy="18" r="12" fill="url(#premium-spark-glow)" />
            <Path
              d="M4 3 L14.1 13.7 L30 5.2 L17.5 15.4 L24.8 31 L15.7 18.2 L1.7 27.7 L13.4 16.2 Z"
              fill="#FFFFFF"
              opacity="0.96"
            />
            <Path d="M1.8 20.8 L8.1 17.2 L4.8 23.2 Z" fill="#FFFDF2" opacity="0.9" />
            <Path d="M24.8 24.1 L31.2 28.8 L26.7 21.7 Z" fill="#FFF7D1" opacity="0.82" />
          </Svg>
        </Reanimated.View>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  shimmer: {
    position: 'absolute',
    left: 0,
    top: -16,
    bottom: -16,
    width: 48,
  },
  spark: {
    position: 'absolute',
    zIndex: 3,
    right: -4,
    bottom: -5,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
