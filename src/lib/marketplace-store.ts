import { v4 as uuidv4 } from 'uuid';
import {
  MarketplaceSkill,
  MarketplaceSearchParams,
  MarketplaceSearchResult,
  PublishSkillData,
  SkillCategory,
} from './marketplace-types';
import seedData from '@/data/marketplace-seed.json';

// MVP: 使用記憶體 + JSON 種子資料作為存儲
// Phase 2 將遷移到 DynamoDB

let marketplaceSkills: MarketplaceSkill[] = [...(seedData as MarketplaceSkill[])];

// === 讀取操作 ===

export function getMarketplaceSkills(params: MarketplaceSearchParams = {}): MarketplaceSearchResult {
  const {
    q,
    category,
    sort = 'downloads',
    order = 'desc',
    page = 1,
    limit = 20,
    minRating,
    priceRange = 'all',
  } = params;

  let filtered = marketplaceSkills.filter((s) => s.status === 'published');

  // 關鍵字搜尋
  if (q) {
    const lower = q.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(lower) ||
        s.description.toLowerCase().includes(lower) ||
        s.tags.some((t) => t.toLowerCase().includes(lower)) ||
        s.expertise.some((e) => e.toLowerCase().includes(lower)) ||
        s.authorName.toLowerCase().includes(lower)
    );
  }

  // 分類篩選
  if (category) {
    filtered = filtered.filter((s) => s.category === category);
  }

  // 最低評分
  if (minRating !== undefined) {
    filtered = filtered.filter((s) => s.rating >= minRating);
  }

  // 價格篩選
  if (priceRange === 'free') {
    filtered = filtered.filter((s) => s.price === 0);
  } else if (priceRange === 'paid') {
    filtered = filtered.filter((s) => s.price > 0);
  }

  // 排序
  filtered.sort((a, b) => {
    let cmp = 0;
    switch (sort) {
      case 'downloads':
        cmp = a.downloads - b.downloads;
        break;
      case 'rating':
        cmp = a.rating - b.rating;
        break;
      case 'newest':
        cmp = new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        break;
      case 'name':
        cmp = a.name.localeCompare(b.name, 'zh-TW');
        break;
    }
    return order === 'desc' ? -cmp : cmp;
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const skills = filtered.slice(start, start + limit);

  return { skills, total, page, limit, totalPages };
}

export function getMarketplaceSkillById(id: string): MarketplaceSkill | undefined {
  return marketplaceSkills.find((s) => s.id === id);
}

export function getFeaturedSkills(): MarketplaceSkill[] {
  return marketplaceSkills
    .filter((s) => s.status === 'published' && s.featured)
    .sort((a, b) => b.downloads - a.downloads);
}

export function getTopSkills(limit = 6): MarketplaceSkill[] {
  return marketplaceSkills
    .filter((s) => s.status === 'published')
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, limit);
}

export function getNewestSkills(limit = 6): MarketplaceSkill[] {
  return marketplaceSkills
    .filter((s) => s.status === 'published')
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}

export function getCategoryStats(): Record<SkillCategory, number> {
  const stats = {} as Record<SkillCategory, number>;
  for (const skill of marketplaceSkills.filter((s) => s.status === 'published')) {
    stats[skill.category] = (stats[skill.category] || 0) + 1;
  }
  return stats;
}

// === 寫入操作 ===

export function publishSkill(data: PublishSkillData): MarketplaceSkill {
  const now = new Date().toISOString();
  const skill: MarketplaceSkill = {
    id: uuidv4(),
    ...data,
    authorId: 'anonymous', // Phase 2: 從認證系統取得
    locale: 'zh-TW',
    version: '1.0.0',
    downloads: 0,
    rating: 0,
    reviewCount: 0,
    status: 'published',
    featured: false,
    isDefault: false,
    publishedAt: now,
    updatedAt: now,
  };
  marketplaceSkills.push(skill);
  return skill;
}

export function updateMarketplaceSkill(
  id: string,
  updates: Partial<MarketplaceSkill>
): MarketplaceSkill | null {
  const idx = marketplaceSkills.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  marketplaceSkills[idx] = {
    ...marketplaceSkills[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return marketplaceSkills[idx];
}

export function incrementDownloads(id: string): boolean {
  const skill = marketplaceSkills.find((s) => s.id === id);
  if (!skill) return false;
  skill.downloads += 1;
  return true;
}

export function deleteMarketplaceSkill(id: string): boolean {
  const idx = marketplaceSkills.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  marketplaceSkills[idx].status = 'archived';
  return true;
}
