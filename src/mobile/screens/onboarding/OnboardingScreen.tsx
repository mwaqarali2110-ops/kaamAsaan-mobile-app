import React from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { useAppStore } from '@/store/useAppStore';
import { colors } from '@/constants/colors';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const onboardingHero = require('../../../assets/onboarding/onboarding-hero.jpg');

export const OnboardingScreen = ({ navigation }: any) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const setHasSeenOnboarding = useAppStore((state) => state.setHasSeenOnboarding);
  const isSmallHeight = height < 720;
  const heroHeight = Platform.OS === 'android'
    ? (isSmallHeight ? 300 : 340)
    : (isSmallHeight ? 320 : 360);
  const titleFontSize = width >= 410 ? 29 : 26;
  const subtitleFontSize = width >= 410 ? 16 : 15;

  const finish = () => {
    setHasSeenOnboarding(true);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }]
    });
  };

  const handleGetStarted = () => {
    finish();
  };

  const handleSkip = () => {
    finish();
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(24, insets.bottom + 18) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageSection}>
          <Image
            source={onboardingHero}
            resizeMode="contain"
            style={[styles.image, { height: heroHeight }]}
          />
        </View>

        <View style={styles.textSection}>
          <Text style={[styles.title, { fontSize: titleFontSize, lineHeight: titleFontSize + 6 }]}>
            Plan solar with confidence
          </Text>
          <Text style={[styles.subtitle, { fontSize: subtitleFontSize, lineHeight: subtitleFontSize + 8 }]}>
            Design your system, compare products, and{'\n'}book a survey from one clean mobile app.
          </Text>
        </View>

        <View style={styles.ctaSection}>
          <Pressable
            android_ripple={{ color: 'rgba(7,27,51,0.08)' }}
            onPress={handleGetStarted}
            style={styles.getStartedButton}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
            <View style={styles.arrowContainer}>
              <ArrowRight size={24} color="#071B33" />
            </View>
          </Pressable>

          <Pressable
            android_ripple={{ color: 'rgba(7,27,51,0.06)' }}
            onPress={handleSkip}
            style={styles.skipButton}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF8EA'
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    justifyContent: 'space-between'
  },
  imageSection: {
    alignItems: 'center',
    marginTop: 18
  },
  image: {
    width: '100%',
    maxWidth: 430,
    resizeMode: 'contain'
  },
  textSection: {
    alignItems: 'center',
    marginTop: 18,
    paddingHorizontal: 0
  },
  title: {
    color: colors.navy,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0
  },
  subtitle: {
    marginTop: 18,
    color: '#607898',
    fontWeight: '500',
    textAlign: 'center'
  },
  ctaSection: {
    width: '100%',
    paddingHorizontal: 0,
    marginTop: 26,
    marginBottom: 18,
    zIndex: 5,
    elevation: 5
  },
  getStartedButton: {
    width: '100%',
    height: 56,
    borderRadius: 18,
    backgroundColor: '#F5B400',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    position: 'relative',
    zIndex: 6
  },
  getStartedText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#071B33'
  },
  arrowContainer: {
    position: 'absolute',
    right: 20,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center'
  },
  skipButton: {
    width: '100%',
    height: 54,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#F1E8DA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 6
  },
  skipText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#071B33'
  },
});
