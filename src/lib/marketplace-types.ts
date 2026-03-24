import { Skill, SkillSignature } from './types';

// === 分類 ===
export type SkillCategory =
  | 'business'    // 商業分析
  | 'tech'        // 技術開發
  | 'creative'    // 創意設計
  | 'education'   // 教育培訓
  | 'consulting'  // 諮詢顧問
  | 'research'    // 學術研究
  | 'other';      // 其他

export const SKILL_CATEGORIES: Record<SkillCategory, string> = {
  business: '商業分析',
  tech: '技術開發',
  creative: '創意設計',
  education: '教育培訓',
  consulting: '諮詢顧問',
  research: '學術研究',
  other: '其他',
};

// === 排序 ===
export type SortOption = 'downloads' | 'rating' | 'newest' | 'name';

export const SORT_OPTIONS: Record<SortOption, string> = {
  downloads: '最多下載',
  rating: '最高評分',
  newest: '最新發佈',
  name: '名稱排序',
};

// === 市集 Skill ===
export interface MarketplaceSkill extends Skill {
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  description: string;
  category: SkillCategory;
  tags: string[];
  locale: string;
  version: string;
  downloads: number;
  rating: number;
  reviewCount: number;
  price: number;
  currency: 'TWD' | 'USD';
  status: 'draft' | 'pending' | 'published' | 'archived';
  featured: boolean;
  publishedAt: string;
  updatedAt: string;
}

// === 評論 (Phase 2 預留) ===
export interface SkillReview {
  id: string;
  skillId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  title: string;
  comment: string;
  helpful: number;
  createdAt: string;
}

// === 搜尋參數 ===
export interface MarketplaceSearchParams {
  q?: string;
  category?: SkillCategory;
  sort?: SortOption;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  minRating?: number;
  priceRange?: 'free' | 'paid' | 'all';
}

// === 搜尋結果 ===
export interface MarketplaceSearchResult {
  skills: MarketplaceSkill[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// === 發佈表單資料 ===
export interface PublishSkillData {
  name: string;
  avatar: string;
  expertise: string[];
  personality: string;
  prompt: string;
  signature: SkillSignature;
  description: string;
  category: SkillCategory;
  tags: string[];
  authorName: string;
  price: number;
  currency: 'TWD' | 'USD';
}
