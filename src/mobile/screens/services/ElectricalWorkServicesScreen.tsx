import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity, ArrowLeft, ChevronRight, Grid2X2, Zap } from 'lucide-react-native';

export const ElectricalWorkServicesScreen = ({ navigation }: any) => {
  const { width } = useWindowDimensions();
  const cardWidth = width - 48;

  const electricalServices = [
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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={30} color="#101828" />
        </Pressable>

        <Text style={styles.title}>Electrical Work</Text>

        <Text style={styles.subtitle}>
          Choose the service you need for your home or business wiring.
        </Text>
      </View>

      <View style={styles.cardsWrap}>
        {electricalServices.map((service) => (
          <Pressable
            key={service.type}
            style={[styles.serviceCard, { width: cardWidth }]}
            onPress={() =>
              navigation.navigate('BookSurvey', {
                selectedServiceType: service.type,
                selectedServiceTitle: service.title,
              })
            }
          >
            <View style={styles.iconBox}>
              {service.icon === 'grid' && <Grid2X2 size={34} color="#D99A00" />}
              {service.icon === 'zap' && <Zap size={36} color="#D99A00" />}
              {service.icon === 'activity' && <Activity size={36} color="#D99A00" />}
            </View>

            <View style={styles.textArea}>
              <Text style={styles.cardTitle}>{service.title}</Text>
              <Text style={styles.cardDescription}>{service.description}</Text>
            </View>

            <View style={styles.arrowCircle}>
              <ChevronRight size={22} color="#D99A00" />
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
};

export const ElectricalWorkBookingScreen = ({ route, navigation }: any) => {
  const serviceTitle = route?.params?.serviceTitle ?? 'Electrical Work';
  const serviceDescription = route?.params?.serviceDescription ?? 'Our team will help you with safe electrical service planning.';
  const selectedService = route?.params?.selectedService;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
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
          onPress={() => navigation.navigate('BookSurvey')}
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
    backgroundColor: '#FFFBF2',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 110,
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
  cardsWrap: {
    width: '100%',
    alignItems: 'center',
  },
  serviceCard: {
    minHeight: 124,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 180, 0, 0.22)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#FFF4D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textArea: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    color: '#101828',
  },
  cardDescription: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: '#667085',
  },
  arrowCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF4D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
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
    gap: 10,
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
  },
});
