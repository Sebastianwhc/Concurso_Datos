import React from 'react';
import { useLang } from '../i18n/useLang';
import { Globe } from 'lucide-react';

interface LangToggleProps {
  variant?: 'floating' | 'inline';
}

export const LangToggle: React.FC<LangToggleProps> = ({ variant = 'floating' }) => {
  const { lang, setLang } = useLang();

  const isFloating = variant === 'floating';

  return (
    <div
      style={{
        position: isFloating ? 'fixed' : 'relative',
        top: isFloating ? '1.5rem' : 'auto',
        right: isFloating ? '1.5rem' : 'auto',
        zIndex: isFloating ? 999 : 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        background: 'rgba(10, 15, 30, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(0, 229, 255, 0.25)',
        borderRadius: '100px',
        padding: '0.25rem 0.35rem',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 229, 255, 0.08)',
        transition: 'all 0.3s ease',
      }}
    >
      <Globe size={14} style={{ color: '#00e5ff', marginLeft: '0.45rem', marginRight: '0.35rem', opacity: 0.85 }} />
      <button
        type="button"
        onClick={() => setLang('es')}
        style={{
          background: lang === 'es' ? 'linear-gradient(135deg, #00e5ff 0%, #00b8ff 100%)' : 'transparent',
          color: lang === 'es' ? '#000' : 'rgba(255,255,255,0.6)',
          fontWeight: lang === 'es' ? 800 : 500,
          border: 'none',
          borderRadius: '100px',
          padding: '0.25rem 0.65rem',
          fontSize: '0.75rem',
          cursor: 'pointer',
          letterSpacing: '0.5px',
          transition: 'all 0.25s ease',
          boxShadow: lang === 'es' ? '0 0 12px rgba(0, 229, 255, 0.4)' : 'none',
        }}
      >
        ES
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        style={{
          background: lang === 'en' ? 'linear-gradient(135deg, #00e5ff 0%, #00b8ff 100%)' : 'transparent',
          color: lang === 'en' ? '#000' : 'rgba(255,255,255,0.6)',
          fontWeight: lang === 'en' ? 800 : 500,
          border: 'none',
          borderRadius: '100px',
          padding: '0.25rem 0.65rem',
          fontSize: '0.75rem',
          cursor: 'pointer',
          letterSpacing: '0.5px',
          transition: 'all 0.25s ease',
          boxShadow: lang === 'en' ? '0 0 12px rgba(0, 229, 255, 0.4)' : 'none',
        }}
      >
        EN
      </button>
    </div>
  );
};

export default LangToggle;
