import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Sparkles, 
  Eye, 
  Save, 
  RotateCcw, 
  LogOut, 
  Tag, 
  Calendar, 
  Layers, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { 
  releaseUpdatesService, 
  ReleaseUpdate, 
  ADMIN_PASSWORD 
} from '../../services/releaseUpdatesService.ts';
import { playChime } from '../../utils/audio.ts';

interface AdminUpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminUpdatesModal: React.FC<AdminUpdatesModalProps> = ({ isOpen, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  
  const [updatesList, setUpdatesList] = useState<ReleaseUpdate[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [version, setVersion] = useState<string>('v0.9.5-alpha');
  const [title, setTitle] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }));
  const [badge, setBadge] = useState<string>('Крупный релиз');
  const [badgeColor, setBadgeColor] = useState<'pink' | 'purple' | 'blue' | 'green' | 'amber'>('pink');
  const [summary, setSummary] = useState<string>('');
  const [highlights, setHighlights] = useState<string[]>(['']);
  const [detailsMarkdown, setDetailsMarkdown] = useState<string>('');
  const [author, setAuthor] = useState<string>('PinkInAu Team');
  const [isLatest, setIsLatest] = useState<boolean>(true);

  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setIsAuthenticated(releaseUpdatesService.isAdminAuthenticated());
      setUpdatesList(releaseUpdatesService.getUpdates());
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = releaseUpdatesService.subscribe(() => {
      setUpdatesList(releaseUpdatesService.getUpdates());
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      releaseUpdatesService.authenticateAdmin(passwordInput);
      setIsAuthenticated(true);
      setAuthError('');
      setPasswordInput('');
    } else {
      playChime('alert');
      setAuthError('Неверный пароль администратора!');
    }
  };

  const handleLogout = () => {
    releaseUpdatesService.logoutAdmin();
    setIsAuthenticated(false);
  };

  const handleApplyPreset = (type: 'major' | 'feature' | 'hotfix' | 'ui') => {
    const nextNum = updatesList.length ? `v0.9.${updatesList.length + 4}-alpha` : 'v0.9.5-alpha';
    setVersion(nextNum);
    setDate(new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }));
    setIsLatest(true);

    if (type === 'major') {
      setTitle('Глобальное обновление ядра и новые инструменты');
      setBadge('Крупный релиз');
      setBadgeColor('pink');
      setSummary('Масштабное расширение функционала платформы: оптимизация скорости и новые режимы совместной работы.');
      setHighlights([
        'Ускорен расчет и синхронизация графа знаний',
        'Новый режим командного спарринга',
        'Улучшена телеметрия автоматического зачета целей'
      ]);
      setDetailsMarkdown('В этом выпуске мы переработали внутреннюю архитектуру синхронизации и добавили расширенные инструменты для трекинга понимания.');
    } else if (type === 'feature') {
      setTitle('Новый модуль аналитики и экспорт отчетов');
      setBadge('Новая функция');
      setBadgeColor('purple');
      setSummary('Добавлены подробные графики освоения концепций и экспорт артефактов в один клик.');
      setHighlights([
        'Детальный график кривой забывания по каждому блоку',
        'Экспорт выполненных проектов в PDF и Markdown',
        'Интеграция быстрых заметок на графе'
      ]);
    } else if (type === 'hotfix') {
      setTitle('Исправление стабильности и оптимизация WebRTC');
      setBadge('Hotfix');
      setBadgeColor('amber');
      setSummary('Устранены задержки передачи аудио в спарринге и ускорена загрузка 3D-сферы.');
      setHighlights([
        'Исправлен баг синхронизации курсоров на доске',
        'Оптимизирована память при запуске Python-скриптов',
        'Плавные переходы между окнами Web OS'
      ]);
    } else {
      setTitle('Редизайн интерфейса и темная тема');
      setBadge('UI / UX');
      setBadgeColor('blue');
      setSummary('Обновленная палитра Material 3, адаптивные мобильные блоки и улучшенная типографика.');
      setHighlights([
        'Новая анимация узлов графа и всплывающих окон',
        'Улучшена читаемость кода в песочнице',
        'Поддержка жестов на сенсорных экранах'
      ]);
    }
  };

  const handleEditClick = (item: ReleaseUpdate) => {
    setEditingId(item.id);
    setVersion(item.version);
    setTitle(item.title);
    setDate(item.date);
    setBadge(item.badge);
    setBadgeColor(item.badgeColor || 'pink');
    setSummary(item.summary);
    setHighlights(item.highlights.length ? item.highlights : ['']);
    setDetailsMarkdown(item.detailsMarkdown || '');
    setAuthor(item.author || 'PinkInAu Team');
    setIsLatest(item.isLatest || false);
    setPreviewMode(false);
  };

  const handleResetForm = () => {
    setEditingId(null);
    setVersion('v0.9.5-alpha');
    setTitle('');
    setDate(new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }));
    setBadge('Крупный релиз');
    setBadgeColor('pink');
    setSummary('');
    setHighlights(['']);
    setDetailsMarkdown('');
    setAuthor('PinkInAu Team');
    setIsLatest(true);
    setSaveStatus(null);
  };

  const handleAddHighlight = () => {
    setHighlights([...highlights, '']);
  };

  const handleHighlightChange = (index: number, val: string) => {
    const copy = [...highlights];
    copy[index] = val;
    setHighlights(copy);
  };

  const handleRemoveHighlight = (index: number) => {
    const copy = highlights.filter((_, i) => i !== index);
    setHighlights(copy.length ? copy : ['']);
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!version.trim() || !title.trim()) {
      setSaveStatus('Пожалуйста, заполните версию и заголовок');
      return;
    }

    const payload: Partial<ReleaseUpdate> = {
      id: editingId || `rel-${Date.now()}`,
      version: version.trim(),
      title: title.trim(),
      date: date.trim(),
      badge: badge.trim(),
      badgeColor,
      summary: summary.trim(),
      highlights: highlights.filter((h) => h.trim().length > 0),
      detailsMarkdown: detailsMarkdown.trim(),
      author: author.trim(),
      isLatest,
      createdAt: editingId ? (updatesList.find((u) => u.id === editingId)?.createdAt || Date.now()) : Date.now(),
    };

    const res = await releaseUpdatesService.saveUpdate(payload, ADMIN_PASSWORD);
    if (res.success) {
      setSaveStatus('Релиз успешно сохранен и опубликован!');
      setTimeout(() => {
        setSaveStatus(null);
        handleResetForm();
      }, 1500);
    } else {
      setSaveStatus(res.error || 'Ошибка при сохранении');
    }
  };

  const handleDeleteUpdate = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот релиз?')) {
      await releaseUpdatesService.deleteUpdate(id, ADMIN_PASSWORD);
      if (editingId === id) {
        handleResetForm();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#FFF1F6] border border-[#ECD5DE] rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#FFDFEB] border-b border-[#ECD5DE]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C8266A] text-white flex items-center justify-center font-bold shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-[#241519] flex items-center gap-2">
                Панель управления релизами Pink Learn
                {isAuthenticated && (
                  <span className="text-xs bg-[#C8266A] text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Админ
                  </span>
                )}
              </h3>
              <p className="text-xs text-[#6F5A63]">
                Добавление, редактирование и публикация обновлений в реальном времени
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#C8266A] hover:bg-[#FFCFE0] rounded-full transition"
              >
                <LogOut className="w-3.5 h-3.5" /> Выйти
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/70 hover:bg-white text-[#241519] flex items-center justify-center transition border border-[#ECD5DE]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {!isAuthenticated ? (
            /* Login View */
            <div className="max-w-md mx-auto py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#FFDFEB] border border-[#F48FB4] text-[#C8266A] flex items-center justify-center shadow-inner">
                <Lock className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold text-[#241519] mb-2 font-display">
                Доступ только для администратора
              </h4>
              <p className="text-sm text-[#6F5A63] mb-6">
                Введите пароль доступа к панели управления релизами и журналом обновлений PinkInAu.
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Введите пароль администратора..."
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white border border-[#ECD5DE] rounded-2xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C8266A] text-center font-mono text-sm shadow-sm"
                    autoFocus
                  />
                </div>
                {authError && (
                  <p className="text-xs text-rose-600 font-semibold flex items-center justify-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {authError}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#C8266A] hover:bg-[#A81B56] text-white font-semibold rounded-2xl transition shadow-md shadow-[#C8266A]/30 cursor-pointer"
                >
                  Войти в панель управления
                </button>
              </form>
            </div>
          ) : (
            /* Admin Control Panel */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Form (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                <div className="bg-white p-5 rounded-2xl border border-[#ECD5DE] shadow-sm space-y-4">
                  
                  {/* Top action row & presets */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#ECD5DE]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6F5A63]">
                      {editingId ? '✏️ Редактирование релиза' : '✨ Новое обновление'}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-[#6F5A63]">Шаблоны:</span>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset('major')}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-[#FFDFEB] text-[#C8266A] rounded-full hover:bg-[#FFCFE0] transition"
                      >
                        Major
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset('feature')}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-[#F3E8FD] text-[#7C3AED] rounded-full hover:bg-[#E9D5FF] transition"
                      >
                        Feature
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset('hotfix')}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-[#FEF3C7] text-[#D97706] rounded-full hover:bg-[#FDE68A] transition"
                      >
                        Hotfix
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset('ui')}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-[#E0F2FE] text-[#0284C7] rounded-full hover:bg-[#BAE6FD] transition"
                      >
                        UI
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSaveUpdate} className="space-y-4">
                    {/* Row 1: Version, Date, Badge */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#6F5A63] mb-1">
                          Номер релиза
                        </label>
                        <input
                          type="text"
                          required
                          value={version}
                          onChange={(e) => setVersion(e.target.value)}
                          placeholder="v0.9.5-alpha"
                          className="w-full px-3 py-2 bg-[#FFFBFC] border border-[#ECD5DE] rounded-xl text-sm font-mono text-[#241519] focus:outline-none focus:border-[#C8266A]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#6F5A63] mb-1">
                          Дата релиза
                        </label>
                        <input
                          type="text"
                          required
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          placeholder="4 октября 2026"
                          className="w-full px-3 py-2 bg-[#FFFBFC] border border-[#ECD5DE] rounded-xl text-sm text-[#241519] focus:outline-none focus:border-[#C8266A]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#6F5A63] mb-1">
                          Категория (Бейдж)
                        </label>
                        <select
                          value={badgeColor}
                          onChange={(e) => {
                            const col = e.target.value as any;
                            setBadgeColor(col);
                            if (col === 'pink') setBadge('Крупный релиз');
                            else if (col === 'purple') setBadge('Новая функция');
                            else if (col === 'amber') setBadge('Hotfix');
                            else if (col === 'blue') setBadge('Архитектура');
                            else setBadge('Улучшения');
                          }}
                          className="w-full px-3 py-2 bg-[#FFFBFC] border border-[#ECD5DE] rounded-xl text-sm text-[#241519] focus:outline-none focus:border-[#C8266A]"
                        >
                          <option value="pink">🌸 Крупный релиз</option>
                          <option value="purple">🔮 Новая функция</option>
                          <option value="blue">📘 Архитектура</option>
                          <option value="amber">⚡ Hotfix</option>
                          <option value="green">🌱 Улучшения</option>
                        </select>
                      </div>
                    </div>

                    {/* Row 2: Title */}
                    <div>
                      <label className="block text-xs font-bold text-[#6F5A63] mb-1">
                        Заголовок обновления
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Например: Автоматический зачет задач и новый граф знаний"
                        className="w-full px-3 py-2 bg-[#FFFBFC] border border-[#ECD5DE] rounded-xl text-sm font-semibold text-[#241519] focus:outline-none focus:border-[#C8266A]"
                      />
                    </div>

                    {/* Row 3: Summary */}
                    <div>
                      <label className="block text-xs font-bold text-[#6F5A63] mb-1">
                        Краткое описание (Summary)
                      </label>
                      <textarea
                        rows={2}
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        placeholder="Краткая суть того, что изменилось..."
                        className="w-full px-3 py-2 bg-[#FFFBFC] border border-[#ECD5DE] rounded-xl text-sm text-[#241519] focus:outline-none focus:border-[#C8266A] resize-none"
                      />
                    </div>

                    {/* Row 4: Highlights / Key Features */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[#6F5A63]">
                          Ключевые пункты изменений (Highlights)
                        </label>
                        <button
                          type="button"
                          onClick={handleAddHighlight}
                          className="text-xs font-bold text-[#C8266A] hover:text-[#A81B56] flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Добавить пункт
                        </button>
                      </div>
                      <div className="space-y-2">
                        {highlights.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-xs text-[#6F5A63] font-bold w-4">{idx + 1}.</span>
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => handleHighlightChange(idx, e.target.value)}
                              placeholder={`Пункт изменения ${idx + 1}...`}
                              className="flex-1 px-3 py-1.5 bg-[#FFFBFC] border border-[#ECD5DE] rounded-xl text-xs text-[#241519] focus:outline-none focus:border-[#C8266A]"
                            />
                            {highlights.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveHighlight(idx)}
                                className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Row 5: Detailed Markdown description */}
                    <div>
                      <label className="block text-xs font-bold text-[#6F5A63] mb-1">
                        Подробный текст / Пост о релизе
                      </label>
                      <textarea
                        rows={3}
                        value={detailsMarkdown}
                        onChange={(e) => setDetailsMarkdown(e.target.value)}
                        placeholder="Развернутый текст с подробностями..."
                        className="w-full px-3 py-2 bg-[#FFFBFC] border border-[#ECD5DE] rounded-xl text-xs text-[#241519] focus:outline-none focus:border-[#C8266A] resize-none font-sans"
                      />
                    </div>

                    {/* Row 6: Latest Toggle & Author */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#ECD5DE]">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isLatest}
                          onChange={(e) => setIsLatest(e.target.checked)}
                          className="w-4 h-4 text-[#C8266A] rounded border-[#ECD5DE] focus:ring-[#C8266A]"
                        />
                        <span className="text-xs font-semibold text-[#241519]">
                          Отметить как актуальный релиз (Latest Version)
                        </span>
                      </label>
                      <div className="flex items-center gap-2">
                        {editingId && (
                          <button
                            type="button"
                            onClick={handleResetForm}
                            className="px-3 py-2 text-xs font-semibold text-[#6F5A63] hover:bg-[#FFDFEB] rounded-xl transition"
                          >
                            Отмена
                          </button>
                        )}
                        <button
                          type="submit"
                          className="flex items-center gap-1.5 px-5 py-2.5 bg-[#C8266A] hover:bg-[#A81B56] text-white font-semibold text-xs rounded-xl shadow-md transition cursor-pointer"
                        >
                          <Save className="w-4 h-4" /> {editingId ? 'Сохранить изменения' : 'Опубликовать релиз'}
                        </button>
                      </div>
                    </div>

                    {saveStatus && (
                      <p className="text-xs font-bold text-[#C8266A] bg-[#FFDFEB] p-2.5 rounded-xl border border-[#F48FB4] text-center">
                        {saveStatus}
                      </p>
                    )}
                  </form>
                </div>
              </div>

              {/* Right Column: List of Existing Releases (5 cols) */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#6F5A63]">
                    Опубликованные версии ({updatesList.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs font-bold text-[#C8266A] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Добавить новую
                  </button>
                </div>

                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {updatesList.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition ${
                        editingId === item.id
                          ? 'bg-[#FFDFEB] border-[#C8266A] ring-2 ring-[#C8266A]/30'
                          : 'bg-white border-[#ECD5DE] hover:border-[#F48FB4]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#FFDFEB] text-[#4A0B27]">
                            {item.version}
                          </span>
                          {item.isLatest && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C8266A] text-white uppercase">
                              Текущий
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#6F5A63]">{item.date}</span>
                      </div>

                      <h5 className="font-semibold text-sm text-[#241519] mb-1 line-clamp-1">
                        {item.title}
                      </h5>

                      <p className="text-xs text-[#6F5A63] line-clamp-2 mb-3">
                        {item.summary}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-[#ECD5DE]/60 text-xs">
                        <span className="text-[11px] text-[#6F5A63] bg-[#FFF1F6] px-2 py-0.5 rounded-md">
                          {item.badge}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditClick(item)}
                            className="p-1.5 text-[#C8266A] hover:bg-[#FFDFEB] rounded-lg transition"
                            title="Редактировать"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUpdate(item.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                            title="Удалить"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
