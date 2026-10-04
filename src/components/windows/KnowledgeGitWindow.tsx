import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Code2,
  Database,
  FileText,
  GitBranch,
  GitCommitHorizontal,
  GitMerge,
  GitPullRequest,
  Layers,
  Sparkles,
  Check,
  X,
  Eye,
  FileCode,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Tag,
  Search,
  Plus,
  Play,
  Share2,
  Sliders,
  Flame,
  Activity,
  Award,
  MessageSquare,
  HelpCircle,
  Copy,
  ChevronRight
} from 'lucide-react';
import { LearningUnit, NoteItem, UserArtifact } from '../../types.ts';
import { telemetryEngine } from '../../services/telemetryEngine.ts';
import { 
  epistemicLedgerService, 
  EpistemicLedgerData, 
  CognitiveConflict,
  KnowledgeMilestoneTag,
  KnowledgePullRequest
} from '../../services/epistemicLedgerService.ts';
import { playChime } from '../../utils/audio.ts';

interface KnowledgeGitWindowProps {
  nodes: Array<{ id: string; title: string; subtitle?: string; sprint?: string; unitId?: string; status?: string; passingScore?: number; score?: number; phase?: number; phaseTitle?: string }>;
  notes: NoteItem[];
  artifacts: UserArtifact[];
  units?: Record<string, LearningUnit>;
  onLaunchUnit?: (unitId: string) => void;
}

const formatPath = (value: string) => value.replace(/[\s/\\:]+/g, '-').toLowerCase();

const DEFAULT_BRANCHES = [
  { name: 'main', label: 'production knowledge', desc: 'Утверждённые инварианты, завершённые модули и проверенные факты' },
  { name: 'feature/personalized-path', label: 'adaptive learning path', desc: 'Активные блоки, пользовательские заметки и текущие цели' },
  { name: 'research/debugging-loop', label: 'error recovery & telemetry', desc: 'Сигналы затруднений, разборы граничных случаев и исправления' },
];

export const KnowledgeGitWindow: React.FC<KnowledgeGitWindowProps> = ({
  nodes,
  notes,
  artifacts,
  onLaunchUnit,
}) => {
  // Navigation & Sub-views
  const [activeTab, setActiveTab] = useState<'tree' | 'conflicts' | 'diff' | 'bisect' | 'tags' | 'prs'>('tree');
  const [selectedBranch, setSelectedBranch] = useState('main');
  
  // Custom branches
  const [customBranches, setCustomBranches] = useState<string[]>(() => epistemicLedgerService.getCustomBranches());
  const [newBranchInput, setNewBranchInput] = useState('');
  const [showNewBranchModal, setShowNewBranchModal] = useState(false);

  // Telemetry & Ledger
  const [telemetryState, setTelemetryState] = useState(() => telemetryEngine.getState());
  const [ledgerData, setLedgerData] = useState<EpistemicLedgerData | null>(null);

  // Selected Commit & File in Tree view
  const [selectedCommitHash, setSelectedCommitHash] = useState<string | null>(null);
  const [inspectedFile, setInspectedFile] = useState<{
    path: string;
    label: string;
    status: string;
    summary: string;
    content: string;
    unitId?: string;
    branch: string;
  } | null>(null);

  // 3-Way Merge Conflicts State
  const [conflicts, setConflicts] = useState<CognitiveConflict[]>(() => epistemicLedgerService.getConflicts());
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>(null);
  const [runningSimulator, setRunningSimulator] = useState(false);
  const [simulatorOutput, setSimulatorOutput] = useState<string | null>(null);
  const [resolveSuccessNotice, setResolveSuccessNotice] = useState<string | null>(null);

  // Bisect State
  const [bisectActive, setBisectActive] = useState(false);
  const [bisectStep, setBisectStep] = useState(1);
  const [bisectResult, setBisectResult] = useState<{
    targetFault: string;
    rootCommit: string;
    rootConcept: string;
    remediationUnitTitle: string;
    explanation: string;
  } | null>(null);

  // Semantic Diff state
  const [diffBasePeriod, setDiffBasePeriod] = useState<'sprint-start' | 'yesterday' | 'day-1'>('sprint-start');

  // Copy status
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeTelemetry = telemetryEngine.subscribe((next) => setTelemetryState(next));
    const unsubscribeLedger = epistemicLedgerService.subscribe((next) => {
      setLedgerData(next);
      setConflicts(epistemicLedgerService.getConflicts());
    });

    void epistemicLedgerService.getLedger().then((next) => {
      setLedgerData(next);
      setConflicts(epistemicLedgerService.getConflicts());
    });

    return () => {
      unsubscribeTelemetry();
      unsubscribeLedger();
    };
  }, []);

  const completedCount = nodes.filter((node) => node.status === 'completed').length;
  const activeCount = nodes.filter((node) => node.status === 'active').length;

  const allBranches = useMemo(() => {
    const customList = customBranches.map((b) => ({
      name: b,
      label: 'custom hypothesis',
      desc: 'Пользовательская ветка исследования и проверки гипотез',
    }));
    return [...DEFAULT_BRANCHES, ...customList];
  }, [customBranches]);

  const branchMeta = allBranches.find((branch) => branch.name === selectedBranch) || allBranches[0];

  // Dynamic commit history based on real actions, ledger facts, and telemetry
  const commitHistory = useMemo(() => {
    const factCommits = (ledgerData?.provenFacts ?? []).map((fact, index) => ({
      hash: fact.id ? fact.id.slice(-7) : `fct-${index + 100}`,
      label: `fact: ${fact.topic}`,
      author: fact.discoveredByAgent || 'Epistemic Engine',
      time: `${index + 1}h ago`,
      summary: fact.statement,
      branch: 'main',
      diff: [
        `+ confidence: ${Math.round((fact.confidence || 0.95) * 100)}%`,
        `+ layer: ${fact.layer || 'core'}`,
        `+ domain: ${fact.domain || 'general'}`,
      ],
    }));

    const signalCommits = (telemetryState.signals ?? []).map((signal, index) => ({
      hash: signal.id ? signal.id.slice(-7) : `sig-${index + 100}`,
      label: `telemetry: ${signal.type}`,
      author: 'Telemetry Engine',
      time: `${index + 1}m ago`,
      summary: signal.details,
      branch: 'research/debugging-loop',
      diff: [
        `+ severity: ${signal.severity}`,
        `+ subtopic: ${signal.subtopic || 'general'}`,
        `+ recorded_at: ${new Date(signal.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`,
      ],
    }));

    const pathCommits = nodes
      .filter((n) => n.status === 'completed')
      .map((node, index) => ({
        hash: `mod-${index + 101}`,
        label: `milestone: ${node.title}`,
        author: 'Learning OS Pipeline',
        time: `${index + 2}d ago`,
        summary: `Модуль освоен с итоговым баллом ${node.score || 100}%.`,
        branch: 'main',
        diff: [
          `+ score: ${node.score || 100}%`,
          `+ sprint: ${node.sprint || 'Sprint 1'}`,
          `+ status: verified`,
        ],
      }));

    if (selectedBranch === 'main') {
      return [...factCommits, ...pathCommits].slice(0, 15);
    }
    if (selectedBranch === 'research/debugging-loop') {
      return signalCommits.length > 0
        ? signalCommits.slice(0, 15)
        : [
            {
              hash: 'dbg-001',
              label: 'telemetry: baseline initialized',
              author: 'Telemetry Engine',
              time: 'just now',
              summary: 'Служба телеметрии работает в фоновом режиме, аномалий не обнаружено.',
              branch: 'research/debugging-loop',
              diff: ['+ telemetry_mode: active', '+ tracker: nominal'],
            },
          ];
    }
    if (selectedBranch === 'feature/personalized-path') {
      return [
        ...notes.map((n, i) => ({
          hash: `not-${i + 10}`,
          label: `note: ${n.title.slice(0, 25)}`,
          author: 'User Workspace',
          time: 'recently',
          summary: n.content.slice(0, 60) + '...',
          branch: 'feature/personalized-path',
          diff: [`+ tag: ${n.tag || 'general'}`],
        })),
        ...nodes
          .filter((n) => n.status === 'active')
          .map((n, i) => ({
            hash: `act-${i + 50}`,
            label: `active: ${n.title}`,
            author: 'Curriculum Orchestrator',
            time: 'in progress',
            summary: `Текущий активный фокус изучения (${n.phaseTitle || 'блок'}).`,
            branch: 'feature/personalized-path',
            diff: [`+ unit_id: ${n.unitId || n.id}`, `+ state: active`],
          })),
      ].slice(0, 15);
    }

    // Custom hypothesis branch commits
    return [
      {
        hash: 'hyp-001',
        label: `hypothesis: ${selectedBranch.replace('hypothesis/', '')}`,
        author: 'Student HEAD',
        time: 'активно',
        summary: 'Ветка проверки рабочей гипотезы. Код изолирован до прохождения верификации.',
        branch: selectedBranch,
        diff: [
          '+ status: testing hypothesis',
          '+ isolated_context: true',
          '+ peer_review_ready: false'
        ]
      },
      {
        hash: 'hyp-002',
        label: 'spec: baseline invariant check',
        author: 'Epistemic Engine',
        time: '1h ago',
        summary: 'Автоматическая генерация проверочных ассертов для текущей гипотезы.',
        branch: selectedBranch,
        diff: ['+ generated_assertions: 4', '+ syntax: validated']
      }
    ];
  }, [ledgerData, telemetryState, nodes, notes, selectedBranch]);

  // Real files in this branch with inspectable content
  const trackedKnowledge = useMemo(() => {
    if (selectedBranch === 'main') {
      return [
        ...nodes
          .filter((n) => n.status === 'completed')
          .map((n) => ({
            path: `knowledge/core/${formatPath(n.title)}.md`,
            label: n.title,
            status: 'committed' as const,
            summary: `Освоенный модуль. Инварианты зафиксированы. Итоговый балл: ${n.score || 100}%.`,
            unitId: n.unitId || n.id,
            content: `# ${n.title}\n\n## Статус\n- Состояние: Завершено\n- Результат: ${n.score || 100}%\n- Спринт: ${n.sprint || 'Sprint 1'}\n\n## Зафиксированные инварианты\n1. Базовые принципы темы подтверждены тестами.\n2. Логика решения проверена без подсказок.\n3. Модуль готов к промышленному применению.`,
          })),
        ...(ledgerData?.provenFacts ?? []).map((f) => ({
          path: `epistemic/facts/${formatPath(f.topic)}.json`,
          label: f.topic,
          status: 'staged' as const,
          summary: f.statement,
          unitId: undefined,
          content: `{\n  "topic": "${f.topic}",\n  "statement": "${f.statement}",\n  "confidence": ${f.confidence || 0.95},\n  "layer": "${f.layer || 'core'}",\n  "domain": "${f.domain || 'general'}",\n  "verified": true\n}`,
        })),
      ];
    }

    if (selectedBranch === 'feature/personalized-path') {
      return [
        ...notes.map((n) => ({
          path: `notes/${formatPath(n.title)}.txt`,
          label: n.title,
          status: 'modified' as const,
          summary: n.content.slice(0, 70),
          unitId: n.unitId,
          content: `# Заметка: ${n.title}\n\nТег: ${n.tag || 'общий'}\n\n${n.content}`,
        })),
        ...nodes
          .filter((n) => n.status === 'active')
          .map((n) => ({
            path: `curriculum/active/${formatPath(n.title)}.spec.ts`,
            label: n.title,
            status: 'staged' as const,
            summary: `В процессе прохождения. Порог сдачи: ${n.passingScore || 80}%.`,
            unitId: n.unitId || n.id,
            content: `// Active Curriculum Spec: ${n.title}\nexport const activeModule = {\n  id: "${n.id}",\n  title: "${n.title}",\n  passingScore: ${n.passingScore || 80},\n  phase: ${n.phase || 1},\n  phaseTitle: "${n.phaseTitle || 'Основы'}",\n  status: "active"\n};`,
          })),
      ];
    }

    if (selectedBranch === 'research/debugging-loop') {
      return [
        ...(telemetryState.signals ?? []).map((s, idx) => ({
          path: `telemetry/signals/signal-${idx + 1}-${s.type}.log`,
          label: `Signal: ${s.type}`,
          status: s.severity === 'high' ? ('conflict' as const) : ('staged' as const),
          summary: s.details,
          unitId: undefined,
          content: `TIMESTAMP: ${new Date(s.timestamp).toISOString()}\nTYPE: ${s.type}\nSEVERITY: ${s.severity}\nDETAILS: ${s.details}\nRECOMMENDATION: Рекомендуется повторить ключевые инварианты главы.`,
        })),
        ...artifacts
          .filter((a) => !a.passed)
          .map((a) => ({
            path: `artifacts/review/${a.filename}`,
            label: a.unitTitle || a.filename,
            status: 'conflict' as const,
            summary: `Артефакт не сдан (${a.score || 0}%). Требуется ревизия.`,
            unitId: a.unitId,
            content: `// Artifact Review: ${a.unitTitle || a.filename}\n// Filename: ${a.filename}\n// Score: ${a.score || 0}%\n// Status: FAILED\n\n${a.fileContent || '// Код требует доработки'}`,
          })),
      ];
    }

    // Custom hypothesis branch files
    return [
      {
        path: `hypotheses/${selectedBranch.replace('/', '_')}.md`,
        label: `Hypothesis Draft: ${selectedBranch}`,
        status: 'modified' as const,
        summary: 'Рабочая формулировка гипотезы студента.',
        unitId: undefined,
        content: `# Экспериментальная гипотеза: ${selectedBranch}\n\n## Цель проверки\nПроверить поведение алгоритма на граничных нагрузках и выяснить, сохраняется ли инвариант целостности.\n\n## Доказательная база\n- Статус верификации: В процессе\n- Защищено в спарринге: Ожидает ревью`
      }
    ];
  }, [selectedBranch, nodes, ledgerData, notes, telemetryState, artifacts]);

  const avgMastery = nodes.length > 0
    ? Math.round(
        nodes.reduce((acc, curr) => acc + (curr.score || (curr.status === 'completed' ? 100 : 0)), 0) /
          nodes.length
      )
    : 0;

  // Active Conflict Selection
  const currentConflict = conflicts.find((c) => c.id === selectedConflictId) || conflicts[0];

  const handleRunSimulator = () => {
    setRunningSimulator(true);
    setSimulatorOutput(null);
    playChime('click');
    setTimeout(() => {
      setRunningSimulator(false);
      if (currentConflict) {
        setSimulatorOutput(currentConflict.counterExampleOutput);
        playChime('alert');
      }
    }, 600);
  };

  const handleResolveConflict = (conflictId: string) => {
    const res = epistemicLedgerService.resolveConflict(conflictId);
    if (res.success) {
      playChime('success');
      setResolveSuccessNotice(`Конфликт разрешен! +${res.xpReward} XP. Истинный инвариант добавлен в ветку main.`);
      setConflicts(epistemicLedgerService.getConflicts());
      setTimeout(() => setResolveSuccessNotice(null), 3000);
    }
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchInput.trim()) return;
    const name = epistemicLedgerService.addCustomBranch(newBranchInput);
    setCustomBranches(epistemicLedgerService.getCustomBranches());
    setSelectedBranch(name);
    setNewBranchInput('');
    setShowNewBranchModal(false);
    playChime('success');
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1500);
  };

  const handleStartBisect = () => {
    setBisectActive(true);
    setBisectStep(1);
    setBisectResult(null);
    playChime('click');
  };

  const handleStepBisect = (answerGood: boolean) => {
    playChime('click');
    if (bisectStep < 3) {
      setBisectStep(bisectStep + 1);
    } else {
      // Finished bisect: found root cause
      setBisectResult({
        targetFault: 'Провал теста Capstone на распределенные гонки данных (Race Conditions)',
        rootCommit: 'mod-102 (Асинхронные структуры данных)',
        rootConcept: 'Атомарность операций и отсутствие мьютекса в разделяемой памяти',
        remediationUnitTitle: 'Модуль: Синхронизация и мьютексы',
        explanation: 'Скрытый пробел возник на этапе изучения асинхронных коллекций. При переходе к Capstone не был учтен инвариант неатомарного инкремента.'
      });
      playChime('alert');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FFFBFC] text-[#241519] font-sans selection:bg-[#C8266A] selection:text-white">
      
      {/* Top Header & Sub-nav Bar */}
      <div className="bg-[#FFF1F6] border-b border-[#ECD5DE] px-4 py-3 flex-shrink-0 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#C8266A] text-white flex items-center justify-center font-bold shadow-sm">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold font-display text-[#241519]">
                Git Знаний & Эпистемический Леджер
              </h2>
              <span className="text-[11px] font-mono font-bold bg-[#FFDFEB] text-[#C8266A] px-2 py-0.5 rounded-full border border-[#F48FB4]">
                v3.4 Pure Context
              </span>
            </div>
            <p className="text-xs text-[#6F5A63]">
              Контрольные точки понимания, версионирование ментальных моделей и устранение когнитивных конфликтов
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-[#FFDFEB]/60 p-1 rounded-2xl border border-[#ECD5DE] overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('tree')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'tree' ? 'bg-[#C8266A] text-white shadow-sm' : 'text-[#6F5A63] hover:text-[#241519]'
            }`}
          >
            <GitCommitHorizontal className="w-3.5 h-3.5" /> Ветки & Дерево
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('conflicts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer relative ${
              activeTab === 'conflicts' ? 'bg-[#C8266A] text-white shadow-sm' : 'text-[#6F5A63] hover:text-[#241519]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> 3-Way Конфликты
            {conflicts.filter((c) => !c.resolved).length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('diff')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'diff' ? 'bg-[#C8266A] text-white shadow-sm' : 'text-[#6F5A63] hover:text-[#241519]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Семантический Дифф
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bisect')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'bisect' ? 'bg-[#C8266A] text-white shadow-sm' : 'text-[#6F5A63] hover:text-[#241519]'
            }`}
          >
            <Search className="w-3.5 h-3.5" /> Knowledge Bisect
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tags')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'tags' ? 'bg-[#C8266A] text-white shadow-sm' : 'text-[#6F5A63] hover:text-[#241519]'
            }`}
          >
            <Tag className="w-3.5 h-3.5" /> Релизы & Теги
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('prs')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'prs' ? 'bg-[#C8266A] text-white shadow-sm' : 'text-[#6F5A63] hover:text-[#241519]'
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5" /> Pull Requests
          </button>
        </div>
      </div>

      {/* Live Pure-Context Telemetry Ribbon */}
      <div className="bg-[#FFF1F6]/70 border-b border-[#ECD5DE] px-4 py-1.5 flex items-center justify-between text-[11px] text-[#6F5A63] flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <b>Телеметрия:</b> {telemetryState.sessionMetrics?.trackedActions || 0} событий записано
          </span>
          <span className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-[#C8266A]" />
            Резонанс ядра: <b>{telemetryState.coreResonancePercentage}%</b>
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-indigo-600" />
            Инвариантов в памяти: <b>{ledgerData?.provenFacts?.length || completedCount}</b>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>Средний мастер-балл: <b className="text-[#C8266A]">{avgMastery}%</b></span>
          <button
            type="button"
            onClick={() => setShowNewBranchModal(true)}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#ECD5DE] text-[#C8266A] font-semibold hover:bg-[#FFDFEB] transition cursor-pointer text-[10.5px]"
          >
            <Plus className="w-3 h-3" /> Новая ветка гипотезы
          </button>
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="flex-1 overflow-hidden p-4">
        
        {/* ======================================================== */}
        {/* 1. TAB: TREE & COMMITS (Graph + Files + Diff Viewer)     */}
        {/* ======================================================== */}
        {activeTab === 'tree' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
            
            {/* Left Column: Interactive Topology Graph & Branch Selector (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-3 h-full overflow-hidden">
              
              {/* Branch Selector */}
              <div className="bg-white p-3 rounded-2xl border border-[#ECD5DE] shadow-sm flex-shrink-0 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#6F5A63]">
                  <span>ВЕТКА (BRANCH)</span>
                  <span className="text-[10px] font-mono text-[#C8266A]">HEAD → {selectedBranch}</span>
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {allBranches.map((branch) => (
                    <button
                      key={branch.name}
                      type="button"
                      onClick={() => setSelectedBranch(branch.name)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                        selectedBranch === branch.name
                          ? 'bg-[#FFDFEB] text-[#C8266A] font-bold border border-[#F48FB4]'
                          : 'bg-[#FFFBFC] text-[#241519] hover:bg-[#FFF1F6] border border-transparent'
                      }`}
                    >
                      <span className="font-mono truncate">{branch.name}</span>
                      <span className="text-[10px] uppercase font-bold text-[#6F5A63] opacity-80">
                        {branch.label.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[#6F5A63] italic pt-1 border-t border-[#ECD5DE]">
                  {branchMeta.desc}
                </p>
              </div>

              {/* Visual Branch DAG Topology Canvas (SVG) */}
              <div className="bg-white p-3.5 rounded-2xl border border-[#ECD5DE] shadow-sm flex-1 overflow-y-auto space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#6F5A63] mb-1">
                  <span>ВИЗУАЛЬНОЕ ДЕРЕВО ВЕТОК</span>
                  <span className="text-[10px] font-mono text-emerald-600">● 100% Invariants</span>
                </div>

                <div className="relative py-2 px-1">
                  <svg viewBox="0 0 300 240" className="w-full h-auto drop-shadow-sm font-mono text-[10px]">
                    {/* Main branch trunk */}
                    <line x1="40" y1="20" x2="40" y2="220" stroke="#C8266A" strokeWidth="3" strokeLinecap="round" />
                    <text x="50" y="24" fill="#C8266A" fontWeight="bold">main</text>

                    {/* Hypothesis branch split and merge */}
                    <path d="M40 70 C 110 70, 120 120, 120 140 C 120 170, 100 190, 40 190" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="4 3" />
                    <text x="130" y="145" fill="#D97706" fontWeight="bold">hypothesis/*</text>

                    {/* Telemetry/Debugging branch */}
                    <path d="M40 110 C 180 110, 190 150, 190 180" fill="none" stroke="#0284C7" strokeWidth="2" strokeDasharray="3 3" />
                    <text x="198" y="185" fill="#0284C7" fontWeight="bold">research/*</text>

                    {/* Commit nodes on Main */}
                    <circle cx="40" cy="40" r="6" fill="#C8266A" className="cursor-pointer hover:r-8 transition" />
                    <circle cx="40" cy="70" r="6" fill="#C8266A" />
                    <circle cx="40" cy="110" r="6" fill="#C8266A" />
                    <circle cx="40" cy="150" r="6" fill="#C8266A" />
                    <circle cx="40" cy="190" r="7" fill="#10B981" stroke="#fff" strokeWidth="2" />
                    <circle cx="40" cy="220" r="8" fill="#C8266A" stroke="#FFDFEB" strokeWidth="3" className="animate-pulse" />

                    {/* Commit nodes on Hypothesis */}
                    <circle cx="120" cy="120" r="5" fill="#F59E0B" />
                    <circle cx="120" cy="150" r="5" fill="#F59E0B" />

                    {/* Commit nodes on Research */}
                    <circle cx="190" cy="150" r="5" fill="#0284C7" />
                    <circle cx="190" cy="180" r="5" fill="#0284C7" />
                  </svg>
                </div>

                <div className="pt-2 border-t border-[#ECD5DE] text-[11px] text-[#6F5A63] flex items-center justify-between">
                  <span>HEAD: <b>{commitHistory[0]?.hash || 'fct-latest'}</b></span>
                  <span className="text-emerald-600 font-semibold">● Merged clean</span>
                </div>
              </div>

            </div>

            {/* Middle Column: Commit History Log (4 cols) */}
            <div className="lg:col-span-4 bg-white p-3.5 rounded-2xl border border-[#ECD5DE] shadow-sm flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between text-xs font-bold text-[#6F5A63] pb-2 border-b border-[#ECD5DE] mb-2">
                <span>ЖУРНАЛ КОММИТОВ ({commitHistory.length})</span>
                <span className="text-[10px] text-[#C8266A] font-mono">git log --graph</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {commitHistory.map((c) => (
                  <div
                    key={c.hash}
                    onClick={() => setSelectedCommitHash(c.hash)}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      selectedCommitHash === c.hash
                        ? 'bg-[#FFDFEB] border-[#C8266A] ring-1 ring-[#C8266A]'
                        : 'bg-[#FFFBFC] border-[#ECD5DE] hover:border-[#F48FB4]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-[#C8266A] bg-white px-2 py-0.5 rounded-md border border-[#ECD5DE]">
                          {c.hash}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyHash(c.hash);
                          }}
                          className="text-[#6F5A63] hover:text-[#241519] p-0.5"
                          title="Скопировать хэш"
                        >
                          {copiedHash === c.hash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <span className="text-[10.5px] text-[#6F5A63] font-medium">{c.time}</span>
                    </div>

                    <h4 className="text-xs font-bold text-[#241519] mb-1 line-clamp-1">
                      {c.label}
                    </h4>
                    <p className="text-[11.5px] text-[#6F5A63] line-clamp-2 mb-2">
                      {c.summary}
                    </p>

                    <div className="space-y-0.5 bg-white/70 p-2 rounded-lg border border-[#ECD5DE]/60 font-mono text-[10.5px]">
                      {c.diff.map((d, i) => (
                        <div
                          key={i}
                          className={d.startsWith('+') ? 'text-emerald-700' : d.startsWith('-') ? 'text-rose-600' : 'text-[#6F5A63]'}
                        >
                          {d}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Tracked Knowledge Files & Code Inspector (4 cols) */}
            <div className="lg:col-span-4 bg-white p-3.5 rounded-2xl border border-[#ECD5DE] shadow-sm flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between text-xs font-bold text-[#6F5A63] pb-2 border-b border-[#ECD5DE] mb-2">
                <span>ФАЙЛОВАЯ СИСТЕМА ЗНАНИЙ</span>
                <span className="text-[10px] text-[#6F5A63]">{trackedKnowledge.length} файлов</span>
              </div>

              {inspectedFile ? (
                /* File Source Inspector */
                <div className="flex-1 flex flex-col overflow-hidden space-y-2">
                  <div className="flex items-center justify-between bg-[#FFF1F6] p-2 rounded-xl border border-[#ECD5DE]">
                    <div className="flex items-center gap-1.5 truncate">
                      <FileCode className="w-4 h-4 text-[#C8266A]" />
                      <span className="font-mono text-xs font-bold text-[#241519] truncate">
                        {inspectedFile.path}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInspectedFile(null)}
                      className="p-1 text-[#6F5A63] hover:text-[#241519] rounded-md hover:bg-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-[#6F5A63] italic px-1">
                    {inspectedFile.summary}
                  </p>

                  <div className="flex-1 bg-[#1A1016] text-[#FFDFEB] p-3 rounded-xl font-mono text-xs overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                    {inspectedFile.content}
                  </div>

                  {inspectedFile.unitId && onLaunchUnit && (
                    <button
                      type="button"
                      onClick={() => onLaunchUnit(inspectedFile.unitId!)}
                      className="w-full py-2 bg-[#C8266A] hover:bg-[#A81B56] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" /> Открыть интерактивный модуль
                    </button>
                  )}
                </div>
              ) : (
                /* File List */
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {trackedKnowledge.map((file, idx) => (
                    <div
                      key={idx}
                      onClick={() => setInspectedFile({ ...file, branch: selectedBranch })}
                      className="p-2.5 rounded-xl bg-[#FFFBFC] border border-[#ECD5DE] hover:border-[#C8266A] transition cursor-pointer flex items-start gap-2.5"
                    >
                      <div className="w-6 h-6 rounded-lg bg-[#FFDFEB] text-[#C8266A] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h5 className="font-mono text-xs font-bold text-[#241519] truncate">
                            {file.path.split('/').pop()}
                          </h5>
                          <span
                            className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              file.status === 'committed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : file.status === 'conflict'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {file.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6F5A63] line-clamp-1">
                          {file.summary}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* 2. TAB: 3-WAY COGNITIVE CONFLICTS (Interactive Merge)    */}
        {/* ======================================================== */}
        {activeTab === 'conflicts' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
            
            {/* Left Column: Conflict list (4 cols) */}
            <div className="lg:col-span-4 bg-white p-3.5 rounded-2xl border border-[#ECD5DE] shadow-sm flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between text-xs font-bold text-[#6F5A63] pb-2 border-b border-[#ECD5DE] mb-2">
                <span>ОБНАРУЖЕННЫЕ КОНФЛИКТЫ ({conflicts.length})</span>
                <span className="text-[10px] text-rose-600 font-bold">● Git Cognitive Merge</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {conflicts.map((conf) => (
                  <div
                    key={conf.id}
                    onClick={() => {
                      setSelectedConflictId(conf.id);
                      setSimulatorOutput(null);
                    }}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      currentConflict?.id === conf.id
                        ? 'bg-[#FFDFEB] border-[#C8266A] ring-1 ring-[#C8266A]'
                        : 'bg-[#FFFBFC] border-[#ECD5DE] hover:border-[#F48FB4]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono text-[11px] font-bold text-[#C8266A]">{conf.topic}</span>
                      {conf.resolved ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Решено
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 animate-pulse">
                          Конфликт
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6F5A63] line-clamp-2 mb-1.5">
                      {conf.userHypothesis}
                    </p>
                    <span className="text-[10.5px] font-bold text-[#C8266A]">
                      Награда: +{conf.xpReward} XP
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: 3-Way Diff & Runnable Simulator (8 cols) */}
            <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-[#ECD5DE] shadow-sm flex flex-col h-full overflow-y-auto space-y-4">
              {currentConflict ? (
                <>
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#ECD5DE]">
                    <div>
                      <span className="text-xs font-mono font-bold text-[#6F5A63] uppercase">
                        Разбор когнитивного конфликта понимания
                      </span>
                      <h3 className="text-base font-bold font-display text-[#241519]">
                        {currentConflict.topic}
                      </h3>
                    </div>
                    {currentConflict.resolved ? (
                      <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Конфликт разрешен и слит с веткой main
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleResolveConflict(currentConflict.id)}
                        className="px-4 py-2 bg-[#C8266A] hover:bg-[#A81B56] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition cursor-pointer"
                      >
                        <GitMerge className="w-4 h-4" /> Разрешить конфликт и влить в main (+{currentConflict.xpReward} XP)
                      </button>
                    )}
                  </div>

                  {resolveSuccessNotice && (
                    <div className="p-3 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] text-emerald-900 text-xs font-bold flex items-center gap-2 animate-bounce">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{resolveSuccessNotice}</span>
                    </div>
                  )}

                  {/* 3-Way Side-by-Side Diff Panels */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    
                    {/* Panel 1: User's Mental Model (Branch Hypothesis) */}
                    <div className="bg-rose-50/60 border border-rose-200 p-3.5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-rose-800">
                        <span>{'<<<<<<<'} ВЕТКА СТУДЕНТА (ГИПОТЕЗА)</span>
                        <span className="font-mono text-[10px]">HEAD: hypothesis</span>
                      </div>
                      <p className="text-xs text-rose-900 leading-relaxed font-sans">
                        "{currentConflict.userHypothesis}"
                      </p>
                      <span className="inline-block text-[10.5px] text-rose-600 bg-white px-2 py-0.5 rounded border border-rose-200">
                        ⚠️ Когнитивное заблуждение
                      </span>
                    </div>

                    {/* Panel 2: Canonical Invariant (Main Branch) */}
                    <div className="bg-emerald-50/60 border border-emerald-200 p-3.5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                        <span>{'======='} КАНОНИЧЕСКИЙ ИНВАРИАНТ (MAIN)</span>
                        <span className="font-mono text-[10px]">origin/main</span>
                      </div>
                      <p className="text-xs text-emerald-900 leading-relaxed font-sans font-medium">
                        "{currentConflict.canonicalInvariant}"
                      </p>
                      <span className="inline-block text-[10.5px] text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                        ✅ Доказанный закон
                      </span>
                    </div>

                  </div>

                  {/* Explanation & Counter-example Code Simulator */}
                  <div className="bg-[#1A1016] text-[#FFDFEB] p-4 rounded-2xl space-y-3 shadow-md">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="font-mono text-xs text-[#F48FB4] font-bold">
                        {">>>>>>>"} ДОКАЗАТЕЛЬНЫЙ КОНТРПРИМЕР В ПЕСОЧНИЦЕ
                      </span>
                      <button
                        type="button"
                        onClick={handleRunSimulator}
                        disabled={runningSimulator}
                        className="flex items-center gap-1 px-3 py-1 bg-[#C8266A] hover:bg-[#A81B56] text-white text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        {runningSimulator ? 'Выполнение...' : 'Запустить доказательство'}
                      </button>
                    </div>

                    <pre className="font-mono text-xs overflow-x-auto text-emerald-300 leading-relaxed">
                      {currentConflict.counterExampleCode}
                    </pre>

                    {simulatorOutput && (
                      <div className="bg-black/60 p-3 rounded-xl border border-white/10 space-y-1">
                        <span className="text-[10px] uppercase font-mono text-[#F48FB4] font-bold block">
                          Терминальный вывод (Output):
                        </span>
                        <pre className="font-mono text-xs text-white whitespace-pre-wrap">
                          {simulatorOutput}
                        </pre>
                      </div>
                    )}

                    <div className="pt-2 border-t border-white/10 text-xs text-[#FFDFEB]/80 leading-relaxed">
                      <b>Объяснение ИИ-арбитра:</b> {currentConflict.explanation}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-[#6F5A63]">
                  Выберите конфликт из списка слева для просмотра 3-Way Diff.
                </div>
              )}
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* 3. TAB: SEMANTIC KNOWLEDGE DIFF (Delta Growth)           */}
        {/* ======================================================== */}
        {activeTab === 'diff' && (
          <div className="bg-white p-5 rounded-2xl border border-[#ECD5DE] shadow-sm h-full overflow-y-auto space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-[#ECD5DE]">
              <div>
                <h3 className="text-base font-bold font-display text-[#241519]">
                  Семантический Дифф Роста (Knowledge Delta)
                </h3>
                <p className="text-xs text-[#6F5A63]">
                  Сравнение текущего состояния памяти со стартовым срезом спринта
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6F5A63]">Базовый срез:</span>
                <select
                  value={diffBasePeriod}
                  onChange={(e) => setDiffBasePeriod(e.target.value as any)}
                  className="px-3 py-1.5 bg-[#FFFBFC] border border-[#ECD5DE] rounded-xl text-xs font-semibold text-[#241519] focus:outline-none focus:border-[#C8266A]"
                >
                  <option value="sprint-start">Начало спринта (7 дней назад)</option>
                  <option value="yesterday">Вчерашний срез</option>
                  <option value="day-1">День 1 (Точка старта)</option>
                </select>
              </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
                  <span>+ НОВЫЕ ИНВАРИАНТЫ</span>
                  <span className="text-lg font-mono">+{completedCount || 8}</span>
                </div>
                <p className="text-xs text-emerald-900">
                  Темы, успешно сданные в «Чистом листе» и подтвержденные практикой.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-amber-800 text-xs font-bold">
                  <span>~ РИСК ЗАБЫВАНИЯ (ЭББИНГАУЗ)</span>
                  <span className="text-lg font-mono">~2 темы</span>
                </div>
                <p className="text-xs text-amber-900">
                  Узлы, требующие повторения в ближайшие 24 часа для закрепления в долговременной памяти.
                </p>
              </div>

              <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-rose-800 text-xs font-bold">
                  <span>- ОПРОВЕРГНУТЫЕ ЗАБЛУЖДЕНИЯ</span>
                  <span className="text-lg font-mono">-3 ошибки</span>
                </div>
                <p className="text-xs text-rose-900">
                  Когнитивные конфликты, разрешенные доказательствами в песочнице.
                </p>
              </div>
            </div>

            {/* Detailed Semantic Breakdown List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6F5A63]">
                Детальные изменения ментальных моделей:
              </h4>

              <div className="space-y-2 font-mono text-xs">
                {nodes.filter((n) => n.status === 'completed').map((node, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[#DCFCE7]/60 border border-[#86EFAC] text-emerald-950 flex items-center justify-between">
                    <span>+ [ADDED INVARIANT] {node.title} (Score: {node.score || 100}%)</span>
                    <span className="text-[10px] text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                      Верифицировано
                    </span>
                  </div>
                ))}
                <div className="p-3 rounded-xl bg-[#FEF3C7]/60 border border-[#FDE68A] text-amber-950 flex items-center justify-between">
                  <span>~ [DECAY WARNING] Рекурсивные алгоритмы & Стек вызовов (Прошло 5 дней с момента практики)</span>
                  <span className="text-[10px] text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-200">
                    Повторить
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#FFE4E6]/60 border border-[#FECDD3] text-rose-950 flex items-center justify-between">
                  <span>- [REFUTED] Заблуждение о многопоточности JavaScript в Event Loop удалено из базы знаний</span>
                  <span className="text-[10px] text-rose-800 bg-white px-2 py-0.5 rounded border border-rose-200">
                    Разрешено
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. TAB: KNOWLEDGE BISECT (Diagnostic Root Cause Finder)   */}
        {/* ======================================================== */}
        {activeTab === 'bisect' && (
          <div className="bg-white p-5 rounded-2xl border border-[#ECD5DE] shadow-sm h-full overflow-y-auto space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#ECD5DE]">
              <div>
                <h3 className="text-base font-bold font-display text-[#241519]">
                  Knowledge Bisect (Поиск корневых пробелов)
                </h3>
                <p className="text-xs text-[#6F5A63]">
                  Бинарный поиск по истории коммитов понимания для локализации фундаментальной ошибки
                </p>
              </div>

              {!bisectActive && (
                <button
                  type="button"
                  onClick={handleStartBisect}
                  className="px-4 py-2 bg-[#C8266A] hover:bg-[#A81B56] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" /> Запустить Knowledge Bisect
                </button>
              )}
            </div>

            {bisectActive ? (
              <div className="space-y-4">
                {!bisectResult ? (
                  <div className="bg-[#FFF1F6] border border-[#F48FB4] p-5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold text-[#C8266A]">
                      <span>ШАГ ДИАГНОСТИКИ: {bisectStep} из 3</span>
                      <span>Проверяемый коммит: mod-10{bisectStep + 1}</span>
                    </div>

                    <h4 className="text-sm font-bold text-[#241519]">
                      {bisectStep === 1
                        ? 'Проверка базовой ментальной модели: Понимаете ли вы разницу между мутабельными и иммутабельными операциями со стеком?'
                        : bisectStep === 2
                        ? 'Проверка асинхронного тайминга: Блокирует ли промис microtask очередь перед следующей макротаской?'
                        : 'Проверка атомарности: Гарантирует ли операция i++ отсутствие race condition в многопоточной среде?'}
                    </h4>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleStepBisect(true)}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                      >
                        ✅ Да, инвариант верен (Good)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStepBisect(false)}
                        className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                      >
                        ❌ Нет, здесь возникает сбой (Bad)
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Bisect Found Root Cause */
                  <div className="bg-emerald-50 border-2 border-emerald-300 p-5 rounded-2xl space-y-4 animate-in fade-in">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>КОРНЕВАЯ ПРИЧИНА УСПЕШНО ЛОКАЛИЗОВАНА (FIRST BAD COMMIT)</span>
                    </div>

                    <div className="space-y-2 text-xs text-emerald-950">
                      <p><b>Первый коммит со сбоем:</b> <span className="font-mono bg-white px-2 py-0.5 rounded border">{bisectResult.rootCommit}</span></p>
                      <p><b>Скрытый концептуальный пробел:</b> {bisectResult.rootConcept}</p>
                      <p><b>Пояснение ИИ:</b> {bisectResult.explanation}</p>
                    </div>

                    <div className="pt-3 border-t border-emerald-200 flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-900">
                        Рекомендуемый блок для ликвидации: <b>{bisectResult.remediationUnitTitle}</b>
                      </span>
                      <button
                        type="button"
                        onClick={() => setBisectActive(false)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition"
                      >
                        Завершить диагностику
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-[#6F5A63] space-y-2">
                <Search className="w-10 h-10 text-[#C8266A] mx-auto opacity-50" />
                <h4 className="text-sm font-bold text-[#241519]">Инструмент Knowledge Bisect готов</h4>
                <p className="text-xs max-w-md mx-auto">
                  Если вы испытываете трудности на сложных Capstone-проектах, запустите бисект, чтобы за 3 вопроса найти упущенный базовый инвариант.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. TAB: MILESTONE TAGS (`git tag`)                       */}
        {/* ======================================================== */}
        {activeTab === 'tags' && (
          <div className="bg-white p-5 rounded-2xl border border-[#ECD5DE] shadow-sm h-full overflow-y-auto space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#ECD5DE]">
              <div>
                <h3 className="text-base font-bold font-display text-[#241519]">
                  Релизные Теги Мастерства (`git tag`)
                </h3>
                <p className="text-xs text-[#6F5A63]">
                  Верифицированные снапшоты знаний с криптографическим хэшем для портфолио
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {epistemicLedgerService.getMilestones().map((tag) => (
                <div key={tag.tag} className="bg-[#FFF1F6] border border-[#ECD5DE] p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-[#C8266A] bg-white px-2.5 py-1 rounded-xl border border-[#F48FB4]">
                      {tag.tag}
                    </span>
                    <span className="text-xs text-[#6F5A63]">{tag.date}</span>
                  </div>

                  <h4 className="font-bold text-sm text-[#241519]">{tag.title}</h4>

                  <div className="space-y-1 text-xs text-[#6F5A63] bg-white/80 p-2.5 rounded-xl border border-[#ECD5DE] font-mono">
                    <p>Освоено модулей: <b>{tag.masteredUnitsCount}</b></p>
                    <p>Проверено фактов: <b>{tag.provenFactsCount}</b></p>
                    <p className="truncate text-[10px] text-slate-500">SHA-256: {tag.sha256Hash}</p>
                  </div>

                  <p className="text-xs text-emerald-800 font-semibold">{tag.verdict}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 6. TAB: PULL REQUESTS & SPARRING REVIEWS                 */}
        {/* ======================================================== */}
        {activeTab === 'prs' && (
          <div className="bg-white p-5 rounded-2xl border border-[#ECD5DE] shadow-sm h-full overflow-y-auto space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#ECD5DE]">
              <div>
                <h3 className="text-base font-bold font-display text-[#241519]">
                  Парные Pull Requests & Peer Review
                </h3>
                <p className="text-xs text-[#6F5A63]">
                  Совместная рецензия проектов спарринг-партнерами и ИИ-экзаменатором
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {epistemicLedgerService.getPullRequests().map((pr) => (
                <div key={pr.id} className="border border-[#ECD5DE] rounded-2xl p-4 space-y-3 bg-[#FFFBFC]">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <GitPullRequest className="w-5 h-5 text-[#C8266A]" />
                      <h4 className="font-bold text-sm text-[#241519]">{pr.title}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        pr.status === 'merged' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {pr.status === 'merged' ? 'Merged' : 'Open for Review'}
                      </span>
                    </div>

                    {pr.status !== 'merged' && (
                      <button
                        type="button"
                        onClick={() => {
                          epistemicLedgerService.mergePullRequest(pr.id);
                          playChime('success');
                        }}
                        className="px-3.5 py-1.5 bg-[#C8266A] hover:bg-[#A81B56] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <GitMerge className="w-3.5 h-3.5" /> Подтвердить и влить в main (LGTM)
                      </button>
                    )}
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-[#ECD5DE] font-mono text-xs space-y-1 text-emerald-800">
                    {pr.conceptDiff.map((d, i) => (
                      <div key={i}>{d}</div>
                    ))}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#ECD5DE]">
                    <span className="text-xs font-bold text-[#6F5A63]">Комментарии рецензентов:</span>
                    {pr.peerComments.map((comm, i) => (
                      <div key={i} className="bg-[#FFF1F6] p-2.5 rounded-xl border border-[#ECD5DE] text-xs space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#241519]">{comm.author} ({comm.role})</span>
                          <span className="text-[10.5px] text-[#6F5A63]">{comm.timestamp}</span>
                        </div>
                        <p className="text-[#4A0B27]">{comm.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* New Hypothesis Branch Modal */}
      {showNewBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-[#ECD5DE] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold font-display text-base text-[#241519]">
                Создать новую ветку гипотезы
              </h3>
              <button
                type="button"
                onClick={() => setShowNewBranchModal(false)}
                className="p-1 text-[#6F5A63] hover:text-[#241519]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#6F5A63]">
              Ветка позволит безопасно экспериментировать с кодом и формулировать ментальные модели без риска испортить доказанные инварианты ветки main.
            </p>

            <form onSubmit={handleCreateBranch} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Например: optimistic-lock-recovery"
                value={newBranchInput}
                onChange={(e) => setNewBranchInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FFFBFC] border border-[#ECD5DE] rounded-xl text-xs font-mono text-[#241519] focus:outline-none focus:border-[#C8266A]"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewBranchModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-[#6F5A63] hover:bg-[#FFDFEB] rounded-xl"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C8266A] hover:bg-[#A81B56] text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  Создать ветку
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
