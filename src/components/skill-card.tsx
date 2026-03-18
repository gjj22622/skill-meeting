'use client';

import { Skill } from '@/lib/types';

interface SkillCardProps {
  skill: Skill;
  selected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  selectable?: boolean;
}

export default function SkillCard({ skill, selected, onSelect, onDelete, selectable }: SkillCardProps) {
  return (
    <div
      className={`card ${selectable ? 'cursor-pointer' : ''}`}
      onClick={selectable ? onSelect : undefined}
      style={{
        borderColor: selected ? 'var(--accent)' : undefined,
        boxShadow: selected ? '0 0 12px rgba(59, 130, 246, 0.2)' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div className={`skill-avatar ${selected ? 'selected' : ''}`}>
          {skill.avatar}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>{skill.name}</h3>
            {skill.isDefault && <span className="badge">預設</span>}
            {selected && <span className="badge" style={{ background: 'var(--accent)', color: 'white', border: 'none' }}>已選</span>}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            {skill.personality}
          </p>
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
            {skill.expertise.map((exp) => (
              <span key={exp} className="badge">{exp}</span>
            ))}
          </div>
        </div>
        {onDelete && !skill.isDefault && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}
            title="刪除"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
