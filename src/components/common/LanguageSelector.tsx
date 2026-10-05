import React, { useState, useRef, useEffect } from 'react';
import { useI18n, SupportedLanguage } from '../../services/i18nService.ts';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'compact' | 'full' | 'dropdown' | 'pill';
  dark?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  variant = 'compact',
  dark = false,
}) => {
  const { lang, setLanguage, languages, geoMeta, resetToAutoIp } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentLangInfo = languages.find((l) => l.code === lang) || languages[2];

  const handleResetToAuto = async () => {
    setIsDetecting(true);
    await resetToAutoIp();
    setIsDetecting(false);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (variant === 'pill') {
    return (
      <div className={`inline-flex items-center p-1 rounded-full ${dark ? 'bg-stone-900/80 border border-white/10' : 'bg-stone-100 border border-stone-200'} ${className}`}>
        {languages.map((item) => {
          const isActive = item.code === lang;
          return (
            <button
              key={item.code}
              onClick={() => setLanguage(item.code, true)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? 'bg-rose-500 text-white shadow-sm font-semibold'
                  : dark
                  ? 'text-stone-300 hover:text-white hover:bg-white/10'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
              title={item.name}
            >
              <span className="mr-1">{item.flag}</span>
              <span>{item.nativeName}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
          dark
            ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
            : 'bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 shadow-xs'
        }`}
        aria-label="Select language"
      >
        <span>{currentLangInfo.flag}</span>
        <span className="font-semibold">{currentLangInfo.nativeName}</span>
        {geoMeta?.isAuto && (
          <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-600 font-mono" title={`Авто по IP (${geoMeta.country || 'Geo'})`}>
            IP
          </span>
        )}
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''} ${dark ? 'text-stone-400' : 'text-stone-500'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-1.5 w-48 rounded-xl shadow-xl z-50 overflow-hidden border transition-all ${
            dark
              ? 'bg-stone-900/95 backdrop-blur-md border-white/15 text-white'
              : 'bg-white/95 backdrop-blur-md border-stone-200 text-stone-800'
          }`}
        >
          <div className="py-1">
            {languages.map((item) => {
              const isSelected = item.code === lang;
              return (
                <button
                  key={item.code}
                  onClick={() => {
                    setLanguage(item.code, true);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? dark
                        ? 'bg-rose-500/20 text-rose-300 font-semibold'
                        : 'bg-rose-50 text-rose-600 font-semibold'
                      : dark
                      ? 'hover:bg-white/10 text-stone-200'
                      : 'hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <span>{item.flag}</span>
                    <span>{item.nativeName}</span>
                  </span>
                  {isSelected && <span className="text-rose-500 font-bold">✓</span>}
                </button>
              );
            })}

            <div className={`my-1 border-t ${dark ? 'border-white/10' : 'border-stone-100'}`} />

            <button
              onClick={handleResetToAuto}
              disabled={isDetecting}
              className={`w-full text-left px-3.5 py-2 text-[11px] flex items-center justify-between transition-colors ${
                geoMeta?.isAuto
                  ? dark
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-emerald-700 bg-emerald-50'
                  : dark
                  ? 'text-stone-400 hover:bg-white/10'
                  : 'text-stone-500 hover:bg-stone-50'
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <span>{isDetecting ? '⏳' : '🌐'}</span>
                <span>{isDetecting ? 'Определение IP...' : 'Автовыбор по IP'}</span>
              </span>
              {geoMeta?.country && (
                <span className="font-mono text-[10px] opacity-75 font-semibold">
                  {geoMeta.country}
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
