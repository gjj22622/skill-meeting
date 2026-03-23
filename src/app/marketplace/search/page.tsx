'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MarketplaceSkill,
  MarketplaceSearchResult,
  SkillCategory,
  SortOption,
  SORT_OPTIONS,
} from '@/lib/marketplace-types';
import MarketplaceSkillCard from '@/components/marketplace/marketplace-skill-card';
import SearchBar from '@/components/marketplace/search-bar';
import CategoryFilter from '@/components/marketplace/category-filter';

export default function MarketplaceSearchPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem' }}><p style={{ color: 'var(--text-secondary)' }}>載入中...</p></div>}>
      <MarketplaceSearchContent />
    </Suspense>
  );
}

function MarketplaceSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [results, setResults] = useState<MarketplaceSearchResult | null>(null);
  const [loading, setLoading] = useState(true);

  const q = searchParams.get('q') || '';
  const category = (searchParams.get('category') as SkillCategory) || undefined;
  const sort = (searchParams.get('sort') as SortOption) || 'downloads';
  const page = Number(searchParams.get('page')) || 1;

  const fetchResults = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    params.set('sort', sort);
    params.set('page', String(page));
    params.set('limit', '12');

    try {
      const res = await fetch(`/api/marketplace/skills?${params}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error('搜尋失敗', err);
    } finally {
      setLoading(false);
    }
  }, [q, category, sort, page]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    // 篩選條件變更時重置頁碼
    if (!('page' in updates)) params.set('page', '1');
    router.push(`/marketplace/search?${params}`);
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <SearchBar
          initialQuery={q}
          onSearch={(query) => updateParams({ q: query || undefined })}
        />
      </div>

      <div style={{ display: 'flex', gap: '1.5rem' }}>
        {/* 側邊欄 */}
        <aside style={{ width: '200px', flexShrink: 0 }}>
          <CategoryFilter
            selected={category}
            onSelect={(cat) => updateParams({ category: cat })}
          />

          <div style={{ marginTop: '1.5rem' }}>
            <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>排序</h4>
            {(Object.entries(SORT_OPTIONS) as [SortOption, string][]).map(([key, label]) => (
              <button
                key={key}
                className={sort === key ? 'btn-primary' : 'btn-secondary'}
                onClick={() => updateParams({ sort: key })}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  padding: '0.4rem 0.75rem',
                  marginBottom: '0.25rem',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </aside>

        {/* 主內容 */}
        <main style={{ flex: 1 }}>
          {loading ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
              搜尋中...
            </p>
          ) : results && results.skills.length > 0 ? (
            <>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                共 {results.total} 個結果
                {q && <>，搜尋「{q}」</>}
              </p>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {results.skills.map((skill: MarketplaceSkill) => (
                  <MarketplaceSkillCard
                    key={skill.id}
                    skill={skill}
                    onClick={() => router.push(`/marketplace/skill/${skill.id}`)}
                  />
                ))}
              </div>

              {/* 分頁 */}
              {results.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                  {page > 1 && (
                    <button
                      className="btn-secondary"
                      onClick={() => updateParams({ page: String(page - 1) })}
                    >
                      ← 上一頁
                    </button>
                  )}
                  <span style={{ padding: '0.5rem 1rem', color: 'var(--text-secondary)' }}>
                    {page} / {results.totalPages}
                  </span>
                  {page < results.totalPages && (
                    <button
                      className="btn-secondary"
                      onClick={() => updateParams({ page: String(page + 1) })}
                    >
                      下一頁 →
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>😔</p>
              <p style={{ color: 'var(--text-secondary)' }}>
                找不到符合條件的 Skill
              </p>
              <button
                className="btn-secondary"
                onClick={() => router.push('/marketplace')}
                style={{ marginTop: '1rem' }}
              >
                回到市集首頁
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
