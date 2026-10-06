import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Plus, 
  Check, 
  X, 
  Search, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Filter, 
  Layers, 
  AlertCircle,
  FileCheck,
  CheckCircle2,
  Info,
  Smile,
  ShieldCheck,
  RefreshCw,
  Coins,
  Edit2
} from 'lucide-react';
import { AdminSticker, stickerService } from '../../services/stickerService.ts';
import { playChime } from '../../utils/audio.ts';

const POPULAR_CATEGORIES = [
  'Все категории',
  'Одобрение & Похвала',
  'Код & Архитектура',
  'Баги & Фиксы',
  'Мотивация & Успех',
  'Мемы & Эмоции',
  'Статусы проекта'
];

const PRICE_PRESETS = [0, 25, 50, 100, 200, 500];

export const AdminStickersTab: React.FC = () => {
  const [stickers, setStickers] = useState<AdminSticker[]>(() => stickerService.getAllStickers());
  const [selectedCategory, setSelectedCategory] = useState<string>('Все категории');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Form state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [previewDimensions, setPreviewDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [previewSizeKb, setPreviewSizeKb] = useState<number>(0);
  const [stickerName, setStickerName] = useState('');
  const [stickerCategory, setStickerCategory] = useState('Одобрение & Похвала');
  const [stickerPrice, setStickerPrice] = useState<number>(0);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Inline price editing state
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>('0');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = stickerService.subscribeStickers((list) => {
      setStickers(list);
    });
    return () => unsub();
  }, []);

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    setUploadError(null);
    setIsProcessingFile(true);

    try {
      const processed = await stickerService.processPngFile(file);
      setUploadedFile(file);
      setPreviewDataUrl(processed.dataUrl);
      setPreviewDimensions({ width: processed.width, height: processed.height });
      setPreviewSizeKb(processed.sizeKb);

      // Default name from filename if empty
      if (!stickerName) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setStickerName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
      playChime('click');
    } catch (err: any) {
      setUploadError(err.message || 'Ошибка обработки PNG файла');
      playChime('alert');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSaveSticker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewDataUrl || !stickerName.trim()) {
      setUploadError('Пожалуйста, выберите PNG файл и укажите название стикера.');
      return;
    }

    try {
      await stickerService.addSticker({
        name: stickerName.trim(),
        category: stickerCategory.trim() || 'Общие',
        imageUrl: previewDataUrl,
        price: Math.max(0, Math.floor(Number(stickerPrice) || 0)),
        width: previewDimensions.width,
        height: previewDimensions.height,
        fileSizeKb: previewSizeKb,
      });

      playChime('success');
      setSuccessNotice(`Стикер «${stickerName.trim()}» (Цена: ${stickerPrice > 0 ? `${stickerPrice} XP` : 'Бесплатно'}) успешно добавлен!`);
      setTimeout(() => setSuccessNotice(null), 4000);

      // Reset modal
      setIsUploadModalOpen(false);
      setUploadedFile(null);
      setPreviewDataUrl('');
      setStickerName('');
      setStickerPrice(0);
      setUploadError(null);
    } catch (err: any) {
      setUploadError(err.message || 'Ошибка сохранения стикера');
    }
  };

  const handleStartEditPrice = (sticker: AdminSticker) => {
    setEditingPriceId(sticker.id);
    setEditingPriceValue(String(sticker.price || 0));
  };

  const handleSaveEditedPrice = async (id: string) => {
    const val = Math.max(0, Math.floor(Number(editingPriceValue) || 0));
    await stickerService.updateStickerPrice(id, val);
    setEditingPriceId(null);
    playChime('success');
  };

  const handleDeleteSticker = async (id: string, name: string) => {
    if (window.confirm(`Удалить стикер «${name}»? Он станет недоступен в чатах и на досках.`)) {
      await stickerService.deleteSticker(id);
      playChime('click');
    }
  };

  const handleToggleActive = async (id: string) => {
    await stickerService.toggleStickerActive(id);
    playChime('click');
  };

  const handleClearAll = async () => {
    if (window.confirm('Вы уверены, что хотите удалить ВСЕ загруженные стикеры? Действие необратимо.')) {
      await stickerService.clearAllStickers();
      playChime('alert');
    }
  };

  // Filtered stickers
  const filteredStickers = stickers.filter((st) => {
    const matchesCat = selectedCategory === 'Все категории' || st.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      st.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const activeCount = stickers.filter((s) => s.isActive !== false).length;
  const categoriesList = Array.from(new Set(stickers.map((s) => s.category).filter(Boolean)));
  const totalKb = stickers.reduce((acc, curr) => acc + (curr.fileSizeKb || 0), 0);
  const paidCount = stickers.filter((s) => (s.price || 0) > 0).length;

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
              <Smile className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>PNG Стикеры платформы</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                  Только админка
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Загрузка PNG-стикеров администратором с возможностью настройки цены (XP / Кармы) и мгновенной синхронизацией.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {stickers.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition cursor-pointer flex items-center space-x-1.5"
              title="Удалить все стикеры"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Очистить все</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setUploadedFile(null);
              setPreviewDataUrl('');
              setStickerName('');
              setStickerPrice(0);
              setUploadError(null);
              setIsUploadModalOpen(true);
              playChime('click');
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-2xs transition cursor-pointer flex items-center space-x-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Загрузить PNG-стикер</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center space-x-2 animate-fade-in shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successNotice}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">Всего стикеров</span>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{stickers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">Активно в чатах</span>
          <p className="text-xl font-bold text-emerald-600 mt-0.5">{activeCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">С установленной ценой</span>
          <p className="text-xl font-bold text-amber-600 mt-0.5">{paidCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">Общий вес файлов</span>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{totalKb} KB</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск стикера по названию или категории..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white focus:outline-hidden text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] text-slate-400 font-semibold mr-1 shrink-0 flex items-center space-x-1">
            <Filter className="w-3 h-3" />
            <span>Категории:</span>
          </span>
          {['Все категории', ...categoriesList].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stickers Grid or Empty State */}
      {filteredStickers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-4 shadow-2xs">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-50 flex items-center justify-center border border-rose-100 text-rose-500">
            <ImageIcon className="w-8 h-8 opacity-80" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-sm font-bold text-slate-800">
              {stickers.length === 0
                ? 'Тестовые стикеры удалены'
                : 'По выбранному фильтру ничего не найдено'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {stickers.length === 0
                ? 'На платформе пока нет стикеров. Загрузите первый PNG-файл с прозрачным фоном и установите цену (или сделайте бесплатным).'
                : 'Попробуйте изменить поисковый запрос или выбрать категорию «Все категории».'}
            </p>
          </div>
          {stickers.length === 0 && (
            <button
              type="button"
              onClick={() => {
                setStickerPrice(0);
                setIsUploadModalOpen(true);
              }}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Загрузить первый PNG-стикер</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredStickers.map((sticker) => (
            <div
              key={sticker.id}
              className={`group bg-white rounded-2xl border transition-all duration-150 p-3.5 space-y-3 flex flex-col justify-between shadow-2xs hover:shadow-md ${
                sticker.isActive !== false ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50/70'
              }`}
            >
              {/* Checkered preview box */}
              <div 
                className="w-full aspect-square rounded-xl flex items-center justify-center p-3 relative overflow-hidden border border-slate-100"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, #f1f5f9 25%, transparent 25%),
                    linear-gradient(-45deg, #f1f5f9 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #f1f5f9 75%),
                    linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)
                  `,
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
                }}
              >
                <img
                  src={sticker.imageUrl}
                  alt={sticker.name}
                  className="max-w-full max-h-full object-contain drop-shadow-xs transition-transform duration-200 group-hover:scale-110 sticker-render-crisp [image-rendering:-webkit-optimize-contrast] [image-rendering:crisp-edges]"
                  loading="eager"
                  decoding="sync"
                />
                <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono font-medium">
                  {sticker.fileSizeKb ? `${sticker.fileSizeKb} KB` : 'PNG'}
                </span>
                {/* Price tag on preview */}
                <div className="absolute top-1.5 left-1.5">
                  {sticker.price && sticker.price > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/90 backdrop-blur-xs text-white text-[9px] font-bold shadow-xs flex items-center space-x-1">
                      <Coins className="w-2.5 h-2.5" />
                      <span>{sticker.price} XP</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600/90 backdrop-blur-xs text-white text-[9px] font-bold shadow-xs">
                      Free
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 truncate max-w-[110px]">
                    {sticker.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {sticker.width && sticker.height ? `${sticker.width}×${sticker.height}` : ''}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 truncate" title={sticker.name}>
                  {sticker.name}
                </h4>

                {/* Price Edit Row */}
                <div className="pt-1 flex items-center justify-between text-[11px] bg-slate-50/80 p-1.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-medium flex items-center space-x-1">
                    <Coins className="w-3 h-3 text-amber-500" />
                    <span>Цена:</span>
                  </span>

                  {editingPriceId === sticker.id ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        min="0"
                        max="99999"
                        value={editingPriceValue}
                        onChange={(e) => setEditingPriceValue(e.target.value)}
                        className="w-16 px-1.5 py-0.5 text-[11px] font-bold bg-white border border-rose-300 rounded text-slate-900 focus:outline-hidden"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEditedPrice(sticker.id);
                          if (e.key === 'Escape') setEditingPriceId(null);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditedPrice(sticker.id)}
                        className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                        title="Сохранить цену"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPriceId(null)}
                        className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded cursor-pointer"
                        title="Отмена"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5">
                      <span className={`font-bold ${sticker.price > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {sticker.price > 0 ? `${sticker.price} XP` : 'Бесплатно'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStartEditPrice(sticker)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                        title="Изменить цену стикера"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => handleToggleActive(sticker.id)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center space-x-1 transition cursor-pointer ${
                    sticker.isActive !== false
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                  title={sticker.isActive !== false ? 'Деактивировать стикер' : 'Активировать стикер'}
                >
                  {sticker.isActive !== false ? (
                    <>
                      <Eye className="w-3 h-3 text-emerald-600" />
                      <span>Активен</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3 text-amber-600" />
                      <span>Скрыт</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteSticker(sticker.id, sticker.name)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="Удалить стикер"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-2xl bg-rose-100 text-rose-600">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Загрузка PNG-стикера</h3>
                  <p className="text-[11px] text-slate-500">Установка названия, категории и цены (XP/Карма)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveSticker} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-rose-500 bg-rose-50/50' 
                    : previewDataUrl 
                    ? 'border-emerald-300 bg-emerald-50/30' 
                    : 'border-slate-300 hover:border-rose-400 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/webp,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />

                {previewDataUrl ? (
                  <div className="space-y-3">
                    <div 
                      className="w-28 h-28 mx-auto rounded-xl p-2 border border-slate-200 relative flex items-center justify-center"
                      style={{
                        backgroundImage: `
                          linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
                          linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
                          linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
                          linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)
                        `,
                        backgroundSize: '12px 12px',
                        backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px'
                      }}
                    >
                      <img
                        src={previewDataUrl}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain drop-shadow-md"
                      />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-emerald-700 block">
                        PNG файл готов к загрузке
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {previewDimensions.width}×{previewDimensions.height} px · {previewSizeKb} KB
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      Нажмите для выбора другого файла
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2 py-3">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Перетащите PNG файл сюда или нажмите для выбора
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Рекомендуется прозрачный фон (transparent PNG), до 3 МБ
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Sticker Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Название стикера
                </label>
                <input
                  type="text"
                  value={stickerName}
                  onChange={(e) => setStickerName(e.target.value)}
                  placeholder="Например: Одобрено лидом, Баг пофикшен, Котик"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white focus:outline-hidden text-slate-900"
                  required
                />
              </div>

              {/* Price Setting */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-600" />
                    <span>Цена стикера (XP / PinkCoins)</span>
                  </label>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    stickerPrice > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {stickerPrice > 0 ? `Платный: ${stickerPrice} XP` : 'Бесплатный для всех (0 XP)'}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max="99999"
                    value={stickerPrice}
                    onChange={(e) => setStickerPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-32 px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-amber-300 focus:border-amber-500 focus:outline-hidden text-slate-900"
                    placeholder="0"
                  />
                  <div className="flex flex-wrap gap-1">
                    {PRICE_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setStickerPrice(p)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                          stickerPrice === p
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p === 0 ? 'Бесплатно' : `${p} XP`}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">
                  Укажите 0, чтобы стикер был сразу открыт всем пользователям, либо цену в XP кармы для платной разблокировки.
                </p>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Категория
                </label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {POPULAR_CATEGORIES.slice(1).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setStickerCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                        stickerCategory === cat
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={stickerCategory}
                  onChange={(e) => setStickerCategory(e.target.value)}
                  placeholder="Или введите свою категорию..."
                  className="w-full px-3.5 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white focus:outline-hidden text-slate-900"
                />
              </div>

              {/* Footer CTA */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={!previewDataUrl || !stickerName.trim() || isProcessingFile}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 rounded-xl shadow-2xs transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Сохранить и опубликовать</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

