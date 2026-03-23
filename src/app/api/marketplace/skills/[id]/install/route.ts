import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceSkillById, incrementDownloads } from '@/lib/marketplace-store';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const skill = getMarketplaceSkillById(id);
  if (!skill) {
    return NextResponse.json({ error: '找不到此 Skill' }, { status: 404 });
  }

  incrementDownloads(id);

  // 回傳可安裝到本地的 Skill 資料（不含市集欄位）
  const installable = {
    id: skill.id,
    name: skill.name,
    avatar: skill.avatar,
    expertise: skill.expertise,
    personality: skill.personality,
    prompt: skill.prompt,
    signature: skill.signature,
    isDefault: false,
  };

  return NextResponse.json({
    success: true,
    skill: installable,
    message: `已安裝 ${skill.name}`,
  });
}
