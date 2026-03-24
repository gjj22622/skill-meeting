'use client';

import { SkillCategory, SKILL_CATEGORIES } from '@/lib/marketplace-types';

interface CategoryFilterProps {
  selected?: SkillCategory;
  onSelect: (category: SkillCategory | undefined) => void;
  stats?: Partial<Record<SkillCategory, number>>;
}

export default function CategoryFilter({ selected, onSelect, stats }: CategoryFilterProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>分類篩選</h4>
      <button
        className={selected === undefined ? 'btn-primary' : 'btn-secondary'}
        onClick={() => onSelect(undefined)}
        style={{ textAlign: 'left', fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}
      >
        全部
      </button>
      {(Object.entries(SKILL_CATEGORIES) as [SkillCategory, string][]).map(([key, label]) => (
        <button
          key={key}
          className={selected === key ? 'btn-primary' : 'btn-secondary'}
          onClick={() => onSelect(key)}
          style={{ textAlign: 'left', fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}
        >
          {label}
          {stats?.[key] !== undefined && (
            <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
              ({stats[key]})
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
