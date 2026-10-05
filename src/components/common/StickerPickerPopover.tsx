import React, { useState, useEffect, useRef } from 'react';
import { 
  Smile, 
  Search, 
  X, 
  ExternalLink, 
  Image as ImageIcon,
  Sparkles,
  Layers,
  Settings
} from 'lucide-react';
import { AdminSticker, stickerService } from '../../services/stickerService.ts';
import { playChime } from '../../utils/audio.ts';

interface StickerPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSticker: (sticker: AdminSticker) => void;
  onOpenAdminConsole?: () => void;
  positionClassName?: string;
}

export const StickerPickerPopover: React.FC<StickerPickerPopoverProps> = ({
  isOpen,
  onClose,
  onSelectSticker,
  onOpenAdminConsole,
  positionClassName = 'bottom-full mb-2 left-0'
}) => {
  const [stickers, setStickers] = useState<AdminSticker[]>(() => stickerService.getActiveStickers());
  const [activeCategory, setActiveCategory] = useState<string>('Все');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const unsub = stickerService.subscribeStickers((list) => {
      setStickers(list.filter((s) => s.isActive !== false));
    });

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      unsub();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = ['Все', ...Array.from(new Set(stickers.map((s) => s.category).filter(Boolean)))];

  const filteredStickers = stickers.filter((s) => {
    const matchCat = activeCategory === 'Все' || s.category === activeCategory;
    const matchSearch = !searchQuery.trim() || 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div
      ref={popoverRef}
      className={`absolute ${positionClassName} z-50 w-72 sm:w-80 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-fade-in flex flex-col text-slate-800`}
      style={{ maxHeight: '380px' }}
    >
      {/* Header */}
      <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
        <div className="flex items-center space-x-1.5">
          <Smile className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-bold text-slate-900">PNG Стикеры</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
            {stickers.length}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {onOpenAdminConsole && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAdminConsole();
              }}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
              title="Управление стикерами в админке"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      {stickers.length > 0 && (
        <div className="p-2 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск стикера..."
              className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white focus:outline-hidden text-slate-900"
            />
          </div>
        </div>
      )}

      {/* Categories Bar */}
      {categories.length > 2 && (
        <div className="flex items-center space-x-1 px-2.5 py-1.5 border-b border-slate-100 overflow-x-auto bg-slate-50/50">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap transition ${
                activeCategory === cat
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Sticker Grid / Body */}
      <div className="p-2.5 overflow-y-auto flex-1 min-h-[140px] max-h-[220px]">
        {stickers.length === 0 ? (
          <div className="text-center py-6 px-4 space-y-2">
            <div className="w-10 h-10 mx-auto rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100">
              <ImageIcon className="w-5 h-5 opacity-70" />
            </div>
            <p className="text-xs font-bold text-slate-800">
              Тестовые стикеры удалены
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Стикеры загружаются администратором через загрузку PNG-файлов в Панели администратора.
            </p>
            {onOpenAdminConsole && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdminConsole();
                }}
                className="mt-2 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition shadow-2xs inline-flex items-center space-x-1"
              >
                <span>Открыть админку</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </button>
            )}
          </div>
        ) : filteredStickers.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Ничего не найдено
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {filteredStickers.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  playChime('click');
                  onSelectSticker(st);
                  onClose();
                }}
                className="group p-1.5 rounded-xl hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all flex flex-col items-center justify-center relative cursor-pointer"
                title={`${st.name} (${st.category})`}
              >
                <div className="w-12 h-12 flex items-center justify-center relative">
                  <img
                    src={st.imageUrl}
                    alt={st.name}
                    className="max-w-full max-h-full object-contain drop-shadow-xs transition-transform duration-150 group-hover:scale-115"
                  />
                </div>
                <span className="text-[9px] font-medium text-slate-600 truncate w-full text-center mt-1 group-hover:text-rose-700">
                  {st.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="p-2 border-t border-slate-100 bg-slate-50/60 text-[10px] text-slate-400 flex items-center justify-between px-3">
        <span>PNG Стикеры</span>
        <span>Добавление через админку</span>
      </div>
    </div>
  );
};
