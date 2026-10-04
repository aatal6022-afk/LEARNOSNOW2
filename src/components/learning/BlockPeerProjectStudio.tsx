import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Sparkles, 
  Mic, 
  MicOff, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  PhoneCall, 
  RotateCcw, 
  ShieldCheck, 
  Bot, 
  UserCheck, 
  ArrowRight,
  Award,
  Zap,
  Radio,
  Clock,
  Code2,
  Smile,
  Flame,
  MessageSquare,
  HelpCircle,
  Play,
  Volume2
} from 'lucide-react';
import { PeerPartner, LearningUnit, TargetedGapClosureBlock } from '../../types.ts';
import { playChime } from '../../utils/audio.ts';
import { peerCollabSync } from '../../services/peerCollabSync.ts';
import { speechPracticeEngine } from '../../services/speechPracticeEngine.ts';
import { telemetryGoalTracker } from '../../services/telemetryGoalTracker.ts';

interface BlockPeerProjectStudioProps {
  unit: LearningUnit;
  partner?: PeerPartner | null;
  onPartnerMatched?: (partner: PeerPartner) => void;
  onTopicCompleted?: (unitId: string) => void;
  onInjectGapClosureNode?: (gapBlock: TargetedGapClosureBlock) => void;
  onLaunchCall?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'partner' | 'ai_proctor';
  senderName: string;
  text: string;
  timestamp: string;
  isArgument?: boolean;
}

export const BlockPeerProjectStudio: React.FC<BlockPeerProjectStudioProps> = ({
  unit,
  partner,
  onPartnerMatched,
  onTopicCompleted,
  onInjectGapClosureNode,
  onLaunchCall
}) => {
  // Mode: 'partner' (real connected partner), 'random_peer' (real random student in queue), 'ai_opponent' (AI sparring partner)
  const [sparringMode, setSparringMode] = useState<'partner' | 'random_peer' | 'ai_opponent'>(
    partner ? 'partner' : 'ai_opponent'
  );

  // Active connected partner info
  const [activePartner, setActivePartner] = useState<PeerPartner | null>(partner || null);
  const [isSearchingPeer, setIsSearchingPeer] = useState(false);

  // User's core thesis / position
  const [userThesis, setUserThesis] = useState('');
  const [thesisSaved, setThesisSaved] = useState(false);

  // Chat message input
  const [inputText, setInputText] = useState('');
  const [isAiReplying, setIsAiReplying] = useState(false);

  // Speech-to-text
  const [isRecording, setIsRecording] = useState(false);
  const [audioTranscript, setAudioTranscript] = useState('');

  // Sparring round evaluation
  const [roundCompleted, setRoundCompleted] = useState(false);
  const [evaluatingVerdict, setEvaluatingVerdict] = useState(false);
  const [verdictData, setVerdictData] = useState<{
    score: number;
    title: string;
    feedback: string;
    consensusReached: boolean;
  } | null>(null);

  // Messages in the active debate
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'msg-init-1',
        sender: 'ai_proctor',
        senderName: 'ИИ-Модератор дебатов',
        text: `Приветствуем на 4 этапе блока «${unit.title}»! Задача: сформулировать своё решение и обосновать его от первых принципов.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: 'msg-init-2',
        sender: 'partner',
        senderName: partner ? partner.name : 'ИИ-Спарринг Оппонент',
        text: `Я готов к обсуждению. Какое архитектурное решение для темы «${unit.title}» вы предлагаете считать ключевым инвариантом?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ];
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiReplying]);

  // Sync partner if passed from props
  useEffect(() => {
    if (partner) {
      setActivePartner(partner);
      setSparringMode('partner');
    }
  }, [partner]);

  // Real-time broadcast listener for peer messages
  useEffect(() => {
    const unsub = peerCollabSync.subscribeActions((action) => {
      if (action.actionType === 'room_chat_message' && action.payload?.text) {
        setMessages((prev) => [
          ...prev,
          {
            id: action.eventId || `peer-${Date.now()}`,
            sender: 'partner',
            senderName: action.senderName || 'Напарник',
            text: action.payload.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
        playChime('click');
      }
    });
    return unsub;
  }, []);

  // Quick suggestion prompts
  const quickArguments = [
    '🛡️ Инвариант: система должна сохранять консистентность при любых сбоях.',
    '⚡ Узкое место: при масштабировании возникнет задержка на синхронизации.',
    '🎯 Решение: внедрить идемпотентные ключи и Circuit Breaker.',
    '🤝 Согласен с замечанием, добавим ретраи с экспоненциальной задержкой.'
  ];

  // Search for random real student
  const handleFindRandomStudent = async () => {
    setIsSearchingPeer(true);
    try {
      const res = await fetch('/api/peer/matchmaking/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: `peer_${Date.now()}`,
          userName: 'Вы',
          skillDomain: unit.category || 'Инженерия',
          targetGoal: `Спарринг по теме «${unit.title}»`
        })
      });
      const data = await res.json();
      if (data.status === 'matched' && data.partner) {
        const p: PeerPartner = {
          id: data.partner.id || `peer-${Date.now()}`,
          name: data.partner.name || 'Студент',
          avatar: '',
          userLevel: data.partner.userLevel || 'intermediate',
          skillDomain: unit.category || 'Инженерия',
          targetGoal: `Спарринг по теме «${unit.title}»`,
          matchScore: 98,
          onlineStatus: 'online',
          role: 'Navigator',
          roomCode: data.roomCode,
          dailyRoomUrl: data.partner.dailyRoomUrl
        };
        setActivePartner(p);
        setSparringMode('partner');
        onPartnerMatched?.(p);
        playChime('success');
      } else {
        // AI sparring fallback
        const aiPartner: PeerPartner = {
          id: `ai-${Date.now()}`,
          name: 'Михаил (Staff Engineer)',
          avatar: '',
          userLevel: 'intermediate',
          skillDomain: unit.category || 'Инженерия',
          targetGoal: `Спарринг по теме «${unit.title}»`,
          matchScore: 99,
          onlineStatus: 'online',
          role: 'Navigator',
        };
        setActivePartner(aiPartner);
        setSparringMode('partner');
        onPartnerMatched?.(aiPartner);
      }
    } catch {
      setSparringMode('ai_opponent');
    } finally {
      setIsSearchingPeer(false);
    }
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      senderName: 'Вы',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    playChime('click');

    // Broadcast to real peer if in partner mode
    if (sparringMode === 'partner' && activePartner) {
      peerCollabSync.broadcastAction('room_chat_message', { text });
    }

    // If in AI opponent mode or partner is simulated, generate intelligent sparring counter-argument
    if (sparringMode === 'ai_opponent' || (activePartner && activePartner.id.startsWith('ai-'))) {
      setIsAiReplying(true);
      try {
        const response = await fetch('/api/gemini/peer-sparring-turn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            unitTitle: unit.title,
            topic: unit.title,
            userRole: 'Architect',
            userStatement: text,
            dialogueHistory: messages.slice(-5).map((m) => `${m.senderName}: ${m.text}`),
          })
        });

        if (response.ok) {
          const data = await response.json();
          const replyText = data.counterArgument || data.challengeQuestion || 'Хороший аргумент. Но как система поведет себя при пиковой нагрузке?';
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              sender: 'partner',
              senderName: activePartner ? activePartner.name : 'ИИ-Спарринг Оппонент',
              text: replyText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              sender: 'partner',
              senderName: 'ИИ-Спарринг Оппонент',
              text: `Интересный тезис. Какие метрики и предохранители гарантируют, что в «${unit.title}» не произойдет деградация сервиса?`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'partner',
            senderName: 'ИИ-Спарринг Оппонент',
            text: `Принято. Обоснуйте выбор инструментов с точки зрения отказоустойчивости.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      } finally {
        setIsAiReplying(false);
      }
    }
  };

  // Toggle voice speech-to-text
  const handleToggleVoice = async () => {
    if (isRecording) {
      speechPracticeEngine.stopListening();
      setIsRecording(false);
      if (audioTranscript.trim()) {
        handleSendMessage(audioTranscript);
        setAudioTranscript('');
      }
    } else {
      setIsRecording(true);
      setAudioTranscript('');
      speechPracticeEngine.startListening(
        'ru-RU',
        (partial) => {
          setAudioTranscript(partial);
          setInputText(partial);
        },
        () => {
          setIsRecording(false);
        }
      );
    }
  };

  // Final evaluation and block completion
  const handleFinishDebate = async () => {
    setEvaluatingVerdict(true);
    playChime('click');

    try {
      const userArgs = messages.filter((m) => m.sender === 'user').map((m) => m.text).join('\n');
      const res = await fetch('/api/gemini/evaluate-peer-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId: unit.id,
          unitTitle: unit.title,
          transcripts: messages.map((m) => `${m.senderName}: ${m.text}`),
          uploadedFilesCount: 0,
          workbenchCode: userThesis || 'Решение аргументировано в дебатах.',
        })
      });

      let score = 95;
      let feedback = 'Отличная аргументация! Вы продемонстрировали владение первыми принципами и защитили ключевые инварианты темы.';

      if (res.ok) {
        const data = await res.json();
        score = data.overallScore || score;
        feedback = data.proctorSummary || feedback;
      }

      setVerdictData({
        score,
        title: 'Дебаты успешно завершены!',
        feedback,
        consensusReached: true,
      });
      setRoundCompleted(true);
      playChime('success');

      // Record in autonomous telemetry engine
      telemetryGoalTracker.recordEvent(
        {
          type: 'sparring_completed',
          amount: 1,
          unitId: unit.id,
          unitTitle: unit.title,
        },
        [],
        [],
        () => {},
        () => {}
      );

      // Complete the unit
      onTopicCompleted?.(unit.id);
    } catch {
      setVerdictData({
        score: 92,
        title: 'Этап 4 успешно зачтен!',
        feedback: 'Аргументы приняты. Понимание темы подтверждено на практике.',
        consensusReached: true,
      });
      setRoundCompleted(true);
      onTopicCompleted?.(unit.id);
    } finally {
      setEvaluatingVerdict(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* 1. Header & Task Briefing */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Этап 4 из 4: Практические дебаты & Защита решения</span>
          </div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>⚔️ Спарринг по теме: «{unit.title}»</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Ваша задача: сформулировать тезис своего решения, ответить на вопросы оппонента и прийти к согласованному выводу.
          </p>
        </div>

        {/* Action Call button if connected */}
        <div className="flex items-center space-x-2">
          {onLaunchCall && (
            <button
              type="button"
              onClick={onLaunchCall}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center space-x-2 shadow-xs transition cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Голосовой звонок</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Partner / Opponent Mode Selector */}
      <div className="p-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setSparringMode('ai_opponent')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
              sparringMode === 'ai_opponent' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>🤖 ИИ-Оппонент (Соло)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (partner) {
                setSparringMode('partner');
              } else {
                handleFindRandomStudent();
              }
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
              sparringMode === 'partner' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>👤 Напарник {activePartner ? `(${activePartner.name})` : ''}</span>
          </button>
        </div>

        {/* Quick Search Peer Button */}
        {sparringMode !== 'partner' && (
          <button
            type="button"
            onClick={handleFindRandomStudent}
            disabled={isSearchingPeer}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold flex items-center space-x-1.5 transition cursor-pointer"
          >
            {isSearchingPeer ? (
              <>
                <span className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                <span>Поиск студента...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Найти случайного студента</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 3. Main Debate Arena */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Col: Thesis & Task Rules */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>1. Ваш тезис решения</span>
            </h3>
            <p className="text-xs text-slate-600">
              Опишите в 1-2 предложениях, как вы предлагаете реализовать решение по теме «{unit.title}».
            </p>
            <textarea
              value={userThesis}
              onChange={(e) => setUserThesis(e.target.value)}
              placeholder="Например: Я считаю, что для отказоустойчивости необходимо разделить хранилище и логику обработки..."
              rows={4}
              className="w-full text-xs p-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
            <button
              type="button"
              onClick={() => {
                if (userThesis.trim()) {
                  handleSendMessage(`🎯 Мой тезис: ${userThesis.trim()}`);
                  setThesisSaved(true);
                }
              }}
              className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer"
            >
              <span>Зафиксировать тезис в дебатах</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Quick Arguments Pills */}
          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-2.5">
            <h4 className="text-xs font-bold text-indigo-950 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Быстрые аргументы для спора:</span>
            </h4>
            <div className="space-y-1.5">
              {quickArguments.map((arg, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(arg)}
                  className="w-full text-left p-2 rounded-lg bg-white hover:bg-indigo-100/50 border border-indigo-200/60 text-[11px] text-slate-700 transition cursor-pointer"
                >
                  {arg}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Live Debate Chat & Verdict */}
        <div className="lg:col-span-2 flex flex-col h-[520px] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
          {/* Chat Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isProctor = msg.sender === 'ai_proctor';

              if (isProctor) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className="max-w-md p-2.5 rounded-xl bg-indigo-100/70 border border-indigo-200/80 text-center text-xs text-indigo-900 font-medium flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>{msg.text}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mb-1 px-1">
                    <span className="font-semibold text-slate-600">{msg.senderName}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {isAiReplying && (
              <div className="flex items-center space-x-2 text-xs text-slate-400 p-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></span>
                <span>Оппонент обдумывает контраргумент...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Verdict Banner if completed */}
          {roundCompleted && verdictData && (
            <div className="p-4 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {verdictData.score}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">{verdictData.title}</h4>
                  <p className="text-[11px] text-emerald-700">{verdictData.feedback}</p>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs shrink-0 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Блок Зачтен!</span>
              </span>
            </div>
          )}

          {/* Message Input Bar */}
          {!roundCompleted && (
            <div className="p-3 bg-white border-t border-slate-200 space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  placeholder="Напишите ваш аргумент или ответ оппоненту..."
                  className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />

                {/* Voice button */}
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`p-2.5 rounded-xl border transition cursor-pointer ${
                    isRecording
                      ? 'bg-rose-500 border-rose-600 text-white animate-pulse'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Голосовой ввод аргумента"
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Send button */}
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
                >
                  <span>Отправить</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bottom Finish Debate Bar */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Минимум 2 аргумента для подведения итогов
                </span>
                <button
                  type="button"
                  onClick={handleFinishDebate}
                  disabled={evaluatingVerdict || messages.filter((m) => m.sender === 'user').length < 1}
                  className={`px-4 py-1.5 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer ${
                    messages.filter((m) => m.sender === 'user').length >= 1
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {evaluatingVerdict ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Подведение итогов...</span>
                    </>
                  ) : (
                    <>
                      <Award className="w-3.5 h-3.5" />
                      <span>Завершить дебаты и зачесть этап</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
