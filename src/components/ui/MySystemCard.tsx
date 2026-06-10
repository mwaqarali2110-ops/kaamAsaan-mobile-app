import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { BatteryCharging, Sun, Zap } from 'lucide-react-native';

type MySystemCardProps = {
  solarKw: number;
  inverterKw: number;
  batteryKwh: number;
};

const formatSystemValue = (value: number) => {
  const bounded = Math.max(0, value);
  return Number.isInteger(bounded) ? `${bounded}` : bounded.toFixed(1);
};
const formatKw = (value: number) => `${formatSystemValue(value)} kW`;
const formatKwh = (value: number) => `${formatSystemValue(value)} kWh`;

export const MySystemCard = ({ solarKw, inverterKw, batteryKwh }: MySystemCardProps) => {
  const pulse = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(0)).current;
  const fill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const solarAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1800, useNativeDriver: true })
      ])
    );
    const inverterAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 0, duration: 1400, useNativeDriver: true })
      ])
    );
    const batteryAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(fill, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(fill, { toValue: 0, duration: 1800, useNativeDriver: true })
      ])
    );

    solarAnimation.start();
    inverterAnimation.start();
    batteryAnimation.start();

    return () => {
      solarAnimation.stop();
      inverterAnimation.stop();
      batteryAnimation.stop();
    };
  }, [blink, fill, pulse]);

  const solarStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }]
  };
  const inverterStyle = {
    opacity: blink.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] })
  };
  const batteryStyle = {
    opacity: fill.interpolate({ inputRange: [0, 1], outputRange: [0.76, 1] }),
    transform: [{ scaleY: fill.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.08] }) }]
  };

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>MY SYSTEM</Text>
      <View style={styles.values}>
        <View style={styles.item}>
          <Animated.View style={[styles.iconWrap, solarStyle]}>
            <Sun color="#B98900" size={14} strokeWidth={2.2} />
          </Animated.View>
          <Text style={styles.label}>Solar Size</Text>
          <Text style={styles.value}>{formatKw(solarKw)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.item}>
          <Animated.View style={[styles.iconWrap, styles.inverterGlow, inverterStyle]}>
            <Zap color="#9D7200" size={14} strokeWidth={2.35} />
          </Animated.View>
          <Text style={styles.label}>Inverter Size</Text>
          <Text style={styles.value}>{formatKw(inverterKw)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.item}>
          <Animated.View style={[styles.iconWrap, batteryStyle]}>
            <BatteryCharging color="#B98900" size={14} strokeWidth={2.2} />
          </Animated.View>
          <Text style={styles.label}>Battery Size</Text>
          <Text style={styles.value}>{formatKwh(batteryKwh)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 74,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(214,157,28,0.46)',
    backgroundColor: '#FFF3C6',
    paddingHorizontal: 13,
    paddingTop: 8,
    paddingBottom: 7,
    shadowColor: '#9B711A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 18,
    elevation: 5
  },
  eyebrow: {
    color: '#8A6500',
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 1.1
  },
  values: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center'
  },
  item: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 2
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  inverterGlow: {
    backgroundColor: 'rgba(255,222,113,0.82)'
  },
  label: {
    color: '#725A1E',
    fontSize: 8,
    fontWeight: '900'
  },
  value: {
    color: '#172031',
    fontSize: 10.5,
    fontWeight: '900',
    lineHeight: 13
  },
  divider: {
    width: 1,
    height: 38,
    backgroundColor: 'rgba(138,101,0,0.16)'
  }
});
