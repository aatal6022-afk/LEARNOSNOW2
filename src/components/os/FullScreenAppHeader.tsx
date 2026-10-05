import React, { useEffect } from 'react';
import { 
  X, 
  Minus, 
  Minimize2, 
  Network, 
  Atom, 
  GitBranch, 
  Calendar, 
  Tv, 
  Users, 
  Bot, 
  PenTool, 
  Award, 
  LayoutGrid, 
  ShieldCheck, 
  Search, 
  Monitor,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { playChime } from '../../utils/audio.ts';
import { useI18n } from '../../services/i18nService.ts';

interface FullScreenAppHeaderProps {
  activeTab: string;
  onClose: () => void;
  onRestoreToWindow?: () => void;
}

const APP_ICONS: Record<string, { icon: any; color: string }> = {
  dag: { icon: Network, color: 'text-[#1A73E8]' },
  knowledge_sphere: { icon: Atom, color: 'text-[#1A73E8]' },
  knowledge_git: { icon: GitBranch, color: 'text-[#1E8E3E]' },
  textbook_library: { icon: BookOpen, color: 'text-[#1E8E3E]' },
  survey: { icon: GraduationCap, color: 'text-[#1A73E8]' },
  calendar: { icon: Calendar, color: 'text-[#1A73E8]' },
  focus: { icon: Tv, color: 'text-[#EA4335]' },
  peer: { icon: Users, color: 'text-[#1E8E3E]' },
  chat: { icon: Bot, color: 'text-[#F9AB00]' },
  white_screen: { icon: PenTool, color: 'text-[#1A73E8]' },
  portfolio: { icon: Award, color: 'text-[#F9AB00]' },
  widgets: { icon: LayoutGrid, color: 'text-[#1A73E8]' },
  partner_search: { icon: Search, color: 'text-[#1A73E8]' },
  admin: { icon: ShieldCheck, color: 'text-[#1A73E8]' },
};

export const FullScreenAppHeader: React.FC<FullScreenAppHeaderProps> = ({
  activeTab,
  onClose,
  onRestoreToWindow,
}) => {
  const { t, getAppTitle } = useI18n();
  const iconMeta = APP_ICONS[activeTab] || { icon: Monitor, color: 'text-[#1A73E8]' };
  const Icon = iconMeta.icon;
  const label = getAppTitle(activeTab);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      
      if (e.key === 'Escape' && !isInput) {
        e.preventDefault();
        playChime('click');
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleClose = () => {
    playChime('click');
    onClose();
  };

  const handleRestore = () => {
    playChime('click');
    if (onRestoreToWindow) {
      onRestoreToWindow();
    } else {
      onClose();
    }
  };

  return (
    <div className="h-11 px-4 bg-white text-[#202124] border-b border-[#DADCE0] flex items-center justify-between shrink-0 select-none z-30 shadow-none">
      {/* Left: Google App Info */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <Icon className={`w-4 h-4 ${iconMeta.color}`} />
          <span className="font-medium text-xs text-[#202124] tracking-tight">{label}</span>
          <span className="text-[#BDC1C6]">·</span>
          <span className="text-[11px] text-[#5F6368]">
            {t('nav.fullscreen', 'Полноэкранный режим')}
          </span>
        </div>
      </div>

      {/* Right: Minimal Google Action Controls */}
      <div className="flex items-center space-x-2">
        <span className="text-[11px] text-[#5F6368] hidden sm:inline-flex items-center space-x-1">
          <span>{t('nav.pressEsc', 'Нажмите Esc для выхода')}</span>
        </span>

        {onRestoreToWindow && (
          <button
            type="button"
            id="fullscreen-restore-window-btn"
            onClick={handleRestore}
            className="px-3 py-1 rounded-full text-xs font-medium text-[#3C4043] hover:text-[#202124] hover:bg-[#F1F3F4] border border-[#DADCE0] transition flex items-center space-x-1.5 cursor-pointer"
            title={t('nav.windowed', 'Оконный режим')}
          >
            <Minimize2 className="w-3.5 h-3.5 text-[#5F6368]" />
            <span className="hidden md:inline">{t('nav.windowed', 'Оконный режим')}</span>
          </button>
        )}

        <button
          type="button"
          id="fullscreen-close-btn"
          onClick={handleClose}
          className="px-3 py-1 rounded-full text-xs font-medium text-[#D93025] hover:bg-[#FCE8E6] transition flex items-center space-x-1.5 cursor-pointer"
          title={t('nav.closeFullscreen', 'Закрыть')}
        >
          <X className="w-3.5 h-3.5" />
          <span>{t('action.close', 'Закрыть')}</span>
        </button>
      </div>
    </div>
  );
};
