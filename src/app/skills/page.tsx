'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Skill } from '@/lib/types';
import {
  getAllSkills,
  saveCustomSkill,
  deleteCustomSkill,
  toggleDefaultSkill,
  fetchSkillsFromApi,
  createSkillViaApi,
  toggleCustomSkillApi,
  deleteSkillViaApi,
} from '@/lib/skill-store';
import SkillCard from '@/components/skill-card';
import SkillForm from '@/components/skill-form';
import { parseMdSkill } from '@/lib/parse-md-skill';

export default function SkillsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');
  const [search, setSearch] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  // Check auth status + load skills
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          setAuthenticated(true);
          const apiSkills = await fetchSkillsFromApi();
          setSkills(apiSkills);
          return;
        }
      } catch {}
      // Fallback: localStorage
      setAuthenticated(false);
      setSkills(getAllSkills());
    })();
  }, []);

  async function refreshSkills() {
    if (authenticated) {
      const apiSkills = await fetchSkillsFromApi();
      setSkills(apiSkills);
    } else {
      setSkills(getAllSkills());
    }
  }

  async function handleSave(skill: Skill) {
    if (authenticated) {
      const created = await createSkillViaApi(skill);
      if (created) {
        await refreshSkills();
      }
    } else {
      saveCustomSkill(skill);
      setSkills(getAllSkills());
    }
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('確定要刪除這個 Skill 嗎？')) return;
    if (authenticated) {
      const ok = await deleteSkillViaApi(id);
      if (ok) await refreshSkills();
    } else {
      deleteCustomSkill(id);
      setSkills(getAllSkills());
    }
  }

  async function handleToggleCustom(id: string, currentActive: boolean) {
    if (authenticated) {
      const ok = await toggleCustomSkillApi(id, !currentActive);
      if (ok) await refreshSkills();
    } else {
      // localStorage: toggle via modifying the stored skill
      const customs = skills.filter((s) => !s.isDefault);
      const target = customs.find((s) => s.id === id);
      if (target) {
        saveCustomSkill({ ...target, isActive: !currentActive });
        setSkills(getAllSkills());
      }
    }
  }

  function handleToggleDefault(id: string) {
    // Default skills: localStorage only (user can't modify DB defaults)
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
      handleSave(skill);
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
          ? parsed.expertise.split(/[、,，]/).map((s: string) => s.trim()).filter(Boolean)
          : [],
        personality: parsed.personality || '',
        prompt: parsed.prompt || content,
        signature: { style: parsed.signature || '{name} | {expertise}' },
      };

      if (!skill.name) {
        setImportError('MD 檔案缺少名稱欄位');
        return;
      }

      await handleSave(skill);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      setImportError('無法讀取檔案');
    }
  }

  // Split into sections
  const defaultSkills = skills.filter((s) => s.isDefault);
  const customSkills = skills.filter((s) => !s.isDefault);

  // Apply search
  function matchSearch(s: Skill) {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.personality.toLowerCase().includes(q) ||
      s.expertise.some((e) => e.toLowerCase().includes(q))
    );
  }

  const filteredDefaults = defaultSkills.filter(matchSearch);
  const filteredCustoms = customSkills.filter(matchSearch);

  const activeDefaultCount = defaultSkills.filter((s) => s.isActive !== false).length;
  const activeCustomCount = customSkills.filter((s) => s.isActive !== false).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Skill 管理</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            系統預設 {defaultSkills.length} 個（{activeDefaultCount} 啟用）・
            我的自訂 {customSkills.length} 個（{activeCustomCount} 啟用）
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
            📝 上傳 MD
          </button>
          <button className="btn-secondary" onClick={() => { setShowImport(!showImport); setShowForm(false); }}>
            📄 匯入 JSON
          </button>
          <a href="/marketplace" className="btn-secondary" style={{ textDecoration: 'none' }}>
            🏪 市集
          </a>
          <button className="btn-primary" onClick={() => { setShowForm(!showForm); setShowImport(false); }}>
            + 建立 Skill
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1.5rem' }}>
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

      {importError && !showImport && (
        <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>{importError}</p>
      )}

      {/* ========== Section 1: System Default Skills (read-only) ========== */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1rem',
          paddingBottom: '0.5rem',
          borderBottom: '2px solid var(--border)',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>🏛️ 系統預設 Skill</h2>
          <span style={{
            fontSize: '0.75rem',
            padding: '0.15rem 0.5rem',
            borderRadius: '4px',
            background: 'rgba(148, 163, 184, 0.15)',
            color: 'var(--text-secondary)',
          }}>
            唯讀
          </span>
        </div>

        {filteredDefaults.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            沒有符合條件的系統預設 Skill
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {filteredDefaults.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onToggle={!authenticated ? () => handleToggleDefault(skill.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* ========== Section 2: My Custom Skills (full CRUD) ========== */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1rem',
          paddingBottom: '0.5rem',
          borderBottom: '2px solid var(--accent)',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>🧩 我的自訂 Skill</h2>
          <span style={{
            fontSize: '0.75rem',
            padding: '0.15rem 0.5rem',
            borderRadius: '4px',
            background: 'rgba(59, 130, 246, 0.15)',
            color: 'var(--accent)',
          }}>
            {customSkills.length} 個
          </span>
        </div>

        {filteredCustoms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            {customSkills.length === 0
              ? '還沒有自訂 Skill，點擊「+ 建立 Skill」開始建立吧！'
              : '沒有符合搜尋條件的自訂 Skill'}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {filteredCustoms.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onToggle={() => handleToggleCustom(skill.id, skill.isActive !== false)}
                onDelete={() => handleDelete(skill.id)}
                onPublish={() => router.push(`/marketplace/publish?from=${skill.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
