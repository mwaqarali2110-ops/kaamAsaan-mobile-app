import React, { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Mail,
  MessageCircle,
  Phone,
  Search,
} from 'lucide-react-native';
import { supportConfig } from '@/constants/support';

type HelpCategory = {
  id: string;
  title: string;
  description: string;
  faqs?: string[];
  support?: boolean;
};

const helpCategories: HelpCategory[] = [
  {
    id: 'solar-system',
    title: 'Solar System Help',
    description: 'Get help with system sizing, load calculation, and package selection.',
    faqs: [
      'How do I calculate my load?',
      'How do I know which system size is right?',
      'Can I compare different brands?',
    ],
  },
  {
    id: 'booking-survey',
    title: 'Booking & Survey Help',
    description: 'Questions about survey booking, visit confirmation, or project progress.',
    faqs: [
      'How do I book a survey?',
      'When will your team contact me?',
      'Can I change my survey date?',
    ],
  },
  {
    id: 'marketplace',
    title: 'Marketplace Help',
    description: 'Help with products, prices, brands, and availability.',
    faqs: [
      'Are prices updated?',
      'Are products verified?',
      'Can I buy only inverter/panels/battery?',
    ],
  },
  {
    id: 'services',
    title: 'Services Help',
    description: 'Support for cleaning, electrical work, installation, and net billing.',
    faqs: [
      'What services are available?',
      'How do I book cleaning or electrical work?',
      'How do I report poor service?',
    ],
  },
  {
    id: 'payment-pricing',
    title: 'Payment & Pricing Help',
    description: 'Understand quotations, prices, and payment-related questions.',
    faqs: [
      'Is pricing transparent?',
      'Are installation charges included?',
      'How do quotations work?',
    ],
  },
  {
    id: 'talk-support',
    title: 'Talk to Support',
    description: 'Contact KaamAsaan support for further assistance.',
    support: true,
  },
];

const openUnavailableAlert = () => {
  Alert.alert('Support contact not configured', 'This support channel will be available soon.');
};

export const HelpCenterScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);

  const visibleCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return helpCategories;
    return helpCategories.filter((category) => {
      const faqMatch = category.faqs?.some((faq) => faq.toLowerCase().includes(query));
      return (
        category.title.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query) ||
        Boolean(faqMatch)
      );
    });
  }, [search]);

  const visibleFaqs = useMemo(() => {
    const query = search.trim().toLowerCase();
    const faqs = selectedCategory?.faqs ?? [];
    if (!query) return faqs;
    return faqs.filter((faq) => faq.toLowerCase().includes(query));
  }, [search, selectedCategory]);

  const handleBack = () => {
    if (selectedCategory) {
      setSelectedCategory(null);
      setExpandedFaq(null);
      return;
    }
    navigation.goBack();
  };

  const handleCategoryPress = (category: HelpCategory) => {
    if (category.support) {
      setSupportOpen(true);
      return;
    }
    setSelectedCategory(category);
    setExpandedFaq(null);
  };

  const openWhatsApp = async () => {
    if (!supportConfig.supportWhatsApp) {
      openUnavailableAlert();
      return;
    }
    await Linking.openURL(`https://wa.me/${supportConfig.supportWhatsApp}`);
  };

  const callSupport = async () => {
    if (!supportConfig.supportPhone) {
      openUnavailableAlert();
      return;
    }
    await Linking.openURL(`tel:${supportConfig.supportPhone}`);
  };

  const emailSupport = async () => {
    if (!supportConfig.supportEmail) {
      openUnavailableAlert();
      return;
    }
    await Linking.openURL(`mailto:${supportConfig.supportEmail}`);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={handleBack}
          hitSlop={12}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <ArrowLeft size={24} color="#0F172A" strokeWidth={2.5} />
        </Pressable>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(34, insets.bottom + 26) }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.title}>{selectedCategory?.title ?? 'Help Center'}</Text>
          <Text style={styles.subtitle}>
            {selectedCategory?.description ?? 'How can we help you today?'}
          </Text>
          <View style={styles.searchBox}>
            <Search size={18} color="#D99A00" strokeWidth={2.3} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search help topics"
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {selectedCategory ? (
          <View style={styles.faqWrap}>
            {visibleFaqs.length ? (
              visibleFaqs.map((faq) => {
                const expanded = expandedFaq === faq;
                return (
                  <Pressable
                    key={faq}
                    style={styles.faqCard}
                    onPress={() => setExpandedFaq(expanded ? null : faq)}
                    accessibilityRole="button"
                  >
                    <View style={styles.faqHeader}>
                      <Text style={styles.faqQuestion}>{faq}</Text>
                      <ChevronDown
                        size={18}
                        color="#B08900"
                        style={expanded ? styles.chevronOpen : undefined}
                      />
                    </View>
                    {expanded ? (
                      <Text style={styles.faqAnswer}>
                        Our support team can guide you through this topic. Use Talk to Support if you need personal help.
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })
            ) : (
              <Text style={styles.emptyText}>No FAQ topics found for this search.</Text>
            )}
          </View>
        ) : (
          <View style={styles.cardsWrap}>
            {visibleCategories.length ? (
              visibleCategories.map((category) => (
                <Pressable
                  key={category.id}
                  style={styles.helpCard}
                  onPress={() => handleCategoryPress(category)}
                  accessibilityRole="button"
                >
                  <View style={styles.cardAccent} />
                  <View style={styles.cardTextWrap}>
                    <Text style={styles.cardTitle}>{category.title}</Text>
                    <Text style={styles.cardDescription}>{category.description}</Text>
                  </View>
                  <View style={styles.arrowCircle}>
                    <ChevronRight size={20} color="#D99A00" strokeWidth={2.5} />
                  </View>
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyText}>No help topics found for this search.</Text>
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={supportOpen} transparent animationType="fade" onRequestClose={() => setSupportOpen(false)}>
        <Pressable style={styles.supportBackdrop} onPress={() => setSupportOpen(false)}>
          <Pressable style={[styles.supportSheet, { paddingBottom: Math.max(18, insets.bottom + 12) }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Talk to Support</Text>
            <Text style={styles.sheetSubtitle}>Choose how you want to contact KaamAsaan support.</Text>

            <Pressable style={styles.supportOption} onPress={openWhatsApp} accessibilityRole="button">
              <View style={styles.supportIcon}>
                <MessageCircle size={21} color="#D99A00" strokeWidth={2.4} />
              </View>
              <Text style={styles.supportText}>WhatsApp Support</Text>
            </Pressable>

            <Pressable style={styles.supportOption} onPress={callSupport} accessibilityRole="button">
              <View style={styles.supportIcon}>
                <Phone size={21} color="#D99A00" strokeWidth={2.4} />
              </View>
              <Text style={styles.supportText}>Call Support</Text>
            </Pressable>

            <Pressable style={styles.supportOption} onPress={emailSupport} accessibilityRole="button">
              <View style={styles.supportIcon}>
                <Mail size={21} color="#D99A00" strokeWidth={2.4} />
              </View>
              <Text style={styles.supportText}>Email Support</Text>
            </Pressable>

            <Pressable style={styles.cancelButton} onPress={() => setSupportOpen(false)} accessibilityRole="button">
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFBF2',
  },
  header: {
    height: 54,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DED0',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#0F172A',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
  },
  headerSpacer: {
    width: 42,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8DED0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  title: {
    color: '#0F172A',
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 5,
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  searchBox: {
    height: 50,
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: '#FFFEFB',
    borderWidth: 1,
    borderColor: '#E8DED0',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  cardsWrap: {
    marginTop: 16,
  },
  helpCard: {
    minHeight: 92,
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DED0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  cardAccent: {
    width: 5,
    height: 46,
    borderRadius: 999,
    backgroundColor: '#F5B400',
    marginRight: 12,
  },
  cardTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
  },
  cardDescription: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  arrowCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF4D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  faqWrap: {
    marginTop: 16,
  },
  faqCard: {
    marginBottom: 10,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DED0',
    padding: 14,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  faqQuestion: {
    flex: 1,
    color: '#0F172A',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  faqAnswer: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 20,
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  supportBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.32)',
    justifyContent: 'flex-end',
  },
  supportSheet: {
    backgroundColor: '#FFFBF2',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: '#E8DED0',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#E8DED0',
    marginBottom: 14,
  },
  sheetTitle: {
    color: '#0F172A',
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '900',
  },
  sheetSubtitle: {
    marginTop: 4,
    marginBottom: 14,
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  supportOption: {
    height: 56,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DED0',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  supportIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#FFF4D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  supportText: {
    flex: 1,
    color: '#0F172A',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
  },
  cancelButton: {
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: '#64748B',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
});
