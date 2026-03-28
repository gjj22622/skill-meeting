'use client';

import { useState, useEffect } from 'react';

interface Meeting {
  id: string;
  title: string;
  user_id: string;
  user_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  context?: any;
  objectives?: any;
  strategy?: any;
  tactics?: any;
  actions?: any;
  control?: any;
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const res = await fetch('/api/admin/meetings');
      if (res.ok) {
        const data = await res.json();
        setMeetings(data);
      }
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (meetingId: string) => {
    if (!confirm('確認要刪除此會議嗎?')) {
      return;
    }

    setDeletingId(meetingId);
    try {
      const res = await fetch(`/api/admin/meetings/${meetingId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMeetings(meetings.filter((m) => m.id !== meetingId));
      } else {
        alert('刪除失敗');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('刪除失敗');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'rgba(34, 197, 94, 0.2)', text: 'var(--success)' };
      case 'in_progress':
        return { bg: 'rgba(245, 158, 11, 0.2)', text: 'var(--warning)' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.2)', text: 'var(--text-secondary)' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'in_progress':
        return '進行中';
      default:
        return '草稿';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>載入會議列表中...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          會議管理
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          共 {meetings.length} 場會議
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {meetings.map((meeting) => {
          const isExpanded = expandedId === meeting.id;
          const colors = getStatusColor(meeting.status);

          return (
            <div
              key={meeting.id}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              {/* Header Row */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : meeting.id)}
                style={{
                  padding: '1.25rem',
                  cursor: 'pointer',
                  display: 'grid',
                  gridTemplateColumns: '1fr 150px 100px 80px 150px 100px',
                  gap: '1rem',
                  alignItems: 'center',
                  borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div>
                  <p style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                    {meeting.title}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                    ID: {meeting.id.slice(0, 8)}...
                  </p>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {meeting.user_name || meeting.user_id}
                </p>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    background: colors.bg,
                    color: colors.text,
                  }}
                >
                  {getStatusLabel(meeting.status)}
                </span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, textAlign: 'center' }}>
                  —
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {formatDate(meeting.created_at)}
                </p>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </div>
              </div>

              {/* Details Row */}
              {isExpanded && (
                <div style={{ padding: '1.5rem', background: 'rgba(59, 130, 246, 0.05)', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    {/* Context */}
                    {meeting.context && Object.keys(meeting.context).length > 0 && (
                      <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>
                          現況分析
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0, lineHeight: '1.5', maxHeight: '100px', overflow: 'auto' }}>
                          {typeof meeting.context === 'string' ? meeting.context : JSON.stringify(meeting.context).slice(0, 200)}
                        </p>
                      </div>
                    )}

                    {/* Objectives */}
                    {meeting.objectives && Object.keys(meeting.objectives).length > 0 && (
                      <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>
                          目標
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0, lineHeight: '1.5', maxHeight: '100px', overflow: 'auto' }}>
                          {typeof meeting.objectives === 'string' ? meeting.objectives : JSON.stringify(meeting.objectives).slice(0, 200)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Timestamps */}
                  <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <div>
                      <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-secondary)' }}>創建時間</p>
                      <p style={{ margin: 0 }}>{formatDate(meeting.created_at)}</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-secondary)' }}>更新時間</p>
                      <p style={{ margin: 0 }}>{formatDate(meeting.updated_at)}</p>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <div style={{ marginTop: '1.5rem' }}>
                    <button
                      onClick={() => handleDelete(meeting.id)}
                      disabled={deletingId === meeting.id}
                      style={{
                        background: 'var(--danger)',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        cursor: deletingId === meeting.id ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        opacity: deletingId === meeting.id ? 0.6 : 1,
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (deletingId !== meeting.id) {
                          e.currentTarget.style.background = '#dc2626';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--danger)';
                      }}
                    >
                      {deletingId === meeting.id ? '刪除中...' : '刪除會議'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {meetings.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>暫無會議</p>
        </div>
      )}
    </div>
  );
}
