import { DAGNode, LearningUnit, UserArtifact } from '../types.ts';
import { telemetryEngine } from './telemetryEngine.ts';
import { i18n } from './i18nService.ts';

export interface EpistemicFact {
  id: string;
  topic: string;
  domain: string;
  statement: string;
  confidence: number;
  discoveredByAgent: string;
  verifiedAt: string;
  layer: 'core_axiom' | 'mantle_skill' | 'orbit_artifact';
  linkedNodeIds?: string[];
  impactWeight: number;
}

export interface AgentReasoningTrace {
  id: string;
  timestamp: string;
  agentName: string;
  taskGoal: string;
  premises: string[];
  deduction: string;
  verdict: string;
  injectedKnowledgeSummary?: string;
  nextStepTrigger?: string;
}

export interface CastalianBridge {
  id: string;
  source: string;
  target: string;
  type: 'castalian_resonance' | 'direct_impact_ray' | 'castalian_bridge';
  explanation: string;
  mathBridge: string;
  strength: number;
}

export interface AiPerceptionEvent {
  id: string;
  timestamp: string;
  channel: 'telemetry_friction' | 'hesitation_vector' | 'ungrounded_theory' | 'epistemic_resonance' | 'blind_recall';
  observation: string;
  metricName: string;
  metricValue: any;
  severity: 'normal' | 'friction' | 'resonance';
}

export interface AiActionEvent {
  id: string;
  timestamp: string;
  actionType: 'clean_memory_purge' | 'axiom_crystallization' | 'castalian_ray_projection' | 'entropy_balance';
  description: string;
  cleanMemoryPurged: boolean;
  targetAxiom: string;
}

export interface CognitiveConflict {
  id: string;
  topic: string;
  branch: string;
  userHypothesis: string;
  canonicalInvariant: string;
  counterExampleCode: string;
  counterExampleOutput: string;
  explanation: string;
  resolved: boolean;
  resolvedAt?: string;
  resolutionNote?: string;
  xpReward: number;
}

export interface KnowledgeMilestoneTag {
  tag: string;
  title: string;
  date: string;
  sha256Hash: string;
  masteredUnitsCount: number;
  provenFactsCount: number;
  verdict: string;
  exportReady: boolean;
}

export interface KnowledgePullRequest {
  id: string;
  title: string;
  author: string;
  reviewer: string;
  sourceBranch: string;
  targetBranch: string;
  status: 'open' | 'merged' | 'closed';
  conceptDiff: string[];
  peerComments: Array<{ author: string; role: string; comment: string; timestamp: string }>;
  artifactName: string;
  createdAt: string;
}

export interface EpistemicLedgerData {
  version: number;
  userPurpose?: string;
  userPurposeDomain?: string;
  userPurposeSetAt?: string;
  studentState: {
    targetDomain: string;
    masteredTopics: string[];
    activeGaps: string[];
    recentConfidenceScore: number;
    totalInsightsCrystallized: number;
    coreResonancePercentage: number;
    lastUpdated: string;
  };
  provenFacts: EpistemicFact[];
  provenInvariants?: EpistemicFact[];
  recentTraces: AgentReasoningTrace[];
  castalianBridges?: CastalianBridge[];
  aiPerceptions?: AiPerceptionEvent[];
  aiActions?: AiActionEvent[];
  cognitiveConflicts?: CognitiveConflict[];
  milestoneTags?: KnowledgeMilestoneTag[];
  pullRequests?: KnowledgePullRequest[];
  crystallizedKnowledgeNodes: Array<{
    id: string;
    title: string;
    subtitle: string;
    layer: 'core' | 'mantle' | 'orbit';
    domain: string;
    domainColor: string;
    status: 'active' | 'completed';
    impactRayTargets: string[];
    description: string;
    weight: number;
    synthesizedByAgent: string;
    createdAt: string;
    formula?: string;
    castalianBeadId?: string;
    firstPrinciplesCitation?: string;
    aiPerception?: {
      observedFriction: string;
      masteryConfidence: number;
      retentionState: 'firm' | 'decaying' | 'untested';
      liveVector: string;
    };
    aiAction?: {
      activeIntervention: string;
      projectedRaysCount: number;
      groundedInArtifact: boolean;
      lastPurgedReasoningTrace?: string;
    };
  }>;
}

const STORAGE_KEY = 'pink_epistemic_ledger_v3';
const CONFLICTS_STORAGE_KEY = 'pink_epistemic_conflicts_v3';
const BRANCHES_STORAGE_KEY = 'pink_knowledge_custom_branches_v3';

const INITIAL_CONFLICTS: CognitiveConflict[] = [
  {
    id: 'conf-async-threads',
    topic: 'Асинхронность в Node.js / JS',
    branch: 'hypothesis/async-mental-model',
    userHypothesis: 'Каждый вызов async/await создает отдельный поток OS и параллельно выполняет JS-инструкции.',
    canonicalInvariant: 'JavaScript выполняется в единственном главном потоке (Single-Threaded Event Loop). Асинхронность достигается через фазы Event Loop и неблокирующий I/O в пуле libuv.',
    counterExampleCode: `// Доказательство: тяжелый синхронный цикл блокирует асинхронные таймеры\nconsole.log("Старт таймера");\nsetTimeout(() => console.log("Таймер сработал!"), 100);\n\nconst start = Date.now();\nwhile (Date.now() - start < 400) {\n  // Блокируем главный поток на 400мс\n}\nconsole.log("Главный поток освобожден через " + (Date.now() - start) + "мс");`,
    counterExampleOutput: `Старт таймера\nГлавный поток освобожден через 401мс\nТаймер сработал! // Сработал только ПОСЛЕ освобождения главного потока`,
    explanation: 'Таймер не смог выполниться параллельно, потому что JavaScript однопоточен. await лишь приостанавливает выполнение генераторной функции и передает управление в очередь микротасок (Microtask Queue).',
    resolved: false,
    xpReward: 120,
  },
  {
    id: 'conf-immutability-react',
    topic: 'Мутации состояния в React / State Flow',
    branch: 'hypothesis/state-reactivity',
    userHypothesis: 'Прямое изменение свойств объекта (state.user.name = "Alex") экономит память и должно вызывать быстрый ререндер.',
    canonicalInvariant: 'React проверяет равенство ссылок (Object.is / Shallow Comparison). Прямая мутация сохраняет ту же ссылку объекта в памяти, предотвращая обнаружение изменений компонентом.',
    counterExampleCode: `const prevUser = { name: "Ivan", role: "guest" };\nconst nextUser = prevUser;\nnextUser.name = "Alex"; // Прямая мутация\n\nconsole.log("Равны ли ссылки?", Object.is(prevUser, nextUser)); // true -> React НЕ сделает re-render!`,
    counterExampleOutput: `Равны ли ссылки? true\nРезультат: Компонент не перерисовывается, данные устаревают в UI.`,
    explanation: 'Иммутабельное обновление ({ ...prev, name: "Alex" }) создает новую ссылку, гарантируя предсказуемый ререндер и работу memo/useMemo.',
    resolved: false,
    xpReward: 90,
  },
  {
    id: 'conf-sql-transactions',
    topic: 'Уровни изоляции транзакций БД',
    branch: 'hypothesis/database-isolation',
    userHypothesis: 'Read Committed уровень изоляции полностью защищает от "Фантомного чтения" (Phantom Reads).',
    canonicalInvariant: 'Read Committed предотвращает только Dirty Read. Phantom Reads предотвращаются только на уровнях Repeatable Read (в PG) или Serializable.',
    counterExampleCode: `// T1: SELECT COUNT(*) FROM users WHERE age > 25 (результат: 5)\n// T2: INSERT INTO users (age) VALUES (30); COMMIT;\n// T1: SELECT COUNT(*) FROM users WHERE age > 25 (результат: 6 -> Фантомная строка!)`,
    counterExampleOutput: `Count 1: 5\nTransaction 2 committed\nCount 2: 6 // Появилась фантомная строка внутри одной транзакции T1`,
    explanation: 'В Read Committed каждый отдельный запрос видит свой свежий снимок (Snapshot), поэтому между двумя одинаковыми запросами могут появиться новые строки из закоммиченных сторонних транзакций.',
    resolved: true,
    resolvedAt: 'Вчера, 18:40',
    resolutionNote: 'Инвариант подтвержден практикой в песочнице SQL.',
    xpReward: 100,
  },
];

const INITIAL_TAGS: KnowledgeMilestoneTag[] = [
  {
    tag: 'v1.0-junior-invariants',
    title: 'Фундаментальные структуры данных & Базовые алгоритмы',
    date: '28 сентября 2026',
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    masteredUnitsCount: 8,
    provenFactsCount: 14,
    verdict: 'Верифицировано: 100% покрытие тестами в изолированной песочнице.',
    exportReady: true,
  },
  {
    tag: 'v1.2-async-concurrency',
    title: 'Асинхронные архитектуры, Event Loop & Libuv',
    date: '3 октября 2026',
    sha256Hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    masteredUnitsCount: 12,
    provenFactsCount: 22,
    verdict: 'Верифицировано: Сдано 4 Capstone проекта без единой когнитивной ошибки.',
    exportReady: true,
  },
];

const INITIAL_PULL_REQUESTS: KnowledgePullRequest[] = [
  {
    id: 'pr-104',
    title: 'Реализация распределенного Rate Limiter на Token Bucket',
    author: 'Вы (Student HEAD)',
    reviewer: 'ИИ-Экзаменатор & Напарник (Sparring Peer)',
    sourceBranch: 'feature/rate-limiter-token-bucket',
    targetBranch: 'main',
    status: 'open',
    conceptDiff: [
      '+ Invariant: Токены пополняются непрерывно на основе формулы: min(capacity, current + rate * delta)',
      '+ Invariant: Атомарная проверка в Redis через Lua-скрипт исключает race conditions',
      '- Deprecated: Синхронная блокировка через локальный мьютекс в многосерверной среде'
    ],
    peerComments: [
      {
        author: 'Напарник (Sparring)',
        role: 'Peer Reviewer',
        comment: 'Отличная идея с расчетом delta на лету вместо фонового таймера setInterval. Это снижает нагрузку на CPU!',
        timestamp: '15 минут назад',
      },
      {
        author: 'Vertex AI Mentor',
        role: 'AI Examiner',
        comment: 'Ассерты на граничный случай переполнения емкости (bucket burst capacity) пройдены на 100%. Готово к мерджу.',
        timestamp: '5 минут назад',
      }
    ],
    artifactName: 'RateLimiterService.ts',
    createdAt: 'Сегодня, 12:30',
  }
];

class EpistemicLedgerService {
  private cache: EpistemicLedgerData | null = null;
  private listeners: Set<(data: EpistemicLedgerData) => void> = new Set();
  private isFetching: boolean = false;
  private conflicts: CognitiveConflict[] = [];
  private customBranches: string[] = [];

  constructor() {
    this.conflicts = this.loadStoredConflicts();
    this.customBranches = this.loadStoredBranches();
    this.loadFromLocal();
    void this.fetchLedger();
  }

  private loadStoredConflicts(): CognitiveConflict[] {
    try {
      const raw = localStorage.getItem(CONFLICTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_CONFLICTS;
  }

  private saveStoredConflicts(conflicts: CognitiveConflict[]) {
    this.conflicts = conflicts;
    try {
      localStorage.setItem(CONFLICTS_STORAGE_KEY, JSON.stringify(conflicts));
    } catch {}
    if (this.cache) {
      this.cache.cognitiveConflicts = conflicts;
      this.notify();
    }
  }

  private loadStoredBranches(): string[] {
    try {
      const raw = localStorage.getItem(BRANCHES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  private saveStoredBranches(branches: string[]) {
    this.customBranches = branches;
    try {
      localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(branches));
    } catch {}
  }

  public getCustomBranches(): string[] {
    return [...this.customBranches];
  }

  public addCustomBranch(name: string): string {
    const formatted = name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const branchName = formatted.startsWith('hypothesis/') ? formatted : `hypothesis/${formatted}`;
    if (!this.customBranches.includes(branchName)) {
      const next = [...this.customBranches, branchName];
      this.saveStoredBranches(next);
    }
    return branchName;
  }

  public getConflicts(): CognitiveConflict[] {
    return [...this.conflicts];
  }

  public resolveConflict(conflictId: string, note?: string): { success: boolean; xpReward: number } {
    const target = this.conflicts.find((c) => c.id === conflictId);
    if (!target) return { success: false, xpReward: 0 };

    target.resolved = true;
    target.resolvedAt = 'Только что';
    target.resolutionNote = note || 'Когнитивный конфликт разрешен. Истинный инвариант подтвержден доказательством и влит в ветку main.';
    this.saveStoredConflicts([...this.conflicts]);

    // Add proven fact to ledger
    if (this.cache) {
      const newFact: EpistemicFact = {
        id: `fact-resolved-${Date.now()}`,
        topic: target.topic,
        domain: 'Разрешенные конфликты',
        statement: target.canonicalInvariant,
        confidence: 0.99,
        discoveredByAgent: 'Epistemic 3-Way Merge Engine',
        verifiedAt: new Date().toISOString(),
        layer: 'core_axiom',
        impactWeight: 20,
      };
      this.cache.provenFacts = [newFact, ...(this.cache.provenFacts || [])];
      this.cache.provenInvariants = this.cache.provenFacts;
      this.notify();
    }

    return { success: true, xpReward: target.xpReward || 100 };
  }

  public getMilestones(): KnowledgeMilestoneTag[] {
    return this.cache?.milestoneTags || INITIAL_TAGS;
  }

  public getPullRequests(): KnowledgePullRequest[] {
    return this.cache?.pullRequests || INITIAL_PULL_REQUESTS;
  }

  public mergePullRequest(prId: string): boolean {
    if (!this.cache) return false;
    const prs = this.cache.pullRequests || INITIAL_PULL_REQUESTS;
    const target = prs.find((p) => p.id === prId);
    if (!target) return false;

    target.status = 'merged';
    this.cache.pullRequests = [...prs];

    // Add proven facts from PR
    const newFact: EpistemicFact = {
      id: `fact-pr-${Date.now()}`,
      topic: target.title,
      domain: 'Peer Review & Sparring',
      statement: `Пулл-реквест «${target.title}» проверен спарринг-партнером и ИИ-экзаменатором и влит в ветку main.`,
      confidence: 1.0,
      discoveredByAgent: 'Peer Review Sparring Pipeline',
      verifiedAt: new Date().toISOString(),
      layer: 'orbit_artifact',
      impactWeight: 25,
    };
    this.cache.provenFacts = [newFact, ...(this.cache.provenFacts || [])];
    this.notify();
    return true;
  }

  private loadFromLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.cache = JSON.parse(raw);
        if (this.cache) {
          this.cache.cognitiveConflicts = this.conflicts;
          this.cache.milestoneTags = INITIAL_TAGS;
          this.cache.pullRequests = INITIAL_PULL_REQUESTS;
        }
      }
    } catch {
      this.cache = this.getLocalFallback();
    }
  }

  private saveToLocal(data: EpistemicLedgerData) {
    this.cache = data;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
    this.notify();
  }

  public async getLedger(): Promise<EpistemicLedgerData> {
    if (!this.cache) {
      await this.fetchLedger();
    }
    return this.cache || this.getLocalFallback();
  }

  public subscribe(listener: (data: EpistemicLedgerData) => void): () => void {
    this.listeners.add(listener);
    if (this.cache) {
      listener(this.cache);
    }
    return () => this.listeners.delete(listener);
  }

  private notify() {
    if (!this.cache) return;
    this.listeners.forEach((fn) => {
      try {
        fn(this.cache!);
      } catch (err) {
        console.warn('[EpistemicLedgerService] Listener notification error:', err);
      }
    });
  }

  public async fetchLedger(): Promise<void> {
    if (this.isFetching) return;
    this.isFetching = true;
    try {
      const res = await fetch('/api/epistemic/ledger');
      if (res.ok) {
        const data: EpistemicLedgerData = await res.json();
        data.cognitiveConflicts = this.conflicts;
        data.milestoneTags = INITIAL_TAGS;
        data.pullRequests = INITIAL_PULL_REQUESTS;
        this.saveToLocal(data);
      } else {
        if (!this.cache) this.cache = this.getLocalFallback();
      }
    } catch {
      if (!this.cache) this.cache = this.getLocalFallback();
    } finally {
      this.isFetching = false;
    }
  }

  public updateFromPulse(serverLedger: Partial<EpistemicLedgerData>) {
    if (!this.cache) {
      this.cache = this.getLocalFallback();
    }
    this.cache = {
      ...this.cache,
      ...serverLedger,
      cognitiveConflicts: this.conflicts,
      milestoneTags: INITIAL_TAGS,
      pullRequests: INITIAL_PULL_REQUESTS,
      studentState: {
        ...this.cache.studentState,
        ...(serverLedger.studentState || {}),
        lastUpdated: new Date().toISOString(),
      },
    };
    this.saveToLocal(this.cache);
  }

  public reconcileWithRealAppState(
    nodes: DAGNode[],
    units: Record<string, LearningUnit>,
    artifacts: UserArtifact[],
    domainName?: string
  ) {
    if (!this.cache) this.cache = this.getLocalFallback();

    const completedUnits: LearningUnit[] = [];
    nodes.forEach((n) => {
      if (n.status === 'completed' && n.unitId && units[n.unitId]) {
        completedUnits.push(units[n.unitId]);
      }
    });

    const masteredTopics: string[] = [];
    completedUnits.forEach((u) => {
      if (!masteredTopics.includes(u.title)) {
        masteredTopics.push(u.title);
      }
    });

    artifacts.forEach((art) => {
      if (art.filename && !masteredTopics.includes(art.filename)) {
        masteredTopics.push(`Артефакт: ${art.filename}`);
      }
    });

    const primaryDomain = domainName || (completedUnits[0]?.category || Object.values(units)[0]?.category || 'Универсальное мастерство');
    this.cache.studentState.targetDomain = primaryDomain;
    this.cache.studentState.masteredTopics = masteredTopics;
    this.cache.studentState.totalInsightsCrystallized = Math.max(masteredTopics.length, this.cache.studentState.totalInsightsCrystallized || 0);
    this.cache.studentState.lastUpdated = new Date().toISOString();

    this.cache.provenFacts = completedUnits.map((u, idx) => ({
      id: `fact-unit-${u.id}-${idx}`,
      topic: u.title.replace(/^[0-9.\s]+/, '').slice(0, 60),
      domain: u.category || primaryDomain,
      statement: `Инвариант «${u.title}» подтвержден практикой и зафиксирован в ядре знаний.`,
      confidence: 0.96,
      discoveredByAgent: 'VertexAi-EpistemicEngine',
      verifiedAt: new Date().toISOString(),
      layer: 'core_axiom' as const,
      impactWeight: 14,
    }));
    this.cache.provenInvariants = this.cache.provenFacts;

    this.notify();
  }

  public getCachedLedger(): EpistemicLedgerData {
    return this.cache || this.getLocalFallback();
  }

  public recordCompletedUnit(unit: Partial<LearningUnit> & { id?: string; title: string; score?: number }, scoreParam?: number) {
    if (!this.cache) this.cache = this.getLocalFallback();
    const effectiveScore = scoreParam !== undefined ? scoreParam : (unit.score || 100);
    const fact: EpistemicFact = {
      id: `fact-unit-${unit.id || 'u'}-${Date.now()}`,
      topic: unit.title.replace(/^[0-9.\s]+/, '').slice(0, 60),
      domain: unit.category || 'Архитектура & Системы',
      statement: `Инвариант «${unit.title}» подтвержден решением в песочнице с оценкой ${effectiveScore}%.`,
      confidence: 0.98,
      discoveredByAgent: 'Learning OS Unit Pipeline',
      verifiedAt: new Date().toISOString(),
      layer: 'core_axiom',
      impactWeight: 18,
    };
    this.cache.provenFacts = [fact, ...(this.cache.provenFacts || [])];
    this.cache.provenInvariants = this.cache.provenFacts;
    if (!this.cache.studentState.masteredTopics.includes(unit.title)) {
      this.cache.studentState.masteredTopics.push(unit.title);
    }
    this.cache.studentState.totalInsightsCrystallized = Math.max(
      this.cache.studentState.masteredTopics.length,
      this.cache.studentState.totalInsightsCrystallized || 0
    );
    this.saveToLocal(this.cache);
  }

  public recordCompletedExercise(
    exerciseOrTitle: string | { unitId?: string; unitTitle?: string; exerciseId?: string; exerciseTitle: string; score: number },
    unitTitleParam?: string,
    scoreParam?: number
  ) {
    if (!this.cache) this.cache = this.getLocalFallback();
    let exTitle = '';
    let uTitle = '';
    let finalScore = 100;

    if (typeof exerciseOrTitle === 'object') {
      exTitle = exerciseOrTitle.exerciseTitle;
      uTitle = exerciseOrTitle.unitTitle || 'Практика';
      finalScore = exerciseOrTitle.score;
    } else {
      exTitle = exerciseOrTitle;
      uTitle = unitTitleParam || 'Практика';
      finalScore = scoreParam || 100;
    }

    const fact: EpistemicFact = {
      id: `fact-ex-${Date.now()}`,
      topic: exTitle,
      domain: uTitle,
      statement: `Практическое упражнение «${exTitle}» успешно решено с итогом ${finalScore}%.`,
      confidence: 0.95,
      discoveredByAgent: 'Interactive Practice Engine',
      verifiedAt: new Date().toISOString(),
      layer: 'mantle_skill',
      impactWeight: 12,
    };
    this.cache.provenFacts = [fact, ...(this.cache.provenFacts || [])];
    this.cache.provenInvariants = this.cache.provenFacts;
    this.saveToLocal(this.cache);
  }

  public async runCleanMemoryAgentCycle(params: {
    taskPrompt: string;
    domain?: string;
    agentName?: string;
    workingContextSnapshot?: any;
  }): Promise<{
    success: boolean;
    trace?: AgentReasoningTrace;
    crystallizedAxiom?: EpistemicFact;
    crystallizedFact?: EpistemicFact;
    error?: string;
  }> {
    const fact: EpistemicFact = {
      id: `axiom-telemetry-${Date.now()}`,
      topic: params.workingContextSnapshot?.topic || 'Телеметрический инвариант',
      domain: params.domain || 'Архитектура & Системы',
      statement: params.taskPrompt || 'Инвариант вычислен на основе глубокой телеметрии и чистой памяти.',
      confidence: 0.96,
      discoveredByAgent: params.agentName || 'AI-TelemetryCoreSynthesizer',
      verifiedAt: new Date().toISOString(),
      layer: 'core_axiom',
      impactWeight: 16,
    };

    const trace: AgentReasoningTrace = {
      id: `trace-${Date.now()}`,
      timestamp: new Date().toISOString(),
      agentName: params.agentName || 'AI-TelemetryCoreSynthesizer',
      taskGoal: params.taskPrompt,
      premises: ['Телеметрия без когнитивного шума', 'Чистая память без раздувания контекста'],
      deduction: 'Успешная фиксация инварианта в ядре знаний.',
      verdict: 'Crystallized into Core Invariant',
    };

    if (!this.cache) this.cache = this.getLocalFallback();
    this.cache.provenFacts = [fact, ...(this.cache.provenFacts || [])];
    this.cache.provenInvariants = this.cache.provenFacts;
    this.cache.recentTraces = [trace, ...(this.cache.recentTraces || []).slice(0, 19)];
    this.saveToLocal(this.cache);

    return {
      success: true,
      trace,
      crystallizedAxiom: fact,
      crystallizedFact: fact,
    };
  }

  public async purgeContext(): Promise<boolean> {
    try {
      const res = await fetch('/api/epistemic/purge-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        await this.fetchLedger();
        return true;
      }
    } catch (err) {
      console.warn('Error purging context:', err);
    }
    return false;
  }

  public async triggerCastalianSynthesis(sourceNodeId: string, targetNodeId?: string): Promise<{
    success: boolean;
    bridge?: CastalianBridge;
    aiPerception?: string;
    aiAction?: string;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/epistemic/castalian-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceNodeId, targetNodeId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ledger) {
          data.ledger.provenInvariants = data.ledger.provenFacts;
          this.cache = data.ledger;
          this.notify();
        }
        return {
          success: true,
          bridge: data.bridge,
          aiPerception: data.aiPerception,
          aiAction: data.aiAction,
        };
      }
    } catch (err: any) {
      console.warn('[Castalian Service] Local execution error:', err);
    }

    const fallbackBridge: CastalianBridge = {
      id: `bridge-${Date.now()}`,
      source: sourceNodeId,
      target: targetNodeId || 'sphere-orbit-capstone',
      type: 'castalian_bridge',
      explanation: 'Инвариантная связь: математическая структура теории напрямую управляет качеством решения в коде.',
      mathBridge: 'Axiom(FirstPrinciples) ⟹ Invariant(Execution)',
      strength: 0.95,
    };

    if (this.cache) {
      if (!this.cache.castalianBridges) this.cache.castalianBridges = [];
      this.cache.castalianBridges.unshift(fallbackBridge);
      this.notify();
    }

    return {
      success: true,
      bridge: fallbackBridge,
      aiPerception: 'ИИ фиксирует изоморфизм между теорией и практическим артефактом.',
      aiAction: 'Проложен Кастальенский луч заземления с гарантией чистой памяти.',
    };
  }

  // =========================================================================
  // ⚡ PURE CONTEXT AI GATEWAY (Every AI request passes through this ledger)
  // =========================================================================

  /**
   * Builds the pure, noise-free epistemic context prompt on the client side.
   * Feeds the user's purpose, verified facts, core axioms, and active cognitive telemetry.
   */
  public buildCleanContextPrompt(taskGoal: string = 'Изучение материала'): string {
    const ledger = this.getCachedLedger();
    const purpose = ledger.userPurpose || 'Освоить инварианты и сделать практический результат без воды';

    const facts = (ledger.provenFacts || [])
      .slice(0, 15)
      .map((f, i) => `[Факт ${i + 1} • ${f.domain}] ${f.topic}: ${f.statement}`)
      .join('\n');

    const coreAxioms = (ledger.crystallizedKnowledgeNodes || [])
      .filter((n) => n.layer === 'core')
      .slice(0, 8)
      .map((n) => `• [ЯДРО] «${n.title}»: ${n.description}`)
      .join('\n');

    const resolvedConflicts = (this.conflicts || [])
      .filter((c) => c.resolved)
      .map((c) => `• [РАЗРЕШЕНО] «${c.topic}»: ${c.canonicalInvariant}`)
      .join('\n');

    const telemetry = telemetryEngine.getState();
    const friction = telemetry.overallCognitiveLoad || 18;
    const gaps = (telemetry.explicitConfusionFlags || []).slice(0, 3).join(', ');

    return `
=== ЧИСТЫЙ ЭПИСТЕМИЧЕСКИЙ РЕЕСТР ЗНАНИЙ (PURE CONTEXT) ===
[ПРИКЛАДНАЯ ЦЕЛЬ ПОЛЬЗОВАТЕЛЯ]: «${purpose}»
[ДИРЕКТИВА NO-WATER]: Запрещена абстрактная вода. Только то, что нужно для достижения цели «${purpose}».
[КОГНИТИВНАЯ НАГРУЗКА]: ${friction}%${gaps ? ` | Активные затруднения: ${gaps}` : ''}

ДОКАЗАННЫЕ ИНВАРИАНТЫ:
${facts || 'Инварианты фиксируются по мере прохождения практики.'}

АКСИОМЫ ЯДРА СФЕРЫ ЗНАНИЙ:
${coreAxioms || 'Ядро формируется из подтвержденных концепций.'}

${resolvedConflicts ? `УСТРАНЕННЫЕ ЗАБЛУЖДЕНИЯ (НЕ ПОВТОРЯТЬ):\n${resolvedConflicts}\n` : ''}
ТЕКУЩАЯ ЦЕЛЕВАЯ ЗАДАЧА АГЕНТА: "${taskGoal}"
`.trim();
  }

  /**
   * Universal AI Request Fetcher with automatic Epistemic Context Enrichment & Memory Assimilation.
   * Wraps any call to /api/gemini/*, attaches pure context, and updates the ledger from response metadata.
   */
  public async fetchAiWithEpistemicContext<T = any>(
    endpoint: string,
    payload: any = {},
    options?: {
      taskGoal?: string;
      domain?: string;
      autoCrystallizeTopic?: string;
      customHeaders?: Record<string, string>;
    }
  ): Promise<T> {
    const taskGoal = options?.taskGoal || payload.taskGoal || payload.unitTitle || 'Генерация учебного контента';
    const domain = options?.domain || payload.domain || payload.category || this.cache?.studentState.targetDomain || 'Архитектура & Системы';

    const cleanContext = this.buildCleanContextPrompt(taskGoal);
    const telemetrySnapshot = telemetryEngine.getState();

    const currentLanguage = i18n.getLanguage();

    const enrichedPayload = {
      ...payload,
      language: payload.language || currentLanguage,
      userLanguage: payload.userLanguage || currentLanguage,
      epistemicContext: cleanContext,
      cleanLedgerContext: cleanContext,
      userPurpose: this.cache?.userPurpose,
      targetDomain: domain,
      telemetrySnapshot: {
        cognitiveLoad: telemetrySnapshot.overallCognitiveLoad,
        indecisionIndex: telemetrySnapshot.indecisionIndex,
        coreResonance: telemetrySnapshot.coreResonancePercentage,
        activeGaps: telemetrySnapshot.explicitConfusionFlags,
      },
      enableCleanMemory: true,
    };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-language': currentLanguage,
          ...(options?.customHeaders || {}),
        },
        body: JSON.stringify(enrichedPayload),
      });

      if (!res.ok) {
        throw new Error(`AI API returned status ${res.status}`);
      }

      const data = await res.json();

      // Automatically assimilate server-returned ledger or clean memory metadata
      if (data && typeof data === 'object') {
        if (data.ledger) {
          this.updateFromPulse(data.ledger);
        } else if (data._cleanMemory) {
          this.recordAiExecutionFeedback(data._cleanMemory);
        }

        // If newly crystallized axioms were discovered, register them
        if (data.crystallizedFact) {
          this.recordFact(
            data.crystallizedFact.topic,
            data.crystallizedFact.statement,
            data.crystallizedFact.domain,
            data.crystallizedFact.layer
          );
        }
      }

      return data as T;
    } catch (err) {
      console.warn(`[Epistemic AI Gateway] Call to ${endpoint} failed, continuing with fallback:`, err);
      throw err;
    }
  }

  /**
   * Ingests feedback metadata returned by AI agents and updates reasoning traces in memory.
   */
  public recordAiExecutionFeedback(metadata: {
    agentName?: string;
    taskGoal?: string;
    domain?: string;
    axiomCrystallized?: string;
    isFallback?: boolean;
  }) {
    if (!this.cache) this.cache = this.getLocalFallback();

    const trace: AgentReasoningTrace = {
      id: `trace-${Date.now()}`,
      timestamp: new Date().toISOString(),
      agentName: metadata.agentName || 'AI-CleanMemoryAgent',
      taskGoal: metadata.taskGoal || 'Обработка запроса',
      premises: ['Чистый контекст из Epistemic Ledger', 'Изоляция транзитного шума'],
      deduction: `Агент завершил задачу: ${metadata.taskGoal || 'успешно'}`,
      verdict: metadata.isFallback ? 'Детерминированный инвариант зафиксирован.' : 'Ответ верифицирован.',
    };

    this.cache.recentTraces = [trace, ...(this.cache.recentTraces || []).slice(0, 19)];

    if (metadata.axiomCrystallized) {
      const topic = metadata.axiomCrystallized;
      const exists = this.cache.provenFacts.some((f) => f.topic.toLowerCase() === topic.toLowerCase());
      if (!exists) {
        this.cache.provenFacts.push({
          id: `fact-${Date.now()}`,
          topic,
          domain: metadata.domain || 'Архитектура',
          statement: `Инвариант «${topic}» подтвержден практикой и зафиксирован в ядре.`,
          confidence: 0.98,
          discoveredByAgent: metadata.agentName || 'AI-CleanMemoryAgent',
          verifiedAt: new Date().toISOString(),
          layer: 'core_axiom',
          impactWeight: 14,
        });
      }
    }

    this.saveToLocal(this.cache);
  }

  /**
   * Sets the user's primary application goal ("А для чего?") and synchronizes with server.
   */
  public async setStudentPurpose(purpose: string, domain?: string): Promise<boolean> {
    if (!purpose.trim()) return false;
    if (!this.cache) this.cache = this.getLocalFallback();

    this.cache.userPurpose = purpose.trim();
    if (domain) this.cache.userPurposeDomain = domain;
    this.cache.userPurposeSetAt = new Date().toISOString();
    this.saveToLocal(this.cache);

    try {
      const res = await fetch('/api/epistemic/set-purpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose: purpose.trim(), domain }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ledger) this.updateFromPulse(data.ledger);
        return true;
      }
    } catch {}
    return true;
  }

  /**
   * Directly record a proven fact/axiom into the ledger and broadcast to all listeners.
   */
  public recordFact(
    topic: string,
    statement: string,
    domain: string = 'Архитектура & Системы',
    layer: 'core_axiom' | 'mantle_skill' | 'orbit_artifact' = 'core_axiom',
    confidence: number = 0.96
  ) {
    if (!this.cache) this.cache = this.getLocalFallback();
    const fact: EpistemicFact = {
      id: `fact-direct-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      topic: topic.trim(),
      domain: domain.trim(),
      statement: statement.trim(),
      confidence,
      discoveredByAgent: 'Epistemic Direct Invariant Recorder',
      verifiedAt: new Date().toISOString(),
      layer,
      impactWeight: layer === 'core_axiom' ? 16 : 10,
    };

    const exists = this.cache.provenFacts.some(
      (f) => f.topic.toLowerCase() === fact.topic.toLowerCase() || f.statement === fact.statement
    );

    if (!exists) {
      this.cache.provenFacts = [fact, ...this.cache.provenFacts];
      this.cache.provenInvariants = this.cache.provenFacts;
      this.saveToLocal(this.cache);
    }
  }

  private getLocalFallback(): EpistemicLedgerData {
    return {
      version: 3,
      userPurpose: 'Создать работающий практический результат и освоить ключевые инварианты без воды',
      userPurposeDomain: 'Прикладные навыки & Системное проектирование',
      userPurposeSetAt: new Date().toISOString(),
      studentState: {
        targetDomain: 'Прикладные навыки & Системное проектирование',
        masteredTopics: [],
        activeGaps: [],
        recentConfidenceScore: 92,
        totalInsightsCrystallized: 0,
        coreResonancePercentage: 85,
        lastUpdated: new Date().toISOString(),
      },
      provenFacts: [],
      provenInvariants: [],
      recentTraces: [],
      castalianBridges: [],
      aiPerceptions: [],
      aiActions: [],
      cognitiveConflicts: this.conflicts,
      milestoneTags: INITIAL_TAGS,
      pullRequests: INITIAL_PULL_REQUESTS,
      crystallizedKnowledgeNodes: [],
    };
  }
}

export const epistemicLedgerService = new EpistemicLedgerService();
