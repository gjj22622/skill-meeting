import { useState, useEffect } from "react";
import { useAuth, LocalUser } from "../lib/auth-context";
import { subscribeAllMeetings, subscribeAllSkills, deleteMeeting as delMeeting, deleteSkill as delSkill } from "../lib/store";
import { Meeting, Skill } from "../types";
import { Trash2, Shield, Users, MessageSquare, Database, LogOut, LogIn, AlertTriangle, Loader2, Clock, Coins } from "lucide-react";
import { cn } from "../lib/utils";
import { format, intervalToDuration } from "date-fns";
import { zhTW } from "date-fns/locale";
import { handleStoreError, OperationType } from "../lib/error-handler";

const ADMIN_NAME = "Admin";

// Gemini 2.0 Flash Pricing (USD per 1M tokens)
const INPUT_PRICE_PER_1M = 0.075;
const OUTPUT_PRICE_PER_1M = 0.30;

const calculateCost = (inputTokens: number = 0, outputTokens: number = 0) => {
  const inputCost = (inputTokens / 1_000_000) * INPUT_PRICE_PER_1M;
  const outputCost = (outputTokens / 1_000_000) * OUTPUT_PRICE_PER_1M;
  return inputCost + outputCost;
};

const formatDuration = (seconds?: number) => {
  if (!seconds) return "-";
  const duration = intervalToDuration({ start: 0, end: seconds * 1000 });
  const parts = [];
  if (duration.hours) parts.push(`${duration.hours}時`);
  if (duration.minutes) parts.push(`${duration.minutes}分`);
  if (duration.seconds || parts.length === 0) parts.push(`${duration.seconds}秒`);
  return parts.join("");
};

export default function AdminPage() {
  const { user, loading, login, logout } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [activeTab, setActiveTab] = useState<'meetings' | 'skills'>('meetings');

  useEffect(() => {
    if (!user) {
      setMeetings([]);
      setSkills([]);
      return;
    }

    const unsubMeetings = subscribeAllMeetings((all) => {
      setMeetings(all);
    });

    const unsubSkills = subscribeAllSkills((all) => {
      setSkills(all);
    });

    return () => {
      unsubMeetings();
      unsubSkills();
    };
  }, [user]);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteMeeting = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
      return;
    }

    try {
      delMeeting(id);
      setDeletingId(null);
    } catch (err) {
      handleStoreError(err, OperationType.DELETE, `meetings/${id}`);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
      return;
    }

    try {
      delSkill(id);
      setDeletingId(null);
    } catch (err) {
      handleStoreError(err, OperationType.DELETE, `skills/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#141414]" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
        <div className="bg-white border border-[#141414] rounded-[40px] p-12 w-full max-w-md shadow-2xl text-center">
          <div className="w-20 h-20 bg-[#141414] text-white rounded-3xl flex items-center justify-center mb-8 mx-auto">
            <Shield size={40} />
          </div>
          <h1 className="text-3xl font-serif italic mb-4">管理員登入</h1>
          <p className="text-gray-500 mb-12">請輸入名稱以存取後台管理系統</p>

          <button
            onClick={() => login(ADMIN_NAME)}
            className="w-full py-5 bg-[#141414] text-white rounded-full font-bold hover:scale-[1.02] transition-transform shadow-xl flex items-center justify-center gap-3"
          >
            <LogIn size={20} /> 以管理員身分登入
          </button>
        </div>
      </div>
    );
  }

  const totalCost = meetings.reduce((acc, m) => acc + calculateCost(m.totalInputTokens, m.totalOutputTokens), 0);
  const totalTokens = meetings.reduce((acc, m) => acc + (m.totalInputTokens || 0) + (m.totalOutputTokens || 0), 0);

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex">
      {/* Sidebar */}
      <div className="w-72 bg-[#141414] text-white flex flex-col p-8">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-white text-[#141414] rounded-xl flex items-center justify-center">
            <Shield size={20} />
          </div>
          <span className="font-serif italic text-xl">Admin Panel</span>
        </div>

        <nav className="flex-1 space-y-2">
          <button
            onClick={() => setActiveTab('meetings')}
            className={cn(
              "w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all font-bold text-sm",
              activeTab === 'meetings' ? "bg-white text-[#141414]" : "text-white/40 hover:text-white hover:bg-white/5"
            )}
          >
            <MessageSquare size={18} /> 會議管理
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={cn(
              "w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all font-bold text-sm",
              activeTab === 'skills' ? "bg-white text-[#141414]" : "text-white/40 hover:text-white hover:bg-white/5"
            )}
          >
            <Database size={18} /> Skill 管理
          </button>
        </nav>

        <div className="mt-auto pt-8 border-t border-white/10">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-bold">
              {user.displayName?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold truncate">{user.displayName}</div>
              <div className="text-[10px] opacity-40 uppercase tracking-widest">Administrator</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-6 py-4 text-red-400 hover:text-red-300 transition-colors font-bold text-sm"
          >
            <LogOut size={18} /> 登出
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-12 overflow-y-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-serif italic mb-2">
              {activeTab === 'meetings' ? "會議管理" : "Skill 管理"}
            </h2>
            <p className="text-gray-500">
              {activeTab === 'meetings' ? `共有 ${meetings.length} 場會議` : `共有 ${skills.length} 個 Skill`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white px-6 py-3 rounded-2xl border border-[#141414]/10 flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-bold">系統連線正常</span>
            </div>
          </div>
        </header>

        {activeTab === 'meetings' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-8 rounded-[32px] border border-[#141414]/10 shadow-sm">
              <div className="flex items-center gap-3 text-gray-400 mb-4">
                <Coins size={20} />
                <span className="text-xs uppercase tracking-widest font-bold">預估總花費 (USD)</span>
              </div>
              <div className="text-4xl font-serif italic">${totalCost.toFixed(6)}</div>
              <div className="text-[10px] text-gray-400 mt-2 font-bold uppercase">基於 Gemini 2.0 Flash 定價</div>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-[#141414]/10 shadow-sm">
              <div className="flex items-center gap-3 text-gray-400 mb-4">
                <Database size={20} />
                <span className="text-xs uppercase tracking-widest font-bold">總 Token 消耗</span>
              </div>
              <div className="text-4xl font-serif italic">{totalTokens.toLocaleString()}</div>
              <div className="text-[10px] text-gray-400 mt-2 font-bold uppercase">Input + Output Tokens</div>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-[#141414]/10 shadow-sm">
              <div className="flex items-center gap-3 text-gray-400 mb-4">
                <Clock size={20} />
                <span className="text-xs uppercase tracking-widest font-bold">總會議時長</span>
              </div>
              <div className="text-4xl font-serif italic">
                {formatDuration(meetings.reduce((acc, m) => acc + (m.durationSeconds || 0), 0))}
              </div>
              <div className="text-[10px] text-gray-400 mt-2 font-bold uppercase">所有已完成會議累計</div>
            </div>
          </div>
        )}

        <div className="bg-white border border-[#141414]/10 rounded-[40px] overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-bottom border-[#141414]/10">
                <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold opacity-40">名稱 / 主題</th>
                <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold opacity-40">耗時 / 消耗</th>
                <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold opacity-40">預估費用</th>
                <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold opacity-40">建立時間</th>
                <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold opacity-40 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141414]/5">
              {activeTab === 'meetings' ? (
                meetings.map(meeting => {
                  const cost = calculateCost(meeting.totalInputTokens, meeting.totalOutputTokens);
                  return (
                    <tr key={meeting.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="font-serif italic text-lg">{meeting.topic}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "text-[8px] uppercase font-bold px-2 py-0.5 rounded-full border",
                            meeting.status === 'completed' ? "bg-green-50 text-green-600 border-green-200" :
                            meeting.status === 'running' ? "bg-blue-50 text-blue-600 border-blue-200" :
                            "bg-gray-50 text-gray-600 border-gray-200"
                          )}>
                            {meeting.status}
                          </span>
                          <span className="text-[10px] opacity-40 font-mono">{meeting.ownerId.slice(0, 8)}...</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs font-bold">
                            <Clock size={12} className="opacity-40" />
                            {formatDuration(meeting.durationSeconds)}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] opacity-40 font-mono">
                            <Database size={10} />
                            {(meeting.totalInputTokens || 0).toLocaleString()} / {(meeting.totalOutputTokens || 0).toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm font-bold">${cost.toFixed(6)}</div>
                        <div className="text-[10px] opacity-40">USD</div>
                      </td>
                      <td className="px-8 py-6 text-sm opacity-60">
                        {format(new Date(meeting.createdAt), "yyyy/MM/dd HH:mm", { locale: zhTW })}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => handleDeleteMeeting(meeting.id)}
                          className={cn(
                            "px-4 py-2 rounded-xl transition-all font-bold text-sm flex items-center gap-2 ml-auto",
                            deletingId === meeting.id
                              ? "bg-red-500 text-white animate-pulse"
                              : "text-red-500 hover:bg-red-50"
                          )}
                        >
                          <Trash2 size={18} />
                          {deletingId === meeting.id ? "點擊以確認刪除" : ""}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                skills.map(skill => (
                  <tr key={skill.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{skill.avatar}</span>
                        <div>
                          <div className="font-serif italic text-lg">{skill.name}</div>
                          <div className="text-[10px] uppercase font-bold opacity-40 mt-1">
                            {skill.isDefault ? "系統預設" : "使用者自訂"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-mono text-xs opacity-60">{skill.ownerId || "System"}</td>
                    <td className="px-8 py-6 text-sm opacity-60">
                      {skill.createdAt ? format(new Date(skill.createdAt), "yyyy/MM/dd HH:mm", { locale: zhTW }) : "-"}
                    </td>
                    <td className="px-8 py-6"></td>
                    <td className="px-8 py-6 text-right">
                      {!skill.isDefault && (
                        <button
                          onClick={() => handleDeleteSkill(skill.id)}
                          className={cn(
                            "px-4 py-2 rounded-xl transition-all font-bold text-sm flex items-center gap-2 ml-auto",
                            deletingId === skill.id
                              ? "bg-red-500 text-white animate-pulse"
                              : "text-red-500 hover:bg-red-50"
                          )}
                        >
                          <Trash2 size={18} />
                          {deletingId === skill.id ? "點擊以確認刪除" : ""}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
              {activeTab === 'meetings' && meetings.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-gray-400 italic">暫無會議資料</td>
                </tr>
              )}
              {activeTab === 'skills' && skills.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-gray-400 italic">暫無 Skill 資料</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
