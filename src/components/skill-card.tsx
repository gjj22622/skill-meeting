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
        borderColor: selected ? 'var(--accent)' : isInactive ? '#f87171' : undefined,
        boxShadow: selected ? '0 0 12px rgba(59, 130, 246, 0.2)' : undefined,
        opacity: isInactive ? 0.55 : 1,
        transition: 'all 0.25s ease',
        background: isInactive ? 'repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(0,0,0,0.015) 10px, rgba(0,0,0,0.015) 20px)' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div className={`skill-avatar ${selected ? 'selected' : ''}`} style={{ position: 'relative' }}>
          {skill.avatar}
          {/* Small status dot on avatar */}
          {onToggle && (
            <span style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: isInactive ? '#ef4444' : '#22c55e',
              border: '2px solid white',
            }} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
            <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>{skill.name}</h3>
            {skill.isDefault && <span className="badge">預設</span>}
            {skill.id?.startsWith('sostac-') && <span className="badge" style={{ background: '#f59e0b20', color: '#d97706', border: '1px solid #f59e0b40' }}>SOSTAC®</span>}
            {isInactive && (
              <span className="badge" style={{
                background: '#ef444420',
                color: '#dc2626',
                border: '1px solid #ef444440',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}>
                🚫 已隱藏
              </span>
            )}
            {selected && <span className="badge" style={{ background: 'var(--accent)', color: 'white', border: 'none' }}>已選</span>}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            {typeof skill.personality === 'object'
              ? (skill.personality as any).description || JSON.stringify(skill.personality)
              : String(skill.personality || '')}
          </p>
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
            {skill.expertise.map((exp) => (
              <span key={exp} className="badge">{exp}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Toggle Switch */}
          {onToggle && (
            <label
              title={isInactive ? '點擊啟用' : '點擊隱藏'}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              {/* Track */}
              <span
                onClick={(e) => { e.preventDefault(); onToggle(); }}
                style={{
                  position: 'relative',
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  background: isInactive ? '#d1d5db' : 'var(--accent, #3b82f6)',
                  transition: 'background 0.25s ease',
                  flexShrink: 0,
                }}
              >
                {/* Thumb */}
                <span style={{
                  position: 'absolute',
                  top: 2,
                  left: isInactive ? 2 : 22,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  transition: 'left 0.25s ease',
                }} />
              </span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: isInactive ? '#9ca3af' : 'var(--accent, #3b82f6)',
                whiteSpace: 'nowrap',
                minWidth: 32,
              }}>
                {isInactive ? 'OFF' : 'ON'}
              </span>
            </label>
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
