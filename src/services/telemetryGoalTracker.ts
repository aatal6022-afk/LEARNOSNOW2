/**
 * Autonomous Telemetry Goal Tracker & Task Auto-Completion Engine
 * 
 * Automatically observes student actions across the entire Learning OS:
 * - Block / unit completion (Step 1, 2, 3, 4)
 * - Quiz completions & test passes
 * - Code executions & sandbox test validations
 * - Stage 4 P2P & AI sparring debate completions
 * - Pomodoro & Focus session time elapsed
 * - Blank page recall challenges
 * - Note creation & knowledge crystallization
 * - Spaced repetition flashcard reviews
 * 
 * When a task or habit matches an observed telemetry milestone (e.g., "Пройти 3 блока за день"),
 * the engine automatically marks it as complete, updates streak/XP, and notifies the student.
 */

import { TaskItem, HabitItem } from '../types.ts';
import { playChime } from '../utils/audio.ts';

export type TelemetryMetricType =
  | 'blocks_completed'
  | 'quizzes_passed'
  | 'sparring_completed'
  | 'code_executed'
  | 'focus_minutes'
  | 'blank_page_done'
  | 'notes_created'
  | 'flashcards_reviewed'
  | 'sphere_inspected'
  | 'generic_activity';

export interface TelemetryEvent {
  type: TelemetryMetricType;
  amount?: number;
  unitId?: string;
  unitTitle?: string;
  metadata?: Record<string, any>;
  timestamp?: number;
}

export interface GoalCriteria {
  metricType: TelemetryMetricType;
  targetCount: number;
  metricLabel: string;
  description: string;
}

export interface DailyTelemetryStats {
  date: string;
  blocksCompleted: number;
  quizzesPassed: number;
  sparringCompleted: number;
  codeExecuted: number;
  focusMinutes: number;
  blankPageDone: number;
  notesCreated: number;
  flashcardsReviewed: number;
  sphereInspected: number;
  completedUnitIds: string[];
}

const STORAGE_KEY = 'learning_os_daily_telemetry';
const AUTO_COMPLETED_NOTICES_KEY = 'learning_os_telemetry_notices';

type AutoCompleteCallback = (taskOrHabitId: string, title: string, reason: string, isHabit: boolean) => void;

class TelemetryGoalTrackerService {
  private listeners: Set<AutoCompleteCallback> = new Set();
  private stats: DailyTelemetryStats;

  constructor() {
    this.stats = this.loadTodayStats();
  }

  private getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private loadTodayStats(): DailyTelemetryStats {
    const today = this.getTodayDateString();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.date === today) {
          return parsed;
        }
      }
    } catch {}

    const fresh: DailyTelemetryStats = {
      date: today,
      blocksCompleted: 0,
      quizzesPassed: 0,
      sparringCompleted: 0,
      codeExecuted: 0,
      focusMinutes: 0,
      blankPageDone: 0,
      notesCreated: 0,
      flashcardsReviewed: 0,
      sphereInspected: 0,
      completedUnitIds: [],
    };
    this.saveStats(fresh);
    return fresh;
  }

  private saveStats(stats: DailyTelemetryStats) {
    this.stats = stats;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {}
  }

  public getStats(): DailyTelemetryStats {
    if (this.stats.date !== this.getTodayDateString()) {
      this.stats = this.loadTodayStats();
    }
    return { ...this.stats };
  }

  /**
   * Intelligently parses user natural language task/habit title to identify the target metric and count.
   * Examples:
   * - "Пройти 3 блока за день" -> blocks_completed, target=3
   * - "Решить тест по модулю" -> quizzes_passed, target=1
   * - "25 минут фокуса" -> focus_minutes, target=25
   * - "Спарринг с напарником на 4 этапе" -> sparring_completed, target=1
   * - "Запустить код в песочнице" -> code_executed, target=1
   */
  public parseGoalCriteria(text: string): GoalCriteria | null {
    if (!text || typeof text !== 'string') return null;
    const lower = text.toLowerCase().trim();

    // Extract numbers if present
    const numMatch = lower.match(/\b(\d+)\b/);
    const parsedNum = numMatch ? parseInt(numMatch[1], 10) : null;

    // 1. Focus minutes / Pomodoro
    if (lower.includes('минут') || lower.includes('помодоро') || lower.includes('pomodoro') || lower.includes('фокус') || lower.includes('таймер')) {
      const target = parsedNum && parsedNum > 0 ? parsedNum : (lower.includes('помодоро') || lower.includes('фокус') ? 25 : 15);
      return {
        metricType: 'focus_minutes',
        targetCount: target,
        metricLabel: `${target} мин. фокуса`,
        description: `Время в режиме глубокого погружения Focus Studio`
      };
    }

    // 2. Blocks / Units completed
    if (lower.includes('блок') || lower.includes('модул') || lower.includes('урок') || lower.includes('темы') || lower.includes('тему') || lower.includes('unit') || lower.includes('lesson')) {
      const target = parsedNum && parsedNum > 0 ? parsedNum : 1;
      return {
        metricType: 'blocks_completed',
        targetCount: target,
        metricLabel: `${target} ${target === 1 ? 'блок' : target < 5 ? 'блока' : 'блоков'}`,
        description: `Освоение и завершение блоков знаний`
      };
    }

    // 3. Quiz / Tests
    if (lower.includes('тест') || lower.includes('квиз') || lower.includes('quiz') || lower.includes('вопрос') || lower.includes('проверк')) {
      const target = parsedNum && parsedNum > 0 ? parsedNum : 1;
      return {
        metricType: 'quizzes_passed',
        targetCount: target,
        metricLabel: `${target} ${target === 1 ? 'тест' : target < 5 ? 'теста' : 'тестов'}`,
        description: `Успешная сдача концептуальных тестов`
      };
    }

    // 4. Sparring / Stage 4 Debate
    if (lower.includes('спарринг') || lower.includes('дебат') || lower.includes('напарник') || lower.includes('этап 4') || lower.includes('шаг 4') || lower.includes('дискусс') || lower.includes('партнер')) {
      const target = parsedNum && parsedNum > 0 ? parsedNum : 1;
      return {
        metricType: 'sparring_completed',
        targetCount: target,
        metricLabel: `${target} ${target === 1 ? 'спарринг' : target < 5 ? 'спарринга' : 'спаррингов'}`,
        description: `Парные дебаты и защита решений на 4 этапе`
      };
    }

    // 5. Code Execution / Workbench Sandbox
    if (lower.includes('код') || lower.includes('песочниц') || lower.includes('скрипт') || lower.includes('програм') || lower.includes('python') || lower.includes('typescript') || lower.includes('запустить') || lower.includes('тест код')) {
      const target = parsedNum && parsedNum > 0 ? parsedNum : 1;
      return {
        metricType: 'code_executed',
        targetCount: target,
        metricLabel: `${target} ${target === 1 ? 'запуск кода' : target < 5 ? 'запуска кода' : 'запусков кода'}`,
        description: `Проверка алгоритмов и запуск тестов в песочнице`
      };
    }

    // 6. Blank Page Retrieval Challenge
    if (lower.includes('белый лист') || lower.includes('чистый лист') || lower.includes('blank') || lower.includes('вспомнить без подсказок')) {
      const target = parsedNum && parsedNum > 0 ? parsedNum : 1;
      return {
        metricType: 'blank_page_done',
        targetCount: target,
        metricLabel: `${target} ${target === 1 ? 'тест памяти' : 'теста памяти'}`,
        description: `Воспроизведение концепций на чистом листе`
      };
    }

    // 7. Notes & Knowledge Crystallization
    if (lower.includes('заметк') || lower.includes('конспект') || lower.includes('note') || lower.includes('записат') || lower.includes('аксиом')) {
      const target = parsedNum && parsedNum > 0 ? parsedNum : 1;
      return {
        metricType: 'notes_created',
        targetCount: target,
        metricLabel: `${target} ${target === 1 ? 'заметка' : target < 5 ? 'заметки' : 'заметок'}`,
        description: `Фиксация инвариантов и создание заметок`
      };
    }

    // 8. Spaced Repetition / Flashcards
    if (lower.includes('карточк') || lower.includes('повтор') || lower.includes('spaced') || lower.includes('flashcard')) {
      const target = parsedNum && parsedNum > 0 ? parsedNum : 5;
      return {
        metricType: 'flashcards_reviewed',
        targetCount: target,
        metricLabel: `${target} карточек`,
        description: `Интервальное повторение ключевых понятий`
      };
    }

    // 9. 3D Knowledge Sphere
    if (lower.includes('сфер') || lower.includes('граф') || lower.includes('sphere') || lower.includes('3d')) {
      const target = parsedNum && parsedNum > 0 ? parsedNum : 1;
      return {
        metricType: 'sphere_inspected',
        targetCount: target,
        metricLabel: `${target} узел сферы`,
        description: `Исследование структуры в 3D Сфере Знаний`
      };
    }

    return null;
  }

  /**
   * Get current progress for a specific metric type today
   */
  public getCurrentMetricCount(metricType: TelemetryMetricType): number {
    const stats = this.getStats();
    switch (metricType) {
      case 'blocks_completed':
        return stats.blocksCompleted;
      case 'quizzes_passed':
        return stats.quizzesPassed;
      case 'sparring_completed':
        return stats.sparringCompleted;
      case 'code_executed':
        return stats.codeExecuted;
      case 'focus_minutes':
        return stats.focusMinutes;
      case 'blank_page_done':
        return stats.blankPageDone;
      case 'notes_created':
        return stats.notesCreated;
      case 'flashcards_reviewed':
        return stats.flashcardsReviewed;
      case 'sphere_inspected':
        return stats.sphereInspected;
      default:
        return 0;
    }
  }

  /**
   * Record a new telemetry event and automatically evaluate active tasks & habits
   */
  public recordEvent(
    event: TelemetryEvent,
    currentTasks: TaskItem[],
    currentHabits: HabitItem[],
    onUpdateTasks: (updated: TaskItem[]) => void,
    onUpdateHabits: (updated: HabitItem[]) => void
  ) {
    const stats = this.loadTodayStats();
    const amount = event.amount || 1;

    switch (event.type) {
      case 'blocks_completed':
        if (event.unitId && !stats.completedUnitIds.includes(event.unitId)) {
          stats.completedUnitIds.push(event.unitId);
          stats.blocksCompleted = stats.completedUnitIds.length;
        } else if (!event.unitId) {
          stats.blocksCompleted += amount;
        }
        break;
      case 'quizzes_passed':
        stats.quizzesPassed += amount;
        break;
      case 'sparring_completed':
        stats.sparringCompleted += amount;
        break;
      case 'code_executed':
        stats.codeExecuted += amount;
        break;
      case 'focus_minutes':
        stats.focusMinutes += amount;
        break;
      case 'blank_page_done':
        stats.blankPageDone += amount;
        break;
      case 'notes_created':
        stats.notesCreated += amount;
        break;
      case 'flashcards_reviewed':
        stats.flashcardsReviewed += amount;
        break;
      case 'sphere_inspected':
        stats.sphereInspected += amount;
        break;
    }

    this.saveStats(stats);
    this.evaluateAndAutoCheck(currentTasks, currentHabits, onUpdateTasks, onUpdateHabits);
  }

  /**
   * Evaluates all uncompleted tasks and habits against today's telemetry stats.
   * If condition is satisfied, automatically toggles them to completed!
   */
  public evaluateAndAutoCheck(
    tasks: TaskItem[],
    habits: HabitItem[],
    onUpdateTasks: (updated: TaskItem[]) => void,
    onUpdateHabits: (updated: HabitItem[]) => void
  ) {
    let tasksChanged = false;
    let habitsChanged = false;
    const stats = this.getStats();

    const updatedTasks = tasks.map((task) => {
      if (task.done) return task;
      const criteria = this.parseGoalCriteria(task.title);
      if (!criteria) return task;

      const currentCount = this.getCurrentMetricCount(criteria.metricType);
      if (currentCount >= criteria.targetCount) {
        tasksChanged = true;
        this.notifyAutoComplete(
          task.id,
          task.title,
          `Телеметрия зафиксировала: ${currentCount}/${criteria.targetCount} (${criteria.description})`,
          false
        );
        return {
          ...task,
          done: true,
          milestone: `Авто-зачет ИИ: ${criteria.metricLabel} (${currentCount}/${criteria.targetCount})`
        };
      }
      return task;
    });

    const updatedHabits = habits.map((habit) => {
      if (habit.completedToday) return habit;
      const criteria = this.parseGoalCriteria(habit.title);
      if (!criteria) return habit;

      const currentCount = this.getCurrentMetricCount(criteria.metricType);
      if (currentCount >= criteria.targetCount) {
        habitsChanged = true;
        const todayStr = this.getTodayDateString();
        const history = Array.isArray(habit.history) ? [...habit.history] : [];
        if (!history.includes(todayStr)) {
          history.push(todayStr);
        }
        const newStreak = habit.streak + 1;
        this.notifyAutoComplete(
          habit.id,
          habit.title,
          `Телеметрия подтвердила привычку: ${currentCount}/${criteria.targetCount} (${criteria.description})`,
          true
        );
        return {
          ...habit,
          completedToday: true,
          streak: newStreak,
          bestStreak: Math.max(habit.bestStreak || 0, newStreak),
          history,
        };
      }
      return habit;
    });

    if (tasksChanged) {
      onUpdateTasks(updatedTasks);
    }
    if (habitsChanged) {
      onUpdateHabits(updatedHabits);
    }

    // Secondary semantic evaluation via Gemini for tasks with free-form conversational wording
    const remainingTasks = (tasksChanged ? updatedTasks : tasks).filter((t) => !t.done);
    const remainingHabits = (habitsChanged ? updatedHabits : habits).filter((h) => !h.completedToday);

    if (remainingTasks.length > 0 || remainingHabits.length > 0) {
      this.evaluateWithGeminiAI(
        remainingTasks,
        remainingHabits,
        tasksChanged ? updatedTasks : tasks,
        habitsChanged ? updatedHabits : habits,
        onUpdateTasks,
        onUpdateHabits
      ).catch(() => {});
    }
  }

  private isGeminiEvaluating = false;

  public async evaluateWithGeminiAI(
    pendingTasks: TaskItem[],
    pendingHabits: HabitItem[],
    allTasks: TaskItem[],
    allHabits: HabitItem[],
    onUpdateTasks: (updated: TaskItem[]) => void,
    onUpdateHabits: (updated: HabitItem[]) => void
  ) {
    if (this.isGeminiEvaluating) return;
    this.isGeminiEvaluating = true;

    try {
      const stats = this.getStats();
      const res = await fetch('/api/gemini/classify-task-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: pendingTasks.map((t) => ({ id: t.id, title: t.title })),
          habits: pendingHabits.map((h) => ({ id: h.id, title: h.title })),
          telemetryStats: stats,
          completedUnitTitles: stats.completedUnitIds,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const completedTaskIds = new Set(data.completedTaskIds || []);
        const completedHabitIds = new Set(data.completedHabitIds || []);
        const evaluationsMap = new Map((data.evaluations || []).map((e: any) => [e.id, e]));

        if (completedTaskIds.size > 0) {
          const newTasks = allTasks.map((t) => {
            if (completedTaskIds.has(t.id) && !t.done) {
              const evalItem: any = evaluationsMap.get(t.id);
              const reason = evalItem?.reason || 'Выполнено на основе действий в системе';
              this.notifyAutoComplete(t.id, t.title, `ИИ-анализ: ${reason}`, false);
              return {
                ...t,
                done: true,
                milestone: `Авто-зачет ИИ: ${reason}`
              };
            }
            return t;
          });
          onUpdateTasks(newTasks);
        }

        if (completedHabitIds.size > 0) {
          const todayStr = this.getTodayDateString();
          const newHabits = allHabits.map((h) => {
            if (completedHabitIds.has(h.id) && !h.completedToday) {
              const evalItem: any = evaluationsMap.get(h.id);
              const reason = evalItem?.reason || 'Подтверждено телеметрией';
              const history = Array.isArray(h.history) ? [...h.history] : [];
              if (!history.includes(todayStr)) history.push(todayStr);
              const newStreak = h.streak + 1;
              this.notifyAutoComplete(h.id, h.title, `ИИ-анализ: ${reason}`, true);
              return {
                ...h,
                completedToday: true,
                streak: newStreak,
                bestStreak: Math.max(h.bestStreak || 0, newStreak),
                history,
              };
            }
            return h;
          });
          onUpdateHabits(newHabits);
        }
      }
    } catch (e) {
      console.warn('Gemini goal classifier fetch warning:', e);
    } finally {
      this.isGeminiEvaluating = false;
    }
  }

  private notifyAutoComplete(id: string, title: string, reason: string, isHabit: boolean) {
    playChime('success');
    this.listeners.forEach((listener) => {
      try {
        listener(id, title, reason, isHabit);
      } catch {}
    });
  }

  public onAutoComplete(callback: AutoCompleteCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }
}

export const telemetryGoalTracker = new TelemetryGoalTrackerService();
