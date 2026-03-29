'use client';

import { useState, useEffect } from 'react';

interface DefaultSkill {
  id: string;
  name: string;
  avatar: string;
  expertise: string[];
  personality: Record<string, any>;
  prompt: string;
  is_visible: number;
}

interface CustomSkillAudit {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  name: string;
  avatar: string;
  expertise: string[];
  personality: string;
  isActive: boolean;
  createdAt: string;
}

type TabType = 'default' | 'custom';

export default function AdminSkillsPage() {
  const [tab, setTab] = useState<TabType>('default');
  const [defaultSkills, setDefaultSkills] = useState<DefaultSkill[]>([]);
  const [customSkills, setCustomSkills] = useState<CustomSkillAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    avatar: '🎯',
    expertise: '',
    personality: '',
    prompt: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    fetchDefaultSkills();
    fetchCustomSkills();
  }, []);

  const fetchDefaultSkills = async () => {
    try {
      const res = await fetch('/api/admin/skills');
      if (res.ok) {
        const data = await res.json();
        setDefaultSkills(data);
      }
    } catch (error) {
      console.error('Failed to fetch default skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomSkills = async () => {
    try {
      const res = await fetch('/api/admin/skills/custom');
      if (res.ok) {
        const data = await res.json();
        setCustomSkills(data);
      }
    } catch (error) {
      console.error('Failed to fetch custom skills:', error);
    }
  };

  const handleToggleVisibility = async (skillId: string, currentVisibility: number) => {
    setTogglingId(skillId);
    const skill = defaultSkills.find(s => s.id === skillId);
    try {
      const res = await fetch(`/api/admin/skills/${skillId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_visible: currentVisibility === 1 ? 0 : 1 }),
      });

      if (res.ok) {
        const updated = await res.json();
        setDefaultSkills(
          defaultSkills.map((s) =>
            s.id === skillId ? { ...s, is_visible: updated.is_visible } : s
          )
        );
        const isNowVisible = updated.is_visible === 1;
        showToast(`${skill?.name || 'Skill'} 已${isNowVisible ? '啟用' : '隱藏'}`, 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(`切換失敗：${err.error || '未知錯誤'}`, 'error');
      }
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
      showToast('切換失敗，請稍後再試', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('請填寫 Skill 名稱');
      return;
    }

    setSubmitting(true);
    try {
      const expertiseArray = formData.expertise
        .split(',')
        .map((e) => e.trim())
        .filter((e) => e);

      const res = await fetch('/api/admin/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          avatar: formData.avatar,
          expertise: expertiseArray,
          personality: formData.personality ? { description: formData.personality } : {},
          prompt: formData.prompt,
        }),
      });

      if (res.ok) {
        const newSkill = await res.json();
        setDefaultSkills([...defaultSkills, newSkill]);
        setFormData({ name: '', avatar: '🎯', expertise: '', personality: '', prompt: '' });
        setShowForm(false);
      } else {
        alert('新增失敗');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('新增失敗');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (skillId: string) => {
    if (!confirm('確認要刪除此預設 Skill 嗎？所有用戶將無法再使用此 Skill。')) return;

    try {
      const res = await fetch(`/api/admin/skills/${skillId}`, { method: 'DELETE' });
      if (res.ok) {
        setDefaultSkills(defaultSkills.filter((s) => s.id !== skillId));
      } else {
        alert('刪除失敗');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('刪除失敗');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>載入中...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Skill 管理
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          管理系統預設 Skill 與查看用戶自訂 Skill
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0',
        marginBottom: '1.5rem',
        borderBottom: '2px solid var(--border)',
      }}>
        <button
          onClick={() => setTab('default')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: tab === 'default' ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: '-2px',
            color: tab === 'default' ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: tab === 'default' ? 700 : 500,
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          🏛️ 系統預設 Skill（{defaultSkills.length}）
        </button>
        <button
          onClick={() => setTab('custom')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: tab === 'custom' ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: '-2px',
            color: tab === 'custom' ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: tab === 'custom' ? 700 : 500,
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          🧩 用戶自訂 Skill（{customSkills.length}）
        </button>
      </div>

      {/* ========== Tab: Default Skills ========== */}
      {tab === 'default' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                padding: '0.6rem 1.2rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
            >
              {showForm ? '取消' : '+ 新增預設 Skill'}
            </button>
          </div>

          {/* Create form */}
          {showForm && (
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem',
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                新增預設 Skill
              </h2>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    Skill 名稱
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：數據分析師"
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    頭像（Emoji）
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value.slice(0, 2) })}
                    placeholder="🎯"
                    maxLength={2}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    專業標籤（逗號分隔）
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.expertise}
                    onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                    placeholder="例如：數據分析,統計學,Python"
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    性格特徵
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.personality}
                    onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                    placeholder="例如：精確、客觀、邏輯思維強"
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    系統提示詞
                  </label>
                  <textarea
                    className="input-field"
                    value={formData.prompt}
                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                    placeholder="描述這個 Skill 的行為和思維方式"
                    style={{ minHeight: '120px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      background: 'var(--accent)',
                      color: 'white',
                      border: 'none',
                      padding: '0.6rem 1.5rem',
                      borderRadius: '6px',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      opacity: submitting ? 0.6 : 1,
                    }}
                  >
                    {submitting ? '創建中...' : '創建 Skill'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    style={{
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                      padding: '0.6rem 1.5rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Default skills grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}>
            {defaultSkills.map((skill) => {
              const isHidden = !skill.is_visible;
              return (
              <div
                key={skill.id}
                style={{
                  background: isHidden
                    ? 'repeating-linear-gradient(135deg, var(--bg-secondary), var(--bg-secondary) 10px, rgba(0,0,0,0.02) 10px, rgba(0,0,0,0.02) 20px)'
                    : 'var(--bg-secondary)',
                  border: `1px solid ${isHidden ? '#f87171' : 'var(--border)'}`,
                  borderRadius: '12px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: isHidden ? 0.6 : 1,
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{
                    fontSize: '2.5rem',
                    width: '60px',
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-card)',
                    borderRadius: '8px',
                    position: 'relative',
                  }}>
                    {skill.avatar}
                    <span style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: isHidden ? '#ef4444' : '#22c55e',
                      border: '2px solid var(--bg-secondary)',
                    }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>
                      {skill.name}
                    </h3>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      background: isHidden ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.2)',
                      color: isHidden ? '#dc2626' : 'var(--success)',
                    }}>
                      {isHidden ? '🚫 已隱藏' : '用戶可見'}
                    </span>
                  </div>
                </div>

                {skill.expertise && skill.expertise.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {skill.expertise.map((tag, idx) => (
                        <span
                          key={idx}
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            background: 'rgba(59, 130, 246, 0.2)',
                            color: 'var(--accent)',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '1rem', padding: '0.75rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.9rem', color: isHidden ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                    {togglingId === skill.id ? '更新中...' : '用戶可見'}
                  </span>
                  {/* Toggle Switch */}
                  <span
                    onClick={() => togglingId !== skill.id && handleToggleVisibility(skill.id, skill.is_visible)}
                    style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: 44,
                      height: 24,
                      borderRadius: 12,
                      background: isHidden ? '#d1d5db' : 'var(--accent, #3b82f6)',
                      cursor: togglingId === skill.id ? 'not-allowed' : 'pointer',
                      transition: 'background 0.25s ease',
                      opacity: togglingId === skill.id ? 0.5 : 1,
                      flexShrink: 0,
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: 2,
                      left: isHidden ? 2 : 22,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      transition: 'left 0.25s ease',
                    }} />
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleDelete(skill.id)}
                    style={{
                      flex: 1,
                      background: 'var(--danger)',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#dc2626'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--danger)'; }}
                  >
                    刪除
                  </button>
                </div>
              </div>
              );
            })}
          </div>

          {defaultSkills.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>暫無預設 Skill</p>
            </div>
          )}
        </>
      )}

      {/* ========== Tab: User Custom Skills (Audit) ========== */}
      {tab === 'custom' && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              此為唯讀總覽，顯示所有用戶建立的自訂 Skill。用戶自行管理自己的 Skill。
            </p>
          </div>

          {customSkills.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>暫無用戶自訂 Skill</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.9rem',
              }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Skill</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>用戶</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>專長</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>狀態</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>建立時間</th>
                  </tr>
                </thead>
                <tbody>
                  {customSkills.map((skill) => (
                    <tr key={skill.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.5rem' }}>{skill.avatar}</span>
                          <span style={{ fontWeight: 500 }}>{skill.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 500 }}>{skill.userName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{skill.userEmail}</div>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {skill.expertise.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              style={{
                                display: 'inline-block',
                                padding: '0.15rem 0.4rem',
                                borderRadius: '3px',
                                fontSize: '0.7rem',
                                background: 'rgba(59, 130, 246, 0.15)',
                                color: 'var(--accent)',
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                          {skill.expertise.length > 3 && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                              +{skill.expertise.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          background: skill.isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                          color: skill.isActive ? 'var(--success)' : 'var(--text-secondary)',
                        }}>
                          {skill.isActive ? '啟用中' : '已停用'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {new Date(skill.createdAt).toLocaleDateString('zh-TW')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          padding: '0.65rem 1.25rem',
          borderRadius: '0.75rem',
          background: toast.type === 'success' ? '#22c55e' : '#ef4444',
          color: 'white',
          fontSize: '0.875rem',
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          animation: 'toast-in 0.3s ease',
        }}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.text}
        </div>
      )}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
