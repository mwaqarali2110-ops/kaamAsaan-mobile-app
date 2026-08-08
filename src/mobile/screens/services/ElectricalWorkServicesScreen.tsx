import React from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Activity, ArrowLeft, ChevronRight, Grid2X2, Zap } from 'lucide-react-native';

const electricalHeroImage = require('../../../../electric work hero section.png');

type ElectricalServiceType = 'load_distribution' | 'single_phase_to_3_phase_wiring' | 'diagnostic_services';
type ElectricalServiceIcon = 'grid' | 'zap' | 'activity';

type ElectricalService = {
  title: string;
  description: string;
  type: ElectricalServiceType;
  icon: ElectricalServiceIcon;
};

const electricalServices: ElectricalService[] = [
  {
    title: 'Load Distribution',
    description: 'Balance electrical load safely across your system.',
    type: 'load_distribution',
    icon: 'grid',
  },
  {
    title: 'Single Phase to 3 Phase Wiring',
    description: 'Upgrade wiring support for higher load requirements.',
    type: 'single_phase_to_3_phase_wiring',
    icon: 'zap',
  },
  {
    title: 'Diagnostic Services',
    description: 'Identify wiring faults, load issues, and safety risks.',
    type: 'diagnostic_services',
    icon: 'activity',
  },
];

const ElectricalServiceCard = ({
  service,
  onPress,
}: {
  service: ElectricalService;
  onPress: () => void;
}) => {
  const renderIcon = () => {
    if (service.icon === 'grid') return <Grid2X2 size={29} color="#D69A00" strokeWidth={2.1} />;
    if (service.icon === 'zap') return <Zap size={32} color="#D69A00" strokeWidth={2.15} />;
    return <Activity size={32} color="#D69A00" strokeWidth={2.15} />;
  };

  return (
    <Pressable
      style={styles.serviceCard}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={service.title}
    >
      <View style={styles.serviceIconBox}>{renderIcon()}</View>

      <View style={styles.serviceText}>
        <Text
          style={styles.serviceCardTitle}
          allowFontScaling={false}
          maxFontSizeMultiplier={1}
        >
          {service.title}
        </Text>
        <Text
          style={styles.serviceCardDescription}
          allowFontScaling={false}
          maxFontSizeMultiplier={1}
        >
          {service.description}
        </Text>
      </View>

      <View style={styles.serviceArrow}>
        <ChevronRight size={26} color="#D69A00" strokeWidth={2.45} />
      </View>
    </Pressable>
  );
};

export const ElectricalWorkServicesScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.serviceHeader}>
        <Pressable
          style={({ pressed }) => [styles.serviceBackButton, pressed && styles.servicePressed]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          android_ripple={{ color: 'rgba(166, 111, 0, 0.10)', borderless: false }}
        >
          <ArrowLeft size={27} color="#111827" strokeWidth={2.25} />
        </Pressable>

        <View style={styles.serviceHeaderCopy}>
          <Text style={styles.serviceTitle}>Electrical Work</Text>
          <Text style={styles.serviceSubtitle}>
            Choose the service you need for your home or business wiring.
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground
          source={electricalHeroImage}
          resizeMode="cover"
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroFullShade} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Expert Electrical{'\n'}Solutions</Text>
            <Text style={styles.heroSubtitle}>
              Safe, reliable & efficient{'\n'}electrical work for your home{'\n'}or business.
            </Text>
          </View>
        </ImageBackground>

        <View style={styles.serviceList}>
          {electricalServices.map((service) => (
            <ElectricalServiceCard
              key={service.type}
              service={service}
              onPress={() =>
                navigation.navigate('BookSurvey', {
                  bookingContext: 'electrical',
                  source: 'electrical_service',
                  selectedServiceType: service.type,
                  selectedServiceTitle: service.title,
                })
              }
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export const ElectricalWorkBookingScreen = ({ route, navigation }: any) => {
  const serviceTitle = route?.params?.serviceTitle ?? 'Electrical Work';
  const serviceDescription = route?.params?.serviceDescription ?? 'Our team will help you with safe electrical service planning.';
  const selectedService = route?.params?.selectedService;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'right', 'bottom', 'left']}>
      <View style={styles.bookingContent}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={23} color="#0F172A" strokeWidth={2.4} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{serviceTitle}</Text>
            <Text style={styles.subtitle}>Electrical Work</Text>
          </View>
        </View>

        <View style={styles.detailCard}>
          <View style={styles.detailBadge}>
            <Text style={styles.detailBadgeText}>Selected Service</Text>
          </View>
          <Text style={styles.detailTitle}>{serviceTitle}</Text>
          <Text style={styles.detailText}>{serviceDescription}</Text>
          {selectedService ? <Text style={styles.serviceCode}>{selectedService}</Text> : null}
        </View>

        <Pressable
          style={({ pressed }) => [styles.bookButton, pressed && styles.pressed]}
          onPress={() => navigation.navigate('BookSurvey', {
            bookingContext: 'electrical',
            source: 'electrical_service',
            selectedServiceType: selectedService,
            selectedServiceTitle: serviceTitle
          })}
          accessibilityRole="button"
        >
          <Text style={styles.bookButtonText}>Book Service</Text>
          <ChevronRight size={20} color="#0F172A" strokeWidth={2.5} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FBF8F1',
  },
  content: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  bookingContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  header: {
    width: '100%',
    marginBottom: 24,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 11,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.82,
  },
  servicePressed: {
    opacity: 0.94,
    backgroundColor: '#FFFCF5',
  },
  serviceBackButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9DCC5',
    marginRight: 14,
    overflow: 'hidden',
  },
  serviceHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  serviceTitle: {
    color: '#111111',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  serviceSubtitle: {
    marginTop: 0,
    color: '#5F6368',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '500',
  },
  headerCopy: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#101828',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    color: '#667085',
    textAlign: 'center',
  },
  serviceList: {
    width: '100%',
    paddingTop: 18,
    paddingBottom: 0,
  },
  serviceCard: {
    width: '100%',
    height: 124,
    minHeight: 124,
    maxHeight: 124,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EFE7D5',
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    flexGrow: 0,
    flexBasis: 'auto',
    alignSelf: 'stretch',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 7,
    elevation: 3,
  },
  serviceIconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#FFF4CC',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  serviceText: {
    flex: 1,
    minWidth: 0,
    marginLeft: 16,
    marginRight: 12,
    justifyContent: 'center',
  },
  serviceCardTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.15,
    includeFontPadding: false,
  },
  serviceCardDescription: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: '#60646C',
    includeFontPadding: false,
  },
  serviceArrow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF4CC',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  hero: {
    width: '100%',
    aspectRatio: 1.78,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#E9D8BF',
    justifyContent: 'flex-end',
  },
  heroImage: {
    borderRadius: 22,
  },
  heroFullShade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  heroCopy: {
    paddingHorizontal: 17,
    paddingBottom: 16,
    width: '76%',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: -0.35,
    textShadowColor: 'rgba(0, 0, 0, 0.34)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  heroSubtitle: {
    marginTop: 6,
    color: '#F9FAFB',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.34)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  detailCard: {
    marginTop: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DED0',
    padding: 18,
    shadowColor: '#A16207',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  detailBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#FFF2C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  detailBadgeText: {
    color: '#A16207',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  detailTitle: {
    marginTop: 16,
    color: '#0F172A',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
  },
  detailText: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  serviceCode: {
    marginTop: 14,
    color: '#D99A00',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  bookButton: {
    height: 58,
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: '#F5B400',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D99A00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 4,
  },
  bookButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    marginRight: 10,
  },
});
