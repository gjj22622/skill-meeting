'use client';

import { useState, useEffect } from 'react';

interface Skill {
  id: string;
  name: string;
  avatar: string;
  expertise: string[];
  personality: Record<string, any>;
  prompt: string;
  is_visible: number;
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
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

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const res = await fetch('/api/admin/skills');
      if (res.ok) {
        const data = await res.json();
        setSkills(data);
      }
    } catch (error) {
      console.error('Failed to fetch skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (skillId: string, currentVisibility: number) => {
    setTogglingId(skillId);
    try {
      const res = await fetch(`/api/admin/skills/${skillId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_visible: currentVisibility === 1 ? 0 : 1 }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSkills(
          skills.map((s) =>
            s.id === skillId ? { ...s, is_visible: updated.is_visible } : s
          )
        );
      }
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
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
        setSkills([...skills, newSkill]);
        setFormData({
          name: '',
          avatar: '🎯',
          expertise: '',
          personality: '',
          prompt: '',
        });
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
    if (!confirm('確認要刪除此 Skill 嗎?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/skills/${skillId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSkills(skills.filter((s) => s.id !== skillId));
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
        <p style={{ color: 'var(--text-secondary)' }}>載入 Skill 列表中...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Skill 管理
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            共 {skills.length} 個預設 Skill
          </p>
        </div>
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
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--accent)';
          }}
        >
          {showForm ? '取消' : '新增預設Skill'}
        </button>
      </div>

      {/* Add Skill Form */}
      {showForm && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}
        >
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

      {/* Skills Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {skills.map((skill) => (
          <div
            key={skill.id}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Avatar and Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div
                style={{
                  fontSize: '2.5rem',
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-card)',
                  borderRadius: '8px',
                }}
              >
                {skill.avatar}
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>
                  {skill.name}
                </h3>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    background: skill.is_visible ? 'rgba(34, 197, 94, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                    color: skill.is_visible ? 'var(--success)' : 'var(--text-secondary)',
                  }}
                >
                  {skill.is_visible ? '可見' : '隱藏'}
                </span>
              </div>
            </div>

            {/* Expertise Tags */}
            {skill.expertise && skill.expertise.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>
                  專業標籤
                </p>
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

            {/* Personality */}
            {skill.personality && Object.keys(skill.personality).length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>
                  性格特徵
                </p>
                <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-primary)' }}>
                  {skill.personality.description || '—'}
                </p>
              </div>
            )}

            {/* Visibility Toggle */}
            <div style={{ marginBottom: '1rem', padding: '1rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={skill.is_visible === 1}
                  onChange={() => handleToggleVisibility(skill.id, skill.is_visible)}
                  disabled={togglingId === skill.id}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: togglingId === skill.id ? 'not-allowed' : 'pointer',
                  }}
                />
                <span style={{ fontSize: '0.9rem' }}>
                  {togglingId === skill.id ? '更新中...' : '用戶可見'}
                </span>
              </label>
            </div>

            {/* Actions */}
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--danger)';
                }}
              >
                刪除
              </button>
            </div>
          </div>
        ))}
      </div>

      {skills.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>暫無預設 Skill</p>
        </div>
      )}
    </div>
  );
}
