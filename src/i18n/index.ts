import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';

const en = require('./locales/en.json');
const ur = require('./locales/ur.json');

export type AppLanguage = 'en' | 'ur';

export const LANGUAGE_STORAGE_KEY = 'kaamasaan.language';
export const languages: Array<{ code: AppLanguage; labelKey: string; nativeLabel: string; isRTL: boolean }> = [
  { code: 'en', labelKey: 'profile.english', nativeLabel: 'English', isRTL: false },
  { code: 'ur', labelKey: 'profile.urdu', nativeLabel: 'اردو', isRTL: true }
];

export const isRTL = (language: string = i18n.language) => language.startsWith('ur');

export const getStoredLanguage = async (): Promise<AppLanguage | null> => {
  const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === 'ur' || stored === 'en' ? stored : null;
};

const getDeviceSuggestion = (): AppLanguage => {
  const locales = Localization.getLocales();
  return locales.some((locale) => locale.languageCode?.toLowerCase() === 'ur') ? 'ur' : 'en';
};

export const initI18n = async () => {
  const storedLanguage = await getStoredLanguage();
  const language = storedLanguage ?? 'en';
  const suggestedLanguage = getDeviceSuggestion();
  const languageIsRTL = isRTL(language);

  I18nManager.allowRTL(languageIsRTL);
  I18nManager.forceRTL(languageIsRTL);

  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      compatibilityJSON: 'v4',
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      lng: language,
      resources: {
        en: { translation: en },
        ur: { translation: ur }
      },
      returnNull: false
    });
  } else {
    await i18n.changeLanguage(language);
  }

  return { language, suggestedLanguage, needsRTLRestart: I18nManager.isRTL !== languageIsRTL };
};

export const changeLanguage = async (language: AppLanguage) => {
  const languageIsRTL = isRTL(language);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  await i18n.changeLanguage(language);

  const needsRTLRestart = I18nManager.isRTL !== languageIsRTL;
  I18nManager.allowRTL(languageIsRTL);
  I18nManager.forceRTL(languageIsRTL);

  return { needsRTLRestart };
};

export const currentLanguage = () => (i18n.language?.startsWith('ur') ? 'ur' : 'en') as AppLanguage;

export default i18n;
