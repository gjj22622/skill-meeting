import { LocalUser } from "../lib/auth-context";
import { useState, useEffect } from "react";
import { subscribeSkills, addSkill, deleteSkill } from "../lib/store";
import { Skill } from "../types";
import { DEFAULT_SKILLS } from "../constants";
import { Plus, Trash2, Edit2, Upload, FileJson, Check, FileText } from "lucide-react";
import { cn } from "../lib/utils";
import { handleStoreError, OperationType } from "../lib/error-handler";

export default function SkillsPage({ user }: { user: LocalUser }) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newSkill, setNewSkill] = useState<Partial<Skill>>({
    name: "",
    avatar: "👤",
    expertise: [],
    personality: "",
    prompt: "",
    signature: { style: "{name} | 專長：{expertise}" }
  });

  useEffect(() => {
    const unsubscribe = subscribeSkills(user.uid, (userSkills) => {
      setSkills(userSkills);
    });
    return unsubscribe;
  }, [user.uid]);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newSkill.name || !newSkill.personality || !newSkill.prompt) return;
    try {
      addSkill({
        name: newSkill.name || "",
        avatar: newSkill.avatar || "👤",
        expertise: newSkill.expertise || [],
        personality: newSkill.personality || "",
        prompt: newSkill.prompt || "",
        signature: newSkill.signature || { style: "{name} | 專長：{expertise}" },
        ownerId: user.uid,
        isDefault: false,
        createdAt: new Date().toISOString(),
      });

      setIsAdding(false);
      setNewSkill({
        name: "",
        avatar: "👤",
        expertise: [],
        personality: "",
        prompt: "",
        signature: { style: "{name} | 專長：{expertise}" }
      });
    } catch (error) {
      console.error("Failed to create skill:", error);
      handleStoreError(error, OperationType.CREATE, "skills");
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
      return;
    }

    try {
      deleteSkill(id);
      setDeletingId(null);
    } catch (error) {
      console.error("Failed to delete skill:", error);
      handleStoreError(error, OperationType.DELETE, `skills/${id}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const extension = file.name.split('.').pop()?.toLowerCase();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        if (extension === 'md') {
          const lines = content.split('\n');
          let name = file.name.replace('.md', '');
          let prompt = content;

          const titleLine = lines.find(l => l.startsWith('# '));
          if (titleLine) {
            name = titleLine.replace('# ', '').trim();
          }

          setNewSkill({
            ...newSkill,
            name,
            prompt,
            personality: `基於 ${name} 的 Markdown 定義`,
            expertise: ["Markdown 定義"]
          });
        } else {
          const json = JSON.parse(content);
          setNewSkill({
            ...newSkill,
            ...json
          });
        }
      } catch (error) {
        alert("檔案格式錯誤或內容無效");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-5xl font-serif italic mb-2">Skill 管理</h1>
          <p className="text-gray-500 font-sans">自訂您的 AI 專家庫，或使用系統預設角色。</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#141414] text-white rounded-full hover:scale-105 transition-transform font-sans font-medium"
        >
          <Plus size={20} />
          建立新 Skill
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Default Skills */}
        <div className="lg:col-span-2 space-y-8">
          <h2 className="text-xs uppercase tracking-widest font-bold opacity-40">系統預設 Skill</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEFAULT_SKILLS.map(skill => (
              <div key={skill.id} className="p-6 bg-white border border-[#141414]/10 rounded-3xl flex gap-4">
                <span className="text-4xl">{skill.avatar}</span>
                <div>
                  <h3 className="text-xl font-serif italic mb-1">{skill.name}</h3>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {skill.expertise.map(e => (
                      <span key={e} className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full font-bold uppercase">{e}</span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">{skill.personality}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-xs uppercase tracking-widest font-bold opacity-40 pt-8">我的自訂 Skill</h2>
          {skills.length === 0 ? (
            <div className="p-12 border-2 border-dashed border-[#141414]/10 rounded-3xl text-center text-gray-400 font-serif italic">
              尚未建立任何自訂 Skill
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skills.map(skill => (
                <div key={skill.id} className="p-6 bg-white border border-[#141414] rounded-3xl flex gap-4 relative group">
                  <span className="text-4xl">{skill.avatar}</span>
                  <div>
                    <h3 className="text-xl font-serif italic mb-1">{skill.name}</h3>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {skill.expertise.map(e => (
                        <span key={e} className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full font-bold uppercase">{e}</span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">{skill.personality}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(skill.id)}
                    className={cn(
                      "absolute top-4 right-4 p-2 transition-all rounded-full flex items-center gap-2",
                      deletingId === skill.id
                        ? "bg-red-500 text-white animate-pulse px-4"
                        : "text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50"
                    )}
                  >
                    <Trash2 size={18} />
                    {deletingId === skill.id && <span className="text-xs font-bold">確認刪除</span>}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Skill Form */}
        {isAdding && (
          <div className="bg-[#141414] text-white p-8 rounded-[40px] sticky top-24 h-fit animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif italic">建立新 Skill</h2>
              <div className="flex gap-4">
                <label className="cursor-pointer hover:text-blue-400 transition-colors flex items-center gap-1 text-[10px] uppercase font-bold" title="上傳 JSON/Skill 檔案">
                  <FileJson size={18} /> JSON
                  <input type="file" accept=".json,.skill" onChange={handleFileUpload} className="hidden" />
                </label>
                <label className="cursor-pointer hover:text-blue-400 transition-colors flex items-center gap-1 text-[10px] uppercase font-bold" title="上傳 Markdown 檔案">
                  <FileText size={18} /> MD
                  <input type="file" accept=".md" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">名稱</label>
                  <input
                    type="text"
                    value={newSkill.name}
                    onChange={e => setNewSkill({...newSkill, name: e.target.value})}
                    className="w-full bg-white/10 border-b border-white/20 py-2 focus:outline-none focus:border-white transition-colors"
                  />
                </div>
                <div className="w-16 space-y-2 text-center">
                  <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">頭像</label>
                  <input
                    type="text"
                    value={newSkill.avatar}
                    onChange={e => setNewSkill({...newSkill, avatar: e.target.value})}
                    className="w-full bg-white/10 border-b border-white/20 py-2 text-center focus:outline-none focus:border-white transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">專業領域 (逗號分隔)</label>
                <input
                  type="text"
                  placeholder="例如：市場分析, 競品研究"
                  onChange={e => setNewSkill({...newSkill, expertise: e.target.value.split(",").map(s => s.trim())})}
                  className="w-full bg-white/10 border-b border-white/20 py-2 focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">性格描述</label>
                <textarea
                  value={newSkill.personality}
                  onChange={e => setNewSkill({...newSkill, personality: e.target.value})}
                  className="w-full h-24 bg-white/10 border border-white/20 rounded-2xl p-4 focus:outline-none focus:border-white transition-colors resize-none text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">系統提示詞 (Prompt)</label>
                <textarea
                  value={newSkill.prompt}
                  onChange={e => setNewSkill({...newSkill, prompt: e.target.value})}
                  className="w-full h-32 bg-white/10 border border-white/20 rounded-2xl p-4 focus:outline-none focus:border-white transition-colors resize-none text-sm"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-4 border border-white/20 rounded-full font-bold text-sm hover:bg-white/5 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 py-4 bg-white text-[#141414] rounded-full font-bold text-sm hover:scale-105 transition-transform"
                >
                  儲存 Skill
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
