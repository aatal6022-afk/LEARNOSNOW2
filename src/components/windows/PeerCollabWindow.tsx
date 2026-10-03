import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Palette, 
  MessageSquare, 
  Layers, 
  Radio, 
  Share2, 
  Check, 
  Lock, 
  Unlock, 
  Tag, 
  Plus, 
  ExternalLink,
  BookOpen,
  Info,
  LogOut,
  Pencil,
  Ban,
  ShieldCheck,
  UserMinus,
  ShieldAlert,
  X,
  Save,
  Flame
} from 'lucide-react';
import { playChime } from '../../utils/audio.ts';
import { PeerPartner, DAGNode, LearningUnit, NoteItem, HabitItem, UserArtifact, CommunityRoom, CommunityRoomBan, ProfileNodeSnapshot } from '../../types.ts';
import { InfiniteWhiteboard } from '../whiteboard/InfiniteWhiteboard.tsx';
import { RoomChatTab } from '../community/RoomChatTab.tsx';
import { CommunityRoomsHub } from '../community/CommunityRoomsHub.tsx';
import { CommunityFeedTab } from '../community/CommunityFeedTab.tsx';
import { peerCollabSync } from '../../services/peerCollabSync.ts';
import { communityRoomService, POPULAR_CATEGORY_SUGGESTIONS } from '../../services/communityRoomService.ts';

interface PeerCollabWindowProps {
  partner?: PeerPartner | null;
  onPartnerMatched?: (partner: PeerPartner) => void;
  isSearchingBuddy?: boolean;
  onStartMatchmaking?: () => void;
  onDisconnectPartner?: () => void;
  initialTab?: string;
  activeUnitId?: string;
  activeUnit?: LearningUnit;
  onSelectUnit?: (unitId: string) => void;
  onOpenDag?: (nodeId?: string) => void;
  onAdoptProfileNode?: (snapshot: ProfileNodeSnapshot) => void;
  onStartSolo?: () => void;
  onSaveNote?: (title: string, content: string, tag: string) => void;
  onSaveArtifact?: (artifact: UserArtifact) => void;
  onLessonCompleted?: (unitId: string) => void;
  onSyncWithMainPlayer?: () => void;
  nodes?: DAGNode[];
  notes?: NoteItem[];
  habits?: HabitItem[];
  currentUser?: { uid: string; displayName: string; email: string; photoURL?: string } | null;
  isPreviewMode?: boolean;
}

const DEFAULT_OPEN_ROOM: CommunityRoom = {
  id: 'room-open-learning-lab',
  name: '⚡ Open Architecture & Learning Lab',
  description: 'Открытое пространство для совместного проектирования архитектурных диаграмм на бесконечной доске и обсуждения решений в чате.',
  bioMarkdown: '### Манифест и регламент группы\n- Свободный обмен идеями и декомпозиция сложных тем.\n- Проектирование инвариантов на общей бесконечной доске.\n- Взаимное ревью и открытые обсуждения.',
  category: 'Распределенные системы',
  tags: ['Архитектура', 'Практика', 'Инварианты', 'Доска'],
  isPrivate: false,
  creatorId: 'system',
  creatorName: 'Платформа LearningOS',
  createdAt: new Date().toISOString(),
  memberCount: 1,
  maxMembers: 100,
  activeTopic: 'Проектирование надежных систем',
};

export const PeerCollabWindow: React.FC<PeerCollabWindowProps> = ({
  partner,
  onPartnerMatched,
  onDisconnectPartner,
  activeUnitId,
  activeUnit,
  onSelectUnit,
  onOpenDag,
  onAdoptProfileNode,
  nodes,
  notes,
  habits,
  currentUser,
  initialTab,
  onSaveNote,
}) => {
  // Navigation inside Room & Community
  const normalizeTab = (tab?: string): 'whiteboard' | 'chat' | 'feed' | 'community' | 'info' => {
    if (tab === 'chat' || tab === 'debate') return 'chat';
    if (tab === 'feed' || tab === 'stream' || tab === 'posts') return 'feed';
    if (tab === 'community' || tab === 'rooms') return 'community';
    if (tab === 'info' || tab === 'manifesto') return 'info';
    return 'whiteboard'; // Default to Infinite Whiteboard
  };

  const [activeTab, setActiveTab] = useState<'whiteboard' | 'chat' | 'feed' | 'community' | 'info'>(
    normalizeTab(initialTab)
  );
  const [isCurrentUserBanned, setIsCurrentUserBanned] = useState(false);

  // Active Current Room
  const [currentRoom, setCurrentRoom] = useState<CommunityRoom>(() => {
    if (partner?.roomCode) {
      return {
        id: partner.roomCode,
        name: partner.targetGoal || activeUnit?.title ? `⚡ Группа: ${activeUnit?.title || 'Архитектура систем'}` : '⚡ Open Architecture & Learning Lab',
        description: 'Открытое пространство группы для совместного проектирования архитектурных диаграмм на бесконечной доске и обсуждения решений в чате.',
        bioMarkdown: '### Манифест и регламент группы\n- Свободный обмен идеями и декомпозиция сложных тем.\n- Проектирование инвариантов на общей бесконечной доске.\n- Взаимное ревью и открытые обсуждения.',
        category: partner.skillDomain || 'Распределенные системы',
        tags: ['Архитектура', 'Практика', 'Инварианты', 'Доска'],
        isPrivate: false,
        creatorId: partner.id || 'creator-1',
        creatorName: partner.name || 'Организатор группы',
        createdAt: new Date().toISOString(),
        memberCount: 8,
        maxMembers: 30,
        activeTopic: activeUnit?.title || 'Проектирование надежных систем',
      };
    }
    return DEFAULT_OPEN_ROOM;
  });

  const [copiedLink, setCopiedLink] = useState(false);

  // Sync Room with partner prop
  useEffect(() => {
    if (partner) {
      if (partner.roomCode) {
        peerCollabSync.setRoomId(partner.roomCode);
      }
      setCurrentRoom((prev) => ({
        ...prev,
        id: partner.roomCode || prev.id,
        name: partner.targetGoal || prev.name,
        category: partner.skillDomain || prev.category,
        creatorName: partner.name || prev.creatorName,
      }));
    }
  }, [partner]);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsCurrentUserBanned(false);
      return;
    }
    return communityRoomService.subscribeRoomBan(currentRoom.id, currentUser.uid, setIsCurrentUserBanned);
  }, [currentRoom.id, currentUser?.uid]);

  const handleSelectRoomFromCommunity = (room: CommunityRoom) => {
    setIsCurrentUserBanned(false);
    setCurrentRoom(room);
    peerCollabSync.setRoomId(room.id);
    setActiveTab('whiteboard');
    playChime('success');
  };

  const handleLeaveRoom = async (roomIdToLeave?: string) => {
    const targetRoomId = roomIdToLeave || currentRoom.id;
    const myUserId = currentUser?.uid || 'user-' + (localStorage.getItem('os_user_id') || 'guest');

    try {
      await communityRoomService.leaveRoom(targetRoomId, myUserId);
    } catch (err) {
      console.warn('Error leaving room:', err);
    }

    // Reset whiteboard and chat state immediately to default open room
    setCurrentRoom(DEFAULT_OPEN_ROOM);
    peerCollabSync.setRoomId(DEFAULT_OPEN_ROOM.id);
    setIsCurrentUserBanned(false);
    setActiveTab('community');
    playChime('click');
  };

  const myUserId = currentUser?.uid || 'user-' + (localStorage.getItem('os_user_id') || 'guest');
  const isOwner = currentRoom.creatorId === myUserId || currentRoom.creatorId === 'creator-1' || currentRoom.creatorId === 'system' || !currentRoom.creatorId;

  // Edit Room Form State
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [editForm, setEditForm] = useState({
    name: currentRoom.name,
    description: currentRoom.description,
    bioMarkdown: currentRoom.bioMarkdown || '',
    category: currentRoom.category,
    activeTopic: currentRoom.activeTopic || '',
    tags: (currentRoom.tags || []).join(', '),
  });
  const [isSavingRoom, setIsSavingRoom] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Banned members state
  const [bannedMembers, setBannedMembers] = useState<CommunityRoomBan[]>([]);
  const [isLoadingBans, setIsLoadingBans] = useState(false);

  // Sync edit form when currentRoom changes
  useEffect(() => {
    setEditForm({
      name: currentRoom.name,
      description: currentRoom.description,
      bioMarkdown: currentRoom.bioMarkdown || '',
      category: currentRoom.category,
      activeTopic: currentRoom.activeTopic || '',
      tags: (currentRoom.tags || []).join(', '),
    });
  }, [currentRoom]);

  // Load banned members
  useEffect(() => {
    if (activeTab === 'info' && isOwner && currentRoom.id !== DEFAULT_OPEN_ROOM.id) {
      setIsLoadingBans(true);
      communityRoomService.listBannedMembers(currentRoom.id, myUserId).then((res) => {
        if (res.success && res.members) {
          setBannedMembers(res.members);
        }
        setIsLoadingBans(false);
      });
    }
  }, [activeTab, isOwner, currentRoom.id, myUserId]);

  const handleSaveRoomDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.category.trim() || isSavingRoom) return;
    setIsSavingRoom(true);
    setEditError(null);

    const tagsArray = editForm.tags
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    try {
      const res = await communityRoomService.updateRoom(currentRoom.id, myUserId, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        bioMarkdown: editForm.bioMarkdown.trim(),
        category: editForm.category.trim(),
        activeTopic: editForm.activeTopic.trim(),
        tags: tagsArray.length > 0 ? tagsArray : currentRoom.tags,
      });

      if (res.success && res.room) {
        setCurrentRoom(res.room);
        setIsEditingRoom(false);
        playChime('success');
      } else {
        setEditError(res.error || 'Не удалось сохранить изменения');
        playChime('alert');
      }
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Ошибка при сохранении');
    } finally {
      setIsSavingRoom(false);
    }
  };

  const handleBanParticipant = async (memberId: string, memberName: string) => {
    if (!memberId || memberId === myUserId) return;
    try {
      const res = await communityRoomService.banRoomMember(currentRoom.id, myUserId, memberId);
      if (res.success && res.room) {
        setCurrentRoom(res.room);
        setBannedMembers((prev) => [
          ...prev.filter((b) => b.userId !== memberId),
          { userId: memberId, userName: memberName, bannedAt: new Date().toISOString() },
        ]);
        playChime('alert');
      }
    } catch (e) {
      console.warn('Error banning member:', e);
    }
  };

  const handleUnbanParticipant = async (memberId: string) => {
    try {
      const res = await communityRoomService.unbanMember(currentRoom.id, myUserId, memberId);
      if (res.success) {
        setBannedMembers((prev) => prev.filter((b) => b.userId !== memberId));
        if (res.room) setCurrentRoom(res.room);
        playChime('success');
      }
    } catch (e) {
      console.warn('Error unbanning member:', e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-gray-900 select-text overflow-hidden font-sans">
      {/* 1. TOP GOOGLE MINIMALIST HEADER */}
      <header className="h-14 px-5 bg-white border-b border-gray-200 flex items-center justify-between shrink-0 shadow-xs z-30">
        {/* Left: Room Badge & Title */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
            {currentRoom.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-sm text-gray-900 truncate">
                {currentRoom.name}
              </h2>
              {currentRoom.isPrivate ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1 shrink-0">
                  <Lock className="w-3 h-3 text-amber-600" />
                  <span>Закрытая</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1 shrink-0">
                  <Unlock className="w-3 h-3 text-emerald-600" />
                  <span>Комьюнити</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 truncate">
              Категория: {currentRoom.category} • Участников: {currentRoom.memberCount || 1}
            </p>
          </div>
        </div>

        {/* Center: Segmented Mode Switcher (Google Style) */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab('whiteboard');
              playChime('click');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'whiteboard'
                ? 'bg-white text-blue-600 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-blue-600" />
            <span>Бесконечная Доска</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('chat');
              playChime('click');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'chat'
                ? 'bg-white text-blue-600 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>Чат комнаты</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('feed');
              playChime('click');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'feed'
                ? 'bg-white text-orange-600 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Лента</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('community');
              playChime('click');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'community'
                ? 'bg-white text-blue-600 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Все Комнаты</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('info');
              playChime('click');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'info'
                ? 'bg-white text-blue-600 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>Инфо & Модерация</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          {currentRoom.id !== DEFAULT_OPEN_ROOM.id && (
            <button
              type="button"
              onClick={() => handleLeaveRoom()}
              className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 shadow-2xs"
              title="Покинуть текущую комнату и вернуться ко всем комнатам"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Выйти из комнаты</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/#room=${currentRoom.id}`);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
              playChime('click');
            }}
            className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium transition cursor-pointer flex items-center space-x-1.5 shadow-2xs"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-gray-500" />}
            <span>{copiedLink ? 'Ссылка скопирована' : 'Пригласить'}</span>
          </button>
        </div>
      </header>

      {/* 2. BODY CONTENT */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden bg-white">
        {activeTab === 'whiteboard' && (
          <div className="w-full h-full">
            <InfiniteWhiteboard
              key={currentRoom.id}
              roomId={currentRoom.id}
              roomName={currentRoom.name}
              currentUser={currentUser}
            />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="w-full h-full">
            <RoomChatTab
              room={currentRoom}
              currentUser={currentUser}
              activeUnit={activeUnit}
              onSelectUnit={onSelectUnit}
              onOpenDag={onOpenDag}
              onAdoptProfileNode={onAdoptProfileNode}
              onLeaveRoom={(leftId) => handleLeaveRoom(leftId)}
              nodes={nodes}
            />
          </div>
        )}

        {activeTab === 'feed' && (
          <div className="w-full h-full overflow-hidden bg-white">
            <CommunityFeedTab
              currentUser={currentUser}
              activeRoom={currentRoom}
              nodes={nodes}
              notes={notes}
              habits={habits}
              onSelectUnit={onSelectUnit}
              onOpenDag={onOpenDag}
              onEnterRoom={handleSelectRoomFromCommunity}
            />
          </div>
        )}

        {activeTab === 'community' && (
          <div className="w-full h-full overflow-y-auto p-6 bg-white">
            <div className="max-w-6xl mx-auto">
              <CommunityRoomsHub
                currentUser={currentUser}
                nodes={nodes}
                notes={notes}
                habits={habits}
                activeUnitId={activeUnitId}
                onSelectUnit={onSelectUnit}
                onOpenDag={onOpenDag}
                onSaveNote={onSaveNote}
                onEnterRoom={handleSelectRoomFromCommunity}
                onLeaveRoom={(leftId) => handleLeaveRoom(leftId)}
                activeRoomId={currentRoom.id}
              />
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="w-full h-full overflow-y-auto p-6 bg-[#fafbfc]">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header & Edit Room Card */}
              <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                      О пространстве комнаты
                    </span>
                    <h3 className="text-lg font-bold text-gray-900">{currentRoom.name}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
                      {currentRoom.description}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                      {currentRoom.category}
                    </span>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => setIsEditingRoom((prev) => !prev)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 border shadow-2xs ${
                          isEditingRoom
                            ? 'bg-gray-100 text-gray-700 border-gray-300'
                            : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                        }`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>{isEditingRoom ? 'Отмена' : 'Редактировать'}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-gray-500 border-t border-gray-100">
                  <span>Организатор: <strong className="text-gray-800">{currentRoom.creatorName}</strong></span>
                  <span>•</span>
                  <span>Лимит участников: <strong>{currentRoom.maxMembers || 30}</strong></span>
                  <span>•</span>
                  <span>Код комнаты: <strong className="font-mono text-gray-800">{currentRoom.id}</strong></span>
                </div>
              </div>

              {/* Edit Room Form */}
              {isEditingRoom && isOwner && (
                <form onSubmit={handleSaveRoomDetails} className="p-6 bg-white border border-blue-200 rounded-2xl shadow-sm space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <h4 className="font-bold text-sm text-gray-900 flex items-center space-x-2">
                      <Pencil className="w-4 h-4 text-blue-600" />
                      <span>Редактирование данных комнаты (Администратор)</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsEditingRoom(false)}
                      className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {editError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                      {editError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Название комнаты *</label>
                      <input
                        type="text"
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Категория *</label>
                      <input
                        type="text"
                        required
                        value={editForm.category}
                        onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Краткое описание</label>
                    <textarea
                      rows={2}
                      value={editForm.description}
                      onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-blue-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Активная тема обсуждения</label>
                      <input
                        type="text"
                        value={editForm.activeTopic}
                        onChange={(e) => setEditForm((f) => ({ ...f, activeTopic: e.target.value }))}
                        placeholder="Например: Проектирование кеша"
                        className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Теги (через запятую)</label>
                      <input
                        type="text"
                        value={editForm.tags}
                        onChange={(e) => setEditForm((f) => ({ ...f, tags: e.target.value }))}
                        placeholder="Архитектура, Доска, Практика"
                        className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Манифест и правила работы (Markdown)</label>
                    <textarea
                      rows={3}
                      value={editForm.bioMarkdown}
                      onChange={(e) => setEditForm((f) => ({ ...f, bioMarkdown: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsEditingRoom(false)}
                      className="px-4 py-2 rounded-xl text-xs text-gray-600 hover:bg-gray-100 cursor-pointer"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingRoom}
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingRoom ? 'Сохранение...' : 'Сохранить изменения'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Members Moderation List */}
              <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Участники комнаты ({currentRoom.members?.length || 1})</span>
                  </h4>
                  {isOwner && (
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      Режим администратора
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(currentRoom.members || [
                    { userId: currentRoom.creatorId, userName: currentRoom.creatorName, role: 'owner' as const, isOnline: true, avatar: currentRoom.creatorAvatar || '' }
                  ]).map((member) => {
                    const isMemberOwner = member.role === 'owner' || member.userId === currentRoom.creatorId;
                    return (
                      <div
                        key={member.userId}
                        className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.userName} className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {(member.userName || 'U').substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-semibold text-xs text-gray-900 block truncate">
                              {member.userName}
                            </span>
                            <span className="text-[10px] text-gray-500 block truncate">
                              {isMemberOwner ? '👑 Организатор' : 'Участник'}
                            </span>
                          </div>
                        </div>

                        {isOwner && !isMemberOwner && (
                          <button
                            type="button"
                            onClick={() => handleBanParticipant(member.userId, member.userName || member.name || 'Участник')}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold transition cursor-pointer flex items-center space-x-1 border border-rose-200 shrink-0"
                            title="Заблокировать в этой комнате"
                          >
                            <Ban className="w-3 h-3 text-rose-600" />
                            <span>Забанить</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Banned Members Section for Admin */}
              {isOwner && (
                <div className="p-6 bg-white border border-rose-200 rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                    <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center space-x-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span>Черный список & Заблокированные ({bannedMembers.length})</span>
                    </h4>
                  </div>

                  {isLoadingBans ? (
                    <p className="text-xs text-gray-400">Загрузка черного списка...</p>
                  ) : bannedMembers.length === 0 ? (
                    <p className="text-xs text-gray-500">В этой комнате нет заблокированных участников.</p>
                  ) : (
                    <div className="space-y-2">
                      {bannedMembers.map((banned) => (
                        <div
                          key={banned.userId}
                          className="p-3 rounded-xl border border-rose-100 bg-rose-50/40 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0">
                              <Ban className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-xs text-gray-900 block truncate">
                                {banned.userName || banned.userId}
                              </span>
                              <span className="text-[10px] text-gray-500 block truncate">
                                Заблокирован бессрочно
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleUnbanParticipant(banned.userId)}
                            className="px-3 py-1 rounded-lg bg-white hover:bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 cursor-pointer transition shadow-2xs"
                          >
                            Разблокировать
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Bio & Manifesto */}
              {currentRoom.bioMarkdown && (
                <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Манифест и правила работы</span>
                  </h4>
                  <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-xl border border-gray-200 font-sans">
                    {currentRoom.bioMarkdown}
                  </div>
                </div>
              )}

              {/* Tags Card */}
              <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Теги комнаты:</h4>
                <div className="flex flex-wrap gap-1.5">
                  {currentRoom.tags.map((tag, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-medium text-xs border border-gray-200 flex items-center space-x-1">
                      <Tag className="w-3 h-3 text-gray-500" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {isCurrentUserBanned && activeTab !== 'community' && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-white px-6 text-center">
            <Lock className="mb-3 h-7 w-7 text-rose-600" />
            <h3 className="text-sm font-bold text-gray-900">Доступ к группе заблокирован</h3>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-gray-500">Владелец удалил вас из группы и запретил повторное вступление.</p>
            <button type="button" onClick={() => setActiveTab('community')} className="mt-4 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">
              Перейти к списку групп
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
