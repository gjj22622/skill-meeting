import { LocalUser } from "../lib/auth-context";
import { useState, useEffect } from "react";
import { subscribeSkills, addMeeting } from "../lib/store";
import { Skill, GoalType } from "../types";
import { DEFAULT_SKILLS } from "../constants";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft, Target, Layers, Info, Check, Play } from "lucide-react";
import { cn } from "../lib/utils";

export default function NewMeetingPage({ user }: { user: LocalUser }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState("");
  const [sourceData, setSourceData] = useState("");
  const [rounds, setRounds] = useState(3);
  const [goalType, setGoalType] = useState<GoalType>("consensus");
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [skills, setSkills] = useState<Skill[]>(DEFAULT_SKILLS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeSkills(user.uid, (userSkills) => {
      setSkills([...DEFAULT_SKILLS, ...userSkills]);
    });
    return unsubscribe;
  }, [user.uid]);

  const toggleSkill = (id: string) => {
    if (selectedSkillIds.includes(id)) {
      setSelectedSkillIds(selectedSkillIds.filter(i => i !== id));
    } else {
      if (selectedSkillIds.length < 6) {
        setSelectedSkillIds([...selectedSkillIds, id]);
      }
    }
  };

  const handleCreate = async () => {
    if (!topic || selectedSkillIds.length < 2) return;
    setLoading(true);
    try {
      const meeting = addMeeting({
        topic,
        sourceData,
        rounds,
        goalType,
        status: 'pending',
        createdAt: new Date().toISOString(),
        ownerId: user.uid,
        skillIds: selectedSkillIds,
        currentRound: 0,
        currentPhase: 'opening',
      });
      navigate(`/meeting/${meeting.id}`);
    } catch (error) {
      console.error("Failed to create meeting:", error);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-12">
        <h1 className="text-5xl font-serif italic mb-2">發起新會議</h1>
        <div className="flex items-center gap-4 mt-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-colors",
                step >= i ? "bg-[#141414] text-white border-[#141414]" : "border-[#141414]/20 text-[#141414]/40"
              )}>
                {i}
              </div>
              {i < 3 && <div className={cn("w-12 h-[1px]", step > i ? "bg-[#141414]" : "bg-[#141414]/20")} />}
            </div>
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-4">
            <label className="text-sm uppercase tracking-widest font-bold opacity-60 flex items-center gap-2">
              <Target size={16} /> 討論主題
            </label>
            <input
              type="text"
              placeholder="例如：如何提升產品的用戶留存率？"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full text-4xl font-serif italic bg-transparent border-b-2 border-[#141414] py-4 focus:outline-none placeholder:opacity-20"
            />
          </div>
          <div className="space-y-4">
            <label className="text-sm uppercase tracking-widest font-bold opacity-60 flex items-center gap-2">
              <Info size={16} /> 來源資料 / 背景知識 (選填)
            </label>
            <textarea
              placeholder="提供一些背景資訊、數據或相關文件內容..."
              value={sourceData}
              onChange={(e) => setSourceData(e.target.value)}
              className="w-full h-48 p-6 bg-white border border-[#141414] rounded-3xl focus:outline-none font-sans resize-none"
            />
          </div>
          <button
            disabled={!topic}
            onClick={() => setStep(2)}
            className="w-full py-6 bg-[#141414] text-white rounded-full font-sans font-bold text-lg hover:scale-[1.02] transition-transform disabled:opacity-20 flex items-center justify-center gap-2"
          >
            下一步：選擇參與 Skill <ChevronRight size={20} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.map((skill) => (
              <button
                key={skill.id}
                onClick={() => toggleSkill(skill.id)}
                className={cn(
                  "p-6 border rounded-3xl text-left transition-all duration-300 flex items-start gap-4 group",
                  selectedSkillIds.includes(skill.id)
                    ? "bg-[#141414] text-white border-[#141414]"
                    : "bg-white border-[#141414]/10 hover:border-[#141414]"
                )}
              >
                <span className="text-4xl">{skill.avatar}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xl font-serif italic">{skill.name}</h3>
                    {selectedSkillIds.includes(skill.id) && <Check size={20} className="text-green-400" />}
                  </div>
                  <p className={cn("text-sm line-clamp-2", selectedSkillIds.includes(skill.id) ? "opacity-60" : "text-gray-500")}>
                    {skill.personality}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-6 border-2 border-[#141414] text-[#141414] rounded-full font-sans font-bold text-lg hover:bg-[#141414]/5 transition-colors flex items-center justify-center gap-2"
            >
              <ChevronLeft size={20} /> 上一步
            </button>
            <button
              disabled={selectedSkillIds.length < 2}
              onClick={() => setStep(3)}
              className="flex-[2] py-6 bg-[#141414] text-white rounded-full font-sans font-bold text-lg hover:scale-[1.02] transition-transform disabled:opacity-20 flex items-center justify-center gap-2"
            >
              下一步：會議設定 <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <label className="text-sm uppercase tracking-widest font-bold opacity-60 flex items-center gap-2">
                <Layers size={16} /> 討論輪數
              </label>
              <div className="flex items-center gap-4">
                {[2, 3, 5].map(r => (
                  <button
                    key={r}
                    onClick={() => setRounds(r)}
                    className={cn(
                      "flex-1 py-4 rounded-2xl border-2 font-bold transition-all",
                      rounds === r ? "bg-[#141414] text-white border-[#141414]" : "border-[#141414]/10 hover:border-[#141414]"
                    )}
                  >
                    {r} 輪
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 italic">輪數越多，討論越深入，但也越耗時。</p>
            </div>

            <div className="space-y-6">
              <label className="text-sm uppercase tracking-widest font-bold opacity-60 flex items-center gap-2">
                <Target size={16} /> 會議目標
              </label>
              <div className="space-y-3">
                {[
                  { id: 'consensus', label: '達成共識', desc: '尋求各方都能接受的最佳方案' },
                  { id: 'exploration', label: '探索問題', desc: '挖掘潛在風險與多樣化觀點' },
                  { id: 'brainstorming', label: '腦力激盪', desc: '產生大量創意與不設限的想法' }
                ].map(g => (
                  <button
                    key={g.id}
                    onClick={() => setGoalType(g.id as GoalType)}
                    className={cn(
                      "w-full p-4 rounded-2xl border-2 text-left transition-all",
                      goalType === g.id ? "bg-[#141414] text-white border-[#141414]" : "border-[#141414]/10 hover:border-[#141414]"
                    )}
                  >
                    <div className="font-bold">{g.label}</div>
                    <div className={cn("text-xs", goalType === g.id ? "opacity-60" : "text-gray-500")}>{g.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-6 border-2 border-[#141414] text-[#141414] rounded-full font-sans font-bold text-lg hover:bg-[#141414]/5 transition-colors flex items-center justify-center gap-2"
            >
              <ChevronLeft size={20} /> 上一步
            </button>
            <button
              disabled={loading}
              onClick={handleCreate}
              className="flex-[2] py-6 bg-[#141414] text-white rounded-full font-sans font-bold text-lg hover:scale-[1.02] transition-transform disabled:opacity-20 flex items-center justify-center gap-2"
            >
              {loading ? "建立中..." : "開始圓桌會議"} <Play size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
