import { useLang, type Lang } from './useLang';
import { translations, type TranslationSchema } from './translations';

export const useT = (): { t: TranslationSchema; lang: Lang; setLang: (l: Lang) => void; toggleLang: () => void } => {
  const { lang, setLang, toggleLang } = useLang();
  return {
    t: translations[lang] as TranslationSchema,
    lang,
    setLang,
    toggleLang,
  };
};
