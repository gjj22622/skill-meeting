'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skill, Meeting, MeetingGoal } from '@/lib/types';
import { getActiveSkills, saveMeeting, fetchSkillsFromApi } from '@/lib/skill-store';
import SkillCard from '@/components/skill-card';
import { v4 as uuidv4 } from 'uuid';

export default function NewMeetingPage() {
  const router = useRouter();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [topic, setTopic] = useState('');
  const [sourceData, setSourceData] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rounds, setRounds] = useState(3);
  const [goalType, setGoalType] = useState<MeetingGoal>('consensus');

  useEffect(() => {
    // Try API first (authenticated), fallback to localStorage
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const apiSkills = await fetchSkillsFromApi();
          // Only show active skills
          setSkills(apiSkills.filter((s) => s.isActive !== false));
          return;
        }
      } catch {}
      setSkills(getActiveSkills());
    })();
  }, []);

  function toggleSkill(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 6 ? [...prev, id] : prev
    );
  }

  function handleCreate() {
    if (!topic.trim() || selectedIds.length < 2) return;

    const meeting: Meeting = {
      id: uuidv4(),
      topic: topic.trim(),
      sourceData: sourceData.trim(),
      skillIds: selectedIds,
      rounds,
      goalType,
      status: 'draft',
      createdAt: new Date().toISOString(),
      messages: [],
    };

    saveMeeting(meeting);
    router.push(`/meeting/${meeting.id}`);
  }

  const goalOptions: { value: MeetingGoal; label: string; desc: string }[] = [
    { value: 'consensus', label: '🤝 達成共識', desc: '找到所有人都能接受的結論' },
    { value: 'explore', label: '🔍 探索問題', desc: '深入發掘議題的各個面向' },
    { value: 'brainstorm', label: '💡 腦力激盪', desc: '產生盡可能多的創意想法' },
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem' }}>建立新會議</h1>

      {/* Topic */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>📝 討論主題</h2>
        <input
          className="input-field"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="例：如何提升用戶留存率？"
          style={{ fontSize: '1.1rem' }}
        />
      </div>

      {/* Source data */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>📚 來源資料（可選）</h2>
        <textarea
          className="input-field"
          value={sourceData}
          onChange={(e) => setSourceData(e.target.value)}
          placeholder="貼上相關文章、數據或背景資料..."
          style={{ minHeight: '120px' }}
        />
      </div>

      {/* Goal type */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>🎯 討論目標</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          {goalOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setGoalType(opt.value)}
              style={{
                padding: '1rem',
                background: goalType === opt.value ? 'var(--accent)' : 'var(--bg-card)',
                border: `1px solid ${goalType === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '0.5rem',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{opt.label}</div>
              <div style={{ fontSize: '0.75rem', color: goalType === opt.value ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)' }}>
                {opt.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Rounds */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>🔄 討論輪數</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRounds(n)}
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '0.5rem',
                background: rounds === n ? 'var(--accent)' : 'var(--bg-card)',
                border: `1px solid ${rounds === n ? 'var(--accent)' : 'var(--border)'}`,
                color: 'var(--text-primary)',
                fontSize: '1.1rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {n}
            </button>
          ))}
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>輪</span>
        </div>
      </div>

      {/* Select skills */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>👥 選擇參與的 Skill（2~6 位）</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          已選 {selectedIds.length} / 6 位
        </p>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {skills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              selected={selectedIds.includes(skill.id)}
              onSelect={() => toggleSkill(skill.id)}
              selectable
            />
          ))}
        </div>
      </div>

      {/* Create button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <a href="/" className="btn-secondary" style={{ textDecoration: 'none' }}>取消</a>
        <button
          className="btn-primary"
          onClick={handleCreate}
          disabled={!topic.trim() || selectedIds.length < 2}
          style={{ fontSize: '1.1rem', padding: '0.75rem 2.5rem' }}
        >
          🚀 建立會議
        </button>
      </div>
    </div>
  );
}
