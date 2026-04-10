'use client';

import { Skill } from '@/lib/types';

interface SkillCardProps {
  skill: Skill;
  selected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  onPublish?: () => void;
  onToggle?: () => void;
  selectable?: boolean;
}

export default function SkillCard({ skill, selected, onSelect, onDelete, onPublish, onToggle, selectable }: SkillCardProps) {
  const isInactive = skill.isActive === false;

  return (
    <div
      className={`card ${selectable ? 'cursor-pointer' : ''}`}
      onClick={selectable ? onSelect : undefined}
      style={{
        borderColor: selected ? 'var(--accent)' : undefined,
        boxShadow: selected ? '0 0 12px rgba(59, 130, 246, 0.2)' : undefined,
        opacity: isInactive ? 0.5 : 1,
        transition: 'opacity 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div className={`skill-avatar ${selected ? 'selected' : ''}`}>
          {skill.avatar}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
            <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>{skill.name}</h3>
            {skill.isDefault && <span className="badge">預設</span>}
            {skill.id?.startsWith('sostac-') && <span className="badge" style={{ background: '#f59e0b20', color: '#d97706', border: '1px solid #f59e0b40' }}>SOSTAC®</span>}
            {isInactive && <span className="badge" style={{ background: '#ef444420', color: '#dc2626', border: '1px solid #ef444440' }}>已停用</span>}
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
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {onToggle && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              style={{
                background: isInactive ? 'var(--bg-card)' : 'var(--accent)',
                color: isInactive ? 'var(--text-secondary)' : 'white',
                border: `1px solid ${isInactive ? 'var(--border)' : 'var(--accent)'}`,
                borderRadius: '1rem',
                cursor: 'pointer',
                fontSize: '0.75rem',
                padding: '0.25rem 0.75rem',
                whiteSpace: 'nowrap',
              }}
              title={isInactive ? '啟用' : '停用'}
            >
              {isInactive ? '已停用' : '啟用中'}
            </button>
          )}
          {onPublish && !skill.isDefault && (
            <button
              onClick={(e) => { e.stopPropagation(); onPublish(); }}
              style={{ color: 'var(--accent)', background: 'none', border: '1px solid var(--accent)', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
              title="發佈到市集"
            >
              📤 發佈
            </button>
          )}
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
    </div>
  );
}
