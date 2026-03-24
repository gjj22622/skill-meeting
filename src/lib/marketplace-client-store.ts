import { MarketplaceSkill, MarketplaceSearchParams, MarketplaceSearchResult, SkillCategory } from './marketplace-types';
import seedData from '@/data/marketplace-seed.json';

const MARKETPLACE_KEY = 'skill-meeting-marketplace';

function getSeedSkills(): MarketplaceSkill[] {
  return seedData as MarketplaceSkill[];
}

function getUserPublished(): MarketplaceSkill[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(MARKETPLACE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as MarketplaceSkill[];
  } catch {
    return [];
  }
}

function saveUserPublished(skills: MarketplaceSkill[]): void {
  localStorage.setItem(MARKETPLACE_KEY, JSON.stringify(skills));
}

export function getAllMarketplaceSkills(): MarketplaceSkill[] {
  return [...getSeedSkills(), ...getUserPublished()];
}

export function searchMarketplaceSkills(params: MarketplaceSearchParams = {}): MarketplaceSearchResult {
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

  let filtered = getAllMarketplaceSkills().filter((s) => s.status === 'published');

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

  if (category) {
    filtered = filtered.filter((s) => s.category === category);
  }

  if (minRating !== undefined) {
    filtered = filtered.filter((s) => s.rating >= minRating);
  }

  if (priceRange === 'free') {
    filtered = filtered.filter((s) => s.price === 0);
  } else if (priceRange === 'paid') {
    filtered = filtered.filter((s) => s.price > 0);
  }

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
  return getAllMarketplaceSkills().find((s) => s.id === id);
}

export function getFeaturedSkills(): MarketplaceSkill[] {
  return getAllMarketplaceSkills()
    .filter((s) => s.status === 'published' && s.featured)
    .sort((a, b) => b.downloads - a.downloads);
}

export function getTopSkills(limit = 6): MarketplaceSkill[] {
  return getAllMarketplaceSkills()
    .filter((s) => s.status === 'published')
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, limit);
}

export function getNewestSkills(limit = 6): MarketplaceSkill[] {
  return getAllMarketplaceSkills()
    .filter((s) => s.status === 'published')
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}

export function getCategoryStats(): Record<SkillCategory, number> {
  const stats = {} as Record<SkillCategory, number>;
  for (const skill of getAllMarketplaceSkills().filter((s) => s.status === 'published')) {
    stats[skill.category] = (stats[skill.category] || 0) + 1;
  }
  return stats;
}

export function publishSkillLocally(data: Omit<MarketplaceSkill, 'id' | 'publishedAt' | 'updatedAt'>): MarketplaceSkill {
  const now = new Date().toISOString();
  const skill: MarketplaceSkill = {
    ...data,
    id: crypto.randomUUID(),
    publishedAt: now,
    updatedAt: now,
  };
  const published = getUserPublished();
  published.push(skill);
  saveUserPublished(published);
  return skill;
}
