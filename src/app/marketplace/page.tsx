'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MarketplaceSkill, SKILL_CATEGORIES, SkillCategory } from '@/lib/marketplace-types';
import MarketplaceSkillCard from '@/components/marketplace/marketplace-skill-card';
import SearchBar from '@/components/marketplace/search-bar';

export default function MarketplacePage() {
  const router = useRouter();
  const [featured, setFeatured] = useState<MarketplaceSkill[]>([]);
  const [popular, setPopular] = useState<MarketplaceSkill[]>([]);
  const [newest, setNewest] = useState<MarketplaceSkill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [featuredRes, popularRes, newestRes] = await Promise.all([
          fetch('/api/marketplace/skills?sort=downloads&limit=6'),
          fetch('/api/marketplace/skills?sort=downloads&limit=6'),
          fetch('/api/marketplace/skills?sort=newest&limit=6'),
        ]);
        const [featuredData, popularData, newestData] = await Promise.all([
          featuredRes.json(),
          popularRes.json(),
          newestRes.json(),
        ]);
        // Featured = skills marked as featured
        setFeatured(featuredData.skills.filter((s: MarketplaceSkill) => s.featured));
        setPopular(popularData.skills);
        setNewest(newestData.skills);
      } catch (err) {
        console.error('載入市集失敗', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleSearch(query: string) {
    if (query) {
      router.push(`/marketplace/search?q=${encodeURIComponent(query)}`);
    }
  }

  function handleCategoryClick(cat: SkillCategory) {
    router.push(`/marketplace/search?category=${cat}`);
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>載入市集中...</p>
      </div>
    );
  }

  return (
    <div>
      {/* 標題 */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          🏪 双云 Skill 市集
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          發現、安裝、分享高品質 AI 討論角色
        </p>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <SearchBar onSearch={handleSearch} placeholder="搜尋 Skill 名稱、標籤、作者..." />
        </div>
      </div>

      {/* 分類快速導覽 */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2rem' }}>
        {(Object.entries(SKILL_CATEGORIES) as [SkillCategory, string][]).map(([key, label]) => (
          <button
            key={key}
            className="btn-secondary"
            onClick={() => handleCategoryClick(key)}
            style={{ fontSize: '0.85rem' }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 精選推薦 */}
      {featured.length > 0 && (
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
            ⭐ 精選推薦
          </h2>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}>
            {featured.map((skill) => (
              <MarketplaceSkillCard
                key={skill.id}
                skill={skill}
                onClick={() => router.push(`/marketplace/skill/${skill.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 熱門下載 */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>🔥 熱門下載</h2>
          <a href="/marketplace/search?sort=downloads" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.875rem' }}>
            查看更多 →
          </a>
        </div>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}>
          {popular.map((skill) => (
            <MarketplaceSkillCard
              key={skill.id}
              skill={skill}
              onClick={() => router.push(`/marketplace/skill/${skill.id}`)}
            />
          ))}
        </div>
      </section>

      {/* 最新發佈 */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>🆕 最新發佈</h2>
          <a href="/marketplace/search?sort=newest" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.875rem' }}>
            查看更多 →
          </a>
        </div>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}>
          {newest.map((skill) => (
            <MarketplaceSkillCard
              key={skill.id}
              skill={skill}
              onClick={() => router.push(`/marketplace/skill/${skill.id}`)}
            />
          ))}
        </div>
      </section>

      {/* 發佈 CTA */}
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          有好的 Skill 想分享？
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          將你的 AI 角色發佈到市集，讓更多人使用
        </p>
        <a href="/marketplace/publish" className="btn-primary" style={{ textDecoration: 'none' }}>
          📤 發佈 Skill
        </a>
      </div>
    </div>
  );
}
