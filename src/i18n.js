import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enUS from './locales/en-US.json';
import esCO from './locales/es-CO.json';
import frFR from './locales/fr-FR.json';
import ruRU from './locales/ru-RU.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'en-US': { translation: enUS },
      'es-CO': { translation: esCO },
      'fr-FR': { translation: frFR },
      'ru-RU': { translation: ruRU },
    },
    lng: 'en-US',
    fallbackLng: 'en-US',
    supportedLngs: ['en-US', 'es-CO', 'fr-FR', 'ru-RU'],
    interpolation: { escapeValue: false },
  });

export default i18n;