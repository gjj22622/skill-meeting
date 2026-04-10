/**
 * AdminSkillManager — Admin 後台「系統 Skill 管理」完整 UI 元件
 *
 * 功能：新增、編輯、開關、刪除系統預設 Skill
 * 整合到 AdminPage.tsx 的 'skills' tab 中使用
 *
 * Usage in AdminPage:
 *   import AdminSkillManager from '../components/AdminSkillManager';
 *   {activeTab === 'skills' && <AdminSkillManager />}
 */

import { useState, useEffect } from "react";
import { admin as adminApi } from "../lib/api";
import { Skill } from "../types";
import {
  Plus, Pencil, Trash2, Power, PowerOff, Save, X, ChevronDown, ChevronUp,
  Loader2, AlertCircle, Search
} from "lucide-react";
import { cn } from "../lib/utils";

type SkillWithOwner = Skill & {
  isActive?: boolean;
  owner?: { displayName: string; email: string } | null;
};

interface SkillFormData {
  name: string;
  avatar: string;
  expertise: string;   // comma-separated for input
  personality: string;
  prompt: string;
  signatureStyle: string;
}

const emptyForm: SkillFormData = {
  name: '',
  avatar: '🤖',
  expertise: '',
  personality: '',
  prompt: '',
  signatureStyle: '🤖 {name}\n📋 專長：{expertise}',
};

function skillToForm(skill: SkillWithOwner): SkillFormData {
  return {
    name: skill.name,
    avatar: skill.avatar,
    expertise: Array.isArray(skill.expertise) ? skill.expertise.join(', ') : skill.expertise,
    personality: skill.personality,
    prompt: skill.prompt,
    signatureStyle: typeof skill.signature === 'object' ? skill.signature.style : skill.signature,
  };
}

export default function AdminSkillManager() {
  const [skills, setSkills] = useState<SkillWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'system' | 'custom'>('all');
  const [search, setSearch] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SkillFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Expand prompt view
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Toggle loading
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const data = await adminApi.skills();
      setSkills(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSkills(); }, []);

  // ── Filtered list ──────────────────────────────────────────
  const filtered = skills.filter(s => {
    if (filter === 'system' && !s.isDefault) return false;
    if (filter === 'custom' && s.isDefault) return false;
    if (search) {
      const q = search.toLowerCase();
      const personalityText = typeof s.personality === 'object'
        ? (s.personality as any).description || JSON.stringify(s.personality)
        : String(s.personality || '');
      return s.name.toLowerCase().includes(q) ||
        personalityText.toLowerCase().includes(q) ||
        (Array.isArray(s.expertise) ? s.expertise.join(' ') : s.expertise).toLowerCase().includes(q);
    }
    return true;
  });

  // ── CRUD handlers ──────────────────────────────────────────

  const handleNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
  };

  const handleEdit = (skill: SkillWithOwner) => {
    setEditingId(skill.id);
    setForm(skillToForm(skill));
    setFormError(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.personality.trim() || !form.prompt.trim()) {
      setFormError('名稱、角色背景、專業知識 Prompt 為必填');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const payload = {
        name: form.name.trim(),
        avatar: form.avatar.trim() || '🤖',
        expertise: form.expertise.split(/[,，、]/).map(s => s.trim()).filter(Boolean),
        personality: form.personality.trim(),
        prompt: form.prompt.trim(),
        signature: { style: form.signatureStyle.trim() || `🤖 {name}\n📋 專長：{expertise}` },
      };

      if (editingId) {
        const updated = await adminApi.updateSkill(editingId, payload);
        setSkills(skills.map(s => s.id === editingId ? { ...s, ...updated } : s));
      } else {
        const created = await adminApi.createSkill(payload);
        setSkills([...skills, created]);
      }

      handleCancel();
    } catch (e: any) {
      setFormError(e.message || '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  // Toast state
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    const skill = skills.find(s => s.id === id);
    try {
      const updated = await adminApi.toggleSkill(id);
      setSkills(skills.map(s => s.id === id ? { ...s, ...updated } : s));
      showToast(`${skill?.name || 'Skill'} 已${updated.isActive ? '啟用' : '隱藏'}`, 'success');
    } catch (e) {
      console.error(e);
      showToast('切換失敗', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
      return;
    }
    try {
      await adminApi.deleteSkill(id);
      setSkills(skills.filter(s => s.id !== id));
      setDeletingId(null);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  const systemCount = skills.filter(s => s.isDefault).length;
  const activeCount = skills.filter(s => s.isDefault && s.isActive).length;
  const customCount = skills.filter(s => !s.isDefault).length;

  return (
    <div className="space-y-6">

      {/* ── Stats Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-[24px] border border-[#141414]/10 shadow-sm text-center">
          <div className="text-3xl font-serif italic">{systemCount}</div>
          <div className="text-[9px] uppercase tracking-widest font-bold text-gray-400 mt-1">系統預設</div>
        </div>
        <div className="bg-white p-5 rounded-[24px] border border-[#141414]/10 shadow-sm text-center">
          <div className="text-3xl font-serif italic text-green-600">{activeCount}</div>
          <div className="text-[9px] uppercase tracking-widest font-bold text-gray-400 mt-1">啟用中</div>
        </div>
        <div className="bg-white p-5 rounded-[24px] border border-[#141414]/10 shadow-sm text-center">
          <div className="text-3xl font-serif italic">{customCount}</div>
          <div className="text-[9px] uppercase tracking-widest font-bold text-gray-400 mt-1">用戶自訂</div>
        </div>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={handleNew}
          className="flex items-center gap-2 px-5 py-3 bg-[#141414] text-white rounded-full text-sm font-bold hover:scale-[1.02] transition-transform shadow-lg">
          <Plus size={16} /> 新增系統 Skill
        </button>

        <div className="flex bg-white rounded-full border border-[#141414]/10 overflow-hidden">
          {(['all', 'system', 'custom'] as const).map(key => (
            <button key={key} onClick={() => setFilter(key)}
              className={cn("px-4 py-2.5 text-xs font-bold transition-colors",
                filter === key ? "bg-[#141414] text-white" : "text-gray-400 hover:text-gray-600")}>
              {key === 'all' ? '全部' : key === 'system' ? '系統' : '自訂'}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="搜尋 Skill..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-full border border-[#141414]/10 text-sm focus:outline-none focus:border-[#141414]/30" />
        </div>
      </div>

      {/* ── Create/Edit Form (Expandable) ──────────────────────── */}
      {showForm && (
        <div className="bg-white rounded-[32px] border-2 border-[#141414] p-8 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-serif italic">
              {editingId ? '編輯系統 Skill' : '新增系統 Skill'}
            </h3>
            <button onClick={handleCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-[80px_1fr] gap-5">
            {/* Avatar */}
            <div>
              <label className="text-[9px] uppercase tracking-widest font-bold text-gray-400 block mb-2">頭像</label>
              <input type="text" value={form.avatar} onChange={e => setForm({ ...form, avatar: e.target.value })}
                className="w-full text-center text-4xl p-2 border-2 border-[#141414]/10 rounded-2xl focus:outline-none focus:border-[#141414]" />
            </div>

            {/* Name */}
            <div>
              <label className="text-[9px] uppercase tracking-widest font-bold text-gray-400 block mb-2">名稱 *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="例：SOSTAC 現況分析師"
                className="w-full px-4 py-3 border-2 border-[#141414]/10 rounded-2xl focus:outline-none focus:border-[#141414] text-sm" />
            </div>
          </div>

          {/* Expertise */}
          <div>
            <label className="text-[9px] uppercase tracking-widest font-bold text-gray-400 block mb-2">專長（逗號分隔）</label>
            <input type="text" value={form.expertise} onChange={e => setForm({ ...form, expertise: e.target.value })}
              placeholder="例：PEST分析, 五力分析, SWOT分析"
              className="w-full px-4 py-3 border-2 border-[#141414]/10 rounded-2xl focus:outline-none focus:border-[#141414] text-sm" />
          </div>

          {/* Personality */}
          <div>
            <label className="text-[9px] uppercase tracking-widest font-bold text-gray-400 block mb-2">角色背景 *</label>
            <textarea value={form.personality} onChange={e => setForm({ ...form, personality: e.target.value })}
              placeholder="這個角色的性格、專業背景和行為風格..."
              rows={2}
              className="w-full px-4 py-3 border-2 border-[#141414]/10 rounded-2xl focus:outline-none focus:border-[#141414] text-sm resize-none" />
          </div>

          {/* Prompt (the key field for SOSTAC knowledge) */}
          <div>
            <label className="text-[9px] uppercase tracking-widest font-bold text-gray-400 block mb-2">
              專業知識 Prompt *（注入 AI 的方法論知識庫）
            </label>
            <textarea value={form.prompt} onChange={e => setForm({ ...form, prompt: e.target.value })}
              placeholder="這裡填入該角色的專業方法論知識，AI 會在討論時參考這些內容..."
              rows={8}
              className="w-full px-4 py-3 border-2 border-[#141414]/10 rounded-2xl focus:outline-none focus:border-[#141414] text-sm resize-y font-mono leading-relaxed" />
            <div className="text-[10px] text-gray-400 mt-1">
              {form.prompt.length} 字 — 超過 100 字的 prompt 會在 AI 討論時自動注入
            </div>
          </div>

          {/* Signature Style */}
          <div>
            <label className="text-[9px] uppercase tracking-widest font-bold text-gray-400 block mb-2">
              簽名樣式（可用 {'{name}'} 和 {'{expertise}'} 變數）
            </label>
            <input type="text" value={form.signatureStyle} onChange={e => setForm({ ...form, signatureStyle: e.target.value })}
              placeholder="📊 {name} | 數據說話\n🔍 專長：{expertise}"
              className="w-full px-4 py-3 border-2 border-[#141414]/10 rounded-2xl focus:outline-none focus:border-[#141414] text-sm font-mono" />
          </div>

          {formError && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 px-4 py-3 rounded-2xl">
              <AlertCircle size={16} /> {formError}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button onClick={handleCancel}
              className="px-6 py-3 rounded-full border border-[#141414]/10 text-sm font-bold hover:bg-gray-50 transition-colors">
              取消
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-[#141414] text-white rounded-full text-sm font-bold hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-50">
              <Save size={16} /> {saving ? '儲存中...' : editingId ? '更新 Skill' : '建立 Skill'}
            </button>
          </div>
        </div>
      )}

      {/* ── Skill List ─────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center text-gray-400 italic py-12">
            {search ? `找不到「${search}」相關的 Skill` : '尚無 Skill'}
          </div>
        )}

        {filtered.map(skill => {
          const isExpanded = expandedId === skill.id;
          const isActive = skill.isActive !== false; // default to true
          const expertiseArr = Array.isArray(skill.expertise) ? skill.expertise : [];

          return (
            <div key={skill.id}
              className={cn(
                "bg-white rounded-[24px] border shadow-sm transition-all",
                isActive ? "border-[#141414]/10" : "border-red-200 opacity-60",
              )}>

              {/* Main Row */}
              <div className="flex items-center gap-4 p-5">
                {/* Avatar + Status */}
                <div className="relative">
                  <div className="text-3xl w-12 h-12 flex items-center justify-center">
                    {skill.avatar}
                  </div>
                  {skill.isDefault && (
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                      isActive ? "bg-green-500" : "bg-red-400"
                    )} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{skill.name}</span>
                    {skill.isDefault && (
                      <span className="px-2 py-0.5 bg-[#141414] text-white text-[8px] uppercase tracking-widest font-bold rounded-full">
                        系統
                      </span>
                    )}
                    {!isActive && skill.isDefault && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-500 text-[8px] uppercase tracking-widest font-bold rounded-full">
                        🚫 已隱藏
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 truncate mt-0.5">
                    {typeof skill.personality === 'object'
                      ? (skill.personality as any).description || JSON.stringify(skill.personality)
                      : String(skill.personality || '')}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {expertiseArr.slice(0, 4).map((e, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-bold rounded-full">
                        {e}
                      </span>
                    ))}
                    {expertiseArr.length > 4 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-[9px] font-bold rounded-full">
                        +{expertiseArr.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                {/* Owner info */}
                {skill.owner && (
                  <div className="text-right hidden md:block">
                    <div className="text-[10px] text-gray-400">{skill.owner.displayName}</div>
                    <div className="text-[9px] text-gray-300">{skill.owner.email}</div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {/* Expand prompt */}
                  <button onClick={() => setExpandedId(isExpanded ? null : skill.id)}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400"
                    title="查看 Prompt">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {/* Toggle Switch (system only) */}
                  {skill.isDefault && (
                    <button
                      onClick={() => handleToggle(skill.id)}
                      disabled={togglingId === skill.id}
                      className="relative flex items-center gap-2 group"
                      title={isActive ? '點擊隱藏' : '點擊啟用'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      {togglingId === skill.id ? (
                        <Loader2 size={16} className="animate-spin text-gray-400" />
                      ) : (
                        <>
                          <span style={{
                            position: 'relative',
                            display: 'inline-block',
                            width: 36,
                            height: 20,
                            borderRadius: 10,
                            background: isActive ? '#22c55e' : '#d1d5db',
                            transition: 'background 0.25s ease',
                          }}>
                            <span style={{
                              position: 'absolute',
                              top: 2,
                              left: isActive ? 18 : 2,
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              background: 'white',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                              transition: 'left 0.25s ease',
                            }} />
                          </span>
                          <span className={cn("text-[10px] font-bold", isActive ? "text-green-500" : "text-gray-400")}>
                            {isActive ? 'ON' : 'OFF'}
                          </span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Edit (system only) */}
                  {skill.isDefault && (
                    <button onClick={() => handleEdit(skill)}
                      className="p-2 rounded-xl hover:bg-blue-50 text-blue-400 transition-colors"
                      title="編輯">
                      <Pencil size={16} />
                    </button>
                  )}

                  {/* Delete */}
                  <button onClick={() => handleDelete(skill.id)}
                    className={cn(
                      "p-2 rounded-xl transition-colors",
                      deletingId === skill.id
                        ? "bg-red-500 text-white"
                        : "hover:bg-red-50 text-red-400"
                    )}
                    title={deletingId === skill.id ? '再按一次確認刪除' : '刪除'}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Expanded Prompt View */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                  <div className="text-[9px] uppercase tracking-widest font-bold text-gray-400 mb-2">
                    專業知識 Prompt（{skill.prompt?.length || 0} 字）
                  </div>
                  <pre className="text-xs text-gray-600 bg-gray-50 rounded-2xl p-4 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
                    {skill.prompt || '(空)'}
                  </pre>
                  <div className="text-[9px] uppercase tracking-widest font-bold text-gray-400 mb-2 mt-4">
                    簽名樣式
                  </div>
                  <div className="text-xs text-gray-600 bg-gray-50 rounded-2xl p-3 font-mono">
                    {typeof skill.signature === 'object' ? skill.signature.style : skill.signature}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          padding: '0.65rem 1.25rem', borderRadius: '0.75rem',
          background: toast.type === 'success' ? '#22c55e' : '#ef4444',
          color: 'white', fontSize: '0.875rem', fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          animation: 'toast-in 0.3s ease',
        }}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.text}
        </div>
      )}
      <style>{`@keyframes toast-in { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
