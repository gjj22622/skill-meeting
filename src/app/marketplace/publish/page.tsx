'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SkillCategory, SKILL_CATEGORIES } from '@/lib/marketplace-types';
import { publishSkillLocally } from '@/lib/marketplace-client-store';

export default function PublishPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🧠');
  const [authorName, setAuthorName] = useState('');
  const [category, setCategory] = useState<SkillCategory>('other');
  const [tagsInput, setTagsInput] = useState('');
  const [expertiseInput, setExpertiseInput] = useState('');
  const [personality, setPersonality] = useState('');
  const [prompt, setPrompt] = useState('');
  const [signatureStyle, setSignatureStyle] = useState('---\n{name}\n專長：{expertise}');
  const [description, setDescription] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name || !prompt || !description || !authorName) {
      setError('請填寫所有必要欄位');
      return;
    }

    try {
      const skill = publishSkillLocally({
        name,
        avatar,
        expertise: expertiseInput.split(/[,，、]/).map((s) => s.trim()).filter(Boolean),
        personality,
        prompt,
        signature: { style: signatureStyle },
        description,
        category,
        tags: tagsInput.split(/[,，、]/).map((s) => s.trim()).filter(Boolean),
        authorId: 'local-user',
        authorName,
        locale: 'zh-TW',
        version: '1.0.0',
        downloads: 0,
        rating: 0,
        reviewCount: 0,
        price: 0,
        currency: 'TWD',
        status: 'published',
        featured: false,
        isDefault: false,
      });
      router.push(`/marketplace/skill/${skill.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '發佈失敗');
    }
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <a href="/marketplace" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-block', marginBottom: '1rem' }}>
        ← 回到市集
      </a>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        發佈 Skill 到市集
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        將你的 AI 角色分享給所有人使用
      </p>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>基本資訊</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                頭像
              </label>
              <input
                className="input-field"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                style={{ textAlign: 'center', fontSize: '1.5rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                名稱 *
              </label>
              <input
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
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
                value={category}
                onChange={(e) => setCategory(e.target.value as SkillCategory)}
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
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="善於從全局角度思考，注重長期價值..."
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
              System Prompt *
            </label>
            <textarea
              className="input-field"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
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
              value={signatureStyle}
              onChange={(e) => setSignatureStyle(e.target.value)}
              placeholder="---\n{name} | 座右銘\n專長：{expertise}"
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>市集描述</h2>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
              詳細描述 *
            </label>
            <textarea
              className="input-field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述這個 Skill 的特色、適用場景、使用建議..."
              style={{ minHeight: '150px', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {error && (
          <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <a href="/marketplace" className="btn-secondary" style={{ textDecoration: 'none' }}>
            取消
          </a>
          <button className="btn-primary" type="submit">
            發佈到市集
          </button>
        </div>
      </form>
    </div>
  );
}
