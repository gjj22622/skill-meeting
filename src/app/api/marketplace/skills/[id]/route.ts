import { NextRequest, NextResponse } from 'next/server';
import {
  getMarketplaceSkillById,
  updateMarketplaceSkill,
  deleteMarketplaceSkill,
} from '@/lib/marketplace-store';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const skill = getMarketplaceSkillById(id);
  if (!skill) {
    return NextResponse.json({ error: '找不到此 Skill' }, { status: 404 });
  }
  return NextResponse.json(skill);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const updated = updateMarketplaceSkill(id, body);
    if (!updated) {
      return NextResponse.json({ error: '找不到此 Skill' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: '更新失敗' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = deleteMarketplaceSkill(id);
  if (!deleted) {
    return NextResponse.json({ error: '找不到此 Skill' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
