import React from 'react';
import { Text, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { InfoCard } from '@/components/cards/InfoCard';
import { AppButton } from '@/components/ui/AppButton';
import { useAuthStore } from '@/store/useAuthStore';

export const ProfileScreen = ({ navigation }: any) => {
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const loading = useAuthStore((state) => state.loading);
  const signOut = useAuthStore((state) => state.signOut);
  const rootNavigation = navigation.getParent();

  if (!session) {
    return (
      <Screen>
        <Header title="Profile" subtitle="Customer account" />
        <InfoCard title="Guest Customer" subtitle="Log in to book surveys, keep your details handy, and manage your solar journey.">
          <View style={{ gap: 9 }}>
            <AppButton title="Login" onPress={() => rootNavigation?.navigate('Login')} />
            <AppButton title="Create Account" tone="secondary" onPress={() => rootNavigation?.navigate('Signup')} />
          </View>
        </InfoCard>
        <InfoCard title="Support" subtitle="Expert opinion and WhatsApp contact entry point." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Profile" subtitle="Customer account" />
      <InfoCard title={profile?.full_name || 'KaamAsaan Customer'} subtitle={session.user.email || 'Customer account'}>
        <View style={{ gap: 7 }}>
          <ProfileLine label="Phone" value={profile?.phone || 'Not added'} />
          <ProfileLine label="City" value={profile?.city || 'Not added'} />
          <ProfileLine label="Account" value="Customer" />
        </View>
      </InfoCard>
      <InfoCard title="Support" subtitle="Expert opinion and WhatsApp contact entry point." />
      <AppButton title={loading ? 'Logging out...' : 'Logout'} tone="secondary" disabled={loading} onPress={() => void signOut()} />
    </Screen>
  );
};

const ProfileLine = ({ label, value }: { label: string; value: string }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16 }}>
    <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '700' }}>{label}</Text>
    <Text style={{ flex: 1, color: '#10213A', textAlign: 'right', fontSize: 12, fontWeight: '900' }}>{value}</Text>
  </View>
);
