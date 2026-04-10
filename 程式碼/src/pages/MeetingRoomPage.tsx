import { LocalUser } from "../lib/auth-context";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { subscribeMeeting, subscribeMessages, getSkill } from "../lib/store";
import { Meeting, Message, Skill } from "../types";
import { DEFAULT_SKILLS } from "../constants";
import { DiscussionEngine } from "../lib/discussion-engine";
import { Play, Loader2, AlertCircle, ChevronDown, CheckCircle } from "lucide-react";
import { cn } from "../lib/utils";
import ReactMarkdown from "react-markdown";

export default function MeetingRoomPage({ user }: { user: LocalUser }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;

    const unsubMeeting = subscribeMeeting(id, (m) => {
      if (m) {
        setMeeting(m);
        if (skills.length === 0) {
          loadSkills(m.skillIds);
        }
      } else {
        navigate("/");
      }
    });

    const unsubMessages = subscribeMessages(id, (msgs) => {
      setMessages(msgs);
    });

    return () => {
      unsubMeeting();
      unsubMessages();
    };
  }, [id, skills.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadSkills = (skillIds: string[]) => {
    const loadedSkills: Skill[] = [];
    for (const sid of skillIds) {
      const defaultSkill = DEFAULT_SKILLS.find(s => s.id === sid);
      if (defaultSkill) {
        loadedSkills.push(defaultSkill);
      } else {
        const stored = getSkill(sid);
        if (stored) loadedSkills.push(stored);
      }
    }
    setSkills(loadedSkills);
  };

  const startDiscussion = async () => {
    if (!meeting || skills.length === 0 || isRunning) return;

    setIsRunning(true);
    setError(null);

    const engine = new DiscussionEngine(meeting, skills);
    const generator = engine.run();

    for await (const event of generator) {
      if (event.type === 'error') {
        setError(event.error || "發生未知錯誤");
        setIsRunning(false);
        break;
      }
      if (event.type === 'complete') {
        setIsRunning(false);
        setTimeout(() => navigate(`/reports/${id}`), 2000);
      }
    }
  };

  if (!meeting) return null;

  const progress = meeting.status === 'completed' ? 100 :
                   meeting.status === 'running' ?
                   (meeting.currentRound / meeting.rounds) * 100 : 0;

  return (
    <div className="h-[calc(100vh-65px)] flex flex-col bg-[#F5F5F0]">
      {/* Header */}
      <div className="bg-white border-b border-[#141414] px-8 py-4 flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-serif italic truncate max-w-xl">{meeting.topic}</h1>
            <span className={cn(
              "px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border",
              meeting.status === 'running' ? "bg-blue-50 text-blue-600 border-blue-200 animate-pulse" :
              meeting.status === 'completed' ? "bg-green-50 text-green-600 border-green-200" :
              "bg-gray-50 text-gray-600 border-gray-200"
            )}>
              {meeting.status === 'running' ? `討論中 (Round ${meeting.currentRound}/${meeting.rounds})` :
               meeting.status === 'completed' ? "已完成" : "等待開始"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#141414] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] font-bold opacity-40 uppercase tracking-tighter">
              進度: {Math.round(progress)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {meeting.status === 'pending' && !isRunning && (
            <button
              onClick={startDiscussion}
              className="flex items-center gap-2 px-6 py-3 bg-[#141414] text-white rounded-full hover:scale-105 transition-transform font-bold"
            >
              <Play size={18} /> 開始討論
            </button>
          )}
          {isRunning && (
            <div className="flex items-center gap-2 text-sm font-bold opacity-60">
              <Loader2 size={18} className="animate-spin" />
              AI 思考中...
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Participants Sidebar */}
        <div className="w-72 border-r border-[#141414]/10 bg-white/50 p-6 overflow-y-auto hidden lg:block">
          <h2 className="text-xs uppercase tracking-widest font-bold opacity-40 mb-6">參與 Skill 列表</h2>
          <div className="space-y-4">
            {skills.map(skill => {
              const isSpeaking = messages.length > 0 && messages[messages.length - 1].skillId === skill.id && isRunning;
              return (
                <div
                  key={skill.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all duration-300",
                    isSpeaking ? "bg-[#141414] text-white border-[#141414] scale-105 shadow-xl" : "bg-white border-[#141414]/5"
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{skill.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-serif italic truncate">{skill.name}</div>
                      <div className={cn("text-[10px] uppercase tracking-widest font-bold opacity-60", isSpeaking ? "text-blue-400" : "")}>
                        {isSpeaking ? "正在發言..." : "等待中"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth"
          >
            {messages.length === 0 && !isRunning && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <div className="text-6xl mb-4">🏛️</div>
                <h3 className="text-2xl font-serif italic">準備就緒</h3>
                <p className="max-w-xs">點擊右上角的「開始討論」按鈕，讓 AI 專家們展開辯論。</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500",
                  idx === messages.length - 1 ? "pb-12" : ""
                )}
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#141414]/10 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                  {msg.skillAvatar}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-serif italic text-lg">{msg.skillName}</span>
                    <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">
                      {msg.phase === 'opening' ? "開場陳述" : `Round ${msg.round}`}
                    </span>
                  </div>
                  <div className="bg-white border border-[#141414]/10 rounded-3xl rounded-tl-none p-6 shadow-sm prose prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600">
                <AlertCircle size={20} />
                <div className="text-sm font-medium">{error}</div>
              </div>
            )}
          </div>

          {/* Floating Indicator */}
          {isRunning && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#141414] text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-2xl animate-bounce">
              <Loader2 size={14} className="animate-spin" />
              討論進行中...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
