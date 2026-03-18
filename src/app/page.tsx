'use client';

import { useEffect, useState } from 'react';
import { Meeting } from '@/lib/types';
import { getMeetings } from '@/lib/skill-store';

export default function HomePage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    setMeetings(getMeetings());
  }, []);

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
              <a
                key={m.id}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
