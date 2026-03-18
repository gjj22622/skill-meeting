'use client';

import { useState } from 'react';
import { Skill } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface SkillFormProps {
  onSave: (skill: Skill) => void;
  onCancel: () => void;
  initial?: Skill;
}

const EMOJI_OPTIONS = ['🧠', '📊', '🔬', '🎨', '⚡', '🛡️', '💡', '🌍', '📈', '🔮', '🎯', '🏗️', '😈', '🧑‍🎨', '👨‍💼', '👩‍🔬'];

export default function SkillForm({ onSave, onCancel, initial }: SkillFormProps) {
  const [name, setName] = useState(initial?.name || '');
  const [avatar, setAvatar] = useState(initial?.avatar || '🧠');
  const [expertise, setExpertise] = useState(initial?.expertise.join('、') || '');
  const [personality, setPersonality] = useState(initial?.personality || '');
  const [prompt, setPrompt] = useState(initial?.prompt || '');
  const [signatureStyle, setSignatureStyle] = useState(
    initial?.signature.style || '{avatar} {name} | 我的座右銘\n📋 專長：{expertise}'
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const skill: Skill = {
      id: initial?.id || uuidv4(),
      name,
      avatar,
      expertise: expertise.split(/[、,，]/).map((s) => s.trim()).filter(Boolean),
      personality,
      prompt,
      signature: { style: signatureStyle },
    };
    onSave(skill);
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '600px' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        {initial ? '編輯 Skill' : '建立新 Skill'}
      </h2>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          頭像
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setAvatar(e)}
              style={{
                fontSize: '1.5rem',
                padding: '0.375rem',
                background: avatar === e ? 'var(--accent)' : 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          名稱
        </label>
        <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="例：市場分析師" required />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          專長（用頓號分隔）
        </label>
        <input className="input-field" value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="例：市場趨勢、競品分析、用戶研究" required />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          個性描述
        </label>
        <input className="input-field" value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder="例：數據驅動、注重量化指標" required />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          角色提示詞
        </label>
        <textarea className="input-field" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="描述這個角色的背景、專業知識和回答風格..." required />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          簽名樣式（可用 {'{name}'} 和 {'{expertise}'} 變數）
        </label>
        <textarea className="input-field" value={signatureStyle} onChange={(e) => setSignatureStyle(e.target.value)} style={{ minHeight: '60px' }} />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button type="button" className="btn-secondary" onClick={onCancel}>取消</button>
        <button type="submit" className="btn-primary">儲存</button>
      </div>
    </form>
  );
}
