'use client';

import { useState } from 'react';
import { Skill } from '@/lib/types';
import { saveCustomSkill, getAllSkills } from '@/lib/skill-store';

interface InstallButtonProps {
  skillId: string;
  skillName: string;
}

export default function InstallButton({ skillId, skillName }: InstallButtonProps) {
  const [status, setStatus] = useState<'idle' | 'installing' | 'installed' | 'error'>('idle');

  async function handleInstall() {
    // 檢查是否已安裝
    const existing = getAllSkills();
    if (existing.some((s) => s.id === skillId)) {
      setStatus('installed');
      return;
    }

    setStatus('installing');
    try {
      const res = await fetch(`/api/marketplace/skills/${skillId}/install`, { method: 'POST' });
      if (!res.ok) throw new Error('安裝失敗');
      const data = await res.json();
      saveCustomSkill(data.skill as Skill);
      setStatus('installed');
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  }

  if (status === 'installed') {
    return (
      <button className="btn-secondary" disabled style={{ opacity: 0.7 }}>
        ✓ 已安裝
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
      ⬇ 安裝 {skillName}
    </button>
  );
}
