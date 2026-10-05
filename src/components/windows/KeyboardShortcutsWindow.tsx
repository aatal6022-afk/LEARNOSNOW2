import React, { useEffect, useState } from 'react';
import { Keyboard, RotateCcw } from 'lucide-react';
import {
  formatShortcut,
  getDefaultShortcuts,
  isReservedShortcut,
  isShortcutFormatValid,
  keyboardEventToShortcut,
  loadKeyboardShortcuts,
  saveKeyboardShortcuts,
  setShortcutCaptureActive,
  SHORTCUT_DEFINITIONS,
  ShortcutActionId,
} from '../../services/keyboardShortcuts.ts';
import { useI18n } from '../../services/i18nService.ts';

export const KeyboardShortcutsWindow: React.FC = () => {
  const { t } = useI18n();
  const [shortcuts, setShortcuts] = useState(loadKeyboardShortcuts);
  const [recordingId, setRecordingId] = useState<ShortcutActionId | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!recordingId) {
      setShortcutCaptureActive(false);
      return;
    }

    setShortcutCaptureActive(true);
    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === 'Escape') {
        setRecordingId(null);
        setStatus(t('shortcuts.canceled', 'Запись сочетания отменена'));
        return;
      }

      const shortcut = keyboardEventToShortcut(event);
      if (!shortcut || !isShortcutFormatValid(shortcut)) {
        setStatus(t('shortcuts.needModKey', 'Добавьте Ctrl/⌘ или Alt к клавише'));
        return;
      }
      if (isReservedShortcut(shortcut)) {
        setStatus(t('shortcuts.reserved', 'Это сочетание зарезервировано браузером или системой'));
        return;
      }
      if (Object.entries(shortcuts).some(([id, value]) => id !== recordingId && value === shortcut)) {
        setStatus(t('shortcuts.alreadyAssigned', 'Это сочетание уже назначено другой команде'));
        return;
      }

      const updated = { ...shortcuts, [recordingId]: shortcut };
      setShortcuts(updated);
      saveKeyboardShortcuts(updated);
      setRecordingId(null);
      setStatus(t('shortcuts.saved', 'Сочетание сохранено'));
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      setShortcutCaptureActive(false);
    };
  }, [recordingId, shortcuts, t]);

  const resetShortcuts = () => {
    const defaults = getDefaultShortcuts();
    setShortcuts(defaults);
    saveKeyboardShortcuts(defaults);
    setRecordingId(null);
    setStatus(t('shortcuts.resetSuccess', 'Восстановлены сочетания по умолчанию'));
  };

  return (
    <section className="h-full overflow-y-auto bg-slate-50 text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <Keyboard className="h-5 w-5 text-sky-700" />
          <div>
            <h2 className="text-base font-semibold">{t('app.shortcuts', 'Горячие клавиши')}</h2>
            <p className="text-xs text-slate-500">{t('shortcuts.desc', 'Сочетания сохраняются в этом браузере')}</p>
          </div>
        </div>
        <button type="button" onClick={resetShortcuts} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100" title={t('widget.resetDefaults', 'Сбросить')}>
          <RotateCcw className="h-3.5 w-3.5" />
          {t('action.reset', 'Сбросить')}
        </button>
      </header>

      <div className="divide-y divide-slate-200 px-5">
        {SHORTCUT_DEFINITIONS.map((definition) => (
          <div key={definition.id} className="flex min-h-16 items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <h3 className="text-sm font-medium">{t(`shortcut.${definition.id}.label`, definition.label)}</h3>
              <p className="text-xs text-slate-500">{t(`shortcut.${definition.id}.desc`, definition.description)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <kbd className="min-w-24 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-center font-mono text-xs text-slate-700">
                {recordingId === definition.id ? t('shortcuts.press', 'Нажмите…') : formatShortcut(shortcuts[definition.id])}
              </kbd>
              <button
                type="button"
                onClick={() => {
                  setStatus(t('shortcuts.recordingPrompt', 'Нажмите нужное сочетание; Esc отменяет запись'));
                  setRecordingId(definition.id);
                }}
                className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:border-sky-500 hover:bg-sky-50 cursor-pointer"
                aria-label={`Изменить сочетание: ${definition.label}`}
              >
                {recordingId === definition.id ? t('shortcuts.recording', 'Запись') : t('action.change', 'Изменить')}
              </button>
            </div>
          </div>
        ))}
      </div>
      <p role="status" aria-live="polite" className="min-h-8 px-5 pb-4 text-xs text-slate-500">{status}</p>
    </section>
  );
};
