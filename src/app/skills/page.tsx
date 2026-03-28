'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Skill } from '@/lib/types';
import { getAllSkills, saveCustomSkill, deleteCustomSkill, toggleDefaultSkill } from '@/lib/skill-store';
import SkillCard from '@/components/skill-card';
import SkillForm from '@/components/skill-form';
import { parseMdSkill } from '@/lib/parse-md-skill';

type FilterType = 'all' | 'active' | 'sostac' | 'custom';

export default function SkillsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

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

  function handleToggle(id: string) {
    toggleDefaultSkill(id);
    setSkills(getAllSkills());
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

  async function handleMdFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setImportError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.endsWith('.md') && file.type !== 'text/markdown' && file.type !== 'text/plain') {
      setImportError('只支援 .md 檔案');
      return;
    }

    try {
      const content = await file.text();
      const parsed = parseMdSkill(content, file.name);

      const skill: Skill = {
        id: crypto.randomUUID(),
        name: parsed.name || file.name.replace(/\.md$/, '') || 'Skill',
        avatar: parsed.avatar || '📄',
        expertise: parsed.expertise
          ? parsed.expertise.split(/[、,，]/).map(s => s.trim()).filter(Boolean)
          : [],
        personality: parsed.personality || '',
        prompt: parsed.prompt || content,
        signature: { style: parsed.signature || '{name} | {expertise}' },
      };

      if (!skill.name) {
        setImportError('MD 檔案缺少名稱欄位');
        return;
      }

      saveCustomSkill(skill);
      setSkills(getAllSkills());
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setImportError('無法讀取檔案');
    }
  }

  const filteredSkills = skills.filter((s) => {
    // Search filter
    if (search) {
      const q = search.toLowerCase();
      const match = s.name.toLowerCase().includes(q)
        || s.personality.toLowerCase().includes(q)
        || s.expertise.some((e) => e.toLowerCase().includes(q));
      if (!match) return false;
    }
    // Type filter
    switch (filter) {
      case 'active': return s.isActive !== false;
      case 'sostac': return s.id?.startsWith('sostac-');
      case 'custom': return !s.isDefault;
      default: return true;
    }
  });

  const activeCount = skills.filter((s) => s.isActive !== false).length;
  const sostacCount = skills.filter((s) => s.id?.startsWith('sostac-')).length;
  const customCount = skills.filter((s) => !s.isDefault).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Skill 管理</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            共 {skills.length} 個角色，{activeCount} 個啟用中
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,text/markdown,text/plain"
            onChange={handleMdFileUpload}
            style={{ display: 'none' }}
          />
          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
            📝 上傳 MD 檔案
          </button>
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

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {([
          { label: '全部', value: skills.length, f: 'all' as FilterType },
          { label: '啟用中', value: activeCount, f: 'active' as FilterType },
          { label: 'SOSTAC®', value: sostacCount, f: 'sostac' as FilterType },
          { label: '自訂', value: customCount, f: 'custom' as FilterType },
        ]).map((stat) => (
          <div
            key={stat.f}
            className="card"
            onClick={() => setFilter(stat.f)}
            style={{
              cursor: 'pointer',
              textAlign: 'center',
              padding: '0.75rem',
              borderColor: filter === stat.f ? 'var(--accent)' : undefined,
            }}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          className="input-field"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 搜尋 Skill 名稱、專長..."
          style={{ maxWidth: '400px' }}
        />
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
        {filteredSkills.map((skill) => (
          <SkillCard
            key={skill.id}
            skill={skill}
            onToggle={() => handleToggle(skill.id)}
            onDelete={!skill.isDefault ? () => handleDelete(skill.id) : undefined}
            onPublish={!skill.isDefault ? () => router.push(`/marketplace/publish?from=${skill.id}`) : undefined}
          />
        ))}
        {filteredSkills.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            沒有符合條件的 Skill
          </div>
        )}
      </div>
    </div>
  );
}
