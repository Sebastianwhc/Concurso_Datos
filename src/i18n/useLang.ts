import { create } from 'zustand';

export type Lang = 'es' | 'en';

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const getInitialLang = (): Lang => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('ecoscan_lang') as Lang | null;
    if (saved === 'es' || saved === 'en') return saved;
  }
  return 'es';
};

export const useLang = create<LangState>((set) => ({
  lang: getInitialLang(),
  setLang: (lang) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ecoscan_lang', lang);
    }
    set({ lang });
  },
  toggleLang: () => {
    set((state) => {
      const next = state.lang === 'es' ? 'en' : 'es';
      if (typeof window !== 'undefined') {
        localStorage.setItem('ecoscan_lang', next);
      }
      return { lang: next };
    });
  },
}));
