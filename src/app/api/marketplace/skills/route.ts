import { NextRequest, NextResponse } from 'next/server';
import {
  getMarketplaceSkills,
  publishSkill,
} from '@/lib/marketplace-store';
import { SkillCategory, SortOption, PublishSkillData } from '@/lib/marketplace-types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const params = {
    q: searchParams.get('q') || undefined,
    category: (searchParams.get('category') as SkillCategory) || undefined,
    sort: (searchParams.get('sort') as SortOption) || 'downloads',
    order: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
    page: Number(searchParams.get('page')) || 1,
    limit: Math.min(Number(searchParams.get('limit')) || 20, 50),
    minRating: searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined,
    priceRange: (searchParams.get('priceRange') as 'free' | 'paid' | 'all') || 'all',
  };

  const result = getMarketplaceSkills(params);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PublishSkillData;

    if (!body.name || !body.prompt || !body.description || !body.category) {
      return NextResponse.json(
        { error: '缺少必要欄位：name, prompt, description, category' },
        { status: 400 }
      );
    }

    const skill = publishSkill({
      name: body.name,
      avatar: body.avatar || '🧠',
      expertise: body.expertise || [],
      personality: body.personality || '',
      prompt: body.prompt,
      signature: body.signature || { style: '{name}' },
      description: body.description,
      category: body.category,
      tags: body.tags || [],
      authorName: body.authorName || '匿名',
      price: body.price || 0,
      currency: body.currency || 'TWD',
    });

    return NextResponse.json(skill, { status: 201 });
  } catch {
    return NextResponse.json({ error: '發佈失敗' }, { status: 500 });
  }
}
