import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  X, 
  Edit3, 
  Save, 
  Sparkles, 
  Flame, 
  BookOpen, 
  ExternalLink, 
  Github, 
  Send, 
  Globe, 
  Camera, 
  Check, 
  Layers, 
  Clock, 
  Award, 
  ShieldCheck, 
  MessageSquare, 
  Copy, 
  Tag, 
  Zap, 
  Activity, 
  Share2, 
  ChevronRight,
  Code2,
  StickyNote,
  MapPin,
  Compass
} from 'lucide-react';
import { UserProfile, DAGNode, ProfileNodeSnapshot } from '../../types.ts';
import { playChime } from '../../utils/audio.ts';
import { socialProfileService } from '../../services/socialProfileService.ts';

// Preset avatar styles for easy 1-click customization
const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
];

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: UserProfile | null;
  currentUserId: string;
  currentUserName?: string;
  currentUserAvatar?: string;
  nodes?: DAGNode[];
  karma?: number;
  onSaveProfile?: (updatedProfile: UserProfile) => void;
  onOpenChatWithUser?: (userId: string, userName: string) => void;
  onSelectNode?: (nodeId: string) => void;
  onOpenUserDag?: (user: { uid: string; displayName: string; avatar?: string; status?: string }, nodeId?: string) => void;
  onOpenUserPortfolio?: (user: { uid: string; displayName: string; avatar?: string }) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  currentUserId,
  currentUserName = 'Студент',
  currentUserAvatar = '',
  nodes = [],
  karma = 0,
  onSaveProfile,
  onOpenChatWithUser,
  onSelectNode,
  onOpenUserDag,
  onOpenUserPortfolio,
}) => {
  const isOwnProfile = !profile || profile.uid === currentUserId;

  const [activeTab, setActiveTab] = useState<'profile' | 'trajectory'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Editable form fields
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [title, setTitle] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState<'focus' | 'idle' | 'break'>('idle');
  const [targetGoal, setTargetGoal] = useState('');
  const [thinkingStyle, setThinkingStyle] = useState('engineering');
  const [githubUrl, setGithubUrl] = useState('');
  const [telegramUrl, setTelegramUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize data on open / profile change
  useEffect(() => {
    if (!isOpen) return;

    if (profile) {
      setDisplayName(profile.displayName || currentUserName);
      setAvatarUrl(profile.avatar || currentUserAvatar || '');
      setTitle(profile.title || 'Учащийся');
      setSpecialty(profile.specialty || 'Архитектура & Системы');
      setBio(profile.bio || '');
      setStatus(profile.status || 'idle');
      setTargetGoal(profile.targetGoal || 'Освоение прикладных навыков');
      setThinkingStyle(profile.thinkingStyle || 'engineering');
      setGithubUrl(profile.githubUrl || '');
      setTelegramUrl(profile.telegramUrl || '');
      setWebsiteUrl(profile.websiteUrl || '');
    } else {
      // Default for self
      try {
        const stored = localStorage.getItem(`learning_os_public_profile_${currentUserId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setDisplayName(parsed.displayName || currentUserName);
          setAvatarUrl(parsed.avatar || currentUserAvatar || '');
          setTitle(parsed.title || 'Staff Systems Architect');
          setSpecialty(parsed.specialty || 'Архитектура & Системы');
          setBio(parsed.bio || 'Изучаю фундаментальные инварианты, проектирую распределенные системы и практикуюсь в коде.');
          setStatus(parsed.status || 'idle');
          setTargetGoal(parsed.targetGoal || 'Свободное владение инвариантами');
          setThinkingStyle(parsed.thinkingStyle || 'engineering');
          setGithubUrl(parsed.githubUrl || '');
          setTelegramUrl(parsed.telegramUrl || '');
          setWebsiteUrl(parsed.websiteUrl || '');
          return;
        }
      } catch {}

      setDisplayName(currentUserName);
      setAvatarUrl(currentUserAvatar);
      setTitle('Практик & Архитектор');
      setSpecialty('Системная инженерия');
      setBio('Изучаю фундаментальные инварианты и практикуюсь на боевых кейсах.');
      setStatus('idle');
      setTargetGoal('Освоение прикладных навыков');
      setThinkingStyle('engineering');
    }
  }, [isOpen, profile, currentUserId, currentUserName, currentUserAvatar]);

  if (!isOpen) return null;

  const completedCount = nodes.filter((n) => n.status === 'completed').length;
  const activeNodes = nodes.filter((n) => n.status === 'active');
  const ringProgress = nodes.length > 0 ? Math.round((completedCount / nodes.length) * 100) : 0;
  const activeNodeId = activeNodes[0]?.id || profile?.currentNodeIds?.[0] || nodes[0]?.id;

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5 МБ');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAvatarUrl(result);
      playChime('click');
    };
    reader.readAsDataURL(file);
  };

  const handleOpenTrajectory = (targetNodeId?: string) => {
    if (onOpenUserDag) {
      onOpenUserDag(
        {
          uid: profile?.uid || currentUserId,
          displayName: displayName || currentUserName,
          avatar: avatarUrl || currentUserAvatar,
          status,
        },
        targetNodeId || activeNodeId
      );
    } else if (targetNodeId) {
      onSelectNode?.(targetNodeId);
    }
    onClose();
    playChime('click');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    const safeNodes: ProfileNodeSnapshot[] = activeNodes.map((n) => ({
      nodeId: n.id,
      title: n.title,
      subtitle: n.subtitle,
      unitId: n.unitId,
      category: n.category,
    }));

    const updatedProfile: UserProfile = {
      uid: currentUserId,
      displayName: displayName.trim() || currentUserName,
      avatar: avatarUrl.trim() || undefined,
      title: title.trim() || 'Учащийся',
      specialty: specialty.trim() || 'Не указана',
      bio: bio.trim(),
      status,
      ringProgress,
      currentNodeIds: activeNodes.map((n) => n.id),
      currentNodes: safeNodes,
      wallPosts: [],
      githubUrl: githubUrl.trim() || undefined,
      telegramUrl: telegramUrl.trim() || undefined,
      websiteUrl: websiteUrl.trim() || undefined,
      targetGoal: targetGoal.trim() || undefined,
      thinkingStyle,
      streakDays: 14,
      completedNodesCount: completedCount,
    };

    try {
      await socialProfileService.savePublicProfile(updatedProfile);

      // Save to localStorage for quick sync
      localStorage.setItem(`learning_os_public_profile_${currentUserId}`, JSON.stringify(updatedProfile));
      localStorage.setItem('learning_os_user_name', updatedProfile.displayName);
      
      onSaveProfile?.(updatedProfile);
      setIsEditing(false);
      setSaveMessage('Профиль успешно сохранен');
      playChime('success');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.warn('Profile save error:', err);
      setSaveMessage('Сохранено локально в браузере');
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in select-text">
      <div className="bg-white rounded-3xl border border-slate-200/90 max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] font-sans">
        
        {/* TOP HERO BANNER */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-6 text-white shrink-0 overflow-hidden">
          {/* Decorative glowing backdrops */}
          <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute left-1/3 -bottom-10 w-40 h-40 rounded-full bg-cyan-400/20 blur-2xl pointer-events-none" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center space-x-4 min-w-0">
              {/* Avatar with edit overlay */}
              <div className="relative group shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/30 shadow-lg bg-white"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-white/20 text-white font-bold text-2xl flex items-center justify-center ring-4 ring-white/30 shadow-lg backdrop-blur-md">
                    {(displayName || 'U').substring(0, 2).toUpperCase()}
                  </div>
                )}

                {isOwnProfile && isEditing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-2xl bg-black/50 text-white flex flex-col items-center justify-center text-[10px] font-medium opacity-90 hover:opacity-100 transition cursor-pointer"
                    title="Загрузить фото"
                  >
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span>Сменить</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileUpload}
                  className="hidden"
                />
              </div>

              {/* Title & Headline */}
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                    {displayName || 'Студент'}
                  </h2>
                  <span className={`w-2.5 h-2.5 rounded-full ring-2 ring-white ${status === 'focus' ? 'bg-emerald-400 animate-pulse' : status === 'break' ? 'bg-amber-400' : 'bg-slate-300'}`} />
                </div>

                <p className="text-sm text-blue-100 font-medium truncate mt-0.5">
                  {title || 'Практик & Архитектор систем'}
                </p>

                <div className="flex items-center flex-wrap gap-2 mt-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-white text-[11px] font-medium backdrop-blur-xs border border-white/20">
                    {specialty || 'Системная инженерия'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[11px] font-semibold flex items-center space-x-1 border border-emerald-400/30">
                    <Flame className="w-3 h-3 text-emerald-300 fill-current" />
                    <span>14 дней стрик</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center space-x-2 shrink-0">
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => {
                    if (isEditing) {
                      handleSave();
                    } else {
                      setIsEditing(true);
                      playChime('click');
                    }
                  }}
                  disabled={isSaving}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 shadow-xs ${
                    isEditing
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-md'
                  }`}
                >
                  {isEditing ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                  <span>{isSaving ? 'Сохранение...' : isEditing ? 'Сохранить' : 'Редактировать'}</span>
                </button>
              )}

              {!isOwnProfile && onOpenChatWithUser && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenChatWithUser(profile!.uid, profile!.displayName);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>Написать</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition cursor-pointer border border-white/20"
                title="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Direct CTA Banner: View Learning Trajectory & Leave Sticky Notes */}
          <div className="mt-4 p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Compass className="w-4 h-4 text-cyan-300 animate-pulse" />
                <span>Траектория обучения на DAG-графе</span>
              </div>
              <p className="text-[11px] text-blue-100 leading-snug">
                Текущий блок подсвечен синим · Наведите на любой блок, чтобы увидеть заметки или оставить свой стикер
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenTrajectory()}
              className="px-4 py-2 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs shadow-md transition cursor-pointer flex items-center space-x-1.5 shrink-0 group"
              title="Открыть интерактивный граф обучения"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
              <span>Посмотреть траекторию обучения</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-white/15 text-xs">
            <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs border border-white/10">
              <div className="text-[10px] text-blue-100 uppercase tracking-wider font-semibold">Прогресс курса</div>
              <div className="text-base font-bold text-white mt-0.5">{ringProgress}%</div>
              <div className="text-[10px] text-blue-200 mt-0.5">{completedCount} из {nodes.length} модулей</div>
            </div>

            <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs border border-white/10">
              <div className="text-[10px] text-blue-100 uppercase tracking-wider font-semibold">Карма & Опыт</div>
              <div className="text-base font-bold text-white mt-0.5">{karma.toLocaleString()} XP</div>
              <div className="text-[10px] text-blue-200 mt-0.5">Верифицировано практикой</div>
            </div>

            <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs border border-white/10">
              <div className="text-[10px] text-blue-100 uppercase tracking-wider font-semibold">Режим фокуса</div>
              <div className="text-base font-bold text-white mt-0.5">
                {status === 'focus' ? '⚡ В потоке' : status === 'break' ? '☕ Отдых' : '⏳ Готов к сессии'}
              </div>
              <div className="text-[10px] text-blue-200 mt-0.5">Помодоро & Инварианты</div>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center justify-between px-6 border-b border-slate-200 bg-slate-50/80 shrink-0 flex-wrap gap-2">
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('profile');
                playChime('click');
              }}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'profile'
                  ? 'border-blue-600 text-blue-700 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Визитка & Навыки</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('trajectory');
                playChime('click');
              }}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'trajectory'
                  ? 'border-blue-600 text-blue-700 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Траектория обучения ({nodes.length} модулей)</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 py-1.5">
            {saveMessage && (
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 animate-fade-in">
                {saveMessage}
              </span>
            )}

            <button
              type="button"
              onClick={() => handleOpenTrajectory()}
              className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              title="Открыть траекторию обучения на интерактивном DAG-графе"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Открыть DAG-граф</span>
            </button>

            {onOpenUserPortfolio && (
              <button
                type="button"
                onClick={() => {
                  onOpenUserPortfolio({
                    uid: profile?.uid || currentUserId,
                    displayName: displayName || currentUserName,
                    avatar: avatarUrl || currentUserAvatar,
                  });
                  onClose();
                  playChime('click');
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                title="Посмотреть сданные проекты и оставить стикеры"
              >
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>Портфолио проектов</span>
              </button>
            )}
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: PROFILE & ABOUT ME */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {isEditing ? (
                /* EDIT FORM */
                <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Редактирование личного профиля</span>
                  </h3>

                  {/* Preset Avatar Selection */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Готовые стили аватаров (или загрузите свой):
                    </label>
                    <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                      {AVATAR_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatarUrl(preset)}
                          className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition cursor-pointer shrink-0 ${
                            avatarUrl === preset ? 'border-blue-600 ring-2 ring-blue-400' : 'border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Отображаемое имя:
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Ваше имя или никнейм"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:outline-hidden text-slate-900 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Роль / Должность:
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Например: Senior Systems Engineer"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:outline-hidden text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Специализация / Направление:
                      </label>
                      <input
                        type="text"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder="Например: Архитектура & Базы Данных"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:outline-hidden text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Текущий статус фокуса:
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:outline-hidden text-slate-900"
                      >
                        <option value="focus">⚡ В глубоком фокусе (Pomodoro)</option>
                        <option value="idle">⏳ Доступен для вопросов и спарринга</option>
                        <option value="break">☕ На перерыве</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      О себе & Профессиональный контекст:
                    </label>
                    <textarea
                      rows={4}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Расскажите о своем опыте, целях и инвариантах, над которыми работаете..."
                      className="w-full p-3 text-xs rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:outline-hidden text-slate-900 leading-relaxed resize-y"
                    />
                  </div>

                  {/* Social & External Links */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        GitHub URL / username:
                      </label>
                      <input
                        type="text"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/..."
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:outline-hidden text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Telegram:
                      </label>
                      <input
                        type="text"
                        value={telegramUrl}
                        onChange={(e) => setTelegramUrl(e.target.value)}
                        placeholder="@username"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:outline-hidden text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Сайт / Портфолио:
                      </label>
                      <input
                        type="text"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:outline-hidden text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center space-x-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Сохранение...' : 'Сохранить изменения'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* READ-ONLY PROFILE VIEW */
                <div className="space-y-6">
                  {/* Bio Card */}
                  <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>О себе и цели обучения</span>
                    </h3>
                    <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                      {bio || 'Пользователь пока не заполнил подробную информацию о себе.'}
                    </p>
                  </div>

                  {/* Links & Socials */}
                  {(githubUrl || telegramUrl || websiteUrl) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {githubUrl && (
                        <a
                          href={githubUrl.startsWith('http') ? githubUrl : `https://github.com/${githubUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-medium flex items-center space-x-1.5 transition"
                        >
                          <Github className="w-3.5 h-3.5" />
                          <span>GitHub</span>
                        </a>
                      )}
                      {telegramUrl && (
                        <a
                          href={telegramUrl.startsWith('http') ? telegramUrl : `https://t.me/${telegramUrl.replace(/^@/, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-sky-500 text-white hover:bg-sky-600 text-xs font-medium flex items-center space-x-1.5 transition"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Telegram</span>
                        </a>
                      )}
                      {websiteUrl && (
                        <a
                          href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-medium flex items-center space-x-1.5 transition"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Веб-сайт</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Learning Highlights */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>Стиль мышления & Восприятие</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {thinkingStyle === 'visual'
                          ? 'Визуальный (диаграммы, схемы, ментальные карты)'
                          : thinkingStyle === 'conceptual'
                          ? 'Концептуальный (от первых принципов и инвариантов)'
                          : thinkingStyle === 'practical'
                          ? 'Практический (быстрый переход к коду и тестам)'
                          : 'Инженерный (строгий анализ компромиссов и надежности)'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Главная цель спринта</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {targetGoal || 'Свободная реализация инвариантов и преодоление барьера чистого листа'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LEARNING TRAJECTORY & MODULES */}
          {activeTab === 'trajectory' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-blue-950 flex items-center space-x-1.5">
                    <Compass className="w-4 h-4 text-blue-600" />
                    <span>Интерактивная карта траектории</span>
                  </h4>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Все модули, зависимости и заметки отображаются на интерактивном DAG-графе. Наведите на блок на карте, чтобы раскрыть желтую линию со всеми комментариями и оставить свой стикер!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenTrajectory()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center space-x-1.5 shrink-0"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Открыть на DAG-карте</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Модули программы ({nodes.length})
                </h3>
                <span className="text-xs text-slate-500">
                  Освоено: <strong>{completedCount}</strong> из <strong>{nodes.length}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {nodes.map((node) => {
                  const isActive = node.status === 'active' || node.id === activeNodeId;
                  const isCompleted = node.status === 'completed';

                  return (
                    <div
                      key={node.id}
                      onClick={() => handleOpenTrajectory(node.id)}
                      className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 group shadow-2xs ${
                        isActive
                          ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40'
                          : isCompleted
                          ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-400'
                          : 'border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/20'
                      }`}
                      title="Кликните: открыть этот блок в DAG-графе со всеми комментариями и стикерами"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {node.sprint || node.phaseTitle || 'Модуль'}
                        </span>
                        <span className="text-[10px] text-blue-600 font-semibold group-hover:underline flex items-center space-x-1">
                          <span>Открыть в DAG</span>
                          <ChevronRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-0.5 transition" />
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-700">
                        {node.title}
                      </h4>

                      {node.subtitle && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {node.subtitle}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            {isOwnProfile ? 'Ваш профиль LearningOS' : `Профиль пользователя ${displayName}`}
          </span>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleOpenTrajectory()}
              className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition cursor-pointer flex items-center space-x-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Посмотреть траекторию обучения</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
