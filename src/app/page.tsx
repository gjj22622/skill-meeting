'use client';

import { useEffect, useState } from 'react';
import { Meeting } from '@/lib/types';
import { getMeetings } from '@/lib/skill-store';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setMeetings(getMeetings());
  }, []);

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirm(id);
  };

  const handleDeleteConfirm = async (id: string) => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/meetings/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setMeetings((prev) => prev.filter((m) => m.id !== id));
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Failed to delete meeting:', error);
    } finally {
      setDeleting(false);
    }
  };

  const statusLabels: Record<string, { text: string; color: string }> = {
    draft: { text: '草稿', color: 'var(--text-secondary)' },
    in_progress: { text: '進行中', color: 'var(--warning)' },
    completed: { text: '已完成', color: 'var(--success)' },
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>🏛️ Skill Meeting</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            讓 AI 角色進行多輪圓桌討論，產出結構化報告
          </p>
        </div>
        <a href="/meeting/new" className="btn-primary" style={{ textDecoration: 'none', fontSize: '1rem', padding: '0.75rem 2rem' }}>
          + 新會議
        </a>
      </div>

      {meetings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏛️</p>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>還沒有任何會議</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            建立你的第一場 AI 圓桌討論吧！
          </p>
          <a href="/meeting/new" className="btn-primary" style={{ textDecoration: 'none' }}>
            開始建立
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {meetings.map((m: Meeting) => {
            const status = statusLabels[m.status] || statusLabels.draft;
            return (
              <div key={m.id} style={{ position: 'relative' }}>
                <a
                  href={m.status === 'completed' && m.report ? `/reports/${m.id}` : `/meeting/${m.id}`}
                  className="card"
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>{m.topic}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {new Date(m.createdAt).toLocaleDateString('zh-TW')} · {m.skillIds.length} 位參與者 · {m.rounds} 輪討論
                      </p>
                    </div>
                    <span className="badge" style={{ color: status.color }}>
                      {status.text}
                    </span>
                  </div>
                </a>
                {/* Delete button - positioned top-right */}
                <button
                  onClick={(e) => handleDeleteClick(e, m.id)}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                    padding: '0.5rem',
                    opacity: 0.6,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.opacity = '0.6';
                  }}
                  title="刪除會議"
                >
                  🗑️
                </button>

                {/* Confirmation dialog */}
                {deleteConfirm === m.id && (
                  <div
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(0, 0, 0, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1000,
                    }}
                    onClick={() => setDeleteConfirm(null)}
                  >
                    <div
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.75rem',
                        padding: '2rem',
                        maxWidth: '400px',
                        width: '90%',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>確認刪除</h3>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                        確定要刪除會議「{m.topic}」嗎？此操作無法復原。
                      </p>
                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="btn-secondary"
                          disabled={deleting}
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleDeleteConfirm(m.id)}
                          disabled={deleting}
                          style={{
                            background: 'var(--danger)',
                            color: 'white',
                            padding: '0.5rem 1.5rem',
                            borderRadius: '0.5rem',
                            fontWeight: 600,
                            border: 'none',
                            cursor: deleting ? 'not-allowed' : 'pointer',
                            opacity: deleting ? 0.5 : 1,
                          }}
                        >
                          {deleting ? '刪除中...' : '刪除'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
