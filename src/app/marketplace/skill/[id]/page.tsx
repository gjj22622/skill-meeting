'use client';

import { useState, useEffect, use } from 'react';
import { MarketplaceSkill, SKILL_CATEGORIES } from '@/lib/marketplace-types';
import { getMarketplaceSkillById } from '@/lib/marketplace-client-store';
import StarRating from '@/components/marketplace/star-rating';
import InstallButton from '@/components/marketplace/install-button';

export default function SkillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [skill, setSkill] = useState<MarketplaceSkill | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const found = getMarketplaceSkillById(id);
    setSkill(found || null);
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>載入中...</p>
      </div>
    );
  }

  if (!skill) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>找不到此 Skill</p>
        <a href="/marketplace" className="btn-secondary" style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}>
          回到市集
        </a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <a href="/marketplace" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-block', marginBottom: '1rem' }}>
        ← 回到市集
      </a>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
          <div style={{ fontSize: '3rem' }}>{skill.avatar}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{skill.name}</h1>
              {skill.featured && (
                <span className="badge" style={{ background: 'var(--warning)', color: '#000', border: 'none' }}>
                  精選
                </span>
              )}
              {skill.price === 0 ? (
                <span className="badge" style={{ background: 'var(--success)', color: '#fff', border: 'none' }}>
                  免費
                </span>
              ) : (
                <span className="badge" style={{ background: 'var(--accent)', color: '#fff', border: 'none' }}>
                  ${skill.price} {skill.currency}
                </span>
              )}
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              {skill.authorAvatar || '👤'} {skill.authorName} · {SKILL_CATEGORIES[skill.category]} · v{skill.version}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
              <StarRating rating={skill.rating} reviewCount={skill.reviewCount} size="md" />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {skill.downloads} 下載
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {skill.tags.map((tag) => (
                <span key={tag} className="badge">{tag}</span>
              ))}
            </div>

            <InstallButton skillId={skill.id} skillName={skill.name} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>介紹</h2>
        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {skill.description}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>角色設定</h2>
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
            人格特質
          </h3>
          <p>{skill.personality}</p>
        </div>
        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
            專長領域
          </h3>
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
            {skill.expertise.map((exp) => (
              <span key={exp} className="badge">{exp}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>System Prompt</h2>
          <button
            className="btn-secondary"
            onClick={() => setShowPrompt(!showPrompt)}
            style={{ fontSize: '0.8rem' }}
          >
            {showPrompt ? '隱藏' : '顯示'}
          </button>
        </div>
        {showPrompt && (
          <pre style={{
            background: 'var(--bg-primary)',
            padding: '1rem',
            borderRadius: '0.5rem',
            fontSize: '0.85rem',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowX: 'auto',
          }}>
            {skill.prompt}
          </pre>
        )}
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>簽名樣式</h2>
        <pre style={{
          background: 'var(--bg-primary)',
          padding: '1rem',
          borderRadius: '0.5rem',
          fontSize: '0.85rem',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
        }}>
          {skill.signature.style
            .replace('{name}', skill.name)
            .replace('{expertise}', skill.expertise.join('、'))}
        </pre>
      </div>
    </div>
  );
}
