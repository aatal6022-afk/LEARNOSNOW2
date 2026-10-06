import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, 
  MessageSquare, 
  Check, 
  Copy, 
  Trash2, 
  Users, 
  Sparkles, 
  FileText, 
  Clock, 
  Pin, 
  X, 
  AtSign, 
  BookOpen, 
  ExternalLink, 
  Search, 
  Tag, 
  Layers, 
  StickyNote, 
  Paperclip,
  Zap,
  Camera,
  LayoutGrid,
  UserCircle2,
  Briefcase,
  Gauge,
  Flame,
  ShieldCheck,
  MessageCircleMore,
  Globe,
  Compass,
  LogOut,
  Ban,
  Smile
} from 'lucide-react';
import { playChime } from '../../utils/audio.ts';
import { peerCollabSync } from '../../services/peerCollabSync.ts';
import { communityRoomService, RoomChatMessage } from '../../services/communityRoomService.ts';
import { CommunityRoom, LearningUnit, NoteItem, DAGNode, BlockGraphicSnapshot, UserProfile, ProfileWallPost, PartnerRequest, ProfileNodeSnapshot } from '../../types.ts';
import { INITIAL_NOTES, INITIAL_DAG_NODES, LEARNING_UNITS } from '../../data/initialData.ts';
import { BlockGraphicSnapshotCard } from '../learning/BlockGraphicSnapshotCard.tsx';
import { auth } from '../../firebase.ts';
import { socialProfileService } from '../../services/socialProfileService.ts';
import { StickerPickerPopover } from '../common/StickerPickerPopover.tsx';
import { AdminSticker, stickerService } from '../../services/stickerService.ts';

export interface NoteAttachment {
  id: string;
  title: string;
  content: string;
  tag: string;
  createdAt?: string;
}

interface RoomChatTabProps {
  room: CommunityRoom;
  currentUser?: { uid: string; displayName: string; email: string; photoURL?: string } | null;
  activeUnit?: LearningUnit;
  onSelectUnit?: (unitId: string) => void;
  onOpenDag?: (nodeId?: string) => void;
  onAdoptProfileNode?: (snapshot: ProfileNodeSnapshot) => void;
  onLeaveRoom?: (roomId: string) => void;
  nodes?: DAGNode[];
  defaultChannel?: 'general' | 'room';
}

export const RoomChatTab: React.FC<RoomChatTabProps> = ({
  room,
  currentUser,
  activeUnit,
  onSelectUnit,
  onOpenDag,
  onAdoptProfileNode,
  onLeaveRoom,
  nodes = [],
  defaultChannel,
}) => {
  const effectiveRoomId = room.id;
  const effectiveRoomName = room.name;
  const effectiveCategory = room.category;

  // Capture material and project details from LearningUnit or DAGNode
  const buildUnitSnapshot = (unit?: LearningUnit, node?: DAGNode): BlockGraphicSnapshot | undefined => {
    let targetUnit = unit;
    if (!targetUnit && node) {
      targetUnit = LEARNING_UNITS[node.unitId] || LEARNING_UNITS[node.id];
    }

    if (targetUnit) {
      return {
        unitId: targetUnit.id,
        blockIndex: targetUnit.blockIndex || (node ? node.phase : undefined),
        title: targetUnit.title || node?.title || 'Учебный блок',
        category: targetUnit.category || node?.category || node?.phaseTitle || 'Обучение',
        authorName: targetUnit.authorName || node?.authorName || '@learning_os',
        durationMin: targetUnit.durationSec ? Math.round(targetUnit.durationSec / 60) : (node?.estimatedTimeMin || 25),
        summaryMarkdown: targetUnit.summaryMarkdown?.slice(0, 6000) || node?.subtitle,
        projectTitle: targetUnit.projectTask?.title || node?.pairTask?.title || node?.adaptiveProjectTitle || 'Практический проект блока',
        projectDescription: targetUnit.projectTask?.description || node?.artifactRequirement || node?.subtitle,
        projectRequirements: targetUnit.projectTask?.requirements || (node?.artifactRequirement ? [node.artifactRequirement] : undefined),
        projectFilename: targetUnit.projectTask?.defaultFilename || 'solution.ts',
        starterCode: targetUnit.projectTask?.starterCode,
        capturedAt: new Date().toISOString()
      };
    }

    if (node) {
      return {
        unitId: node.unitId || node.id,
        blockIndex: node.phase,
        title: node.title,
        category: node.category || node.phaseTitle || 'Блок программы',
        authorName: node.authorName || '@mentor',
        durationMin: node.estimatedTimeMin || 30,
        summaryMarkdown: node.subtitle ? `# ${node.title}\n\n${node.subtitle}` : undefined,
        projectTitle: node.adaptiveProjectTitle || node.pairTask?.title || 'Практическое задание блока',
        projectDescription: node.artifactRequirement || node.subtitle,
        projectRequirements: node.artifactRequirement ? [node.artifactRequirement] : undefined,
        capturedAt: new Date().toISOString()
      };
    }

    return undefined;
  };

  const getInitialMessages = (targetRoomId: string): RoomChatMessage[] => {
    try {
      const saved = localStorage.getItem(`room_chat_messages_${targetRoomId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error loading chat from localStorage', e);
    }
    if (targetRoomId === 'community_general') {
      return [
        {
          id: 'msg-general-welcome-1',
          senderId: 'system',
          senderName: 'Сообщество LearningOS',
          text: `Добро пожаловать в Общий чат сообщества! 🌍\nЗдесь собираются все студенты и инженеры платформы. Обсуждайте архитектуру, делитесь идеями, задавайте вопросы по любым блокам и находите напарников для парного спарринга.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          pinned: true,
        },
        {
          id: 'msg-general-welcome-2',
          senderId: 'system',
          senderName: 'Бот сообщества',
          text: `💡 Вы можете прикреплять конспекты через кнопку «Конспект» (@note) или делиться снимком текущего изучаемого блока через «Снимок блока» (@block).`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          attachedBlockSnapshot: buildUnitSnapshot(activeUnit)
        }
      ];
    }
    return [
      {
        id: 'msg-welcome-1',
        senderId: room.creatorId || 'system',
        senderName: room.creatorName || 'Организатор комнаты',
        senderAvatar: room.creatorAvatar,
        text: `Добро пожаловать в учебную комнату «${room.name}»! 🚀\nЗдесь можно задавать вопросы по теме комнаты, прикреплять конспекты через @note и делиться снимком текущего блока.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        pinned: true,
      },
      {
        id: 'msg-welcome-2',
        senderId: 'system',
        senderName: 'Бот комнаты',
        text: `💡 Посмотрите текущий изучаемый блок в этой группе:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attachedBlockSnapshot: buildUnitSnapshot(activeUnit)
      }
    ];
  };

  // 1. Messages State
  const [messages, setMessages] = useState<RoomChatMessage[]>(() => getInitialMessages(effectiveRoomId));

  // Sync messages when channel changes
  useEffect(() => {
    setMessages(getInitialMessages(effectiveRoomId));
  }, [effectiveRoomId]);

  const [inputMessage, setInputMessage] = useState('');
  const [pendingNotes, setPendingNotes] = useState<NoteAttachment[]>([]);
  const [pendingBlockSnapshot, setPendingBlockSnapshot] = useState<BlockGraphicSnapshot | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  
  // Note / Block / Sticker mention popover state
  const [showMentionPopover, setShowMentionPopover] = useState(false);
  const [mentionType, setMentionType] = useState<'note' | 'block' | 'sticker' | 'all'>('all');
  const [mentionFilter, setMentionFilter] = useState('');
  
  const [isNotePickerModalOpen, setIsNotePickerModalOpen] = useState(false);
  const [notePickerSearch, setNotePickerSearch] = useState('');
  const [isBlockPickerModalOpen, setIsBlockPickerModalOpen] = useState(false);
  const [blockPickerSearch, setBlockPickerSearch] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [wallDraftText, setWallDraftText] = useState('');
  const [wallDraftKind, setWallDraftKind] = useState<ProfileWallPost['kind']>('debug');
  const [wallDraftNodeId, setWallDraftNodeId] = useState<string>('');
  const [wallDraftTaskId, setWallDraftTaskId] = useState<string>('');
  const [wallDraftSnippet, setWallDraftSnippet] = useState('');
  const [wallDraftLogs, setWallDraftLogs] = useState('');
  const [partnerRequests, setPartnerRequests] = useState<PartnerRequest[]>([]);
  const [profileSyncStatus, setProfileSyncStatus] = useState<'local' | 'syncing' | 'synced' | 'error'>('local');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [viewingNodeSnapshot, setViewingNodeSnapshot] = useState<ProfileNodeSnapshot | null>(null);
  
  // Active reading modal for opened note
  const [activeViewingNote, setActiveViewingNote] = useState<NoteAttachment | null>(null);
  const [copiedNoteContent, setCopiedNoteContent] = useState(false);
  const [showParticipantsSidebar, setShowParticipantsSidebar] = useState(false);
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);
  const [allStickers, setAllStickers] = useState<AdminSticker[]>(() => stickerService.getAllStickers());

  useEffect(() => {
    const unsub = stickerService.subscribeStickers((list) => {
      setAllStickers(list);
    });
    return () => unsub();
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const myUserId = currentUser?.uid || 'user-' + (localStorage.getItem('os_user_id') || 'guest');
  const myUserName = currentUser?.displayName || 'Студент';
  const myUserAvatar = currentUser?.photoURL || '';
  const canSync = Boolean(currentUser?.uid && auth.currentUser?.uid === currentUser.uid);

  const participants = useMemo(() => {
    const map = new Map<string, { uid: string; displayName: string; avatar?: string; role: string; specialty: string; bio: string; status: 'focus' | 'idle' | 'break'; currentNodeIds: string[]; }>();

    if (currentUser) {
      map.set(myUserId, {
        uid: myUserId,
        displayName: myUserName,
        avatar: myUserAvatar,
        role: 'Учащийся',
        specialty: 'Не указана',
        bio: '',
        status: 'idle',
        currentNodeIds: nodes.filter((node) => node.status === 'active').map((node) => node.id),
      });
    }

    (room.members || []).forEach((member) => {
      if (!member.userId) return;
      map.set(member.userId, {
        uid: member.userId,
        displayName: member.userName || member.name || 'Участник',
        avatar: member.avatar,
        role: member.role || 'Member',
        specialty: 'Не указана',
        bio: '',
        status: 'idle',
        currentNodeIds: [],
      });
    });

    messages.forEach((msg) => {
      if (!msg.senderId || map.has(msg.senderId)) return;
      map.set(msg.senderId, {
        uid: msg.senderId,
        displayName: msg.senderName,
        avatar: msg.senderAvatar,
        role: 'Learner',
        specialty: 'Не указана',
        bio: '',
        status: 'idle',
        currentNodeIds: [],
      });
    });

    if (!map.has(myUserId) && currentUser) {
      map.set(myUserId, {
        uid: myUserId,
        displayName: myUserName,
        avatar: myUserAvatar,
        role: 'Учащийся',
        specialty: 'Не указана',
        bio: '',
        status: 'idle',
        currentNodeIds: nodes.filter((node) => node.status === 'active').map((node) => node.id),
      });
    }

    return Array.from(map.values());
  }, [room.members, messages, currentUser, myUserId, myUserName, myUserAvatar, activeUnit?.id, nodes]);

  const makeProfile = (seed: { uid: string; displayName: string; avatar?: string; role: string; specialty: string; bio: string; status: 'focus' | 'idle' | 'break'; currentNodeIds: string[] }): UserProfile => {
    const completedCount = seed.uid === myUserId ? nodes.filter((node) => node.status === 'completed').length : 0;
    return {
      uid: seed.uid,
      displayName: seed.displayName,
      avatar: seed.avatar,
      title: seed.role,
      specialty: seed.specialty,
      bio: seed.bio,
      status: seed.status,
      ringProgress: seed.uid === myUserId && nodes.length > 0 ? Math.round((completedCount / nodes.length) * 100) : 0,
      currentNodeIds: seed.currentNodeIds,
      currentNodes: [],
      partnerRequestStatus: 'none',
      wallPosts: [],
    };
  };

  const [profileMap, setProfileMap] = useState<Record<string, UserProfile>>(() => {
    const baseMap: Record<string, UserProfile> = {};
    participants.forEach((participant) => {
      baseMap[participant.uid] = makeProfile(participant);
    });

    try {
      const saved = localStorage.getItem(`learnos_public_profile_${myUserId}`);
      if (saved && baseMap[myUserId]) {
        const parsed = JSON.parse(saved) as Partial<UserProfile>;
        baseMap[myUserId] = { ...baseMap[myUserId], ...parsed, wallPosts: [], pairTask: undefined, partnerUid: undefined };
      }
    } catch (e) {
      console.warn('Failed to load local profile draft', e);
    }

    return baseMap;
  });

  useEffect(() => {
    try {
      const ownProfile = profileMap[myUserId];
      if (ownProfile) {
        localStorage.setItem(`learnos_public_profile_${myUserId}`, JSON.stringify({
          displayName: ownProfile.displayName,
          title: ownProfile.title,
          specialty: ownProfile.specialty,
          bio: ownProfile.bio,
        }));
      }
    } catch (e) {
      console.warn('Failed to save local profile draft', e);
    }
  }, [profileMap, myUserId]);

  const selectedProfile = selectedProfileId ? profileMap[selectedProfileId] || null : null;

  const currentProfile = profileMap[myUserId] || makeProfile({
    uid: myUserId,
    displayName: myUserName,
    avatar: myUserAvatar,
    role: 'Учащийся',
    specialty: 'Не указана',
    bio: '',
    status: nodes.some((node) => node.status === 'active') ? 'focus' : 'idle',
    currentNodeIds: nodes.filter((node) => node.status === 'active').map((node) => node.id),
  });

  const activePartnerRequest = partnerRequests.find((request) =>
    request.status === 'accepted' && (request.fromUserId === myUserId || request.toUserId === myUserId)
  );
  const activePartnerUid = activePartnerRequest
    ? activePartnerRequest.fromUserId === myUserId ? activePartnerRequest.toUserId : activePartnerRequest.fromUserId
    : null;
  const activePartnerProfile = activePartnerUid ? profileMap[activePartnerUid] || null : null;
  const selectedPartnerRequest = selectedProfileId
    ? partnerRequests.find((request) =>
      request.fromUserId === myUserId && request.toUserId === selectedProfileId ||
      request.toUserId === myUserId && request.fromUserId === selectedProfileId
    )
    : undefined;
  const incomingPartnerRequests = partnerRequests.filter((request) => request.toUserId === myUserId && request.status === 'pending');

  const participantIds = participants.map((participant) => participant.uid).filter((uid) => uid && uid !== 'system');
  const participantKey = Array.from(new Set([
    ...participantIds,
    ...partnerRequests.flatMap((request) => [request.fromUserId, request.toUserId]),
    myUserId,
  ])).sort().join('|');

  const selectedNodeCards: ProfileNodeSnapshot[] = selectedProfile
    ? selectedProfile.currentNodes?.length
      ? selectedProfile.currentNodes
      : selectedProfile.currentNodeIds.map((nodeId) => {
        const localNode = nodes.find((node) => node.id === nodeId);
        return {
          nodeId,
          title: localNode?.title || 'Активный учебный узел',
          subtitle: localNode?.subtitle,
          unitId: localNode?.unitId,
        };
      })
    : [];

  useEffect(() => {
    setProfileMap((previous) => {
      let updated = previous;
      participants.forEach((participant) => {
        if (updated[participant.uid]) return;
        if (updated === previous) updated = { ...previous };
        updated[participant.uid] = makeProfile(participant);
      });
      if (!updated[myUserId]) {
        if (updated === previous) updated = { ...previous };
        updated[myUserId] = makeProfile({
          uid: myUserId,
          displayName: myUserName,
          avatar: myUserAvatar,
          role: 'Учащийся',
          specialty: 'Не указана',
          bio: '',
          status: 'idle',
          currentNodeIds: nodes.filter((node) => node.status === 'active').map((node) => node.id),
        });
      }
      return updated;
    });
  }, [participants, myUserId, myUserName, myUserAvatar, nodes]);

  useEffect(() => {
    if (!canSync) {
      setProfileSyncStatus('local');
      return;
    }

    const unsubscribeRequests = socialProfileService.subscribePartnerRequests(myUserId, (requests) => {
      setPartnerRequests(requests);
    });
    return unsubscribeRequests;
  }, [canSync, myUserId]);

  useEffect(() => {
    if (!canSync) return;
    const unsubscribeProfiles = participantKey.split('|').filter(Boolean).map((uid) =>
      socialProfileService.subscribeProfile(uid, (cloudProfile) => {
        if (!cloudProfile) return;
        setProfileMap((previous) => {
          const fallback = participants.find((participant) => participant.uid === uid);
          const base = previous[uid] || makeProfile(fallback || {
            uid,
            displayName: 'Участник',
            role: 'Учащийся',
            specialty: 'Не указана',
            bio: '',
            status: 'idle',
            currentNodeIds: [],
          });
          if (!base) return previous;
          const merged: UserProfile = {
            ...base,
            ...cloudProfile,
            displayName: cloudProfile.displayName || base.displayName,
            title: cloudProfile.title || base.title,
            specialty: cloudProfile.specialty || base.specialty,
            bio: cloudProfile.bio ?? base.bio,
            ringProgress: typeof cloudProfile.ringProgress === 'number' ? cloudProfile.ringProgress : base.ringProgress,
            currentNodeIds: Array.isArray(cloudProfile.currentNodeIds) ? cloudProfile.currentNodeIds : base.currentNodeIds,
            currentNodes: Array.isArray(cloudProfile.currentNodes) ? cloudProfile.currentNodes : base.currentNodes,
            wallPosts: base.wallPosts || [],
          };
          if (JSON.stringify(previous[uid]) === JSON.stringify(merged)) return previous;
          return { ...previous, [uid]: merged };
        });
      })
    );
    return () => unsubscribeProfiles.forEach((unsubscribe) => unsubscribe());
  }, [canSync, participantKey]);

  useEffect(() => {
    if (!canSync || !currentUser) return;
    socialProfileService.publishIdentity({
      uid: currentUser.uid,
      displayName: myUserName,
      avatar: myUserAvatar || undefined,
    }).catch((error) => {
      console.warn('Public profile identity sync failed:', error);
      setProfileSyncStatus('error');
    });
  }, [canSync, currentUser?.uid, myUserName, myUserAvatar]);

  useEffect(() => {
    if (!canSync || !selectedProfileId) return;
    return socialProfileService.subscribeWallPosts(selectedProfileId, (wallPosts) => {
      setProfileMap((previous) => {
        const profile = previous[selectedProfileId];
        if (!profile || JSON.stringify(profile.wallPosts) === JSON.stringify(wallPosts)) return previous;
        return { ...previous, [selectedProfileId]: { ...profile, wallPosts } };
      });
    });
  }, [canSync, selectedProfileId]);

  const buildContextPairTask = (targetProfile: UserProfile) => {
    const nodeId = targetProfile.currentNodeIds[0] || currentProfile.currentNodeIds[0] || nodes.find((node) => node.status === 'active')?.id || 'root-node';
    const nodeTitle = nodes.find((node) => node.id === nodeId)?.title || activeUnit?.title || 'Ключевой узел';
    return {
      id: `pair-${Date.now()}`,
      title: `Парная ветка: ${nodeTitle}`,
      nodeId,
      nodeTitle,
      brief: `Общая задача для ${myUserName} и ${targetProfile.displayName}: по очереди объяснить узел, выполнить практику и сверить критерии результата.`,
    };
  };

  const handleProfileOpen = (uid: string) => {
    setSelectedProfileId(uid);
    playChime('click');
  };

  const handleSendPartnerRequest = async (targetProfile: UserProfile) => {
    if (!targetProfile || targetProfile.uid === myUserId || isSendingRequest) return;
    if (!canSync) {
      setProfileError('Войдите в аккаунт Firebase, чтобы отправить синхронизируемую заявку.');
      return;
    }

    const existingRequest = partnerRequests.find((request) =>
      request.fromUserId === myUserId && request.toUserId === targetProfile.uid && request.status !== 'rejected'
    );
    if (existingRequest) return;

    if (activePartnerRequest && activePartnerUid !== targetProfile.uid) {
      setProfileError('У вас уже есть активный напарник. Завершите текущую пару перед новой заявкой.');
      return;
    }

    setIsSendingRequest(true);
    setProfileError(null);
    try {
      const pairTask = buildContextPairTask(targetProfile);
      await socialProfileService.sendPartnerRequest({
        fromUserId: myUserId,
        toUserId: targetProfile.uid,
        message: `Предлагаю вместе пройти узел «${pairTask.nodeTitle}».`,
        pairTask,
      });
      setProfileSyncStatus('synced');
      playChime('success');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Не удалось отправить заявку.');
      setProfileSyncStatus('error');
      playChime('alert');
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleRespondToPartnerRequest = async (request: PartnerRequest, status: 'accepted' | 'rejected') => {
    if (!canSync) return;
    setProfileError(null);
    try {
      await socialProfileService.respondToPartnerRequest(request.id, myUserId, status);
      setProfileSyncStatus('synced');
      playChime(status === 'accepted' ? 'success' : 'click');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Не удалось обновить заявку.');
      setProfileSyncStatus('error');
      playChime('alert');
    }
  };

  const handleSaveProfileEdit = async (updatedProfile: UserProfile) => {
    if (updatedProfile.uid !== myUserId) return;
    const nextProfile = { ...updatedProfile, displayName: updatedProfile.displayName.trim() || myUserName };
    setProfileMap((previous) => ({ ...previous, [myUserId]: nextProfile }));
    setProfileError(null);

    if (!canSync) {
      setProfileSyncStatus('local');
      setProfileError('Изменения сохранены в этом браузере. Войдите в аккаунт Firebase для синхронизации между устройствами.');
      return;
    }

    setIsSavingProfile(true);
    setProfileSyncStatus('syncing');
    try {
      const currentNodes = currentProfile.currentNodes?.length
        ? currentProfile.currentNodes
        : currentProfile.currentNodeIds.map((nodeId) => {
            const node = nodes.find((item) => item.id === nodeId);
            return {
              nodeId,
              title: node?.title || 'Активный учебный узел',
              subtitle: node?.subtitle,
              unitId: node?.unitId,
            };
          });

      await socialProfileService.savePublicProfile({
        uid: myUserId,
        displayName: nextProfile.displayName,
        avatar: nextProfile.avatar,
        title: nextProfile.title,
        specialty: nextProfile.specialty,
        bio: nextProfile.bio,
        status: nextProfile.status,
        ringProgress: currentProfile.ringProgress,
        currentNodeIds: currentProfile.currentNodeIds,
        currentNodes,
      });
      setProfileSyncStatus('synced');
    } catch (error) {
      setProfileSyncStatus('error');
      setProfileError(error instanceof Error ? error.message : 'Не удалось сохранить профиль в облако.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCreateWallPost = async () => {
    if (!selectedProfile || !wallDraftText.trim() || isCreatingPost) return;
    if (!canSync) {
      setProfileError('Войдите в аккаунт Firebase, чтобы публиковать посты для других пользователей.');
      return;
    }

    setIsCreatingPost(true);
    setProfileError(null);
    try {
      await socialProfileService.createWallPost(selectedProfile.uid, {
        nodeId: wallDraftNodeId || undefined,
        taskId: wallDraftTaskId || undefined,
        kind: wallDraftKind,
        authorId: myUserId,
        authorName: myUserName,
        title: wallDraftKind === 'debug' ? 'Я застрял' : wallDraftKind === 'optimization' ? 'Оптимизация решения' : 'Заметка на полях',
        text: wallDraftText.trim(),
        snippet: wallDraftSnippet.trim() || undefined,
        logs: wallDraftLogs.trim() || undefined,
        createdAt: new Date().toISOString(),
      });
      setWallDraftText('');
      setWallDraftSnippet('');
      setWallDraftLogs('');
      setWallDraftKind('debug');
      setProfileSyncStatus('synced');
      playChime('success');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Не удалось опубликовать запись.');
      setProfileSyncStatus('error');
      playChime('alert');
    } finally {
      setIsCreatingPost(false);
    }
  };

  const nodeOptions = useMemo(() => {
    const fallback = [
      { id: activeUnit?.id || nodes[0]?.id || 'root-node', title: activeUnit?.title || nodes[0]?.title || 'Текущий узел' },
    ];
    return [...(nodes || []).map((node) => ({ id: node.id, title: node.title })), ...fallback].filter((option, idx, arr) => arr.findIndex((item) => item.id === option.id) === idx);
  }, [nodes, activeUnit]);

  const isEditingOwnProfile = selectedProfile && selectedProfile.uid === myUserId;

  // Load user's notebook notes
  const userNotes: NoteItem[] = useMemo(() => {
    try {
      const saved = localStorage.getItem('learning_os_notes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error loading notes:', e);
    }
    return INITIAL_NOTES;
  }, []);

  // List of all course DAG nodes (or initial fallback)
  const courseNodes: DAGNode[] = useMemo(() => {
    if (nodes && nodes.length > 0) return nodes;
    return INITIAL_DAG_NODES;
  }, [nodes]);

  // Active DAG node or active learning unit
  const activeDagNode = useMemo(() => {
    return courseNodes.find((n) => n.status === 'active') ||
      courseNodes.find((n) => n.id === activeUnit?.id || n.unitId === activeUnit?.id) ||
      courseNodes[0];
  }, [courseNodes, activeUnit]);

  // Filtered blocks for mention autocomplete
  const filteredMentionBlocks = useMemo(() => {
    const q = mentionFilter.trim().toLowerCase();
    if (!q) {
      return [...courseNodes].sort((a, b) => {
        if (a.id === activeDagNode?.id) return -1;
        if (b.id === activeDagNode?.id) return 1;
        return 0;
      });
    }
    return courseNodes.filter(
      (node) =>
        node.title.toLowerCase().includes(q) ||
        (node.subtitle && node.subtitle.toLowerCase().includes(q)) ||
        (node.phaseTitle && node.phaseTitle.toLowerCase().includes(q)) ||
        (node.category && node.category.toLowerCase().includes(q)) ||
        (node.sprint && node.sprint.toLowerCase().includes(q))
    );
  }, [courseNodes, mentionFilter, activeDagNode]);

  // Filtered notes for mention autocomplete
  const filteredMentionNotes = useMemo(() => {
    const q = mentionFilter.trim().toLowerCase();
    if (!q) return userNotes;
    return userNotes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.tag.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
    );
  }, [userNotes, mentionFilter]);

  // Filtered stickers for mention autocomplete
  const filteredMentionStickers = useMemo(() => {
    const q = mentionFilter.trim().toLowerCase();
    const active = allStickers.filter((s) => s.isActive !== false);
    if (!q) return active;
    return active.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    );
  }, [allStickers, mentionFilter]);

  // Realtime Firestore Chat Subscription
  useEffect(() => {
    const unsubscribeFirestore = communityRoomService.subscribeChatMessages(effectiveRoomId, (firestoreMsgs) => {
      if (firestoreMsgs.length > 0) {
        setMessages((prev) => {
          const map = new Map<string, RoomChatMessage>();
          prev.forEach(m => map.set(m.id, m));
          firestoreMsgs.forEach(m => map.set(m.id, m));
          return Array.from(map.values());
        });
      }
    });

    return () => {
      unsubscribeFirestore();
    };
  }, [effectiveRoomId]);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`room_chat_messages_${effectiveRoomId}`, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat', e);
    }
  }, [messages, effectiveRoomId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to real-time WebRTC broadcasts from peerCollabSync
  useEffect(() => {
    const unsub = peerCollabSync.subscribeActions((action) => {
      if (action.actionType === 'room_chat_message' && action.payload?.message) {
        const incomingRoomId = action.payload.roomId || room.id;
        if (incomingRoomId === effectiveRoomId) {
          const incomingMsg = action.payload.message as RoomChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === incomingMsg.id)) return prev;
            playChime('click');
            return [...prev, incomingMsg];
          });
        }
      }
    });
    return () => unsub();
  }, [effectiveRoomId, room.id]);

  // Detect "@" / "@note" / "@block" / "@sticker" typing in input
  const handleInputChange = (val: string) => {
    setInputMessage(val);

    const lastAtIndex = val.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = val.substring(lastAtIndex + 1);
      if (!textAfterAt.includes('\n')) {
        setShowMentionPopover(true);
        const lower = textAfterAt.toLowerCase();
        if (lower.startsWith('block') || lower.startsWith('unit') || lower.startsWith('урок') || lower.startsWith('блок')) {
          setMentionType('block');
          setMentionFilter(textAfterAt.replace(/^(block|unit|урок|блок)[:\s]*/i, '').trim());
        } else if (lower.startsWith('note') || lower.startsWith('конспект') || lower.startsWith('заметк')) {
          setMentionType('note');
          setMentionFilter(textAfterAt.replace(/^(note|конспект|заметк)[:\s]*/i, '').trim());
        } else if (lower.startsWith('sticker') || lower.startsWith('стикер') || lower.startsWith('смайл')) {
          setMentionType('sticker');
          setMentionFilter(textAfterAt.replace(/^(sticker|стикер|смайл)[:\s]*/i, '').trim());
        } else {
          setMentionType('all');
          setMentionFilter(textAfterAt.trim());
        }
        return;
      }
    }
    setShowMentionPopover(false);
  };

  const extractTextFromEditor = (element: HTMLElement | null): string => {
    if (!element) return '';
    let result = '';
    
    const traverse = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.tagName === 'IMG' && el.getAttribute('data-sticker-id')) {
          const id = el.getAttribute('data-sticker-id');
          const name = el.getAttribute('data-sticker-name') || '';
          result += `[sticker:${id}:${name}]`;
        } else if (el.tagName === 'BR') {
          result += '\n';
        } else if (el.tagName === 'DIV' || el.tagName === 'P') {
          if (result.length > 0 && !result.endsWith('\n')) {
            result += '\n';
          }
          el.childNodes.forEach(traverse);
        } else {
          el.childNodes.forEach(traverse);
        }
      }
    };

    element.childNodes.forEach(traverse);
    return result;
  };

  const insertStickerIntoEditor = (sticker: AdminSticker) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();

    const sel = window.getSelection();
    let range: Range | null = null;
    if (sel && sel.rangeCount > 0) {
      const curRange = sel.getRangeAt(0);
      if (editor.contains(curRange.commonAncestorContainer)) {
        range = curRange;
      }
    }

    if (!range) {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }

    // Delete any active text selection
    range.deleteContents();

    // Create sticker image element rendered right inside the input field
    const img = document.createElement('img');
    img.src = sticker.imageUrl;
    img.alt = `[sticker:${sticker.id}:${sticker.name}]`;
    img.title = sticker.name;
    img.setAttribute('data-sticker-id', sticker.id);
    img.setAttribute('data-sticker-name', sticker.name);
    img.className = 'inline-block w-12 h-12 sm:w-14 sm:h-14 max-w-[3.5rem] max-h-[3.5rem] align-middle mx-1.5 select-none cursor-default drop-shadow-sm object-contain sticker-render-crisp [image-rendering:-webkit-optimize-contrast] [image-rendering:crisp-edges]';
    img.contentEditable = 'false';

    const space = document.createTextNode('\u00A0');

    range.insertNode(space);
    range.insertNode(img);

    // Move cursor after the space
    range.setStartAfter(space);
    range.setEndAfter(space);
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }

    const text = extractTextFromEditor(editor);
    setInputMessage(text);
    playChime('click');
    setIsStickerPickerOpen(false);
  };

  const handleEditorInput = () => {
    const text = extractTextFromEditor(editorRef.current);
    handleInputChange(text);
  };

  const handleSelectMentionSticker = (sticker: AdminSticker) => {
    insertStickerIntoEditor(sticker);
    setShowMentionPopover(false);
  };

  const handleSelectMentionNote = (note: NoteItem) => {
    const attachment: NoteAttachment = {
      id: note.id,
      title: note.title,
      content: note.content,
      tag: note.tag,
      createdAt: note.createdAt,
    };

    if (!pendingNotes.some((n) => n.id === note.id)) {
      setPendingNotes((prev) => [...prev, attachment]);
    }

    const lastAtIndex = inputMessage.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const beforeAt = inputMessage.substring(0, lastAtIndex);
      setInputMessage(`${beforeAt}@note: «${note.title}» `);
      if (editorRef.current) {
        editorRef.current.innerText = `${beforeAt}@note: «${note.title}» `;
      }
    } else {
      setInputMessage((prev) => `${prev} @note: «${note.title}» `);
      if (editorRef.current) {
        editorRef.current.innerText = `${editorRef.current.innerText} @note: «${note.title}» `;
      }
    }

    setShowMentionPopover(false);
    setIsNotePickerModalOpen(false);
    playChime('click');
    editorRef.current?.focus();
  };

  const handleAttachBlockSnapshot = (targetNode?: DAGNode, targetUnit?: LearningUnit) => {
    const chosenNode = targetNode || activeDagNode;
    const chosenUnit = targetUnit || (chosenNode?.unitId ? LEARNING_UNITS[chosenNode.unitId] : activeUnit);
    const snapshot = buildUnitSnapshot(chosenUnit, chosenNode);
    if (!snapshot) return;

    setPendingBlockSnapshot(snapshot);

    const lastAtIndex = inputMessage.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const beforeAt = inputMessage.substring(0, lastAtIndex);
      setInputMessage(`${beforeAt}@block[${snapshot.title}] `);
      if (editorRef.current) {
        editorRef.current.innerText = `${beforeAt}@block[${snapshot.title}] `;
      }
    } else if (!inputMessage.trim()) {
      setInputMessage(`Посмотрите графический снимок блока: @block[${snapshot.title}] `);
      if (editorRef.current) {
        editorRef.current.innerText = `Посмотрите графический снимок блока: @block[${snapshot.title}] `;
      }
    } else {
      setInputMessage((prev) => `${prev.trimEnd()} @block[${snapshot.title}] `);
      if (editorRef.current) {
        editorRef.current.innerText = `${editorRef.current.innerText.trimEnd()} @block[${snapshot.title}] `;
      }
    }

    setShowMentionPopover(false);
    setIsBlockPickerModalOpen(false);
    playChime('success');
    editorRef.current?.focus();
  };

  const handleAttachCurrentBlockSnapshot = (unitToShare?: LearningUnit) => {
    handleAttachBlockSnapshot(undefined, unitToShare || activeUnit);
  };

  const handleRemovePendingBlock = () => {
    setPendingBlockSnapshot(null);
    playChime('click');
  };

  const handleRemovePendingNote = (noteId: string) => {
    setPendingNotes((prev) => prev.filter((n) => n.id !== noteId));
    playChime('click');
  };

  const renderMessageTextWithMentions = (text: string, isMe: boolean) => {
    if (!text) return null;

    // Matches @block[...], @block: «...», @note[...], @note: «...», [sticker:id:name], [sticker:id], :[sticker:id]:
    const tokenRegex = /(@block\[(.*?)\]|@block:\s*«(.*?)»|@note\[(.*?)\]|@note:\s*«(.*?)»|\[sticker:[^\]]+\]|:\[sticker:[^\]]+\]:)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    const stickerList = allStickers.length > 0 ? allStickers : stickerService.getAllStickers();

    // Check if the message is ONLY a single sticker (standalone)
    const singleStickerMatch = text.trim().match(/^\[sticker:([^:]+?)(?::([^\]]+?))?\]$/);
    if (singleStickerMatch) {
      const stkId = singleStickerMatch[1].trim();
      const stkName = singleStickerMatch[2]?.trim() || '';
      const foundStk = stickerList.find(
        (s) => s.id === stkId || (stkName && s.name.toLowerCase() === stkName.toLowerCase()) || s.name.toLowerCase() === stkId.toLowerCase()
      );
      if (foundStk) {
        return (
          <div className="py-1.5">
            <img
              src={foundStk.imageUrl}
              alt={foundStk.name}
              title={foundStk.name}
              className="max-w-[200px] max-h-[200px] sm:max-w-[240px] sm:max-h-[240px] object-contain drop-shadow-md hover:scale-105 transition-transform duration-150 cursor-pointer sticker-render-crisp [image-rendering:-webkit-optimize-contrast] [image-rendering:crisp-edges]"
              loading="eager"
              decoding="sync"
              onClick={() => playChime('click')}
            />
          </div>
        );
      }
    }

    while ((match = tokenRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const fullMatch = match[0];

      if (fullMatch.startsWith('@block')) {
        const blockMatch = fullMatch.match(/@block\[(.*?)\]|@block:\s*«(.*?)»/);
        const blockTitle = blockMatch ? (blockMatch[1] || blockMatch[2] || '').trim() : '';

        const matchedNode = courseNodes.find(
          (n) => n.title.toLowerCase() === blockTitle.toLowerCase() ||
                 blockTitle.toLowerCase().includes(n.title.toLowerCase())
        );
        const targetUnitId = matchedNode?.unitId || matchedNode?.id || activeUnit?.id || 'unit-1';

        parts.push(
          <span
            key={`block-${match.index}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectUnit) {
                onSelectUnit(targetUnitId);
                playChime('success');
              }
            }}
            title="Перейти к изучению этого блока"
            className={`inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold transition cursor-pointer shadow-2xs border select-none ${
              isMe
                ? 'bg-sky-500/30 text-sky-100 hover:bg-sky-500/50 border-sky-400/40'
                : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border-sky-200'
            }`}
          >
            <Camera className="w-3 h-3 text-sky-500 shrink-0" />
            <span className="truncate max-w-[200px]">{blockTitle}</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
          </span>
        );
      } else if (fullMatch.startsWith('@note')) {
        const noteMatch = fullMatch.match(/@note\[(.*?)\]|@note:\s*«(.*?)»/);
        const noteTitle = noteMatch ? (noteMatch[1] || noteMatch[2] || '').trim() : '';

        const matchedNote = userNotes.find(
          (n) => n.title.toLowerCase() === noteTitle.toLowerCase() ||
                 noteTitle.toLowerCase().includes(n.title.toLowerCase())
        );

        parts.push(
          <span
            key={`note-${match.index}`}
            onClick={(e) => {
              e.stopPropagation();
              if (matchedNote) {
                handleOpenNoteViewer({
                  id: matchedNote.id,
                  title: matchedNote.title,
                  content: matchedNote.content,
                  tag: matchedNote.tag,
                  createdAt: matchedNote.createdAt,
                });
              }
            }}
            title="Открыть конспект"
            className={`inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold transition cursor-pointer shadow-2xs border select-none ${
              isMe
                ? 'bg-indigo-500/30 text-indigo-100 hover:bg-indigo-500/50 border-indigo-400/40'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border-indigo-200'
            }`}
          >
            <BookOpen className="w-3 h-3 text-indigo-500 shrink-0" />
            <span className="truncate max-w-[180px]">📝 {noteTitle}</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
          </span>
        );
      } else if (fullMatch.includes('[sticker:')) {
        const stkMatch = fullMatch.match(/\[sticker:([^:]+?)(?::([^\]]+?))?\]/);
        const stickerId = stkMatch ? stkMatch[1].trim() : '';
        const stickerName = stkMatch && stkMatch[2] ? stkMatch[2].trim() : '';

        const foundStk = stickerList.find(
          (s) => s.id === stickerId || (stickerName && s.name.toLowerCase() === stickerName.toLowerCase()) || s.name.toLowerCase() === stickerId.toLowerCase()
        );

        if (foundStk) {
          // Telegram-style prominent sticker in message
          parts.push(
            <img
              key={`stk-inline-${match.index}`}
              src={foundStk.imageUrl}
              alt={foundStk.name}
              title={foundStk.name}
              className="inline-block w-12 h-12 sm:w-14 sm:h-14 max-w-[3.5rem] max-h-[3.5rem] align-middle mx-1.5 transition-transform duration-150 hover:scale-115 select-none shrink-0 drop-shadow-sm object-contain sticker-render-crisp [image-rendering:-webkit-optimize-contrast] [image-rendering:crisp-edges]"
              loading="eager"
              decoding="sync"
            />
          );
        } else {
          // If image is still resolving, render a clean fallback
          parts.push(
            <span
              key={`stk-fallback-${match.index}`}
              className="inline-block text-[1.4em] mx-[2px] select-none align-middle"
              title={stickerName || stickerId}
            >
              🎨
            </span>
          );
        }
      } else {
        parts.push(fullMatch);
      }

      lastIndex = match.index + fullMatch.length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return <>{parts}</>;
  };

  const handleSendMessage = async () => {
    const rawText = (editorRef.current ? extractTextFromEditor(editorRef.current) : inputMessage).trim();
    if (!rawText && pendingNotes.length === 0 && !pendingBlockSnapshot) return;

    const newMsg: RoomChatMessage = {
      id: 'msg-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      senderId: myUserId,
      senderName: myUserName,
      senderAvatar: myUserAvatar,
      text: rawText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachedNotes: pendingNotes.length > 0 ? [...pendingNotes] : undefined,
      attachedBlockSnapshot: pendingBlockSnapshot || undefined,
    };

    // Optimistically add to UI
    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
    setPendingNotes([]);
    setPendingBlockSnapshot(null);
    setShowMentionPopover(false);
    playChime('click');

    // 1. Save to Firestore
    communityRoomService.sendChatMessage(effectiveRoomId, {
      senderId: newMsg.senderId,
      senderName: newMsg.senderName,
      senderAvatar: newMsg.senderAvatar,
      text: newMsg.text,
      timestamp: newMsg.timestamp,
      attachedNotes: newMsg.attachedNotes,
      attachedBlockSnapshot: newMsg.attachedBlockSnapshot,
    }).catch(err => console.warn('Chat Firestore save err:', err));

    // 2. Broadcast via WebRTC sync to active peers
    peerCollabSync.broadcastAction('room_chat_message', { message: newMsg, roomId: effectiveRoomId });
  };

  const handleSelectSticker = async (sticker: AdminSticker, mode: 'insert' | 'send' = 'insert') => {
    if (mode === 'send') {
      await handleSendSticker(sticker);
      return;
    }

    // Insert directly into text inside the rich WYSIWYG editor
    insertStickerIntoEditor(sticker);
  };

  const handleSendSticker = async (sticker: AdminSticker) => {
    const newMsg: RoomChatMessage = {
      id: 'msg-stk-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      senderId: myUserId,
      senderName: myUserName,
      senderAvatar: myUserAvatar,
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachedSticker: {
        id: sticker.id,
        name: sticker.name,
        imageUrl: sticker.imageUrl,
        category: sticker.category,
      },
    };

    setMessages((prev) => [...prev, newMsg]);
    setIsStickerPickerOpen(false);
    playChime('click');

    // Save to Firestore
    communityRoomService.sendChatMessage(effectiveRoomId, {
      senderId: newMsg.senderId,
      senderName: newMsg.senderName,
      senderAvatar: newMsg.senderAvatar,
      text: '',
      timestamp: newMsg.timestamp,
      attachedSticker: newMsg.attachedSticker,
    }).catch(err => console.warn('Chat Firestore save err:', err));

    // WebRTC sync
    peerCollabSync.broadcastAction('room_chat_message', { message: newMsg, roomId: effectiveRoomId });
  };

  const handleCopyMessage = (msg: RoomChatMessage) => {
    navigator.clipboard.writeText(msg.text);
    setCopiedMsgId(msg.id);
    setTimeout(() => setCopiedMsgId(null), 2000);
    playChime('click');
  };

  const handleOpenNoteViewer = (note: NoteAttachment) => {
    setActiveViewingNote(note);
    setCopiedNoteContent(false);
    playChime('click');
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-900 select-text font-sans relative overflow-hidden">
      {/* 1. COMPACT CONTEXTUAL UTILITY TOOLBAR */}
      <div className="h-12 px-3 sm:px-4 border-b border-slate-200/90 bg-white flex items-center justify-between shrink-0 z-20 shadow-2xs gap-2">
        <div className="flex items-center space-x-2.5 text-xs min-w-0">
          <div className="flex items-center space-x-2 px-2.5 py-1 bg-blue-50 text-blue-800 rounded-lg border border-blue-200/80 font-bold shrink-0">
            <MessageSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate max-w-[150px] sm:max-w-[220px]">{room.name}</span>
          </div>

          <span className="text-slate-300 hidden md:inline">·</span>
          <span className="text-slate-500 text-xs truncate hidden md:inline">
            {effectiveCategory}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Share Block Snapshot button */}
          <button
            type="button"
            onClick={() => {
              setIsBlockPickerModalOpen(true);
              playChime('click');
            }}
            title="Выбрать или прикрепить снимок блока (@block)"
            className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-medium transition cursor-pointer flex items-center space-x-1.5 border border-sky-200/80"
          >
            <Camera className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">Снимок блока</span>
          </button>

          {/* Attach Note button */}
          <button
            type="button"
            onClick={() => {
              setIsNotePickerModalOpen(true);
              playChime('click');
            }}
            title="Прикрепить конспект из блокнота (@note)"
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer flex items-center space-x-1.5 border border-slate-200"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Конспект</span>
          </button>

          {/* Participants toggle button */}
          <button
            type="button"
            onClick={() => {
              setShowParticipantsSidebar((prev) => !prev);
              playChime('click');
            }}
            title={showParticipantsSidebar ? 'Скрыть участников' : 'Показать участников'}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center space-x-1.5 border ${
              showParticipantsSidebar
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{participants.length}</span>
          </button>

          {/* Leave Room button */}
          {room.id !== 'community_general' && onLeaveRoom && (
            <button
              type="button"
              onClick={async () => {
                const effectiveUserId = myUserId || currentUser?.uid || 'user-guest';
                await communityRoomService.leaveRoom(room.id, effectiveUserId);
                onLeaveRoom?.(room.id);
                playChime('click');
              }}
              title="Покинуть эту комнату"
              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 border border-rose-200 shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden md:inline">Покинуть</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. CHAT BODY WITH INTEGRATED INPUT & OPTIONAL SIDEBAR */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Main Chat Column */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50/50">
          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 space-y-4 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-400">
                <MessageSquare className="w-10 h-10 stroke-[1.5]" />
                <p className="text-xs max-w-sm leading-relaxed">
                  В этой комнате еще нет сообщений. Напишите первым или прикрепите конспект!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === myUserId;
                const isSystem = msg.senderId === 'system';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex items-start justify-center my-2">
                      <div className="max-w-xl w-full p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] text-indigo-600 font-semibold uppercase tracking-wider">
                          <span className="flex items-center space-x-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{msg.senderName}</span>
                          </span>
                          <span className="text-slate-400 font-normal font-mono text-[10px]">{msg.timestamp}</span>
                        </div>
                        {msg.text && (
                          <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                            {renderMessageTextWithMentions(msg.text, false)}
                          </div>
                        )}

                        {/* Graphic Block Snapshot inside System Message */}
                        {msg.attachedBlockSnapshot && (
                          <div className="pt-1">
                            <BlockGraphicSnapshotCard
                              snapshot={msg.attachedBlockSnapshot}
                              onSelectUnit={onSelectUnit}
                              onOpenDag={onOpenDag}
                            />
                          </div>
                        )}

                        {/* Attached Notes inside System Tip */}
                        {msg.attachedNotes && msg.attachedNotes.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 space-y-1.5">
                            {msg.attachedNotes.map((att) => (
                              <button
                                key={att.id}
                                type="button"
                                onClick={() => handleOpenNoteViewer(att)}
                                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 transition cursor-pointer flex items-center justify-between group"
                              >
                                <div className="flex items-center space-x-2.5 min-w-0">
                                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                                  <div className="truncate">
                                    <span className="font-semibold text-xs text-slate-900 block truncate group-hover:text-indigo-600">
                                      {att.title}
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                      {att.tag || '#конспект'} · Открыть запись
                                    </span>
                                  </div>
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end space-x-2.5 group ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    {msg.senderAvatar ? (
                      <button type="button" onClick={() => handleProfileOpen(msg.senderId)} className="cursor-pointer shrink-0 mb-1">
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-2xs"
                        />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleProfileOpen(msg.senderId)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mb-1 border shadow-2xs cursor-pointer ${
                          isMe
                            ? 'bg-slate-900 text-white border-slate-800'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {msg.senderName.substring(0, 2).toUpperCase()}
                      </button>
                    )}

                    {/* Message Bubble Container */}
                    <div className={`flex flex-col max-w-[85%] sm:max-w-[76%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`flex items-center space-x-2 text-[10px] text-slate-400 px-1 ${isMe ? 'justify-end' : ''}`}>
                        {!isMe && (
                          <button type="button" onClick={() => handleProfileOpen(msg.senderId)} className="font-semibold text-slate-700 hover:text-blue-600 cursor-pointer">
                            {msg.senderName}
                          </button>
                        )}
                        <span className="font-mono">{msg.timestamp}</span>
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs relative select-text ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-tr-sm'
                            : 'bg-white text-slate-900 border border-slate-200/90 rounded-tl-sm'
                        }`}
                      >
                        {/* Text content */}
                        {msg.text && (
                          <div className="whitespace-pre-wrap break-words font-sans">
                            {renderMessageTextWithMentions(msg.text, isMe)}
                          </div>
                        )}

                        {/* PNG Sticker */}
                        {msg.attachedSticker && (
                          <div className="py-1.5">
                            <div 
                              className="inline-block relative group/stk"
                              title={`Стикер: ${msg.attachedSticker.name}`}
                            >
                              <img
                                src={msg.attachedSticker.imageUrl}
                                alt={msg.attachedSticker.name}
                                className="max-w-[200px] max-h-[200px] sm:max-w-[240px] sm:max-h-[240px] object-contain drop-shadow-md hover:scale-105 transition-transform duration-150 cursor-pointer sticker-render-crisp [image-rendering:-webkit-optimize-contrast] [image-rendering:crisp-edges]"
                                loading="eager"
                                decoding="sync"
                                onClick={() => playChime('click')}
                              />
                              <div className={`text-[10px] font-medium mt-1 ${isMe ? 'text-blue-100' : 'text-slate-500'}`}>
                                {msg.attachedSticker.name}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Graphic Block Snapshot */}
                        {msg.attachedBlockSnapshot && (
                          <div className="mt-3">
                            <BlockGraphicSnapshotCard
                              snapshot={msg.attachedBlockSnapshot}
                              onSelectUnit={onSelectUnit}
                              onOpenDag={onOpenDag}
                            />
                          </div>
                        )}

                        {/* Attached Notes Cards */}
                        {msg.attachedNotes && msg.attachedNotes.length > 0 && (
                          <div className={`mt-3 pt-2.5 space-y-2 border-t ${isMe ? 'border-blue-400/40' : 'border-slate-100'}`}>
                            {msg.attachedNotes.map((note) => (
                              <div
                                key={note.id}
                                onClick={() => handleOpenNoteViewer(note)}
                                className={`p-2.5 rounded-xl transition cursor-pointer flex items-center justify-between ${
                                  isMe
                                    ? 'bg-blue-700/80 hover:bg-blue-700 text-white border border-blue-400/40'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200'
                                }`}
                              >
                                <div className="flex items-center space-x-2 min-w-0">
                                  <div className={`p-1 rounded-lg shrink-0 ${isMe ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-700'}`}>
                                    <BookOpen className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-semibold text-xs block truncate">
                                      {note.title}
                                    </span>
                                    <span className={`text-[10px] block truncate ${isMe ? 'text-blue-100' : 'text-slate-500'}`}>
                                      {note.tag || '#конспект'} · Открыть запись
                                    </span>
                                  </div>
                                </div>
                                <ExternalLink className={`w-3.5 h-3.5 shrink-0 ml-2 ${isMe ? 'text-blue-200' : 'text-slate-400'}`} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Bubble hover tools */}
                      <div className={`flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition px-1 ${isMe ? 'justify-end' : ''}`}>
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                          title="Копировать текст"
                        >
                          {copiedMsgId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Pending Attachments Banner */}
          {(pendingNotes.length > 0 || pendingBlockSnapshot) && (
            <div className="px-4 py-2 bg-indigo-50/80 border-t border-indigo-100 flex flex-wrap gap-2 items-center shrink-0">
              <span className="text-[11px] font-semibold text-indigo-900 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Прикреплено:</span>
              </span>

              {pendingBlockSnapshot && (
                <div className="px-2.5 py-1 rounded-lg bg-slate-900 text-cyan-300 text-xs font-medium flex items-center space-x-1.5 border border-slate-700 shadow-2xs">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="max-w-[200px] truncate">Блок: {pendingBlockSnapshot.title}</span>
                  <button
                    type="button"
                    onClick={handleRemovePendingBlock}
                    className="text-slate-400 hover:text-rose-400 p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {pendingNotes.map((note) => (
                <div
                  key={note.id}
                  className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-xs text-indigo-900 font-medium flex items-center space-x-1.5 shadow-2xs"
                >
                  <span className="max-w-[180px] truncate">📝 {note.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePendingNote(note.id)}
                    className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Chat Input Bar with relative mention popover */}
          <div className="p-3 sm:p-4 border-t border-slate-200/90 bg-white shrink-0 relative">
            {/* Live Autocomplete Popover */}
            {showMentionPopover && (
              <div className="absolute bottom-full mb-2 left-3 right-3 sm:left-4 sm:right-4 max-h-72 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-30 flex flex-col animate-scaleUp">
                <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-700 font-semibold gap-2">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <AtSign className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">Прикрепить к сообщению:</span>
                  </div>
                  
                  {/* Category switcher tabs */}
                  <div className="flex items-center space-x-1 bg-slate-200/70 p-0.5 rounded-lg text-[10px]">
                    <button
                      type="button"
                      onClick={() => setMentionType('all')}
                      className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                        mentionType === 'all' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Все
                    </button>
                    <button
                      type="button"
                      onClick={() => setMentionType('block')}
                      className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer flex items-center space-x-1 ${
                        mentionType === 'block' ? 'bg-sky-600 text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Camera className="w-3 h-3" />
                      <span>Блоки (@block)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMentionType('note')}
                      className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer flex items-center space-x-1 ${
                        mentionType === 'note' ? 'bg-indigo-600 text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>Конспекты (@note)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMentionType('sticker')}
                      className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer flex items-center space-x-1 ${
                        mentionType === 'sticker' ? 'bg-rose-600 text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Smile className="w-3 h-3" />
                      <span>Стикеры (@sticker)</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMentionPopover(false)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-y-auto max-h-56 divide-y divide-slate-100 p-1.5 custom-scrollbar space-y-0.5">
                  {/* Stickers Section */}
                  {(mentionType === 'all' || mentionType === 'sticker') && (
                    <div className="space-y-1 pb-1">
                      {mentionType === 'all' && (
                        <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400 flex items-center justify-between">
                          <span className="flex items-center space-x-1">
                            <Smile className="w-3 h-3 text-rose-600" />
                            <span>PNG Стикеры (@sticker)</span>
                          </span>
                          <span className="text-[9px] font-normal lowercase">найдено: {filteredMentionStickers.length}</span>
                        </div>
                      )}

                      {filteredMentionStickers.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">
                          Стикеров по запросу не найдено
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5 p-1">
                          {filteredMentionStickers.slice(0, 8).map((stk) => (
                            <button
                              key={`popover-sticker-${stk.id}`}
                              type="button"
                              onClick={() => handleSelectMentionSticker(stk)}
                              className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-200 transition cursor-pointer flex items-center space-x-2 group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-white p-1 border border-slate-200 flex items-center justify-center shrink-0">
                                <img src={stk.imageUrl} alt={stk.name} className="max-w-full max-h-full object-contain" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold text-xs text-slate-900 block truncate group-hover:text-rose-700">
                                  {stk.name}
                                </span>
                                <span className="text-[9px] text-slate-400 truncate block">
                                  {stk.price ? `${stk.price} XP` : 'Бесплатно'}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Blocks Section */}
                  {(mentionType === 'all' || mentionType === 'block') && (
                    <div className="space-y-1">
                      {mentionType === 'all' && (
                        <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400 flex items-center justify-between">
                          <span className="flex items-center space-x-1">
                            <Camera className="w-3 h-3 text-sky-600" />
                            <span>Блоки программы обучения (@block)</span>
                          </span>
                          <span className="text-[9px] font-normal lowercase">найдено: {filteredMentionBlocks.length}</span>
                        </div>
                      )}

                      {filteredMentionBlocks.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">
                          Блоков по запросу не найдено
                        </div>
                      ) : (
                        filteredMentionBlocks.slice(0, 6).map((node) => {
                          const isActive = node.id === activeDagNode?.id;
                          return (
                            <button
                              key={`popover-block-${node.id}`}
                              type="button"
                              onClick={() => handleAttachBlockSnapshot(node)}
                              className={`w-full text-left p-2.5 rounded-xl transition cursor-pointer flex items-center justify-between group ${
                                isActive ? 'bg-sky-50/90 hover:bg-sky-100/80 border border-sky-200/80' : 'hover:bg-slate-50 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                                <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-sky-600 group-hover:text-white transition'}`}>
                                  <Camera className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="font-semibold text-xs text-slate-900 block truncate group-hover:text-sky-700">
                                      {node.title}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                    {node.sprint || node.phaseTitle || 'Курс'} · {node.estimatedTimeMin || 30} мин {node.subtitle ? `· ${node.subtitle}` : ''}
                                  </p>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0 ${
                                isActive ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-sky-100 group-hover:text-sky-800'
                              }`}>
                                {isActive ? 'Активный' : node.status === 'completed' ? 'Пройден' : 'Прикрепить'}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Notes Section */}
                  {(mentionType === 'all' || mentionType === 'note') && (
                    <div className="space-y-1 pt-1">
                      {mentionType === 'all' && (
                        <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400 flex items-center justify-between">
                          <span className="flex items-center space-x-1">
                            <BookOpen className="w-3 h-3 text-indigo-600" />
                            <span>Конспекты и заметки (@note)</span>
                          </span>
                          <span className="text-[9px] font-normal lowercase">найдено: {filteredMentionNotes.length}</span>
                        </div>
                      )}

                      {filteredMentionNotes.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">
                          Конспектов по запросу не найдено
                        </div>
                      ) : (
                        filteredMentionNotes.slice(0, 6).map((note) => (
                          <button
                            key={`popover-note-${note.id}`}
                            type="button"
                            onClick={() => handleSelectMentionNote(note)}
                            className="w-full text-left p-2.5 hover:bg-indigo-50/70 rounded-xl transition cursor-pointer flex items-center justify-between group"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition shrink-0">
                                <BookOpen className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-xs text-slate-900 block truncate group-hover:text-indigo-700">
                                  📝 {note.title}
                                </span>
                                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                  {note.content.substring(0, 90)}...
                                </p>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-600 shrink-0 font-medium group-hover:bg-indigo-100 group-hover:text-indigo-800">
                              {note.tag || '#конспект'}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Input Row */}
            <div className="flex items-end gap-2 bg-slate-50 border border-slate-200/90 rounded-2xl p-1.5 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition shadow-2xs relative">
              {/* Sticker Picker Popover */}
              <StickerPickerPopover
                isOpen={isStickerPickerOpen}
                onClose={() => setIsStickerPickerOpen(false)}
                onSelectSticker={handleSelectSticker}
                positionClassName="bottom-full mb-3 left-0 sm:left-2"
                initialMode="insert"
              />

              <button
                type="button"
                onClick={() => {
                  setIsStickerPickerOpen((prev) => !prev);
                  playChime('click');
                }}
                title="Вставить или отправить PNG-стикер"
                className={`p-2 rounded-xl transition cursor-pointer shrink-0 ${
                  isStickerPickerOpen 
                    ? 'bg-rose-100 text-rose-600' 
                    : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                }`}
              >
                <Smile className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsBlockPickerModalOpen(true);
                  playChime('click');
                }}
                title="Выбрать и прикрепить графический снимок блока (@block)"
                className="p-2 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition cursor-pointer shrink-0"
              >
                <Camera className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsNotePickerModalOpen(true);
                  playChime('click');
                }}
                title="Прикрепить запись из блокнота (@note)"
                className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer shrink-0"
              >
                <AtSign className="w-4 h-4" />
              </button>

              <div
                ref={editorRef}
                contentEditable
                role="textbox"
                aria-multiline="true"
                suppressContentEditableWarning
                data-placeholder={`Напишите в чат комнаты «${room.name}»... (@block / @note / @sticker)`}
                onInput={handleEditorInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const text = e.clipboardData.getData('text/plain');
                  document.execCommand('insertText', false, text);
                  handleEditorInput();
                }}
                className="flex-1 bg-transparent px-2 py-1.5 text-xs text-slate-900 focus:outline-hidden resize-none min-h-[36px] max-h-32 overflow-y-auto leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none whitespace-pre-wrap break-words"
              />

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() && pendingNotes.length === 0 && !pendingBlockSnapshot}
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-semibold transition cursor-pointer shrink-0 shadow-xs active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>Введите <span className="font-mono text-slate-600 font-semibold">@block</span> для выбора блока или <span className="font-mono text-slate-600 font-semibold">@note</span> для конспекта</span>
              <span className="hidden sm:inline">Enter — отправить · Shift+Enter — перенос строки</span>
            </div>
          </div>
        </div>

        {/* Collapsible Participants Sidebar */}
        {showParticipantsSidebar && (
          <aside className="w-64 border-l border-slate-200/90 bg-white flex flex-col h-full overflow-hidden shrink-0">
            <div className="h-11 px-3.5 border-b border-slate-100 flex items-center justify-between text-xs shrink-0">
              <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Участники ({participants.length})</span>
              </span>
              <button
                type="button"
                onClick={() => setShowParticipantsSidebar(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                title="Скрыть панель"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
              {participants.map((participant) => {
                const profile = profileMap[participant.uid] || makeProfile(participant);
                const isChosen = selectedProfileId === participant.uid;
                return (
                  <button
                    key={participant.uid}
                    type="button"
                    onClick={() => handleProfileOpen(participant.uid)}
                    className={`w-full rounded-xl border p-2 text-left transition cursor-pointer ${
                      isChosen ? 'border-indigo-300 bg-indigo-50/60 shadow-2xs' : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      {profile.avatar ? (
                        <img src={profile.avatar} alt={profile.displayName} className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {profile.displayName.substring(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold text-slate-900 truncate">{profile.displayName}</span>
                          <span className={`h-2 w-2 rounded-full shrink-0 ${profile.status === 'focus' ? 'bg-emerald-500 animate-pulse' : profile.status === 'idle' ? 'bg-amber-400' : 'bg-slate-300'}`} />
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{profile.specialty}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${profile.ringProgress}%` }} />
                          </div>
                          <span className="text-[9px] font-mono text-slate-500">{profile.ringProgress}%</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {activePartnerProfile && (
                <div className="mt-3 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/60 to-white p-2.5 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Парный партнёр</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div className="text-xs font-semibold text-slate-900">{activePartnerProfile.displayName}</div>
                  <div className="text-[10px] text-slate-500 truncate">{activePartnerRequest?.pairTask.nodeTitle || 'Совместный блок'}</div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* 6. MODAL: FULL NOTE PICKER */}
      {isNotePickerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-xl w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2 text-indigo-700 font-bold text-sm">
                <BookOpen className="w-4 h-4" />
                <span>Прикрепить конспект из блокнота (@note)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsNotePickerModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск по конспектам и тегам..."
                value={notePickerSearch}
                onChange={(e) => setNotePickerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:outline-none text-gray-900"
              />
            </div>

            {/* Notes List */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {userNotes.filter(n => !notePickerSearch.trim() || n.title.toLowerCase().includes(notePickerSearch.toLowerCase())).map((note) => (
                <div
                  key={note.id}
                  onClick={() => {
                    handleSelectMentionNote(note);
                    setIsNotePickerModalOpen(false);
                  }}
                  className="p-3.5 rounded-xl bg-[#f8f9fa] hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition cursor-pointer flex flex-col justify-between group space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-900 group-hover:text-blue-700">
                      📝 {note.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-[10px] text-gray-600 font-medium">
                      {note.tag}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsNotePickerModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6.1. MODAL: FULL BLOCK PICKER */}
      {isBlockPickerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-scaleUp max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center space-x-2.5 text-sky-700 font-bold text-sm">
                <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Выбрать снимок учебного блока (@block)</h3>
                  <p className="text-[11px] text-slate-500 font-normal">Прикрепите графический снимок теории, инвариантов и практического проекта</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBlockPickerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Active Block Shortcut Card */}
            {activeDagNode && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50/40 border border-sky-200 flex items-center justify-between shrink-0 shadow-2xs">
                <div className="min-w-0 pr-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-md bg-sky-600 text-white text-[10px] font-bold uppercase tracking-wider">
                      Текущий активный блок
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">{activeDagNode.sprint || activeDagNode.phaseTitle}</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 mt-1 truncate">{activeDagNode.title}</h4>
                  {activeDagNode.subtitle && (
                    <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{activeDagNode.subtitle}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleAttachBlockSnapshot(activeDagNode)}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
                >
                  Прикрепить
                </button>
              </div>
            )}

            {/* Search Input */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск блоков по названию, теме, спринту..."
                value={blockPickerSearch}
                onChange={(e) => setBlockPickerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 focus:outline-none text-slate-900"
              />
            </div>

            {/* Blocks List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-[160px]">
              {courseNodes
                .filter((node) => {
                  const q = blockPickerSearch.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    node.title.toLowerCase().includes(q) ||
                    (node.subtitle && node.subtitle.toLowerCase().includes(q)) ||
                    (node.phaseTitle && node.phaseTitle.toLowerCase().includes(q)) ||
                    (node.category && node.category.toLowerCase().includes(q)) ||
                    (node.sprint && node.sprint.toLowerCase().includes(q))
                  );
                })
                .map((node) => {
                  const isActive = node.id === activeDagNode?.id;
                  return (
                    <div
                      key={`modal-block-${node.id}`}
                      onClick={() => handleAttachBlockSnapshot(node)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-start justify-between group ${
                        isActive
                          ? 'bg-sky-50/70 border-sky-300 hover:bg-sky-100/70'
                          : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start space-x-3 min-w-0 pr-3">
                        <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isActive ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-sky-600 group-hover:text-white transition'}`}>
                          <Camera className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-slate-900 group-hover:text-sky-700">
                              {node.title}
                            </span>
                            {isActive && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-100 text-sky-800">
                                В изучении
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                            <span>{node.sprint || node.phaseTitle}</span>
                            <span>·</span>
                            <span>{node.estimatedTimeMin || 30} мин</span>
                            {node.category && (
                              <>
                                <span>·</span>
                                <span>{node.category}</span>
                              </>
                            )}
                          </div>
                          {node.subtitle && (
                            <p className="text-[11px] text-slate-600 line-clamp-1 mt-1">
                              {node.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold group-hover:bg-sky-600 group-hover:text-white transition shrink-0">
                        Выбрать
                      </span>
                    </div>
                  );
                })}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 shrink-0">
              <span className="text-xs text-slate-400">
                Всего блоков в программе: {courseNodes.length}
              </span>
              <button
                type="button"
                onClick={() => setIsBlockPickerModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: VIEW ATTACHED NOTE DETAILS */}
      {activeViewingNote && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                  {activeViewingNote.tag || '#конспект'}
                </span>
                <h3 className="font-bold text-base text-gray-900">
                  📝 {activeViewingNote.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveViewingNote(null)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Note Full Content */}
            <div className="max-h-96 overflow-y-auto bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs text-gray-800 leading-relaxed font-sans whitespace-pre-line select-text">
              {activeViewingNote.content}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-gray-400">
                Запись сохранена в вашем цифровом блокноте
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeViewingNote.content);
                    setCopiedNoteContent(true);
                    setTimeout(() => setCopiedNoteContent(false), 2000);
                    playChime('click');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs cursor-pointer flex items-center space-x-1.5 transition"
                >
                  {copiedNoteContent ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-600" />}
                  <span>{copiedNoteContent ? 'Скопировано' : 'Копировать'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveViewingNote(null)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer"
                >
                  Понятно
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-2xl">
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-500 p-6 text-white">
              <div className="absolute -right-12 -top-10 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
              <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-cyan-300/25 blur-2xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {selectedProfile.avatar ? (
                    <img src={selectedProfile.avatar} alt={selectedProfile.displayName} className="h-20 w-20 rounded-[22px] object-cover border-4 border-white/25 shadow-lg" />
                  ) : (
                    <div className="h-20 w-20 rounded-[22px] flex items-center justify-center text-xl font-bold bg-white/15 border-4 border-white/25">
                      {selectedProfile.displayName.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]">
                      <Sparkles className="w-3 h-3" />
                      {selectedProfile.specialty}
                    </div>
                    <h3 className="mt-3 text-2xl font-bold">{selectedProfile.displayName}</h3>
                    <p className="mt-1 text-sm text-indigo-100">{selectedProfile.title}</p>
                  </div>
                </div>

                <button type="button" onClick={() => setSelectedProfileId(null)} className="rounded-full border border-white/25 bg-white/10 p-2 text-white hover:bg-white/20 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative mt-6 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/15 bg-white/8 p-3 backdrop-blur-sm">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-indigo-100">Focus</div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-12 w-12 rounded-full border-[5px] border-white/20" style={{ background: `conic-gradient(#ffffff ${selectedProfile.ringProgress * 3.6}deg, rgba(255,255,255,0.18) 0deg)` }} />
                    <div>
                      <div className="text-xl font-bold">{selectedProfile.ringProgress}%</div>
                      <div className="text-[10px] text-indigo-100">скорость поглощения</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/8 p-3 backdrop-blur-sm">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-indigo-100">Фокус · Pomodoro</div>
                  <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
                    <span className={`h-2.5 w-2.5 rounded-full ${selectedProfile.status === 'focus' ? 'bg-emerald-300 animate-pulse' : selectedProfile.status === 'idle' ? 'bg-amber-300' : 'bg-slate-300'}`} />
                    {selectedProfile.status === 'focus' ? 'Активна' : selectedProfile.status === 'idle' ? 'Не запущена' : 'Перерыв'}
                  </div>
                  <div className="mt-1 text-[10px] text-indigo-100">Статус из таймера пользователя</div>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/8 p-3 backdrop-blur-sm">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-indigo-100">Партнёрство</div>
                  <div className="mt-2 text-lg font-semibold">{selectedPartnerRequest?.status === 'accepted' ? 'Активно' : 'Свободен'}</div>
                  <div className="mt-1 text-[10px] text-indigo-100">{selectedPartnerRequest?.pairTask.nodeTitle || 'можно пригласить в пару'}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-5 md:grid-cols-[1.5fr_0.9fr] max-h-[calc(90vh-260px)] overflow-y-auto">
              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <UserCircle2 className="w-4 h-4 text-indigo-600" />
                      Биография
                    </div>
                    {selectedProfile.uid === myUserId && (
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-medium ${profileSyncStatus === 'synced' ? 'text-emerald-700' : profileSyncStatus === 'error' ? 'text-rose-700' : 'text-gray-500'}`}>
                          {profileSyncStatus === 'synced' ? 'Облако синхронизировано' : profileSyncStatus === 'syncing' ? 'Синхронизация…' : profileSyncStatus === 'error' ? 'Ошибка синхронизации' : 'Локально'}
                        </span>
                        <button type="button" onClick={() => handleSaveProfileEdit(selectedProfile)} disabled={isSavingProfile} className="rounded-xl border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700 disabled:opacity-50 cursor-pointer">
                          {isSavingProfile ? 'Сохраняю…' : 'Сохранить'}
                        </button>
                      </div>
                    )}
                  </div>

                  {selectedProfile.uid === myUserId ? (
                    <div className="space-y-2">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          value={selectedProfile.displayName}
                          onChange={(event) => setProfileMap((prev) => ({ ...prev, [myUserId]: { ...prev[myUserId], displayName: event.target.value } }))}
                          placeholder="Имя"
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-indigo-500 focus:outline-none"
                        />
                        <input
                          value={selectedProfile.title}
                          onChange={(event) => setProfileMap((prev) => ({ ...prev, [myUserId]: { ...prev[myUserId], title: event.target.value } }))}
                          placeholder="Роль / занятие"
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <input
                        value={selectedProfile.specialty}
                        onChange={(event) => setProfileMap((prev) => ({ ...prev, [myUserId]: { ...prev[myUserId], specialty: event.target.value } }))}
                        placeholder="Специализация"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-indigo-500 focus:outline-none"
                      />
                      <select
                        value={selectedProfile.status}
                        onChange={(event) => setProfileMap((prev) => ({ ...prev, [myUserId]: { ...prev[myUserId], status: event.target.value as UserProfile['status'] } }))}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-indigo-500 focus:outline-none"
                        aria-label="Статус фокус-сессии"
                      >
                        <option value="focus">Фокус-сессия активна</option>
                        <option value="idle">Фокус-сессия не запущена</option>
                        <option value="break">Перерыв</option>
                      </select>
                      <textarea
                        value={selectedProfile.bio}
                        onChange={(event) => setProfileMap((prev) => ({ ...prev, [myUserId]: { ...prev[myUserId], bio: event.target.value } }))}
                        rows={4}
                        placeholder="О себе и над чем сейчас работаете"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-indigo-500 focus:outline-none resize-none"
                      />
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed text-gray-700">{selectedProfile.bio}</p>
                  )}
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Gauge className="w-4 h-4 text-indigo-600" />
                      Узлы в работе
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.12em] text-gray-500">current nodes</span>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    {selectedProfile.currentNodeIds.map((nodeId) => {
                      const node = nodes.find((item) => item.id === nodeId) || (activeUnit && activeUnit.id === nodeId ? { id: activeUnit.id, title: activeUnit.title } as DAGNode : undefined);
                      const nodeTitle = node?.title || 'Узел без имени';
                      return (
                        <button
                          key={`${selectedProfile.uid}-${nodeId}`}
                          type="button"
                          onClick={() => onSelectUnit?.(nodeId)}
                          className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-3 text-left hover:border-indigo-300 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-700">Node</span>
                            <span className="text-[10px] text-gray-500">{selectedProfile.ringProgress}%</span>
                          </div>
                          <div className="mt-2 text-sm font-semibold text-gray-900">{nodeTitle}</div>
                          <div className="mt-2 h-2.5 rounded-full bg-indigo-100">
                            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500" style={{ width: `${selectedProfile.ringProgress}%` }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 to-sky-50/80 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-indigo-950">
                      <Compass className="w-4 h-4 text-indigo-600 animate-pulse" />
                      <span>Траектория обучения & Заметки к блокам</span>
                    </div>
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                      Интерактивный граф
                    </span>
                  </div>

                  <p className="text-xs text-indigo-900 leading-relaxed">
                    Все заметки, фидбек и стикеры прикрепляются прямо к блокам в интерактивном DAG-графе. Наведите на любой блок, чтобы раскрыть желтую линию со всеми комментариями и оставить свой стикер!
                  </p>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const targetNodeId = selectedProfile.currentNodeIds[0] || (nodes[0]?.id);
                        if (targetNodeId) onSelectUnit?.(targetNodeId);
                        setSelectedProfileId(null);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center space-x-2"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Посмотреть траекторию обучения в DAG-графе</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-violet-50 to-sky-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Briefcase className="w-4 h-4 text-violet-600" />
                    Pair Task / граф напарника
                  </div>

                  <div className="mt-3 rounded-2xl border border-violet-200 bg-white p-3 shadow-sm">
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-700">Current duo</div>
                    <div className="mt-2 text-base font-semibold text-gray-900">{selectedProfile.pairTask?.title || 'Парная ветка ещё не назначена'}</div>
                    <p className="mt-2 text-xs leading-relaxed text-gray-700">{selectedProfile.pairTask?.brief || 'Выберитеся в пару, чтобы заложить конкретный графический task с напарником.'}</p>
                  </div>

                  <div className="mt-3 flex gap-2">
                    {selectedProfile.uid !== myUserId ? (
                      <button type="button" onClick={() => handleSendPartnerRequest(selectedProfile)} className="flex-1 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700 cursor-pointer">
                        {selectedProfile.partnerRequestStatus === 'accepted' ? 'Напарник подтверждён' : 'Кинуть заявку в напарники'}
                      </button>
                    ) : (
                      <button type="button" onClick={() => setSelectedProfileId(null)} className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
                        Редактировать профиль
                      </button>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-sm font-semibold text-gray-900">Краткая сводка</div>
                  <div className="mt-3 space-y-2 text-xs text-gray-700">
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span>Профиль</span>
                      <strong>{selectedProfile.title}</strong>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span>Активный узел</span>
                      <strong>{selectedProfile.currentNodeIds[0] ? (nodes.find((item) => item.id === selectedProfile.currentNodeIds[0])?.title || 'Сейчас в работе') : 'Нет узла'}</strong>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span>Статус</span>
                      <strong>{selectedProfile.status}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Постов</span>
                      <strong>{selectedProfile.wallPosts?.length || 0}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
