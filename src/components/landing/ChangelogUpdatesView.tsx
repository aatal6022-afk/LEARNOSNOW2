import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  Copy, 
  Calendar, 
  Layers, 
  ShieldCheck, 
  Sliders, 
  ArrowLeft, 
  ExternalLink, 
  ChevronRight, 
  Settings, 
  Lock,
  Tag
} from 'lucide-react';
import { 
  releaseUpdatesService, 
  ReleaseUpdate 
} from '../../services/releaseUpdatesService.ts';

interface ChangelogUpdatesViewProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdmin: () => void;
}

export const ChangelogUpdatesView: React.FC<ChangelogUpdatesViewProps> = ({
  isOpen,
  onClose,
  onOpenAdmin
}) => {
  const [updates, setUpdates] = useState<ReleaseUpdate[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUpdates(releaseUpdatesService.getUpdates());
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = releaseUpdatesService.subscribe(() => {
      setUpdates(releaseUpdatesService.getUpdates());
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const latestUpdate = updates.find((u) => u.isLatest) || updates[0];

  const filteredUpdates = updates.filter((item) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'major') return item.badge.toLowerCase().includes('крупн') || item.badgeColor === 'pink';
    if (filterCategory === 'feature') return item.badge.toLowerCase().includes('функц') || item.badgeColor === 'purple';
    if (filterCategory === 'hotfix') return item.badge.toLowerCase().includes('fix') || item.badgeColor === 'amber';
    return true;
  });

  const handleCopyVersion = (version: string, id: string) => {
    navigator.clipboard.writeText(version);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const getBadgeStyle = (color?: string) => {
    switch (color) {
      case 'purple':
        return 'bg-[#F3E8FD] text-[#7C3AED] border-[#E9D5FF]';
      case 'blue':
        return 'bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]';
      case 'amber':
        return 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]';
      case 'green':
        return 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]';
      default:
        return 'bg-[#FFDFEB] text-[#C8266A] border-[#F48FB4]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#FFFBFC] text-[#241519] selection:bg-[#C8266A] selection:text-white font-sans">
      
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-[#ECD5DE]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#FFF1F6] text-[#6F5A63] hover:text-[#241519] transition"
              title="Назад к лендингу"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-xl tracking-tight">
                Pink<b>In</b>Au
              </span>
              <span className="text-[#ECD5DE] font-light">/</span>
              <span className="text-sm font-semibold text-[#6F5A63]">Что нового</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#C8266A] bg-[#FFF1F6] hover:bg-[#FFDFEB] border border-[#ECD5DE] rounded-full transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" /> Панель администратора
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#FFF1F6] hover:bg-[#FFDFEB] text-[#241519] flex items-center justify-center transition border border-[#ECD5DE]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFDFEB] text-[#4A0B27] text-xs font-semibold border border-[#F48FB4]">
            <Sparkles className="w-4 h-4 text-[#C8266A]" />
            <span>Журнал релизов и обновлений платформы</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold font-display tracking-tight text-[#241519]">
            Что нового в <span className="text-[#C8266A]">Pink Learn</span>
          </h1>

          <p className="text-base sm:text-lg text-[#6F5A63] max-w-2xl mx-auto leading-relaxed">
            Хронология развития образовательной Web OS. Здесь собраны все ключевые нововведения, архитектурные улучшения и исправления.
          </p>
        </div>

        {/* Latest Release Showcase Card */}
        {latestUpdate && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFF1F6] via-[#FFDFEB]/70 to-[#FFCFE0]/80 p-6 sm:p-8 border-2 border-[#F48FB4] shadow-lg shadow-[#C8266A]/10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl sm:text-4xl font-mono font-extrabold text-[#C8266A] tracking-tight">
                  {latestUpdate.version}
                </span>
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-[#C8266A] text-white shadow-sm">
                  Актуальный релиз
                </span>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getBadgeStyle(latestUpdate.badgeColor)}`}>
                  {latestUpdate.badge}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#6F5A63]">
                <Calendar className="w-3.5 h-3.5" />
                <span>{latestUpdate.date}</span>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold font-display text-[#241519] mb-3">
              {latestUpdate.title}
            </h2>

            <p className="text-sm sm:text-base text-[#4A0B27] mb-6 leading-relaxed">
              {latestUpdate.summary}
            </p>

            {latestUpdate.highlights && latestUpdate.highlights.length > 0 && (
              <div className="space-y-2 mb-6 bg-white/80 backdrop-blur-sm p-4 sm:p-5 rounded-2xl border border-[#ECD5DE]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6F5A63] mb-3">
                  Главные улучшения:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {latestUpdate.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs sm:text-sm text-[#241519]">
                      <div className="w-4 h-4 rounded-full bg-[#FFDFEB] text-[#C8266A] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {latestUpdate.detailsMarkdown && (
              <div className="text-xs sm:text-sm text-[#6F5A63] border-t border-[#ECD5DE] pt-4">
                {latestUpdate.detailsMarkdown}
              </div>
            )}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-[#ECD5DE]">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
                filterCategory === 'all'
                  ? 'bg-[#C8266A] text-white shadow-sm'
                  : 'bg-[#FFF1F6] text-[#6F5A63] hover:bg-[#FFDFEB]'
              }`}
            >
              Все выпуски ({updates.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('major')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
                filterCategory === 'major'
                  ? 'bg-[#C8266A] text-white shadow-sm'
                  : 'bg-[#FFF1F6] text-[#6F5A63] hover:bg-[#FFDFEB]'
              }`}
            >
              🌸 Крупные релизы
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('feature')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
                filterCategory === 'feature'
                  ? 'bg-[#C8266A] text-white shadow-sm'
                  : 'bg-[#FFF1F6] text-[#6F5A63] hover:bg-[#FFDFEB]'
              }`}
            >
              🔮 Новые функции
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('hotfix')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
                filterCategory === 'hotfix'
                  ? 'bg-[#C8266A] text-white shadow-sm'
                  : 'bg-[#FFF1F6] text-[#6F5A63] hover:bg-[#FFDFEB]'
              }`}
            >
              ⚡ Hotfix & Fixes
            </button>
          </div>

          <span className="text-xs text-[#6F5A63]">
            Показано: {filteredUpdates.length} из {updates.length}
          </span>
        </div>

        {/* Timeline of Releases */}
        <div className="space-y-6 relative before:absolute before:inset-0 before:left-6 sm:before:left-8 before:w-0.5 before:bg-[#ECD5DE] before:z-0">
          {filteredUpdates.map((item, idx) => (
            <div key={item.id} className="relative z-10 pl-14 sm:pl-16">
              
              {/* Timeline dot */}
              <div className="absolute left-4 sm:left-6 -translate-x-1/2 top-5 w-5 h-5 rounded-full bg-white border-4 border-[#C8266A] shadow-sm" />

              {/* Release Box */}
              <div className="bg-white border border-[#ECD5DE] rounded-3xl p-6 hover:shadow-md transition space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-lg text-[#241519]">
                      {item.version}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyVersion(item.version, item.id)}
                      className="p-1 rounded-md text-[#6F5A63] hover:text-[#C8266A] hover:bg-[#FFF1F6] transition"
                      title="Скопировать версию"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getBadgeStyle(item.badgeColor)}`}>
                      {item.badge}
                    </span>
                  </div>

                  <span className="text-xs font-medium text-[#6F5A63]">
                    {item.date}
                  </span>
                </div>

                <h3 className="text-lg font-bold font-display text-[#241519]">
                  {item.title}
                </h3>

                <p className="text-sm text-[#4A0B27]/90 leading-relaxed">
                  {item.summary}
                </p>

                {item.highlights && item.highlights.length > 0 && (
                  <ul className="space-y-1.5 pt-2 border-t border-[#ECD5DE]/50">
                    {item.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-[#6F5A63]">
                        <span className="text-[#C8266A] font-bold">•</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {item.detailsMarkdown && (
                  <p className="text-xs text-[#6F5A63] italic pt-2">
                    {item.detailsMarkdown}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info in Changelog */}
        <div className="text-center py-8 border-t border-[#ECD5DE] text-xs text-[#6F5A63] space-y-2">
          <p>© 2026 PinkInAu. Все релизы версионируются по стандарту SemVer.</p>
          <p>
            Есть предложения по новым функциям? Пишите: <a href="https://t.me/pinkinauceo" target="_blank" rel="noopener noreferrer" className="text-[#C8266A] font-semibold underline">@pinkinauceo</a>
          </p>
        </div>

      </div>
    </div>
  );
};
