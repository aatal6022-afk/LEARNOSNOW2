import React, { useState, useEffect, useRef } from 'react';
import { 
  Smile, 
  Search, 
  X, 
  ExternalLink, 
  Image as ImageIcon,
  Sparkles,
  Layers,
  Settings,
  Coins,
  Lock,
  Unlock,
  Type,
  Send
} from 'lucide-react';
import { AdminSticker, stickerService } from '../../services/stickerService.ts';
import { playChime } from '../../utils/audio.ts';

export type StickerPickerMode = 'insert' | 'send';

interface StickerPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSticker: (sticker: AdminSticker, mode?: StickerPickerMode) => void;
  onOpenAdminConsole?: () => void;
  positionClassName?: string;
  userKarma?: number;
  initialMode?: StickerPickerMode;
}

export const StickerPickerPopover: React.FC<StickerPickerPopoverProps> = ({
  isOpen,
  onClose,
  onSelectSticker,
  onOpenAdminConsole,
  positionClassName = 'bottom-full mb-2 left-0',
  userKarma = 500,
  initialMode = 'insert'
}) => {
  const [stickers, setStickers] = useState<AdminSticker[]>(() => stickerService.getActiveStickers());
  const [activeCategory, setActiveCategory] = useState<string>('Все');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mode, setMode] = useState<StickerPickerMode>(initialMode);
  const [unlockPromptSticker, setUnlockPromptSticker] = useState<AdminSticker | null>(null);
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

  const handleStickerClick = (st: AdminSticker, targetMode: StickerPickerMode = mode) => {
    const isUnlocked = stickerService.isStickerUnlocked(st);
    if (!isUnlocked && st.price > 0) {
      setUnlockPromptSticker(st);
      return;
    }

    playChime('click');
    onSelectSticker(st, targetMode);
    onClose();
  };

  const handleConfirmUnlock = (st: AdminSticker) => {
    const result = stickerService.unlockSticker(st, userKarma);
    if (result.success) {
      playChime('success');
      setUnlockPromptSticker(null);
      onSelectSticker(st, mode);
      onClose();
    } else {
      playChime('alert');
      alert(result.error || 'Недостаточно очков для разблокировки');
    }
  };

  return (
    <div
      ref={popoverRef}
      className={`absolute ${positionClassName} z-50 w-76 sm:w-88 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-fade-in flex flex-col text-slate-800`}
      style={{ maxHeight: '430px' }}
    >
      {/* Header */}
      <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
        <div className="flex items-center space-x-2">
          <Smile className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-bold text-slate-900">PNG Стикеры</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
            {stickers.length}
          </span>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-[10px]">
          <button
            type="button"
            onClick={() => setMode('insert')}
            className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer flex items-center space-x-1 ${
              mode === 'insert' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Вставлять стикер прямо в текст сообщения"
          >
            <Type className="w-3 h-3" />
            <span>В текст</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('send')}
            className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer flex items-center space-x-1 ${
              mode === 'send' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Отправить как отдельное сообщение"
          >
            <Send className="w-3 h-3" />
            <span>Отдельно</span>
          </button>
        </div>

        <div className="flex items-center space-x-1">
          {onOpenAdminConsole && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAdminConsole();
              }}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
              title="Управление стикерами и ценами в админке"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      {stickers.length > 0 && !unlockPromptSticker && (
        <div className="p-2 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск стикера по названию..."
              className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white focus:outline-hidden text-slate-900"
            />
          </div>
        </div>
      )}

      {/* Categories Bar */}
      {categories.length > 2 && !unlockPromptSticker && (
        <div className="flex items-center space-x-1 px-2.5 py-1.5 border-b border-slate-100 overflow-x-auto bg-slate-50/50">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap transition cursor-pointer ${
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

      {/* Unlock Confirmation Modal overlay inside Popover */}
      {unlockPromptSticker ? (
        <div className="p-4 space-y-3.5 text-center my-auto animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 p-2 border border-amber-200 flex items-center justify-center">
            <img src={unlockPromptSticker.imageUrl} alt={unlockPromptSticker.name} className="max-w-full max-h-full object-contain sticker-render-crisp [image-rendering:-webkit-optimize-contrast] [image-rendering:crisp-edges]" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900">Разблокировать стикер?</h4>
            <p className="text-[11px] text-slate-500">
              «{unlockPromptSticker.name}» стоит <span className="font-bold text-amber-600">{unlockPromptSticker.price} XP</span>
            </p>
          </div>
          <div className="flex items-center justify-center space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setUnlockPromptSticker(null)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={() => handleConfirmUnlock(unlockPromptSticker)}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-2xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Купить за {unlockPromptSticker.price} XP</span>
            </button>
          </div>
        </div>
      ) : (
        /* Sticker Grid / Body */
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
                  className="mt-2 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition shadow-2xs inline-flex items-center space-x-1 cursor-pointer"
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
              {filteredStickers.map((st) => {
                const isUnlocked = stickerService.isStickerUnlocked(st);
                const isPaid = (st.price || 0) > 0;

                return (
                  <div
                    key={st.id}
                    className="group relative p-1.5 rounded-xl hover:bg-rose-50/80 border border-transparent hover:border-rose-200 transition-all flex flex-col items-center justify-center cursor-pointer"
                    onClick={() => handleStickerClick(st, mode)}
                    title={`${st.name} · ${isPaid ? `${st.price} XP` : 'Бесплатно'} (Нажмите, чтобы ${mode === 'insert' ? 'вставить в текст' : 'отправить'})`}
                  >
                    <div className="w-12 h-12 flex items-center justify-center relative">
                      <img
                        src={st.imageUrl}
                        alt={st.name}
                        className="max-w-full max-h-full object-contain drop-shadow-xs transition-transform duration-150 group-hover:scale-110 sticker-render-crisp [image-rendering:-webkit-optimize-contrast] [image-rendering:crisp-edges]"
                        loading="eager"
                        decoding="sync"
                      />
                      {isPaid && !isUnlocked && (
                        <div className="absolute inset-0 bg-slate-900/40 rounded-lg flex items-center justify-center backdrop-blur-[0.5px]">
                          <Lock className="w-3.5 h-3.5 text-amber-300 drop-shadow" />
                        </div>
                      )}
                    </div>
                    <div className="w-full flex items-center justify-center space-x-1 mt-1">
                      <span className="text-[9px] font-medium text-slate-600 truncate text-center group-hover:text-rose-700">
                        {st.name}
                      </span>
                    </div>
                    {isPaid && (
                      <span className={`text-[8px] font-bold px-1 rounded ${isUnlocked ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                        {isUnlocked ? 'Открыт' : `${st.price} XP`}
                      </span>
                    )}

                    {/* Quick alternate action button on hover */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const altMode: StickerPickerMode = mode === 'insert' ? 'send' : 'insert';
                        handleStickerClick(st, altMode);
                      }}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-white/95 rounded-md shadow-xs border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition"
                      title={mode === 'insert' ? 'Отправить отдельно' : 'Вставить в текст'}
                    >
                      {mode === 'insert' ? <Send className="w-2.5 h-2.5 text-blue-600" /> : <Type className="w-2.5 h-2.5 text-rose-600" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Footer info */}
      <div className="p-2 border-t border-slate-100 bg-slate-50/60 text-[10px] text-slate-400 flex items-center justify-between px-3">
        <span>Режим: {mode === 'insert' ? 'Вставка в текст' : 'Отправка отдельно'}</span>
        <span>PNG Стикеры</span>
      </div>
    </div>
  );
};

