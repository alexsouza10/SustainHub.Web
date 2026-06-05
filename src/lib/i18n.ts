import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '@/locales/en'
import pt from '@/locales/pt'
import es from '@/locales/es'

const savedLang = localStorage.getItem('lang') ?? 'en'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      pt: { translation: pt },
      es: { translation: es },
    },
    lng:          savedLang,
    fallbackLng:  'en',
    interpolation: { escapeValue: false },
  })

export default i18n
