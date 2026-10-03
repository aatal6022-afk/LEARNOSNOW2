import React, { useEffect, useState } from 'react';
import { 
  Award, 
  FileText, 
  CheckCircle2, 
  FileDown, 
  ExternalLink, 
  Calendar, 
  Star, 
  Sparkles, 
  Share2, 
  Copy, 
  LoaderCircle, 
  User, 
  Edit3,
  MessageSquare,
  StickyNote,
  Send,
  X,
  Layers
} from 'lucide-react';
import { UserArtifact, ArtifactComment } from '../../types.ts';
import { socialProfileService } from '../../services/socialProfileService.ts';
import { playChime } from '../../utils/audio.ts';

interface PortfolioWindowProps {
  artifacts: UserArtifact[];
  ownerUid?: string;
  ownerName?: string;
  ownerAvatar?: string;
  currentUser?: { uid: string; displayName: string; email?: string; photoURL?: string } | null;
  onOpenProfile?: () => void;
  isPeerPortfolio?: boolean;
  onClosePeerPortfolio?: () => void;
}

export const PortfolioWindow: React.FC<PortfolioWindowProps> = ({ 
  artifacts, 
  ownerUid, 
  ownerName, 
  ownerAvatar, 
  currentUser,
  onOpenProfile,
  isPeerPortfolio = false,
  onClosePeerPortfolio
}) => {
  const [selectedArtifact, setSelectedArtifact] = useState<UserArtifact | null>(artifacts[0] || null);
  const [isPublished, setIsPublished] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareMessage, setShareMessage] = useState('');

  // Artifact comments / sticky notes
  const [comments, setComments] = useState<ArtifactComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentColor, setNewCommentColor] = useState<'yellow' | 'blue' | 'pink' | 'green'>('yellow');
  const [isAddingComment, setIsAddingComment] = useState(false);

  useEffect(() => {
    if (artifacts.length > 0 && !selectedArtifact) {
      setSelectedArtifact(artifacts[0]);
    } else if (artifacts.length > 0 && selectedArtifact && !artifacts.some(a => a.id === selectedArtifact.id)) {
      setSelectedArtifact(artifacts[0]);
    }
  }, [artifacts, selectedArtifact]);

  useEffect(() => {
    if (!ownerUid) return;
    return socialProfileService.subscribePublishedPortfolio(ownerUid, (portfolio) => {
      setIsPublished(Boolean(portfolio));
      if (portfolio) {
        const url = new URL(window.location.href);
        url.pathname = '/';
        url.search = '';
        url.searchParams.set('portfolio', ownerUid);
        setShareUrl(url.toString());
      } else {
        setShareUrl('');
      }
    });
  }, [ownerUid]);

  // Subscribe to comments on selected artifact
  useEffect(() => {
    if (!selectedArtifact) {
      setComments([]);
      return;
    }
    const unsub = socialProfileService.subscribeArtifactComments(selectedArtifact.id, (commentsList) => {
      setComments(commentsList);
    });
    return unsub;
  }, [selectedArtifact?.id]);

  const handleAddComment = async () => {
    if (!newCommentText.trim() || !selectedArtifact) return;
    setIsAddingComment(true);
    try {
      await socialProfileService.addArtifactComment(selectedArtifact.id, {
        artifactId: selectedArtifact.id,
        authorId: currentUser?.uid || 'user-default',
        authorName: currentUser?.displayName || 'Коллега',
        authorAvatar: currentUser?.photoURL,
        text: newCommentText.trim(),
        color: newCommentColor,
      });
      setNewCommentText('');
      playChime('success');
    } catch (e) {
      console.error('Failed to add artifact comment:', e);
    } finally {
      setIsAddingComment(false);
    }
  };

  const handlePublishPortfolio = async () => {
    if (!ownerUid) return;
    setIsPublishing(true);
    setShareMessage('');
    try {
      await socialProfileService.publishPortfolio(ownerUid, ownerName || 'Студент', ownerAvatar, artifacts);
      const url = new URL(window.location.href);
      url.pathname = '/';
      url.search = '';
      url.searchParams.set('portfolio', ownerUid);
      const nextShareUrl = url.toString();
      setShareUrl(nextShareUrl);
      setIsPublished(true);
      try {
        await navigator.clipboard.writeText(nextShareUrl);
        setShareMessage('Портфолио опубликовано, ссылка скопирована.');
      } catch {
        setShareMessage('Портфолио опубликовано. Скопируйте ссылку из поля ниже.');
      }
    } catch (error) {
      setShareMessage(error instanceof Error ? error.message : 'Не удалось опубликовать портфолио.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublishPortfolio = async () => {
    if (!ownerUid) return;
    setIsPublishing(true);
    setShareMessage('');
    try {
      await socialProfileService.unpublishPortfolio(ownerUid);
      setIsPublished(false);
      setShareUrl('');
      setShareMessage('Публичный доступ отозван.');
    } catch (error) {
      setShareMessage(error instanceof Error ? error.message : 'Не удалось отозвать доступ.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyShareUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage('Ссылка скопирована.');
    } catch {
      setShareMessage('Выделите и скопируйте ссылку из поля.');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white/95 backdrop-blur-2xl text-slate-800 text-xs select-none font-sans">
      {/* Peer Viewing Info Banner */}
      {isPeerPortfolio && (
        <div className="h-9 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 text-white flex items-center justify-between text-xs shrink-0 shadow-xs z-30">
          <div className="flex items-center space-x-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse shrink-0" />
            <span className="truncate">
              Портфолио проектов: <strong className="font-bold text-white">{ownerName || 'Коллега'}</strong> · Доступен просмотр кода и стикеры
            </span>
          </div>
          {onClosePeerPortfolio && (
            <button
              type="button"
              onClick={onClosePeerPortfolio}
              className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-semibold text-[11px] transition cursor-pointer flex items-center space-x-1 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Вернуться к моему портфолио</span>
            </button>
          )}
        </div>
      )}

      {/* Top Header */}
      <div className="min-h-11 border-b border-slate-200/80 px-4 py-2 flex flex-wrap items-center justify-between gap-2 bg-white/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center space-x-2.5">
          <Award className="w-4 h-4 text-slate-700" />
          <h3 className="font-bold text-xs text-slate-900 tracking-tight">
            {isPeerPortfolio ? `Проекты пользователя ${ownerName}` : 'Портфолио проверенных решений'}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
          <span>Сданные проекты · {artifacts.length}</span>
          {!isPeerPortfolio && onOpenProfile && (
            <button
              type="button"
              onClick={onOpenProfile}
              className="inline-flex items-center gap-1.5 border border-blue-200 bg-blue-50/80 px-2.5 py-1.5 text-blue-700 hover:bg-blue-100 rounded-lg transition cursor-pointer font-semibold"
              title="Открыть и редактировать профиль"
            >
              <User className="h-3.5 w-3.5 text-blue-600" />
              <span>Мой профиль</span>
            </button>
          )}
          {!isPeerPortfolio && ownerUid && (
            <>
              <button
                type="button"
                onClick={handlePublishPortfolio}
                disabled={isPublishing || !artifacts.some((artifact) => artifact.passed && artifact.score >= 70)}
                className="inline-flex items-center gap-1.5 border border-slate-300 px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
                title="Опубликовать проверенные артефакты и скопировать ссылку"
              >
                {isPublishing ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
                <span>{isPublished ? 'Обновить ссылку' : 'Поделиться'}</span>
              </button>
              {isPublished && (
                <button
                  type="button"
                  onClick={handleUnpublishPortfolio}
                  disabled={isPublishing}
                  className="border border-slate-300 px-2.5 py-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg disabled:opacity-50"
                >
                  Снять доступ
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {!isPeerPortfolio && ownerUid && shareUrl && (
        <div className="flex items-center gap-2 border-b border-slate-200 bg-emerald-50/70 px-4 py-2">
          <input aria-label="Публичная ссылка на портфолио" readOnly value={shareUrl} className="min-w-0 flex-1 bg-transparent text-[11px] text-slate-700 outline-none font-mono" />
          <button type="button" onClick={handleCopyShareUrl} title="Скопировать ссылку" className="p-1.5 text-emerald-800 hover:bg-emerald-100 rounded cursor-pointer">
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {!isPeerPortfolio && ownerUid && shareMessage && <p role="status" className="border-b border-slate-200 px-4 py-1.5 text-[11px] text-slate-600">{shareMessage}</p>}

      {/* Main Grid */}
      <div className="flex-1 flex overflow-hidden select-text">
        {/* Artifacts List */}
        <div className="w-80 border-r border-slate-200/80 bg-white/40 backdrop-blur-md p-4 space-y-2 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Верифицированные артефакты (≥70%)
          </div>

          {artifacts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              {isPeerPortfolio ? 'У пользователя пока нет сданных проектов' : 'Нет сохраненных артефактов'}
            </div>
          ) : (
            artifacts.map((a) => (
              <div
                key={a.id}
                onClick={() => {
                  setSelectedArtifact(a);
                  playChime('click');
                }}
                className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                  selectedArtifact?.id === a.id
                    ? 'bg-slate-900 text-white shadow-xs border-slate-900'
                    : 'bg-white/80 border-white/90 hover:border-slate-300 text-slate-700 shadow-2xs backdrop-blur-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-xs font-bold tabular-nums ${selectedArtifact?.id === a.id ? 'text-emerald-300' : 'text-emerald-700'}`}>
                    {a.score}%
                  </span>
                  <span className={`text-[10px] ${selectedArtifact?.id === a.id ? 'text-slate-300' : 'text-slate-400'}`}>{a.submittedAt}</span>
                </div>
                <h4 className={`font-bold text-xs mt-1 truncate ${selectedArtifact?.id === a.id ? 'text-white' : 'text-slate-900'}`}>{a.unitTitle}</h4>
                <div className={`flex items-center space-x-1.5 text-[10px] mt-1.5 font-mono ${selectedArtifact?.id === a.id ? 'text-slate-300' : 'text-slate-500'}`}>
                  <FileText className="w-3 h-3" />
                  <span className="truncate">{a.filename}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Artifact Viewer */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-white/30 backdrop-blur-md">
          {selectedArtifact ? (
            <div className="space-y-5 max-w-4xl">
              {/* Header Card */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.05)] space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Верифицировано стресс-тестом Gemini
                    </span>
                    <h2 className="text-base font-semibold text-slate-900 mt-1">
                      {selectedArtifact.unitTitle}
                    </h2>
                    <div className="text-[11px] text-slate-500 mt-1 font-mono">
                      Файл: {selectedArtifact.filename} · Сдано: {selectedArtifact.submittedAt}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-3xl font-semibold text-emerald-700 font-mono tabular-nums">
                      {selectedArtifact.score}%
                    </span>
                    <div className="text-[10px] text-emerald-700 font-medium mt-0.5">ВЫПОЛНЕНО</div>
                  </div>
                </div>

                {/* Key Achievements */}
                <div className="grid md:grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs space-y-1.5">
                    <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Пройденные критерии:</span>
                    </div>
                    <ul className="text-slate-600 text-[11px] space-y-1">
                      {selectedArtifact.strongPoints.map((sp, i) => (
                        <li key={i}>• {sp}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs space-y-1.5">
                    <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-slate-600" />
                      <span>Рекомендация эксперта:</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {selectedArtifact.productionAdvice || 'Решение соответствует production-стандартам.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Code Snapshot */}
              <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between font-mono text-[11px] text-slate-300">
                  <span>Исходный код решения: {selectedArtifact.filename}</span>
                  <span className="text-slate-500">Read-only Snapshot</span>
                </div>
                <pre className="p-4 bg-slate-950 font-mono text-[11px] text-slate-100 overflow-x-auto leading-relaxed max-h-96">
                  {selectedArtifact.fileContent}
                </pre>
              </div>

              {/* Peer Sticky Notes & Comments to Artifact */}
              <div className="bg-amber-50/80 backdrop-blur-md rounded-3xl p-5 border border-amber-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center space-x-1.5 text-amber-950">
                    <StickyNote className="w-4 h-4 text-amber-600" />
                    <span>Бумажные стикеры и комментарии к проекту ({comments.length})</span>
                  </span>
                  <span className="text-[10px] text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                    Синхронизировано · видно автору и коллегам
                  </span>
                </div>

                {/* List of comments/stickies */}
                {comments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {comments.map((c) => {
                      const colorBg = 
                        c.color === 'blue' ? 'bg-blue-100/90 border-blue-300 text-blue-950' :
                        c.color === 'pink' ? 'bg-pink-100/90 border-pink-300 text-pink-950' :
                        c.color === 'green' ? 'bg-emerald-100/90 border-emerald-300 text-emerald-950' :
                        'bg-amber-100/90 border-amber-300 text-amber-950';

                      return (
                        <div key={c.id} className={`p-3 rounded-2xl border shadow-2xs space-y-1.5 ${colorBg}`}>
                          <div className="flex items-center justify-between text-[10px] opacity-80">
                            <span className="font-bold truncate">{c.authorName}</span>
                            <span>{new Date(c.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
                            {c.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-amber-800/70 italic text-center py-3">
                    Пока нет стикеров. Оставьте отзыв, похвалу или архитектурный совет автору!
                  </div>
                )}

                {/* Sticky note input composer */}
                <div className="space-y-2 pt-2 border-t border-amber-200">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] text-amber-900 font-semibold mr-1">Цвет стикера:</span>
                    <button
                      type="button"
                      onClick={() => setNewCommentColor('yellow')}
                      className={`w-4 h-4 rounded-full bg-amber-300 border ${newCommentColor === 'yellow' ? 'ring-2 ring-amber-600 scale-110' : 'border-amber-400'}`}
                      title="Желтый"
                    />
                    <button
                      type="button"
                      onClick={() => setNewCommentColor('blue')}
                      className={`w-4 h-4 rounded-full bg-blue-300 border ${newCommentColor === 'blue' ? 'ring-2 ring-blue-600 scale-110' : 'border-blue-400'}`}
                      title="Синий"
                    />
                    <button
                      type="button"
                      onClick={() => setNewCommentColor('pink')}
                      className={`w-4 h-4 rounded-full bg-pink-300 border ${newCommentColor === 'pink' ? 'ring-2 ring-pink-600 scale-110' : 'border-pink-400'}`}
                      title="Розовый"
                    />
                    <button
                      type="button"
                      onClick={() => setNewCommentColor('green')}
                      className={`w-4 h-4 rounded-full bg-emerald-300 border ${newCommentColor === 'green' ? 'ring-2 ring-emerald-600 scale-110' : 'border-emerald-400'}`}
                      title="Зеленый"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddComment();
                      }}
                      placeholder="Напишите комментарий или прикрепите бумажный стикер к проекту..."
                      className="flex-1 px-3 py-2 text-xs rounded-xl bg-white border border-amber-300 focus:border-amber-500 focus:outline-hidden text-slate-800 placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddComment}
                      disabled={!newCommentText.trim() || isAddingComment}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs disabled:opacity-40 shadow-2xs transition cursor-pointer flex items-center space-x-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Оставить стикер</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 text-xs">
              Выберите артефакт из списка слева
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
