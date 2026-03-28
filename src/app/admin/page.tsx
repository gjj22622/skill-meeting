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
