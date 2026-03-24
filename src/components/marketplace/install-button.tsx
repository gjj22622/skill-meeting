'use client';

import { useState } from 'react';
import { Skill } from '@/lib/types';
import { saveCustomSkill, getAllSkills } from '@/lib/skill-store';
import { getMarketplaceSkillById } from '@/lib/marketplace-client-store';

interface InstallButtonProps {
  skillId: string;
  skillName: string;
}

export default function InstallButton({ skillId, skillName }: InstallButtonProps) {
  const [status, setStatus] = useState<'idle' | 'installing' | 'installed' | 'error'>('idle');

  function handleInstall() {
    const existing = getAllSkills();
    if (existing.some((s) => s.id === skillId)) {
      setStatus('installed');
      return;
    }

    setStatus('installing');
    try {
      const marketplaceSkill = getMarketplaceSkillById(skillId);
      if (!marketplaceSkill) throw new Error('找不到此 Skill');

      const skill: Skill = {
        id: marketplaceSkill.id,
        name: marketplaceSkill.name,
        avatar: marketplaceSkill.avatar,
        expertise: marketplaceSkill.expertise,
        personality: marketplaceSkill.personality,
        prompt: marketplaceSkill.prompt,
        signature: marketplaceSkill.signature,
        isDefault: false,
      };
      saveCustomSkill(skill);
      setStatus('installed');
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  }

  if (status === 'installed') {
    return (
      <button className="btn-secondary" disabled style={{ opacity: 0.7 }}>
        已安裝
      </button>
    );
  }

  if (status === 'installing') {
    return (
      <button className="btn-primary" disabled>
        安裝中...
      </button>
    );
  }

  if (status === 'error') {
    return (
      <button className="btn-primary" style={{ background: 'var(--danger)' }} disabled>
        安裝失敗
      </button>
    );
  }

  return (
    <button className="btn-primary" onClick={handleInstall}>
      安裝 {skillName}
    </button>
  );
}
