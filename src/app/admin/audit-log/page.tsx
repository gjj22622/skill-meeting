'use client';

import { useState, useEffect } from 'react';

interface AuditLog {
  id: string;
  admin_id: string;
  admin_name: string;
  admin_email: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: string;
  created_at: string;
}

interface AuditResponse {
  logs: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

const ACTION_LABELS: Record<string, string> = {
  'skill_create': '新增 Skill',
  'skill_update': '更新 Skill',
  'skill_delete': '刪除 Skill',
  'skill_visibility_toggle': '切換 Skill 可見性',
  'user_delete': '刪除用戶',
  'meeting_delete': '刪除會議',
};

const RESOURCE_LABELS: Record<string, string> = {
  'skill': 'Skill',
  'user': '用戶',
  'meeting': '會議',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    try {
      const offset = (page - 1) * limit;
      const res = await fetch(`/api/admin/audit-log?limit=${limit}&offset=${offset}`);
      if (res.ok) {
        const data: AuditResponse = await res.json();
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch audit log:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionLabel = (action: string) => {
    return ACTION_LABELS[action] || action;
  };

  const getResourceLabel = (resourceType: string) => {
    return RESOURCE_LABELS[resourceType] || resourceType;
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>載入操作記錄中...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          操作記錄
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          共 {total} 筆記錄
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
                  時間
                </th>
                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)' }}>
                  管理員
                </th>
                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)' }}>
                  動作
                </th>
                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)' }}>
                  資源類型
                </th>
                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)' }}>
                  資源ID
                </th>
                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)' }}>
                  詳細信息
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {formatDate(log.created_at)}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>
                        {log.admin_name || log.admin_id}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {log.admin_email}
                      </p>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        background: 'rgba(59, 130, 246, 0.2)',
                        color: 'var(--accent)',
                      }}
                    >
                      {getActionLabel(log.action)}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                    {getResourceLabel(log.resource_type)}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    {log.resource_id.slice(0, 8)}...
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                    <div
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={log.details}
                    >
                      {log.details}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {logs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>暫無操作記錄</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            style={{
              background: page === 1 ? 'var(--bg-card)' : 'var(--accent)',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.5 : 1,
            }}
          >
            上一頁
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                background: p === page ? 'var(--accent)' : 'var(--bg-card)',
                color: 'white',
                border: '1px solid var(--border)',
                padding: '0.5rem 0.75rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: p === page ? 600 : 400,
              }}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            style={{
              background: page === totalPages ? 'var(--bg-card)' : 'var(--accent)',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              opacity: page === totalPages ? 0.5 : 1,
            }}
          >
            下一頁
          </button>
        </div>
      )}
    </div>
  );
}
