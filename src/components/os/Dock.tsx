import React from 'react';
import { 
  Monitor,
  Network, 
  Atom, 
  GitBranch, 
  BookOpen, 
  GraduationCap, 
  Calendar, 
  Tv, 
  Bot, 
  Users, 
  PenTool, 
  LayoutGrid, 
  Award, 
  ShieldCheck, 
} from 'lucide-react';
import { WindowId, WindowState } from '../../types.ts';
import { useI18n } from '../../services/i18nService.ts';

interface DockProps {
  windows: Record<WindowId, WindowState>;
  onToggleWindow: (id: WindowId) => void;
  activeWindowId: WindowId | null;
}

const DOCK_CONFIG: { id: WindowId; icon: React.ReactNode }[] = [
  { id: 'desktop', icon: <Monitor className="w-5 h-5" /> },
  { id: 'dag', icon: <Network className="w-5 h-5" /> },
  { id: 'knowledge_sphere', icon: <Atom className="w-5 h-5 text-sky-500 animate-spin-slow" /> },
  { id: 'knowledge_git', icon: <GitBranch className="w-5 h-5 text-emerald-500" /> },
  { id: 'textbook_library', icon: <BookOpen className="w-5 h-5 text-emerald-600" /> },
  { id: 'survey', icon: <GraduationCap className="w-5 h-5 text-indigo-500" /> },
  { id: 'calendar', icon: <Calendar className="w-5 h-5 text-sky-500" /> },
  { id: 'focus', icon: <Tv className="w-5 h-5" /> },
  { id: 'chat', icon: <Bot className="w-5 h-5" /> },
  { id: 'partner_search', icon: <Users className="w-5 h-5" /> },
  { id: 'peer', icon: <Users className="w-5 h-5" /> },
  { id: 'white_screen', icon: <PenTool className="w-5 h-5 text-rose-500" /> },
  { id: 'widgets', icon: <LayoutGrid className="w-5 h-5" /> },
  { id: 'portfolio', icon: <Award className="w-5 h-5" /> },
  { id: 'admin', icon: <ShieldCheck className="w-5 h-5" /> },
];

export const Dock: React.FC<DockProps> = ({ windows, onToggleWindow, activeWindowId }) => {
  const { getAppTitle } = useI18n();

  return (
    <div 
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 select-none pt-6 pb-2.5 px-8 group flex flex-col items-center cursor-pointer"
      aria-label="Dock"
    >
      {/* Thin Collapsed Strip */}
      <div className="w-32 h-1.5 rounded-full bg-slate-900/60 dark:bg-white/60 backdrop-blur-xl border border-white/30 shadow-md transition-all duration-300 ease-out group-hover:opacity-0 group-hover:h-0 group-hover:scale-x-50 pointer-events-none" />

      {/* Full Expanded Dock */}
      <div className="transform translate-y-5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-300 ease-out pointer-events-none group-hover:pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl px-2.5 py-1.5 flex items-center space-x-1.5 border border-slate-200/90 dark:border-white/15 shadow-2xl ring-1 ring-slate-900/5">
        {DOCK_CONFIG.map((item) => {
          const win = windows[item.id];
          const isOpen = win && win.isOpen;
          const isActive = activeWindowId === item.id;
          const isMinimized = win && win.isMinimized;
          const label = getAppTitle(item.id);

          return (
            <div key={item.id} className="group/item relative flex flex-col items-center">
              {/* Tooltip */}
              <div className="absolute -top-9 scale-0 group-hover/item:scale-100 transition-transform origin-bottom duration-150 pointer-events-none z-50 whitespace-nowrap bg-slate-900 text-white text-[11px] font-medium px-2 py-0.5 rounded shadow-sm">
                {label}
              </div>

              <button
                id={`dock-item-${item.id}`}
                data-tab={item.id}
                data-window-id={item.id}
                onClick={() => onToggleWindow(item.id)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={label}
              >
                {item.icon}
              </button>

              {/* Status Dot */}
              <div className="h-1 flex items-center justify-center mt-0.5">
                {isOpen && (
                  <span
                    className={`w-1 h-1 rounded-full transition-all ${
                      isMinimized 
                        ? 'bg-amber-500' 
                        : isActive 
                        ? 'bg-slate-900' 
                        : 'bg-slate-400'
                    }`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
