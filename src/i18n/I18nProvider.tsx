import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { AppLanguage, changeLanguage, currentLanguage, initI18n, isRTL } from './index';
import { colors } from '@/constants/colors';

type LanguageContextValue = {
  language: AppLanguage;
  rtl: boolean;
  restartRequired: boolean;
  setLanguage: (language: AppLanguage) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [language, setLanguageState] = useState<AppLanguage>('en');
  const [restartRequired, setRestartRequired] = useState(false);

  useEffect(() => {
    let mounted = true;
    void initI18n().then(({ language: nextLanguage, needsRTLRestart }) => {
      if (!mounted) return;
      setLanguageState(nextLanguage);
      setRestartRequired(needsRTLRestart);
      setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      rtl: isRTL(language),
      restartRequired,
      setLanguage: async (nextLanguage) => {
        const result = await changeLanguage(nextLanguage);
        setLanguageState(currentLanguage());
        setRestartRequired(result.needsRTLRestart);
      }
    }),
    [language, restartRequired]
  );

  if (!ready) return <I18nLoadingScreen />;

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

const I18nLoadingScreen = () => {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FBF8F1' }}>
      <ActivityIndicator color={colors.amber} size="large" />
      <Text style={{ color: colors.navy, fontSize: 13, fontWeight: '800' }}>Loading...</Text>
    </View>
  );
};

export const useAppLanguage = () => {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useAppLanguage must be used inside I18nProvider');
  return value;
};
