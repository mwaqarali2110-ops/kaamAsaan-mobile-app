import React from 'react';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { InfoCard } from '@/components/cards/InfoCard';

export const MyProjectScreen = () => (
  <Screen>
    <Header title="My Project" subtitle="Track survey and installation" />
    <InfoCard title="No active project yet" subtitle="Book a survey to start your solar project timeline." />
  </Screen>
);
