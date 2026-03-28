'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  meeting_count: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current admin
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const me = await meRes.json();
          setCurrentAdmin(me.id);
        }

        // Get users
        const usersRes = await fetch('/api/admin/users');
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDelete = async (userId: string) => {
    if (userId === currentAdmin) {
      alert('無法刪除自己的帳戶');
      return;
    }

    if (!confirm('確認要刪除此用戶嗎?')) {
      return;
    }

    setDeletingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setUsers(users.filter((u) => u.id !== userId));
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
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>載入用戶列表中...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          用戶管理
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          共 {users.length} 位用戶
        </p>
      </div>

      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.9rem',
            }}
          >
            <thead>
              <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)' }}>
                  名稱
                </th>
                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)' }}>
                  Email
                </th>
                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)' }}>
                  角色
                </th>
                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)' }}>
                  會議數
                </th>
                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)' }}>
                  註冊時間
                </th>
                <th style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>{user.name}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    {user.email}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        background: user.role === 'admin' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        color: user.role === 'admin' ? 'var(--danger)' : 'var(--accent)',
                      }}
                    >
                      {user.role === 'admin' ? '管理員' : '用戶'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>{user.meeting_count}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {formatDate(user.created_at)}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={deletingId === user.id || user.id === currentAdmin}
                      style={{
                        background: 'var(--danger)',
                        color: 'white',
                        border: 'none',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '4px',
                        cursor: user.id === currentAdmin ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem',
                        opacity: user.id === currentAdmin ? 0.5 : 1,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (user.id !== currentAdmin) {
                          e.currentTarget.style.background = '#dc2626';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--danger)';
                      }}
                    >
                      {deletingId === user.id ? '刪除中...' : '刪除'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {users.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>暫無用戶</p>
        </div>
      )}
    </div>
  );
}
