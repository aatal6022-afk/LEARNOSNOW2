import React, { useState, useEffect, useMemo } from 'react';
import { 
  Flame, 
  MessageSquare, 
  Send, 
  Sparkles, 
  Camera, 
  BookOpen, 
  Check, 
  X, 
  Search, 
  Heart, 
  Lock, 
  Unlock, 
  Layers, 
  Filter, 
  Globe, 
  ArrowRight,
  ShieldCheck,
  UserPlus,
  Share2,
  FileText,
  Tag,
  Users
} from 'lucide-react';
import { playChime } from '../../utils/audio.ts';
import { CommunityRoom, CommunityRoomPost, DAGNode, LearningUnit, NoteItem, HabitItem, BlockGraphicSnapshot } from '../../types.ts';
import { communityRoomService } from '../../services/communityRoomService.ts';
import { BlockGraphicSnapshotCard } from '../learning/BlockGraphicSnapshotCard.tsx';
import { LEARNING_UNITS, INITIAL_DAG_NODES } from '../../data/initialData.ts';

interface CommunityFeedTabProps {
  currentUser?: { uid: string; displayName: string; email: string; photoURL?: string } | null;
  activeRoom?: CommunityRoom;
  nodes?: DAGNode[];
  notes?: NoteItem[];
  habits?: HabitItem[];
  onSelectUnit?: (unitId: string) => void;
  onOpenDag?: (nodeId?: string) => void;
  onEnterRoom?: (room: CommunityRoom) => void;
}

export const CommunityFeedTab: React.FC<CommunityFeedTabProps> = ({
  currentUser,
  activeRoom,
  nodes = [],
  notes = [],
  habits = [],
  onSelectUnit,
  onOpenDag,
  onEnterRoom,
}) => {
  const myUserId = currentUser?.uid || 'user-' + (localStorage.getItem('os_user_id') || 'guest');
  const myUserName = currentUser?.displayName || 'Студент';
  const myUserAvatar = currentUser?.photoURL || '';

  const [allRooms, setAllRooms] = useState<CommunityRoom[]>([]);
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all'); // 'all' or specific roomId
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // New Post State
  const [targetPostRoomId, setTargetPostRoomId] = useState<string>(activeRoom?.id || 'room-open-learning-lab');
  const [postText, setPostText] = useState('');
  const [pendingBlockSnapshot, setPendingBlockSnapshot] = useState<BlockGraphicSnapshot | null>(null);
  const [pendingNotes, setPendingNotes] = useState<NoteItem[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  // Modals
  const [isBlockPickerOpen, setIsBlockPickerOpen] = useState(false);
  const [blockSearch, setBlockSearch] = useState('');
  const [isNotePickerOpen, setIsNotePickerOpen] = useState(false);
  const [noteSearch, setNoteSearch] = useState('');
  const [activeViewingNote, setActiveViewingNote] = useState<NoteItem | null>(null);

  // Likes tracking
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  // PIN modal for private rooms
  const [pinModalRoom, setPinModalRoom] = useState<CommunityRoom | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Load all rooms & live subscribe
  const loadRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const rooms = await communityRoomService.listRooms({ includePrivate: true });
      setAllRooms(rooms);
    } catch (e) {
      console.warn('Error loading rooms for feed:', e);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    loadRooms();
    const unsub = communityRoomService.subscribeRooms((rooms) => {
      setAllRooms(rooms);
    });
    return unsub;
  }, []);

  // Update target post room if activeRoom changes
  useEffect(() => {
    if (activeRoom) {
      setTargetPostRoomId(activeRoom.id);
    }
  }, [activeRoom]);

  // Target room object for posting
  const targetRoom = useMemo(() => {
    return allRooms.find((r) => r.id === targetPostRoomId) || allRooms[0] || activeRoom;
  }, [allRooms, targetPostRoomId, activeRoom]);

  // Check if current user is member of the selected posting room
  const isMemberOfTargetRoom = useMemo(() => {
    if (!targetRoom) return false;
    if (targetRoom.id === 'room-open-learning-lab' || targetRoom.id === 'community_general') return true;
    if (targetRoom.creatorId === myUserId || targetRoom.creatorId === 'creator-1' || targetRoom.creatorId === 'system' || !targetRoom.creatorId) return true;
    return Boolean(targetRoom.members?.some((m) => m.userId === myUserId));
  }, [targetRoom, myUserId]);

  // Aggregate Feed Posts from all communities
  const feedPosts = useMemo(() => {
    const list: Array<CommunityRoomPost & { roomName: string; roomId: string; roomCategory: string; roomIsPrivate: boolean }> = [];
    
    allRooms.forEach((room) => {
      if (selectedRoomFilter !== 'all' && room.id !== selectedRoomFilter) return;

      const posts = room.feedPosts || [];
      posts.forEach((p) => {
        list.push({
          ...p,
          roomName: room.name,
          roomId: room.id,
          roomCategory: room.category,
          roomIsPrivate: room.isPrivate,
        });
      });
    });

    // Filter by search query
    let filtered = list;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((p) => 
        p.text.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q) ||
        p.roomName.toLowerCase().includes(q) ||
        (p.learningNode?.title && p.learningNode.title.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    filtered.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return filtered;
  }, [allRooms, selectedRoomFilter, searchQuery]);

  const handleJoinTargetRoom = async (room: CommunityRoom) => {
    if (room.isPrivate) {
      setPinModalRoom(room);
      setPinInput('');
      setPinError(null);
      return;
    }

    try {
      const res = await communityRoomService.joinRoom(room.id, {
        userId: myUserId,
        userName: myUserName,
        avatar: myUserAvatar,
      });
      if (res.success) {
        await loadRooms();
        playChime('success');
      } else {
        setPostError(res.error || 'Не удалось вступить в комнату');
      }
    } catch (e) {
      setPostError('Ошибка при вступлении в комнату');
    }
  };

  const handleVerifyPrivatePin = async () => {
    if (!pinModalRoom) return;
    try {
      const res = await communityRoomService.joinRoom(pinModalRoom.id, {
        userId: myUserId,
        userName: myUserName,
        avatar: myUserAvatar,
        accessCode: pinInput.trim(),
      });
      if (res.success) {
        setPinModalRoom(null);
        await loadRooms();
        playChime('success');
      } else {
        setPinError(res.error || 'Неверный PIN-код');
        playChime('alert');
      }
    } catch (e) {
      setPinError('Ошибка проверки кода доступа');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim() && !pendingBlockSnapshot && pendingNotes.length === 0) return;
    if (!targetRoom || isPosting) return;

    if (!isMemberOfTargetRoom) {
      setPostError(`Чтобы публиковать записи от лица сообщества «${targetRoom.name}», необходимо сначала вступить в него.`);
      playChime('alert');
      return;
    }

    setIsPosting(true);
    setPostError(null);

    try {
      const learningNodePayload = pendingBlockSnapshot ? {
        nodeId: pendingBlockSnapshot.nodeId || pendingBlockSnapshot.unitId,
        title: pendingBlockSnapshot.title,
        subtitle: pendingBlockSnapshot.subtitle,
        unitId: pendingBlockSnapshot.unitId,
        category: pendingBlockSnapshot.category,
        sprint: pendingBlockSnapshot.sprint,
        phase: pendingBlockSnapshot.phase || pendingBlockSnapshot.blockIndex,
        type: pendingBlockSnapshot.type,
        status: pendingBlockSnapshot.status,
        estimatedTimeMin: pendingBlockSnapshot.estimatedTimeMin,
        authorName: pendingBlockSnapshot.authorName,
        summarySnippet: pendingBlockSnapshot.summaryMarkdown || pendingBlockSnapshot.summary,
      } : undefined;

      const attachedNotesPayload = pendingNotes.length > 0 ? pendingNotes.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        tag: n.tag,
        createdAt: n.createdAt,
      })) : undefined;

      const res = await communityRoomService.postToFeed(targetRoom.id, {
        authorId: myUserId,
        authorName: myUserName,
        authorAvatar: myUserAvatar,
        text: postText.trim() || `📌 Прикреплен учебный блок «${pendingBlockSnapshot?.title || 'DAG Block'}»`,
        learningNode: learningNodePayload,
        attachedNotes: attachedNotesPayload,
      });

      if (res.success) {
        setPostText('');
        setPendingBlockSnapshot(null);
        setPendingNotes([]);
        await loadRooms();
        playChime('success');
      } else {
        setPostError(res.error || 'Не удалось опубликовать запись');
      }
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Ошибка публикации');
    } finally {
      setIsPosting(false);
    }
  };

  const handleToggleLike = (postId: string) => {
    setLikedPosts((prev) => {
      const next = !prev[postId];
      playChime(next ? 'success' : 'click');
      return { ...prev, [postId]: next };
    });
  };

  // Attach a DAG block snapshot from picker
  const handleSelectBlockSnapshot = (node: DAGNode) => {
    const unit = LEARNING_UNITS[node.unitId] || LEARNING_UNITS[node.id];
    const snapshot: BlockGraphicSnapshot = {
      unitId: unit ? unit.id : (node.unitId || node.id),
      nodeId: node.id,
      blockIndex: node.phase || 1,
      phase: node.phase || 1,
      title: node.title,
      subtitle: node.subtitle,
      category: node.category || unit?.category || 'Архитектура',
      sprint: node.sprint || `Спринт ${node.phase || 1}`,
      type: node.type || 'theory',
      status: node.status || 'active',
      durationMin: node.estimatedTimeMin || 45,
      estimatedTimeMin: node.estimatedTimeMin || 45,
      summaryMarkdown: unit?.summaryMarkdown || unit?.theoryMarkdown,
      starterCode: unit?.projectTask?.starterCode || unit?.starterCode,
      projectTitle: unit?.projectTask?.title || unit?.projectTitle,
      projectFilename: unit?.projectTask?.defaultFilename || unit?.projectFilename,
      authorName: node.authorName || unit?.authorName || myUserName,
    };

    setPendingBlockSnapshot(snapshot);
    setIsBlockPickerOpen(false);
    playChime('success');
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] text-slate-900 select-text overflow-hidden font-sans">
      {/* 1. TOP SUB-HEADER: Filters & Community Rooms Selector */}
      <div className="px-6 py-3.5 bg-white border-b border-gray-200 shrink-0 shadow-xs z-20 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold shadow-2xs">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500/20" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <span>Единая Лента Сообществ & Практики</span>
                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                  Live Feed
                </span>
              </h2>
              <p className="text-[11px] text-gray-500">
                Смотрите ленты любых сообществ без ограничений. Публикуйте от лица сообществ, в которых состоите.
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск по ленте постов и блоков..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Room Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3 text-gray-400" />
            <span>Лента:</span>
          </span>

          <button
            type="button"
            onClick={() => {
              setSelectedRoomFilter('all');
              playChime('click');
            }}
            className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer flex items-center space-x-1.5 border ${
              selectedRoomFilter === 'all'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>Все сообщества</span>
            <span className="text-[10px] opacity-80 font-mono">({feedPosts.length})</span>
          </button>

          {allRooms.map((room) => {
            const isSelected = selectedRoomFilter === room.id;
            const isMember = room.id === 'room-open-learning-lab' || room.creatorId === myUserId || room.members?.some((m) => m.userId === myUserId);
            return (
              <button
                key={`filter-room-${room.id}`}
                type="button"
                onClick={() => {
                  setSelectedRoomFilter(room.id);
                  setTargetPostRoomId(room.id);
                  playChime('click');
                }}
                className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer flex items-center space-x-1.5 border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {room.isPrivate ? <Lock className="w-3 h-3 text-amber-500" /> : <Unlock className="w-3 h-3 text-emerald-500" />}
                <span className="truncate max-w-[150px]">{room.name}</span>
                {isMember && (
                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1 rounded" title="Вы участник">
                    ✓
                  </span>
                )}
                {room.feedPosts?.length ? (
                  <span className="text-[10px] opacity-75 font-mono">({room.feedPosts.length})</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. MAIN SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* 3. POST CREATION CARD */}
          <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-3 relative">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                {myUserAvatar ? (
                  <img src={myUserAvatar} alt={myUserName} className="w-7 h-7 rounded-full object-cover border border-gray-200" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    {myUserName.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <span className="font-bold text-xs text-gray-900 block">{myUserName}</span>
                  <div className="flex items-center space-x-1.5 text-[10px] text-gray-500">
                    <span>Публикация от лица:</span>
                    {isMemberOfTargetRoom ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Участник</span>
                      </span>
                    ) : (
                      <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-amber-600" />
                        <span>Не участник</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Target Room Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-gray-500 hidden sm:inline">Сообщество:</span>
                <select
                  value={targetPostRoomId}
                  onChange={(e) => {
                    setTargetPostRoomId(e.target.value);
                    setPostError(null);
                  }}
                  className="text-xs font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer max-w-[240px] truncate"
                >
                  {allRooms.map((r) => {
                    const isMem = r.id === 'room-open-learning-lab' || r.creatorId === myUserId || r.members?.some((m) => m.userId === myUserId);
                    return (
                      <option key={r.id} value={r.id}>
                        {isMem ? '✓ ' : '🔒 '} {r.name}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {postError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center justify-between">
                <span>{postError}</span>
                <button type="button" onClick={() => setPostError(null)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* If NOT member of target room, show friendly join barrier */}
            {!isMemberOfTargetRoom ? (
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/90 to-orange-50/60 border border-amber-200 space-y-3">
                <div className="flex items-start space-x-2.5">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 leading-relaxed">
                    <strong>Вы не состоите в сообществе «{targetRoom?.name}».</strong>
                    <p className="text-[11px] text-amber-800/90 mt-0.5">
                      Лента открыта для свободного чтения. Но чтобы опубликовать запись от лица этого сообщества, необходимо сначала вступить в него.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-amber-200/60">
                  <span className="text-[11px] text-amber-800 font-medium">
                    Участников: {targetRoom?.memberCount || 1} · {targetRoom?.isPrivate ? 'Закрытая группа' : 'Открытое комьюнити'}
                  </span>
                  <button
                    type="button"
                    onClick={() => targetRoom && handleJoinTargetRoom(targetRoom)}
                    className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Вступить в сообщество, чтобы постить</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreatePost} className="space-y-3">
                <textarea
                  rows={3}
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder={`Поделитесь инсайтом, решением задачи или прикрепите DAG-блок в ленту «${targetRoom?.name}»...`}
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:outline-none resize-none leading-relaxed"
                />

                {/* Attached 1-to-1 DAG Block Preview (Exact visual replica of the node in the DAG graph) */}
                {pendingBlockSnapshot && (
                  <div className="relative p-3 bg-sky-50/50 rounded-2xl border border-sky-200 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-sky-800">
                      <span className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-sky-600" />
                        <span>Прикрепленный узел графа (1:1 копия дизайна из DAG):</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setPendingBlockSnapshot(null)}
                        className="text-gray-400 hover:text-rose-600 transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Открепить блок</span>
                      </button>
                    </div>

                    {/* 1-TO-1 EXACT DAG GRAPH BLOCK CARD */}
                    <div className="flex justify-start">
                      <BlockGraphicSnapshotCard
                        snapshot={pendingBlockSnapshot}
                        onSelectUnit={onSelectUnit}
                        onOpenDag={onOpenDag}
                      />
                    </div>
                  </div>
                )}

                {/* Attached Notes Chips */}
                {pendingNotes.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                      <span>Прикрепленные конспекты:</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {pendingNotes.map((note) => (
                        <div
                          key={note.id}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-medium flex items-center space-x-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-600" />
                          <span className="truncate max-w-[180px]">📝 {note.title}</span>
                          <button
                            type="button"
                            onClick={() => setPendingNotes((prev) => prev.filter((n) => n.id !== note.id))}
                            className="text-amber-500 hover:text-rose-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Toolbar & Publish Button */}
                <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsBlockPickerOpen(true);
                        playChime('click');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 border shadow-2xs ${
                        pendingBlockSnapshot
                          ? 'bg-sky-100 text-sky-800 border-sky-300'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-sky-50 hover:text-sky-700'
                      }`}
                      title="Прикрепить графический блок из курса в виде точной копии узла графа"
                    >
                      <Camera className="w-3.5 h-3.5 text-sky-600" />
                      <span>{pendingBlockSnapshot ? 'Блок прикреплен' : '+ Прикрепить блок (@block)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsNotePickerOpen(true);
                        playChime('click');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white text-gray-700 border border-gray-200 hover:bg-amber-50 hover:text-amber-700 text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                      title="Прикрепить конспект из блокнота"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                      <span>+ Конспект (@note)</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={(!postText.trim() && !pendingBlockSnapshot && pendingNotes.length === 0) || isPosting}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isPosting ? 'Публикация...' : 'Опубликовать в ленту'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* 4. FEED POSTS STREAM */}
          <div className="space-y-4">
            {feedPosts.length === 0 ? (
              <div className="p-12 bg-white border border-gray-200 rounded-2xl text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto shadow-2xs">
                  <Flame className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-gray-900">В этой ленте пока нет записей</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Опубликуйте первую учебную запись с инвариантом или прикрепленным DAG-блоком!
                </p>
              </div>
            ) : (
              feedPosts.map((post) => {
                const isLiked = Boolean(likedPosts[post.id]);
                const likesCount = (post.likes || 0) + (isLiked ? 1 : 0);

                // Check if post has attached block snapshot or learningNode
                const blockSnapshot: BlockGraphicSnapshot | undefined = post.learningNode ? {
                  unitId: post.learningNode.unitId || post.learningNode.nodeId,
                  nodeId: post.learningNode.nodeId,
                  blockIndex: post.learningNode.phase || 1,
                  phase: post.learningNode.phase || 1,
                  title: post.learningNode.title,
                  subtitle: post.learningNode.subtitle,
                  category: post.learningNode.category || post.roomCategory,
                  sprint: post.learningNode.sprint || `Спринт ${post.learningNode.phase || 1}`,
                  type: post.learningNode.type || 'theory',
                  status: post.learningNode.status || 'active',
                  estimatedTimeMin: post.learningNode.estimatedTimeMin || 45,
                  durationMin: post.learningNode.estimatedTimeMin || 45,
                  summaryMarkdown: post.learningNode.summarySnippet,
                  authorName: post.learningNode.authorName || post.authorName,
                } : undefined;

                return (
                  <article
                    key={post.id}
                    className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-3.5 transition hover:border-gray-300"
                  >
                    {/* Post Header: Author & Community Tag */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        {post.authorAvatar ? (
                          <img src={post.authorAvatar} alt={post.authorName} className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {post.authorName.substring(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-gray-900 truncate">
                              {post.authorName}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Недавно'}
                            </span>
                          </div>

                          {/* Community Badge */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRoomFilter(post.roomId);
                              setTargetPostRoomId(post.roomId);
                              playChime('click');
                            }}
                            className="mt-0.5 text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-100 flex items-center space-x-1 cursor-pointer truncate max-w-[240px]"
                            title={`Показать все посты сообщества «${post.roomName}»`}
                          >
                            <span>Сообщество: {post.roomName}</span>
                          </button>
                        </div>
                      </div>

                      {post.roomIsPrivate && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1 shrink-0">
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>Закрытая</span>
                        </span>
                      )}
                    </div>

                    {/* Post Body Text */}
                    {post.text && (
                      <div className="text-xs leading-relaxed text-gray-800 whitespace-pre-line font-sans">
                        {post.text}
                      </div>
                    )}

                    {/* Attached 1-to-1 DAG Block (Exact visual copy of the block from the DAG graph) */}
                    {blockSnapshot && (
                      <div className="pt-1">
                        <div className="text-[10px] font-bold text-sky-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-sky-600" />
                          <span>Прикрепленный учебный блок:</span>
                        </div>
                        <BlockGraphicSnapshotCard
                          snapshot={blockSnapshot}
                          onSelectUnit={onSelectUnit}
                          onOpenDag={onOpenDag}
                        />
                      </div>
                    )}

                    {/* Attached Notes (if any) */}
                    {post.attachedNotes && post.attachedNotes.length > 0 && (
                      <div className="pt-2 border-t border-gray-100 space-y-1.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Прикрепленные конспекты:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {post.attachedNotes.map((note) => (
                            <div
                              key={note.id}
                              onClick={() => {
                                setActiveViewingNote(note as NoteItem);
                                playChime('click');
                              }}
                              className="p-2.5 rounded-xl bg-amber-50/60 hover:bg-amber-100/70 border border-amber-200/80 transition cursor-pointer flex items-center justify-between group"
                            >
                              <div className="flex items-center space-x-2 min-w-0">
                                <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <div className="min-w-0">
                                  <span className="font-semibold text-xs text-amber-950 block truncate group-hover:text-amber-800">
                                    {note.title}
                                  </span>
                                  <span className="text-[10px] text-amber-700 block truncate">
                                    {note.tag || '#конспект'} · Открыть
                                  </span>
                                </div>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-700 transition shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Post Actions Footer */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => handleToggleLike(post.id)}
                          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                            isLiked
                              ? 'bg-rose-50 text-rose-600 font-bold'
                              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                          <span>{likesCount}</span>
                        </button>
                      </div>

                      {/* Direct jump to room button */}
                      <button
                        type="button"
                        onClick={() => {
                          const r = allRooms.find((rm) => rm.id === post.roomId);
                          if (r && onEnterRoom) {
                            onEnterRoom(r);
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-xs transition cursor-pointer flex items-center space-x-1"
                      >
                        <span>Перейти в комнату</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 5. MODAL: DAG BLOCK PICKER */}
      {isBlockPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-xl w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2 text-sky-700 font-bold text-sm">
                <Camera className="w-4 h-4" />
                <span>Выбрать учебный блок для публикации (@block)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsBlockPickerOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск по блокам программы..."
                value={blockSearch}
                onChange={(e) => setBlockSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 custom-scrollbar pr-1">
              {(nodes.length > 0 ? nodes : INITIAL_DAG_NODES).filter((n) => !blockSearch.trim() || n.title.toLowerCase().includes(blockSearch.toLowerCase()) || (n.subtitle && n.subtitle.toLowerCase().includes(blockSearch.toLowerCase()))).map((node) => (
                <button
                  key={`pick-block-${node.id}`}
                  type="button"
                  onClick={() => handleSelectBlockSnapshot(node)}
                  className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-sky-300 hover:bg-sky-50/50 transition cursor-pointer flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded">
                        {node.sprint || `Блок ${node.phase || 1}`}
                      </span>
                      <h4 className="font-bold text-xs text-gray-900 truncate group-hover:text-sky-700">
                        {node.title}
                      </h4>
                    </div>
                    {node.subtitle && (
                      <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                        {node.subtitle}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-sky-600 transition shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: NOTE PICKER */}
      {isNotePickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-xl w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm">
                <BookOpen className="w-4 h-4" />
                <span>Прикрепить конспект из блокнота (@note)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsNotePickerOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск по конспектам..."
                value={noteSearch}
                onChange={(e) => setNoteSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 custom-scrollbar pr-1">
              {notes.filter((n) => !noteSearch.trim() || n.title.toLowerCase().includes(noteSearch.toLowerCase())).map((note) => (
                <button
                  key={`pick-note-${note.id}`}
                  type="button"
                  onClick={() => {
                    if (!pendingNotes.some((n) => n.id === note.id)) {
                      setPendingNotes((prev) => [...prev, note]);
                    }
                    setIsNotePickerOpen(false);
                    playChime('success');
                  }}
                  className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 transition cursor-pointer flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-3">
                    <h4 className="font-bold text-xs text-gray-900 truncate group-hover:text-amber-800">
                      📝 {note.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                      {note.content}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded shrink-0">
                    {note.tag || '#конспект'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: NOTE VIEWER */}
      {activeViewingNote && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>{activeViewingNote.title}</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveViewingNote(null)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-slate-800 leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap font-sans">
              {activeViewingNote.content}
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: PIN VERIFICATION */}
      {pinModalRoom && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Код доступа (PIN)</span>
              </h3>
              <button
                type="button"
                onClick={() => setPinModalRoom(null)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Введите 4-значный PIN или код доступа для сообщества «{pinModalRoom.name}».
            </p>

            {pinError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                {pinError}
              </div>
            )}

            <input
              type="password"
              placeholder="Введите PIN..."
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full p-2.5 text-center tracking-widest text-lg font-mono rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:outline-none"
            />

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setPinModalRoom(null)}
                className="px-4 py-2 rounded-xl text-xs text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleVerifyPrivatePin}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer shadow-2xs"
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
