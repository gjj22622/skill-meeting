'use client';

import { useState, useEffect } from 'react';

interface DashboardStats {
  totalUsers: number;
  totalMeetings: number;
  completedMeetings: number;
  totalTokenUsage: number;
  recentMeetings: Array<{
    id: string;
    title: string;
    user_id: string;
    status: string;
    created_at: string;
  }>;
  meetingsPerDay: Array<{
    date: string;
    count: number;
  }>;
  topUsers: Array<{
    name: string;
    email: string;
    meeting_count: number;
  }>;
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '1.5rem',
        flex: 1,
        minWidth: '200px',
      }}
    >
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>
        {label}
      </p>
      <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color }}>
        {value}
      </p>
    </div>
  );
}

// ── API 使用狀況長條圖 ──

interface ApiKeyUsage {
  provider: string;
  key_index: number;
  label: string;
  total_input_tokens: number;
  total_output_tokens: number;
  total_requests: number;
  daily_token_limit: number | null;
  daily_request_limit: number | null;
  estimated_cost: number;
}

interface ApiUsageData {
  keys: ApiKeyUsage[];
  total_cost: number;
  pool: { gemini: { total: number; available: number } };
}

const PROVIDER_COLORS: Record<string, string> = {
  gemini: '#4285f4',
  openrouter: '#8b5cf6',
  anthropic: '#d97706',
};

function getBarColor(percentage: number): string {
  if (percentage >= 85) return '#ef4444';
  if (percentage >= 60) return '#eab308';
  return '#22c55e';
}

function ApiUsageChart() {
  const [data, setData] = useState<ApiUsageData | null>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch('/api/admin/api-usage');
        if (res.ok) setData(await res.json());
      } catch (e) {
        console.error('Failed to fetch API usage:', e);
      }
    };

    fetchUsage();
    const interval = setInterval(fetchUsage, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return null;

  const geminiPool = data.pool.gemini;

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
            API 使用狀況
          </h2>
          {data.total_cost > 0 && (
            <span style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: data.total_cost > 1 ? '#ef4444' : data.total_cost > 0.1 ? '#eab308' : '#22c55e',
              background: 'var(--bg-primary, #1a1a2e)',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
            }}>
              今日花費 ${data.total_cost.toFixed(4)}
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {data.keys.length} 個 API Key · Gemini {geminiPool.available}/{geminiPool.total} 可用 · 每 30 秒刷新
        </span>
      </div>

      {data.keys.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>
          尚無 API Key 設定
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {data.keys.map((key) => {
            const totalTokens = key.total_input_tokens + key.total_output_tokens;
            const hasLimit = key.daily_token_limit !== null && key.daily_token_limit > 0;
            const percentage = hasLimit
              ? Math.min((totalTokens / key.daily_token_limit!) * 100, 100)
              : 0;
            const remaining = hasLimit ? Math.max(key.daily_token_limit! - totalTokens, 0) : null;
            const barColor = hasLimit ? getBarColor(percentage) : (PROVIDER_COLORS[key.provider] || '#6b7280');
            const barWidth = hasLimit ? Math.max(percentage, 1) : (totalTokens > 0 ? 100 : 2);

            return (
              <div key={`${key.provider}-${key.key_index}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: PROVIDER_COLORS[key.provider] || '#6b7280',
                    }} />
                    {key.label}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {hasLimit
                      ? `${totalTokens.toLocaleString()} / ${key.daily_token_limit!.toLocaleString()} tokens (${percentage.toFixed(1)}%)`
                      : `${totalTokens.toLocaleString()} tokens`
                    }
                    {' · '}{key.total_requests} 次請求
                    {key.estimated_cost > 0 && (
                      <span style={{ color: 'var(--warning)', fontWeight: 600 }}> · ${key.estimated_cost.toFixed(4)}</span>
                    )}
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '24px',
                    background: 'var(--bg-primary, #1a1a2e)',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: `${barWidth}%`,
                      height: '100%',
                      background: barColor,
                      borderRadius: '6px',
                      transition: 'width 0.5s ease, background 0.3s ease',
                      opacity: hasLimit ? 1 : 0.6,
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '0.7rem',
                      color: 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {remaining !== null ? `剩餘 ${remaining.toLocaleString()}` : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/admin/dashboard');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>載入數據中...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--danger)' }}>無法載入儀表板數據</p>
      </div>
    );
  }

  // Find min and max count for scaling bars
  const maxCount = Math.max(...stats.meetingsPerDay.map((d) => d.count), 1);

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>儀表板</h1>

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <StatCard label="總用戶數" value={stats.totalUsers} color="var(--accent)" />
        <StatCard label="總會議數" value={stats.totalMeetings} color="var(--text-primary)" />
        <StatCard label="已完成會議" value={stats.completedMeetings} color="var(--success)" />
        <StatCard label="Token用量" value={stats.totalTokenUsage.toLocaleString()} color="var(--warning)" />
      </div>

      {/* API Usage Chart */}
      <ApiUsageChart />

      {/* Daily Meetings Chart */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
          過去7天會議數量
        </h2>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '150px' }}>
          {stats.meetingsPerDay.length > 0 ? (
            stats.meetingsPerDay.map((day) => (
              <div
                key={day.date}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <div
                  style={{
                    background: 'var(--accent)',
                    width: '100%',
                    height: `${(day.count / maxCount) * 100}px`,
                    borderRadius: '4px 4px 0 0',
                    minHeight: '8px',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {new Date(day.date).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {day.count}
                </span>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>暫無數據</p>
          )}
        </div>
      </div>

      {/* Recent Meetings */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
          最近會議 (過去7天)
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.9rem',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-secondary)' }}>
                  主題
                </th>
                <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-secondary)' }}>
                  發起人
                </th>
                <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-secondary)' }}>
                  狀態
                </th>
                <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-secondary)' }}>
                  建立時間
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.recentMeetings.map((meeting) => (
                <tr key={meeting.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem' }}>{meeting.title}</td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                    {meeting.user_id}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        background:
                          meeting.status === 'completed'
                            ? 'rgba(34, 197, 94, 0.2)'
                            : meeting.status === 'in_progress'
                              ? 'rgba(245, 158, 11, 0.2)'
                              : 'rgba(148, 163, 184, 0.2)',
                        color:
                          meeting.status === 'completed'
                            ? 'var(--success)'
                            : meeting.status === 'in_progress'
                              ? 'var(--warning)'
                              : 'var(--text-secondary)',
                      }}
                    >
                      {meeting.status === 'completed'
                        ? '已完成'
                        : meeting.status === 'in_progress'
                          ? '進行中'
                          : '草稿'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {formatDate(meeting.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Users */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.5rem',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
          活躍用戶Top 5
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.9rem',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-secondary)' }}>
                  名稱
                </th>
                <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-secondary)' }}>
                  Email
                </th>
                <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-secondary)' }}>
                  會議數
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.topUsers.map((user, index) => (
                <tr key={index} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem' }}>{user.name}</td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                    {user.email}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        background: 'rgba(59, 130, 246, 0.2)',
                        color: 'var(--accent)',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                      }}
                    >
                      {user.meeting_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
