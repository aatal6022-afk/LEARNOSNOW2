import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, Shield, User } from 'lucide-react';
import { useI18n } from '../../services/i18nService.ts';

interface SystemLockScreenModalProps {
  isOpen: boolean;
  onUnlock: () => void;
  userName?: string;
  userEmail?: string;
  userPhoto?: string;
}

export const SystemLockScreenModal: React.FC<SystemLockScreenModalProps> = ({
  isOpen,
  onUnlock,
  userName,
  userEmail,
  userPhoto,
}) => {
  const { t, lang } = useI18n();
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  const displayName = userName || t('topbar.student', 'Студент');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const locale = lang === 'kk' ? 'kk-KZ' : lang === 'uk' ? 'uk-UA' : lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'ru-RU';
      setTimeStr(
        now.toLocaleTimeString(locale, {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
      setDateStr(
        now.toLocaleDateString(locale, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lang]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-black/90 backdrop-blur-2xl text-white p-8 animate-fade-in select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between max-w-5xl opacity-80">
        <div className="flex items-center space-x-2 text-xs text-white/70">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Learning OS • {t('lock.title', 'Сеанс защищен')}</span>
        </div>
        <div className="text-xs text-white/60">
          {t('lock.hint', 'Нажмите кнопку для разблокировки')}
        </div>
      </div>

      {/* Center Clock & Lock Display */}
      <div className="flex flex-col items-center justify-center space-y-6 text-center my-auto">
        <div className="space-y-2">
          <div className="text-7xl md:text-8xl font-extralight tracking-tight text-white/95 tabular-nums">
            {timeStr}
          </div>
          <div className="text-sm md:text-base font-medium text-white/70 capitalize tracking-wide">
            {dateStr}
          </div>
        </div>

        {/* User Card & Unlock Action */}
        <div className="mt-8 flex flex-col items-center space-y-4 bg-white/10 p-6 rounded-3xl border border-white/15 backdrop-blur-md shadow-2xl w-80">
          <div className="relative">
            {userPhoto ? (
              <img
                src={userPhoto}
                alt={displayName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white/90 shadow-lg">
                <User className="w-8 h-8" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-white/20 flex items-center justify-center text-white/80">
              <Lock className="w-3 h-3" />
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-base font-bold text-white tracking-tight">{displayName}</h3>
            {userEmail && (
              <p className="text-xs text-white/60 font-mono truncate max-w-[220px]">{userEmail}</p>
            )}
          </div>

          <button
            id="btn-system-unlock"
            onClick={onUnlock}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-white hover:bg-white/90 text-slate-900 font-semibold text-xs shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
          >
            <span>{t('lock.button', 'Войти в систему')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="text-[11px] text-white/40 tracking-wider">
        Learning OS Ecosystem
      </div>
    </div>
  );
};
