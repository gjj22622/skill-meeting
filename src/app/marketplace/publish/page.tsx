'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SkillCategory, SKILL_CATEGORIES, PublishSkillData } from '@/lib/marketplace-types';

export default function PublishPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<PublishSkillData>({
    name: '',
    avatar: '🧠',
    expertise: [],
    personality: '',
    prompt: '',
    signature: { style: '---\n{name}\n🎯 專長：{expertise}' },
    description: '',
    category: 'other',
    tags: [],
    authorName: '',
    price: 0,
    currency: 'TWD',
  });

  const [expertiseInput, setExpertiseInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.name || !form.prompt || !form.description || !form.authorName) {
      setError('請填寫所有必要欄位');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        expertise: expertiseInput.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
        tags: tagsInput.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
      };

      const res = await fetch('/api/marketplace/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '發佈失敗');
      }

      const skill = await res.json();
      router.push(`/marketplace/skill/${skill.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '發佈失敗');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <a href="/marketplace" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-block', marginBottom: '1rem' }}>
        ← 回到市集
      </a>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        📤 發佈 Skill 到市集
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        將你的 AI 角色分享給所有人使用
      </p>

      <form onSubmit={handleSubmit}>
        {/* 基本資訊 */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>基本資訊</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                頭像
              </label>
              <input
                className="input-field"
                value={form.avatar}
                onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                style={{ textAlign: 'center', fontSize: '1.5rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                名稱 *
              </label>
              <input
                className="input-field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例：策略顧問"
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
              作者名稱 *
            </label>
            <input
              className="input-field"
              value={form.authorName}
              onChange={(e) => setForm({ ...form, authorName: e.target.value })}
              placeholder="你的名稱或組織名稱"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                分類 *
              </label>
              <select
                className="input-field"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as SkillCategory })}
              >
                {(Object.entries(SKILL_CATEGORIES) as [SkillCategory, string][]).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                標籤（逗號分隔）
              </label>
              <input
                className="input-field"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="策略, 商業, 分析"
              />
            </div>
          </div>
        </div>

        {/* 角色設定 */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>角色設定</h2>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
              專長領域（逗號分隔）
            </label>
            <input
              className="input-field"
              value={expertiseInput}
              onChange={(e) => setExpertiseInput(e.target.value)}
              placeholder="商業策略, 競爭分析, 市場定位"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
              人格特質
            </label>
            <input
              className="input-field"
              value={form.personality}
              onChange={(e) => setForm({ ...form, personality: e.target.value })}
              placeholder="善於從全局角度思考，注重長期價值..."
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
              System Prompt *
            </label>
            <textarea
              className="input-field"
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              placeholder="你是一位..."
              style={{ minHeight: '120px', fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
              簽名樣式
            </label>
            <input
              className="input-field"
              value={form.signature.style}
              onChange={(e) => setForm({ ...form, signature: { style: e.target.value } })}
              placeholder="---\n{name} | 座右銘\n專長：{expertise}"
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {/* 市集描述 */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>市集描述</h2>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
              詳細描述 *（支援 Markdown）
            </label>
            <textarea
              className="input-field"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="描述這個 Skill 的特色、適用場景、使用建議..."
              style={{ minHeight: '150px', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {error}
          </p>
        )}

        {/* 提交 */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <a href="/marketplace" className="btn-secondary" style={{ textDecoration: 'none' }}>
            取消
          </a>
          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? '發佈中...' : '📤 發佈到市集'}
          </button>
        </div>
      </form>
    </div>
  );
}
