import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export const NotificationsScreen = ({ navigation }: any) => {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.shell} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={10}
          accessibilityLabel={t('common.back')}
          accessibilityRole="button"
        >
          <ArrowLeft color="#10213A" size={22} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.title}>{t('notifications.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Bell color="#B07800" size={30} strokeWidth={2.3} />
        </View>
        <Text style={styles.emptyTitle}>{t('notifications.emptyTitle')}</Text>
        <Text style={styles.emptyText}>{t('notifications.emptyText')}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#FBF8F1' },
  header: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E7DFD1'
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBF8F1'
  },
  title: { flex: 1, color: '#10213A', textAlign: 'center', fontSize: 18, fontWeight: '900' },
  headerSpacer: { width: 40 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7E6',
    borderWidth: 1,
    borderColor: '#F3DCA8'
  },
  emptyTitle: { marginTop: 18, color: '#10213A', textAlign: 'center', fontSize: 20, fontWeight: '900' },
  emptyText: { marginTop: 8, color: '#64748B', textAlign: 'center', fontSize: 13, fontWeight: '600', lineHeight: 20 }
});
