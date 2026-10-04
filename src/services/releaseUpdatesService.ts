import { playChime } from '../utils/audio.ts';

export interface ReleaseUpdate {
  id: string;
  version: string;
  title: string;
  date: string;
  badge: string;
  badgeColor?: 'pink' | 'purple' | 'blue' | 'green' | 'amber';
  summary: string;
  highlights: string[];
  detailsMarkdown?: string;
  author?: string;
  isLatest?: boolean;
  createdAt: number;
}

export const ADMIN_PASSWORD = 'admin789056@pinKil@ve';

const LOCAL_STORAGE_KEY = 'pink_learn_release_updates';
const ADMIN_AUTH_KEY = 'pink_learn_admin_authenticated';

export const INITIAL_UPDATES: ReleaseUpdate[] = [
  {
    id: 'rel-0-9-4',
    version: 'v0.9.4-alpha',
    title: 'Глобальный запуск Pink Learn Alpha & Умная Телеметрия',
    date: '4 октября 2026',
    badge: 'Крупный релиз',
    badgeColor: 'pink',
    summary: 'Первый публичный альфа-релиз Pink Learn. Интерактивный граф знаний, парный спарринг в реальном времени и двухуровневый трекер целей.',
    highlights: [
      'Интерактивный граф обучения с тепловой картой забывания Эббингауза',
      'Фокус-студия с тестом «Чистый лист» и интерактивной песочницей Python/TypeScript',
      'Парный спарринг со звуковым и видео-каналом WebRTC и синхронной доской',
      'Автоматическое закрытие задач через глубокую телеметрию и ИИ-анализ',
      'Публичная страница портфолио для демонстрации артефактов и кода'
    ],
    detailsMarkdown: 'Мы рады представить первый полнофункциональный альфа-релиз Pink Learn! Платформа превращает линейные курсы в динамический граф понимания. Вся система работает в формате Web OS: плавающие окна, общая память сессий, командный Помодоро и кристаллизация знаний в Сфере.',
    author: 'PinkInAu Core Team',
    isLatest: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: 'rel-0-9-2',
    version: 'v0.9.2-alpha',
    title: '3D Сфера Знаний & Кастальенский Синтез',
    date: '28 сентября 2026',
    badge: 'Новая функция',
    badgeColor: 'purple',
    summary: 'Внедрена трехслойная Сфера Знаний (Ядро, Мантия, Орбита), вдохновленная «Игрой в бисер» Германа Гессе.',
    highlights: [
      '3D-визуализация междисциплинарных связей на Three.js / WebGL',
      'Алгоритм поиска скрытых аналогий между физикой, музыкой и кодом',
      'Сохранение инвариантов и концептуальных мостов'
    ],
    detailsMarkdown: 'Сфера Знаний позволяет увидеть дисциплины как единый связанный космос. ИИ анализирует ваши пройденные темы и предлагает неожиданные параллели для глубокого понимания.',
    author: 'PinkInAu Core Team',
    isLatest: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
  },
  {
    id: 'rel-0-9-0',
    version: 'v0.9.0-alpha',
    title: 'Песочницы кода и Git Понимания',
    date: '15 сентября 2026',
    badge: 'Архитектура',
    badgeColor: 'blue',
    summary: 'Полноценный изолированный запуск скриптов Python 3.11 и коммиты мастерства.',
    highlights: [
      'Серверная песочница с исполнением тестов за <200мс',
      'Ветвление гипотез и версионирование заметок',
      'Поддержка адаптивных квизов на базе Gemini'
    ],
    detailsMarkdown: 'Теперь каждый теоретический блок сопровождается реальной практикой в терминале с автоматической проверкой ассертов.',
    author: 'PinkInAu Core Team',
    isLatest: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 19,
  }
];

class ReleaseUpdatesService {
  private updates: ReleaseUpdate[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.updates = this.loadLocalUpdates();
    this.syncWithServer();
  }

  private loadLocalUpdates(): ReleaseUpdate[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_UPDATES;
  }

  private saveLocalUpdates(updates: ReleaseUpdate[]) {
    this.updates = updates;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updates));
    } catch {}
    this.notifyListeners();
  }

  public async syncWithServer(): Promise<ReleaseUpdate[]> {
    try {
      const res = await fetch('/api/updates');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.updates)) {
          this.saveLocalUpdates(data.updates);
          return data.updates;
        }
      }
    } catch {}
    return this.updates;
  }

  public getUpdates(): ReleaseUpdate[] {
    return [...this.updates].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  public getLatestUpdate(): ReleaseUpdate | null {
    const list = this.getUpdates();
    return list.find((u) => u.isLatest) || list[0] || null;
  }

  public isAdminAuthenticated(): boolean {
    return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
  }

  public authenticateAdmin(password: string): boolean {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem(ADMIN_AUTH_KEY, 'true');
      playChime('success');
      return true;
    }
    return false;
  }

  public logoutAdmin(): void {
    localStorage.removeItem(ADMIN_AUTH_KEY);
  }

  public async saveUpdate(update: Partial<ReleaseUpdate>, password: string): Promise<{ success: boolean; error?: string }> {
    if (password !== ADMIN_PASSWORD && !this.isAdminAuthenticated()) {
      return { success: false, error: 'Неверный пароль администратора' };
    }

    try {
      const res = await fetch('/api/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: ADMIN_PASSWORD, update }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.updates)) {
          this.saveLocalUpdates(data.updates);
          playChime('success');
          return { success: true };
        }
      }
    } catch (e: any) {
      console.warn('Server save failed, using local fallback:', e);
    }

    // Local fallback
    const id = update.id || `rel-${Date.now()}`;
    const formatted: ReleaseUpdate = {
      id,
      version: update.version || 'v0.9.5-alpha',
      title: update.title || 'Новое обновление',
      date: update.date || new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
      badge: update.badge || 'Обновление',
      badgeColor: (update.badgeColor as any) || 'pink',
      summary: update.summary || '',
      highlights: update.highlights || [],
      detailsMarkdown: update.detailsMarkdown || '',
      author: update.author || 'PinkInAu Team',
      isLatest: update.isLatest !== undefined ? update.isLatest : true,
      createdAt: update.createdAt || Date.now(),
    };

    let updatedList = [...this.updates];
    if (formatted.isLatest) {
      updatedList = updatedList.map((u) => ({ ...u, isLatest: false }));
    }

    const idx = updatedList.findIndex((u) => u.id === id);
    if (idx >= 0) {
      updatedList[idx] = formatted;
    } else {
      updatedList.unshift(formatted);
    }

    this.saveLocalUpdates(updatedList);
    playChime('success');
    return { success: true };
  }

  public async deleteUpdate(id: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (password !== ADMIN_PASSWORD && !this.isAdminAuthenticated()) {
      return { success: false, error: 'Неверный пароль администратора' };
    }

    try {
      const res = await fetch(`/api/updates/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: ADMIN_PASSWORD }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.updates)) {
          this.saveLocalUpdates(data.updates);
          return { success: true };
        }
      }
    } catch {}

    const updatedList = this.updates.filter((u) => u.id !== id);
    this.saveLocalUpdates(updatedList);
    return { success: true };
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((fn) => {
      try { fn(); } catch {}
    });
  }
}

export const releaseUpdatesService = new ReleaseUpdatesService();
