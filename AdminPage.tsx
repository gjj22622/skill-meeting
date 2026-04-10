import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../lib/auth-context";
import { admin as adminApi, AdminStats } from "../lib/api";
import { Meeting, Skill } from "../types";
import {
  Trash2, Shield, MessageSquare, Database, LogOut, LogIn, Loader2,
  Clock, Coins, Mail, Lock, BarChart3, Users, Activity, Zap,
  TrendingUp, Calendar, Hash, AlertCircle, CheckCircle2, PlayCircle,
  PauseCircle, RefreshCw
} from "lucide-react";
import { cn } from "../lib/utils";
import { format, intervalToDuration, subDays, isAfter, parseISO } from "date-fns";
import { zhTW } from "date-fns/locale";

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

const formatTokens = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
};

// ── Simple Bar Chart Component ──────────────────────────
function MiniBarChart({ data, color = "#141414", height = 120 }: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-lg transition-all duration-300"
            style={{
              height: `${Math.max((d.value / max) * (height - 24), 2)}px`,
              backgroundColor: color,
              opacity: 0.15 + (d.value / max) * 0.85,
            }}
            title={`${d.label}: ${d.value}`}
          />
          <span className="text-[8px] text-gray-400 font-bold truncate w-full text-center">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Ring Progress Component ─────────────────────────────
function RingProgress({ value, max, label, color = "#141414", size = 80 }: {
  value: number; max: number; label: string; color?: string; size?: number;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e5e0" strokeWidth={6} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-500"
        />
      </svg>
      <div className="text-center -mt-1">
        <div className="text-lg font-serif italic">{Math.round(pct)}%</div>
        <div className="text-[9px] text-gray-400 font-bold uppercase">{label}</div>
      </div>
    </div>
  );
}

type AdminTab = 'dashboard' | 'meetings' | 'skills' | 'users';

export default function AdminPage() {
  const { user, loading, login, logout } = useAuth();
  const [meetings, setMeetings] = useState<(Meeting & { owner?: { displayName: string; email: string } })[]>([]);
  const [skills, setSkills] = useState<(Skill & { owner?: { displayName: string; email: string } })[]>([]);
  const [users, setUsers] = useState<{ id: string; displayName: string; email: string; role: string; createdAt: string }[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [m, s, st, u] = await Promise.all([
        adminApi.meetings(),
        adminApi.skills(),
        adminApi.stats(),
        adminApi.users(),
      ]);
      setMeetings(m);
      setSkills(s);
      setStats(st);
      setUsers(u);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    loadData();
  }, [user]);

  // ── Derived Dashboard Metrics ───────────────────────────
  const dashboard = useMemo(() => {
    if (!stats) return null;

    const completed = meetings.filter(m => m.status === 'completed');
    const running = meetings.filter(m => m.status === 'running');
    const failed = meetings.filter(m => m.status === 'failed');
    const pending = meetings.filter(m => m.status === 'pending');

    const totalCost = calculateCost(stats.totalInputTokens, stats.totalOutputTokens);
    const totalTokens = stats.totalInputTokens + stats.totalOutputTokens;
    const avgTokensPerMeeting = completed.length > 0
      ? totalTokens / completed.length : 0;
    const avgDuration = completed.length > 0
      ? (stats.totalDuration || 0) / completed.length : 0;
    const avgCostPerMeeting = completed.length > 0
      ? totalCost / completed.length : 0;

    // Last 7 days meetings
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(now, 6 - i);
      const dayStr = format(date, "MM/dd");
      const count = meetings.filter(m => {
        const created = parseISO(m.createdAt);
        return format(created, "MM/dd") === dayStr;
      }).length;
      return { label: dayStr, value: count };
    });

    // Token usage by meeting (top 8)
    const topTokenMeetings = [...completed]
      .sort((a, b) => ((b.totalInputTokens || 0) + (b.totalOutputTokens || 0)) -
        ((a.totalInputTokens || 0) + (a.totalOutputTokens || 0)))
      .slice(0, 8)
      .map(m => ({
        label: m.topic.length > 6 ? m.topic.slice(0, 6) + ".." : m.topic,
        value: (m.totalInputTokens || 0) + (m.totalOutputTokens || 0),
      }));

    // User meeting count (top 5)
    const userMeetingMap = new Map<string, { name: string; email: string; count: number }>();
    meetings.forEach(m => {
      const owner = (m as any).owner;
      const key = m.ownerId;
      if (!userMeetingMap.has(key)) {
        userMeetingMap.set(key, {
          name: owner?.displayName || "Unknown",
          email: owner?.email || "",
          count: 0,
        });
      }
      userMeetingMap.get(key)!.count++;
    });
    const topUsers = [...userMeetingMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Goal type distribution
    const goalTypes = { consensus: 0, exploration: 0, brainstorming: 0 };
    meetings.forEach(m => {
      if (m.goalType in goalTypes) goalTypes[m.goalType as keyof typeof goalTypes]++;
    });

    // Custom vs system skills
    const systemSkills = skills.filter(s => s.isDefault);
    const customSkills = skills.filter(s => !s.isDefault);

    return {
      totalCost,
      totalTokens,
      avgTokensPerMeeting,
      avgDuration,
      avgCostPerMeeting,
      completed: completed.length,
      running: running.length,
      failed: failed.length,
      pending: pending.length,
      last7Days,
      topTokenMeetings,
      topUsers,
      goalTypes,
      systemSkills: systemSkills.length,
      customSkills: customSkills.length,
      inputTokens: stats.totalInputTokens,
      outputTokens: stats.totalOutputTokens,
    };
  }, [stats, meetings, skills]);

  const handleDeleteMeeting = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
      return;
    }
    try {
      await adminApi.deleteMeeting(id);
      setDeletingId(null);
      setMeetings(meetings.filter(m => m.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
      return;
    }
    try {
      await adminApi.deleteSkill(id);
      setDeletingId(null);
      setSkills(skills.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#141414]" size={48} />
      </div>
    );
  }

  // ── Login Screen ────────────────────────────────────────
  if (!user || user.role !== 'admin') {
    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setLoginError(null);
      try {
        await login(emailInput, passwordInput);
      } catch (err: any) {
        setLoginError(err.message || '登入失敗');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
        <div className="bg-white border border-[#141414] rounded-[40px] p-12 w-full max-w-md shadow-2xl text-center">
          <div className="w-20 h-20 bg-[#141414] text-white rounded-3xl flex items-center justify-center mb-8 mx-auto">
            <Shield size={40} />
          </div>
          <h1 className="text-3xl font-serif italic mb-4">管理員登入</h1>
          <p className="text-gray-500 mb-8">請使用管理員帳號登入</p>

          {user && user.role !== 'admin' && (
            <div className="mb-6 p-3 bg-yellow-50 text-yellow-700 rounded-2xl text-sm">
              目前帳號 ({user.email}) 不是管理員。請使用管理員帳號登入。
              <button onClick={logout} className="block mt-2 text-red-500 underline">登出後重試</button>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" placeholder="管理員 Email" value={emailInput} onChange={e => setEmailInput(e.target.value)}
                className="w-full pl-11 pr-4 py-4 rounded-full border-2 border-[#141414] bg-white font-sans focus:outline-none" />
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="password" placeholder="密碼" value={passwordInput} onChange={e => setPasswordInput(e.target.value)}
                className="w-full pl-11 pr-4 py-4 rounded-full border-2 border-[#141414] bg-white font-sans focus:outline-none" />
            </div>

            {loginError && <div className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-full">{loginError}</div>}

            <button type="submit" disabled={submitting}
              className="w-full py-5 bg-[#141414] text-white rounded-full font-bold hover:scale-[1.02] transition-transform shadow-xl flex items-center justify-center gap-3 disabled:opacity-50">
              <LogIn size={20} /> {submitting ? "登入中..." : "管理員登入"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Admin Dashboard Layout ──────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F5F0] flex">
      {/* Sidebar */}
      <div className="w-72 bg-[#141414] text-white flex flex-col p-8 min-h-screen sticky top-0">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-white text-[#141414] rounded-xl flex items-center justify-center">
            <Shield size={20} />
          </div>
          <span className="font-serif italic text-xl">Admin Panel</span>
        </div>

        <nav className="flex-1 space-y-2">
          {([
            { key: 'dashboard' as AdminTab, icon: BarChart3, label: '數據儀表板' },
            { key: 'meetings' as AdminTab, icon: MessageSquare, label: '會議管理' },
            { key: 'skills' as AdminTab, icon: Database, label: 'Skill 管理' },
            { key: 'users' as AdminTab, icon: Users, label: '用戶管理' },
          ]).map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={cn("w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all font-bold text-sm",
                activeTab === key ? "bg-white text-[#141414]" : "text-white/40 hover:text-white hover:bg-white/5")}>
              <Icon size={18} /> {label}
            </button>
          ))}
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
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-6 py-4 text-red-400 hover:text-red-300 transition-colors font-bold text-sm">
            <LogOut size={18} /> 登出
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-12 overflow-y-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-serif italic mb-2">
              {activeTab === 'dashboard' && "數據儀表板"}
              {activeTab === 'meetings' && "會議管理"}
              {activeTab === 'skills' && "Skill 管理"}
              {activeTab === 'users' && "用戶管理"}
            </h2>
            <p className="text-gray-500">
              {activeTab === 'dashboard' && "即時監控所有會議活動與資源消耗"}
              {activeTab === 'meetings' && `共有 ${meetings.length} 場會議`}
              {activeTab === 'skills' && `共有 ${skills.length} 個 Skill`}
              {activeTab === 'users' && `共有 ${users.length} 位用戶`}
            </p>
          </div>
          <button onClick={loadData} disabled={refreshing}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-[#141414]/10 text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50">
            <RefreshCw size={16} className={cn(refreshing && "animate-spin")} /> 重新整理
          </button>
        </header>

        {/* ─── Dashboard Tab ────────────────────────────────── */}
        {activeTab === 'dashboard' && dashboard && (
          <div className="space-y-8">
            {/* Row 1: Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-[28px] border border-[#141414]/10 shadow-sm">
                <div className="flex items-center gap-2 text-gray-400 mb-3">
                  <Coins size={16} />
                  <span className="text-[9px] uppercase tracking-widest font-bold">總花費 (USD)</span>
                </div>
                <div className="text-3xl font-serif italic">${dashboard.totalCost.toFixed(4)}</div>
                <div className="text-[10px] text-gray-400 mt-1">
                  平均 ${dashboard.avgCostPerMeeting.toFixed(4)} / 場
                </div>
              </div>

              <div className="bg-white p-6 rounded-[28px] border border-[#141414]/10 shadow-sm">
                <div className="flex items-center gap-2 text-gray-400 mb-3">
                  <Zap size={16} />
                  <span className="text-[9px] uppercase tracking-widest font-bold">總 Token</span>
                </div>
                <div className="text-3xl font-serif italic">{formatTokens(dashboard.totalTokens)}</div>
                <div className="text-[10px] text-gray-400 mt-1">
                  In: {formatTokens(dashboard.inputTokens)} / Out: {formatTokens(dashboard.outputTokens)}
                </div>
              </div>

              <div className="bg-white p-6 rounded-[28px] border border-[#141414]/10 shadow-sm">
                <div className="flex items-center gap-2 text-gray-400 mb-3">
                  <Clock size={16} />
                  <span className="text-[9px] uppercase tracking-widest font-bold">總時長</span>
                </div>
                <div className="text-3xl font-serif italic">{formatDuration(stats?.totalDuration)}</div>
                <div className="text-[10px] text-gray-400 mt-1">
                  平均 {formatDuration(Math.round(dashboard.avgDuration))} / 場
                </div>
              </div>

              <div className="bg-white p-6 rounded-[28px] border border-[#141414]/10 shadow-sm">
                <div className="flex items-center gap-2 text-gray-400 mb-3">
                  <Users size={16} />
                  <span className="text-[9px] uppercase tracking-widest font-bold">使用者</span>
                </div>
                <div className="text-3xl font-serif italic">{stats?.userCount || 0}</div>
                <div className="text-[10px] text-gray-400 mt-1">
                  {stats?.skillCount || 0} 個 Skill 已建立
                </div>
              </div>
            </div>

            {/* Row 2: Meeting Status + Goals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Meeting Status */}
              <div className="bg-white p-8 rounded-[32px] border border-[#141414]/10 shadow-sm">
                <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-6">會議狀態分佈</h3>
                <div className="flex justify-around">
                  <RingProgress value={dashboard.completed} max={meetings.length || 1} label="完成" color="#22c55e" />
                  <RingProgress value={dashboard.running} max={meetings.length || 1} label="進行中" color="#3b82f6" />
                  <RingProgress value={dashboard.failed + dashboard.pending} max={meetings.length || 1} label="其他" color="#ef4444" />
                </div>
                <div className="mt-6 grid grid-cols-4 gap-2 text-center">
                  {[
                    { icon: CheckCircle2, label: '完成', count: dashboard.completed, color: 'text-green-500' },
                    { icon: PlayCircle, label: '進行', count: dashboard.running, color: 'text-blue-500' },
                    { icon: PauseCircle, label: '等待', count: dashboard.pending, color: 'text-gray-400' },
                    { icon: AlertCircle, label: '失敗', count: dashboard.failed, color: 'text-red-500' },
                  ].map(({ icon: Icon, label, count, color }) => (
                    <div key={label}>
                      <Icon size={16} className={cn("mx-auto mb-1", color)} />
                      <div className="text-lg font-bold">{count}</div>
                      <div className="text-[8px] uppercase font-bold text-gray-400">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7-day Trend */}
              <div className="bg-white p-8 rounded-[32px] border border-[#141414]/10 shadow-sm">
                <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-6">近 7 日會議趨勢</h3>
                <MiniBarChart data={dashboard.last7Days} color="#141414" height={150} />
                <div className="mt-4 text-center text-[10px] text-gray-400">
                  過去 7 天共 {dashboard.last7Days.reduce((s, d) => s + d.value, 0)} 場會議
                </div>
              </div>

              {/* Goal Type Distribution */}
              <div className="bg-white p-8 rounded-[32px] border border-[#141414]/10 shadow-sm">
                <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-6">討論目標類型</h3>
                <div className="space-y-5">
                  {[
                    { key: 'consensus', label: '達成共識', emoji: '🤝', color: 'bg-green-500' },
                    { key: 'exploration', label: '深度探索', emoji: '🔬', color: 'bg-blue-500' },
                    { key: 'brainstorming', label: '腦力激盪', emoji: '💡', color: 'bg-yellow-500' },
                  ].map(({ key, label, emoji, color }) => {
                    const count = dashboard.goalTypes[key as keyof typeof dashboard.goalTypes];
                    const pct = meetings.length > 0 ? (count / meetings.length) * 100 : 0;
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold">{emoji} {label}</span>
                          <span className="text-sm font-mono">{count} 場 ({Math.round(pct)}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all duration-500", color)}
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h4 className="text-[9px] uppercase tracking-widest font-bold text-gray-400 mb-3">Skill 構成</h4>
                  <div className="flex gap-4">
                    <div className="flex-1 text-center p-3 bg-gray-50 rounded-2xl">
                      <div className="text-xl font-bold">{dashboard.systemSkills}</div>
                      <div className="text-[8px] uppercase font-bold text-gray-400">系統預設</div>
                    </div>
                    <div className="flex-1 text-center p-3 bg-gray-50 rounded-2xl">
                      <div className="text-xl font-bold">{dashboard.customSkills}</div>
                      <div className="text-[8px] uppercase font-bold text-gray-400">自訂</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Token Usage + Top Users */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Token Consuming Meetings */}
              <div className="bg-white p-8 rounded-[32px] border border-[#141414]/10 shadow-sm">
                <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-6">Token 消耗排行</h3>
                {dashboard.topTokenMeetings.length > 0 ? (
                  <MiniBarChart data={dashboard.topTokenMeetings} color="#6366f1" height={140} />
                ) : (
                  <div className="text-center text-gray-400 italic py-8">暫無資料</div>
                )}
              </div>

              {/* Top Users */}
              <div className="bg-white p-8 rounded-[32px] border border-[#141414]/10 shadow-sm">
                <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-6">活躍用戶排行</h3>
                {dashboard.topUsers.length > 0 ? (
                  <div className="space-y-4">
                    {dashboard.topUsers.map((u, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white",
                          i === 0 ? "bg-yellow-500" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-orange-400" : "bg-gray-300"
                        )}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold truncate">{u.name}</div>
                          <div className="text-[10px] text-gray-400 truncate">{u.email}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-serif italic">{u.count}</div>
                          <div className="text-[8px] text-gray-400 uppercase font-bold">場會議</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 italic py-8">暫無資料</div>
                )}
              </div>
            </div>

            {/* Row 4: Recent Meetings Quick View */}
            <div className="bg-white p-8 rounded-[32px] border border-[#141414]/10 shadow-sm">
              <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-6">最近會議一覽</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-3 text-[9px] uppercase tracking-widest font-bold text-gray-400">主題</th>
                      <th className="pb-3 text-[9px] uppercase tracking-widest font-bold text-gray-400">發起人</th>
                      <th className="pb-3 text-[9px] uppercase tracking-widest font-bold text-gray-400">狀態</th>
                      <th className="pb-3 text-[9px] uppercase tracking-widest font-bold text-gray-400">Token (In/Out)</th>
                      <th className="pb-3 text-[9px] uppercase tracking-widest font-bold text-gray-400">費用</th>
                      <th className="pb-3 text-[9px] uppercase tracking-widest font-bold text-gray-400">時長</th>
                      <th className="pb-3 text-[9px] uppercase tracking-widest font-bold text-gray-400">建立時間</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {meetings.slice(0, 10).map(m => {
                      const cost = calculateCost(m.totalInputTokens, m.totalOutputTokens);
                      const owner = (m as any).owner;
                      return (
                        <tr key={m.id} className="hover:bg-gray-50/50">
                          <td className="py-3 pr-4">
                            <div className="font-bold text-sm truncate max-w-[200px]">{m.topic}</div>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="text-xs">{owner?.displayName || '-'}</div>
                            <div className="text-[10px] text-gray-400">{owner?.email || ''}</div>
                          </td>
                          <td className="py-3 pr-4">
                            <span className={cn("text-[9px] uppercase font-bold px-2.5 py-1 rounded-full border",
                              m.status === 'completed' ? "bg-green-50 text-green-600 border-green-200" :
                              m.status === 'running' ? "bg-blue-50 text-blue-600 border-blue-200" :
                              m.status === 'failed' ? "bg-red-50 text-red-600 border-red-200" :
                              "bg-gray-50 text-gray-600 border-gray-200"
                            )}>{m.status}</span>
                          </td>
                          <td className="py-3 pr-4 font-mono text-xs">
                            {formatTokens(m.totalInputTokens || 0)} / {formatTokens(m.totalOutputTokens || 0)}
                          </td>
                          <td className="py-3 pr-4 text-sm font-bold">${cost.toFixed(4)}</td>
                          <td className="py-3 pr-4 text-xs">{formatDuration(m.durationSeconds)}</td>
                          <td className="py-3 text-xs text-gray-400">
                            {format(new Date(m.createdAt), "MM/dd HH:mm", { locale: zhTW })}
                          </td>
                        </tr>
                      );
                    })}
                    {meetings.length === 0 && (
                      <tr><td colSpan={7} className="py-8 text-center text-gray-400 italic">暫無會議資料</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── Meetings Tab ─────────────────────────────────── */}
        {activeTab === 'meetings' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white p-8 rounded-[32px] border border-[#141414]/10 shadow-sm">
                <div className="flex items-center gap-3 text-gray-400 mb-4">
                  <Coins size={20} />
                  <span className="text-xs uppercase tracking-widest font-bold">預估總花費 (USD)</span>
                </div>
                <div className="text-4xl font-serif italic">${(stats ? calculateCost(stats.totalInputTokens, stats.totalOutputTokens) : 0).toFixed(6)}</div>
                <div className="text-[10px] text-gray-400 mt-2 font-bold uppercase">基於 Gemini 2.0 Flash 定價</div>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-[#141414]/10 shadow-sm">
                <div className="flex items-center gap-3 text-gray-400 mb-4">
                  <Database size={20} />
                  <span className="text-xs uppercase tracking-widest font-bold">總 Token 消耗</span>
                </div>
                <div className="text-4xl font-serif italic">{((stats?.totalInputTokens || 0) + (stats?.totalOutputTokens || 0)).toLocaleString()}</div>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-[#141414]/10 shadow-sm">
                <div className="flex items-center gap-3 text-gray-400 mb-4">
                  <Clock size={20} />
                  <span className="text-xs uppercase tracking-widest font-bold">總會議時長</span>
                </div>
                <div className="text-4xl font-serif italic">{formatDuration(stats?.totalDuration)}</div>
              </div>
            </div>

            <div className="bg-white border border-[#141414]/10 rounded-[40px] overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold opacity-40">主題</th>
                    <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold opacity-40">發起人</th>
                    <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold opacity-40">耗時 / 消耗</th>
                    <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold opacity-40">預估費用</th>
                    <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold opacity-40">建立時間</th>
                    <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold opacity-40 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141414]/5">
                  {meetings.map(meeting => {
                    const cost = calculateCost(meeting.totalInputTokens, meeting.totalOutputTokens);
                    const owner = (meeting as any).owner;
                    return (
                      <tr key={meeting.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="font-serif italic text-lg">{meeting.topic}</div>
                          <span className={cn("text-[8px] uppercase font-bold px-2 py-0.5 rounded-full border",
                            meeting.status === 'completed' ? "bg-green-50 text-green-600 border-green-200" :
                            meeting.status === 'running' ? "bg-blue-50 text-blue-600 border-blue-200" :
                            meeting.status === 'failed' ? "bg-red-50 text-red-600 border-red-200" :
                            "bg-gray-50 text-gray-600 border-gray-200"
                          )}>{meeting.status}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-sm font-bold">{owner?.displayName || '-'}</div>
                          <div className="text-[10px] text-gray-400">{owner?.email || ''}</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-xs font-bold"><Clock size={12} className="inline opacity-40 mr-1" />{formatDuration(meeting.durationSeconds)}</div>
                          <div className="text-[10px] opacity-40 font-mono">{(meeting.totalInputTokens || 0).toLocaleString()} / {(meeting.totalOutputTokens || 0).toLocaleString()}</div>
                        </td>
                        <td className="px-8 py-6"><div className="text-sm font-bold">${cost.toFixed(6)}</div></td>
                        <td className="px-8 py-6 text-sm opacity-60">{format(new Date(meeting.createdAt), "yyyy/MM/dd HH:mm", { locale: zhTW })}</td>
                        <td className="px-8 py-6 text-right">
                          <button onClick={() => handleDeleteMeeting(meeting.id)}
                            className={cn("px-4 py-2 rounded-xl transition-all font-bold text-sm flex items-center gap-2 ml-auto",
                              deletingId === meeting.id ? "bg-red-500 text-white animate-pulse" : "text-red-500 hover:bg-red-50")}>
                            <Trash2 size={18} />{deletingId === meeting.id ? "確認刪除" : ""}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {meetings.length === 0 && (
                    <tr><td colSpan={6} className="px-8 py-12 text-center text-gray-400 italic">暫無會議資料</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ─── Skills Tab ───────────────────────────────────── */}
        {activeTab === 'skills' && (
          <div className="bg-white border border-[#141414]/10 rounded-[40px] overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold opacity-40">名稱</th>
                  <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold opacity-40">類型</th>
                  <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold opacity-40">擁有者</th>
                  <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold opacity-40">建立時間</th>
                  <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold opacity-40 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/5">
                {skills.map(skill => {
                  const owner = (skill as any).owner;
                  return (
                    <tr key={skill.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{skill.avatar}</span>
                          <div className="font-serif italic text-lg">{skill.name}</div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn("text-[9px] uppercase font-bold px-3 py-1 rounded-full border",
                          skill.isDefault ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-purple-50 text-purple-600 border-purple-200"
                        )}>{skill.isDefault ? "系統預設" : "使用者自訂"}</span>
                      </td>
                      <td className="px-8 py-6 text-sm opacity-60">{owner?.displayName || "System"}</td>
                      <td className="px-8 py-6 text-sm opacity-60">
                        {skill.createdAt ? format(new Date(skill.createdAt), "yyyy/MM/dd HH:mm", { locale: zhTW }) : "-"}
                      </td>
                      <td className="px-8 py-6 text-right">
                        {!skill.isDefault && (
                          <button onClick={() => handleDeleteSkill(skill.id)}
                            className={cn("px-4 py-2 rounded-xl transition-all font-bold text-sm flex items-center gap-2 ml-auto",
                              deletingId === skill.id ? "bg-red-500 text-white animate-pulse" : "text-red-500 hover:bg-red-50")}>
                            <Trash2 size={18} />{deletingId === skill.id ? "確認刪除" : ""}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {skills.length === 0 && (
                  <tr><td colSpan={5} className="px-8 py-12 text-center text-gray-400 italic">暫無 Skill 資料</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Users Tab ────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="bg-white border border-[#141414]/10 rounded-[40px] overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold opacity-40">用戶</th>
                  <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold opacity-40">Email</th>
                  <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold opacity-40">角色</th>
                  <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold opacity-40">會議數</th>
                  <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold opacity-40">註冊時間</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/5">
                {users.map(u => {
                  const userMeetings = meetings.filter(m => m.ownerId === u.id);
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#141414] text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {u.displayName?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="font-bold">{u.displayName}</div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm opacity-60">{u.email}</td>
                      <td className="px-8 py-6">
                        <span className={cn("text-[9px] uppercase font-bold px-3 py-1 rounded-full border",
                          u.role === 'admin' ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-gray-50 text-gray-600 border-gray-200"
                        )}>{u.role}</span>
                      </td>
                      <td className="px-8 py-6 text-lg font-serif italic">{userMeetings.length}</td>
                      <td className="px-8 py-6 text-sm opacity-60">
                        {format(new Date(u.createdAt), "yyyy/MM/dd HH:mm", { locale: zhTW })}
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr><td colSpan={5} className="px-8 py-12 text-center text-gray-400 italic">暫無用戶資料</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
