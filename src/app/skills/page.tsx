'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skill } from '@/lib/types';
import { getAllSkills, saveCustomSkill, deleteCustomSkill } from '@/lib/skill-store';
import SkillCard from '@/components/skill-card';
import SkillForm from '@/components/skill-form';

export default function SkillsPage() {
  const router = useRouter();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');

  useEffect(() => {
    setSkills(getAllSkills());
  }, []);

  function handleSave(skill: Skill) {
    saveCustomSkill(skill);
    setSkills(getAllSkills());
    setShowForm(false);
  }

  function handleDelete(id: string) {
    if (confirm('確定要刪除這個 Skill 嗎？')) {
      deleteCustomSkill(id);
      setSkills(getAllSkills());
    }
  }

  function handleImport() {
    setImportError('');
    try {
      const parsed = JSON.parse(importJson);
      const skill: Skill = {
        id: parsed.id || crypto.randomUUID(),
        name: parsed.name,
        avatar: parsed.avatar || '🧠',
        expertise: parsed.expertise || [],
        personality: parsed.personality || '',
        prompt: parsed.prompt || '',
        signature: parsed.signature || { style: '{name}' },
      };
      if (!skill.name) throw new Error('缺少 name 欄位');
      saveCustomSkill(skill);
      setSkills(getAllSkills());
      setShowImport(false);
      setImportJson('');
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'JSON 格式錯誤');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Skill 管理</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>管理你的 AI 討論角色</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => { setShowImport(!showImport); setShowForm(false); }}>
            📄 匯入 JSON
          </button>
          <a href="/marketplace" className="btn-secondary" style={{ textDecoration: 'none' }}>
            🏪 從市集安裝
          </a>
          <button className="btn-primary" onClick={() => { setShowForm(!showForm); setShowImport(false); }}>
            + 建立 Skill
          </button>
        </div>
      </div>

      {/* Import JSON */}
      {showImport && (
        <div className="card" style={{ marginBottom: '1.5rem', maxWidth: '600px' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>匯入 Skill JSON</h3>
          <textarea
            className="input-field"
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            placeholder='{"name": "市場分析師", "avatar": "📊", "expertise": ["市場趨勢"], ...}'
            style={{ minHeight: '120px', fontFamily: 'monospace', fontSize: '0.85rem' }}
          />
          {importError && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '0.5rem' }}>{importError}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={() => setShowImport(false)}>取消</button>
            <button className="btn-primary" onClick={handleImport}>匯入</button>
          </div>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div style={{ marginBottom: '1.5rem' }}>
          <SkillForm onSave={handleSave} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Skill list */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {skills.map((skill) => (
          <SkillCard
            key={skill.id}
            skill={skill}
            onDelete={() => handleDelete(skill.id)}
            onPublish={() => router.push(`/marketplace/publish?from=${skill.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
