'use client';

import { MarketplaceSkill, SKILL_CATEGORIES } from '@/lib/marketplace-types';
import StarRating from './star-rating';

interface MarketplaceSkillCardProps {
  skill: MarketplaceSkill;
  onClick?: () => void;
}

export default function MarketplaceSkillCard({ skill, onClick }: MarketplaceSkillCardProps) {
  return (
    <div
      className="card cursor-pointer"
      onClick={onClick}
      style={{ transition: 'transform 0.15s, box-shadow 0.15s' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = '';
        (e.currentTarget as HTMLElement).style.boxShadow = '';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div className="skill-avatar">{skill.avatar}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>{skill.name}</h3>
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

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            {skill.authorName} · {SKILL_CATEGORIES[skill.category]}
          </p>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            marginBottom: '0.5rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {skill.personality}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem' }}>
            <StarRating rating={skill.rating} reviewCount={skill.reviewCount} />
            <span style={{ color: 'var(--text-secondary)' }}>
              ⬇ {skill.downloads} 下載
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {skill.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="badge">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
