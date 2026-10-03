import React, { useState } from 'react';
import { 
  ArrowRight, 
  BookOpen, 
  Check, 
  Code2, 
  Copy, 
  Sparkles, 
  Layers, 
  Zap, 
  Flame, 
  ExternalLink, 
  StickyNote,
  Users,
  Lock,
  MessageSquare
} from 'lucide-react';
import { BlockGraphicSnapshot } from '../../types.ts';
import { playChime } from '../../utils/audio.ts';

interface BlockGraphicSnapshotCardProps {
  snapshot: BlockGraphicSnapshot;
  onSelectUnit?: (unitId: string) => void;
  onOpenDag?: (nodeId?: string) => void;
  isCompact?: boolean;
}

export const BlockGraphicSnapshotCard: React.FC<BlockGraphicSnapshotCardProps> = ({
  snapshot,
  onSelectUnit,
  onOpenDag,
  isCompact = false,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (snapshot.starterCode) {
      navigator.clipboard.writeText(snapshot.starterCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      playChime('click');
    }
  };

  const handleOpenFullDag = (e: React.MouseEvent) => {
    e.stopPropagation();
    playChime('success');
    const targetId = snapshot.nodeId || snapshot.unitId;
    if (onOpenDag) {
      onOpenDag(targetId);
    } else {
      window.dispatchEvent(
        new CustomEvent('learning_open_dag_node', {
          detail: { nodeId: snapshot.nodeId, unitId: snapshot.unitId },
        })
      );
    }
    if (snapshot.unitId) {
      onSelectUnit?.(snapshot.unitId);
    }
  };

  const handleLaunchInFocus = (e: React.MouseEvent) => {
    e.stopPropagation();
    playChime('click');
    if (snapshot.unitId) {
      onSelectUnit?.(snapshot.unitId);
      window.dispatchEvent(new CustomEvent('learning_launch_module_window', { detail: { unitId: snapshot.unitId } }));
    }
  };

  const isPair = snapshot.type === 'pair' || (snapshot as any).isPairWork;
  const isProject = snapshot.type === 'project' || Boolean(snapshot.projectTitle);
  const isInjection = snapshot.type === 'injection' || snapshot.status === 'stuck_injected';
  const isCompleted = snapshot.status === 'completed';
  const isActive = !isCompleted && !isInjection && snapshot.status !== 'locked';

  const sprintText = snapshot.sprint || (snapshot.blockIndex != null ? `Спринт ${snapshot.blockIndex}` : (snapshot.category || 'Спринт 01'));
  const durationMin = snapshot.durationMin || snapshot.estimatedTimeMin || 45;
  const authorName = snapshot.authorName || '@algo_master';

  const markdownPreview = (snapshot.summaryMarkdown || snapshot.summary || '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return (
    <div
      onClick={handleOpenFullDag}
      title="Клик: открыть этот блок в интерактивном DAG-графе с комментариями и стикерами"
      className="dag-node-card relative rounded-xl p-4 transition-all duration-150 cursor-pointer text-left select-none bg-white border-2 border-sky-500 ring-2 ring-sky-500/20 shadow-sm hover:shadow-xl hover:scale-[1.01] w-full max-w-[290px] my-2 text-slate-800 group"
    >
      {/* 1. Yellow Ribbon - 1:1 replica of the DAG graph block header with interactive hint */}
      <div className="h-1.5 -mx-4 -mt-4 mb-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-t-xl transition-all duration-300 relative group/ribbon flex items-center justify-end px-2">
        <span className="absolute -bottom-2 right-2 px-1.5 py-0.2 bg-amber-200/95 text-amber-950 border border-amber-400 rounded text-[9px] font-bold shadow-2xs flex items-center gap-1">
          <StickyNote className="w-2.5 h-2.5 text-amber-700" />
          <span>DAG Граф & Стикеры 📝</span>
        </span>
      </div>

      {/* 2. Status header with clean unboxed metadata */}
      <div className="flex items-center justify-between mb-2 text-xs">
        <span className="text-[11px] font-medium text-slate-500">{sprintText}</span>
        <div className="flex items-center space-x-1.5">
          {isPair && (
            <span className="flex items-center space-x-1 text-emerald-800 font-bold text-[10px] bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
              <Users className="w-3 h-3 text-emerald-700" />
              <span>P2P Спарринг</span>
            </span>
          )}
          {isProject && !isPair && (
            <span className="flex items-center space-x-1 text-purple-700 font-bold text-[10px] bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
              <Sparkles className="w-3 h-3 text-purple-600" />
              <span>Боевой кейс</span>
            </span>
          )}
          {isCompleted && (
            <span className="flex items-center space-x-1 text-emerald-600 font-semibold text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Освоено</span>
            </span>
          )}
          {isActive && !isProject && !isPair && (
            <span className="flex items-center space-x-1 text-sky-600 font-semibold text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              <span>В фокусе</span>
            </span>
          )}
          {isInjection && (
            <span className="flex items-center space-x-1 text-amber-600 font-semibold text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>ИИ-Инъекция</span>
            </span>
          )}
        </div>
      </div>

      {/* 3. Title & Subtitle */}
      <div className="font-semibold text-xs leading-snug mb-1 text-slate-900 group-hover:text-blue-600 transition">
        {snapshot.title}
      </div>
      {snapshot.subtitle && (
        <div className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
          {snapshot.subtitle}
        </div>
      )}

      {/* Optional Invariant Snippet if available */}
      {markdownPreview && (
        <div className="mt-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-[10px] text-slate-600 line-clamp-2 leading-snug">
          💡 {markdownPreview}
        </div>
      )}

      {/* 4. Starter code expandable if present */}
      {snapshot.starterCode && (
        <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-slate-200" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-slate-800 px-2.5 py-1 text-[9px] text-slate-400">
            <span className="flex items-center gap-1">
              <Code2 className="h-3 w-3 text-cyan-400" />
              <span className="font-mono text-cyan-300">{snapshot.projectFilename || 'solution.ts'}</span>
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              title="Копировать код"
              className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              {copiedCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
          <pre className="max-h-20 overflow-auto whitespace-pre p-2 font-mono text-[9px] leading-relaxed text-slate-300 custom-scrollbar">
            {snapshot.starterCode.trim()}
          </pre>
        </div>
      )}

      {/* 5. Footer metadata - exactly matching DAG block footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="font-mono tabular-nums text-slate-600 font-medium">{durationMin} мин</span>
        <span className="text-slate-700 font-medium truncate max-w-[140px] text-right">
          {authorName}
        </span>
      </div>

      {/* 6. Quick Action Navigation Bar */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
        <button
          type="button"
          onClick={handleOpenFullDag}
          className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          title="Открыть узел в интерактивном DAG-графе"
        >
          <Layers className="w-3 h-3 text-blue-500" />
          <span>В полный граф ↗</span>
        </button>

        <button
          type="button"
          onClick={handleLaunchInFocus}
          className="font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
          title="Открыть модуль в Фокус-Студии"
        >
          <span>В студию</span>
          <ArrowRight className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
};
