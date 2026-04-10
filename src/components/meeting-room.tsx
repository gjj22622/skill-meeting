'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Meeting, Skill, DiscussionEvent, MeetingMessage, MeetingReport, DiscussionPhase } from '@/lib/types';
import { saveMeeting } from '@/lib/skill-store';
import ChatBubble from './chat-bubble';
import ReportViewer from './report-viewer';

interface MeetingRoomProps {
  meeting: Meeting;
  skills: Skill[];
}

interface DisplayMessage {
  id: string;
  skillId: string;
  skillName: string;
  skillAvatar: string;
  content: string;
  phase: DiscussionPhase;
  round?: number;
  isStreaming: boolean;
}

export default function MeetingRoom({ meeting, skills }: MeetingRoomProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string>('waiting');
  const [currentRound, setCurrentRound] = useState(0);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [report, setReport] = useState<MeetingReport | null>(null);
  const [tokenUsage, setTokenUsage] = useState<{ input: number; output: number; total: number } | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function startDiscussion() {
    setIsRunning(true);
    setError(null);
    setMessages([]);
    setReport(null);
    // 更新會議狀態為進行中
    saveMeeting({ ...meeting, status: 'in_progress' });

    try {
      const customSkills = skills.filter((s) => !s.isDefault);
      const res = await fetch(`/api/meeting/${meeting.id}/discuss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meeting, customSkills }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (!data) continue;

          try {
            const event: DiscussionEvent = JSON.parse(data);
            handleEvent(event);
          } catch {
            // skip malformed JSON
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsRunning(false);
    }
  }

  function handleEvent(event: DiscussionEvent) {
    switch (event.type) {
      case 'phase':
        setCurrentPhase(event.phase || '');
        if (event.phase === 'discussion') setCurrentRound(1);
        break;

      case 'message_start':
        setActiveSpeaker(event.skillId || null);
        if (event.round) setCurrentRound(event.round);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            skillId: event.skillId || '',
            skillName: event.skillName || '',
            skillAvatar: event.skillAvatar || '',
            content: '',
            phase: (event.phase || currentPhase) as DiscussionPhase,
            round: event.round,
            isStreaming: true,
          },
        ]);
        break;

      case 'message_delta':
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.skillId === event.skillId) {
            updated[updated.length - 1] = { ...last, content: last.content + (event.content || '') };
          }
          return updated;
        });
        break;

      case 'message_end':
        setActiveSpeaker(null);
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.skillId === event.skillId) {
            updated[updated.length - 1] = { ...last, isStreaming: false };
          }
          return updated;
        });
        break;

      case 'report':
        if (event.report) {
          setReport(event.report);
          if (event.tokenUsage) setTokenUsage(event.tokenUsage);
          if (event.durationMs) setDurationMs(event.durationMs);
          // 儲存完成的會議到 localStorage
          const completedMeeting: Meeting = {
            ...meeting,
            status: 'completed',
            report: event.report,
            messages: event.report.fullTranscript,
            tokenUsage: event.tokenUsage,
            durationMs: event.durationMs,
          };
          saveMeeting(completedMeeting);

          // 同步到 SQLite（讓管理後台可以讀取）
          fetch(`/api/meeting/${meeting.id}/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topic: meeting.topic,
              sourceData: meeting.sourceData,
              skillIds: meeting.skillIds,
              rounds: meeting.rounds,
              goalType: meeting.goalType,
              status: 'completed',
              messages: event.report.fullTranscript,
              report: event.report,
              tokenUsage: event.tokenUsage,
              durationMs: event.durationMs,
            }),
          }).catch((err) => console.error('Failed to sync meeting to DB:', err));
        }
        break;

      case 'error':
        setError(event.error || 'Unknown error');
        break;
    }
  }

  const totalSteps = skills.length * (1 + meeting.rounds) + 1; // opening + rounds + summary
  const completedMessages = messages.filter((m) => !m.isStreaming).length;
  const progress = Math.min((completedMessages / totalSteps) * 100, 100);

  const phaseLabels: Record<string, string> = {
    waiting: '等待開始',
    opening: '🎤 開場陳述',
    discussion: `💬 第 ${currentRound} / ${meeting.rounds} 輪討論`,
    summary: '📋 總結報告',
  };

  return (
    <div>
      {/* Header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{meeting.topic}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {phaseLabels[currentPhase] || currentPhase}
            </p>
          </div>
          {!isRunning && !report && (
            <button className="btn-primary" onClick={startDiscussion} style={{ fontSize: '1rem', padding: '0.75rem 2rem' }}>
              🚀 開始討論
            </button>
          )}
        </div>

        {isRunning && (
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {/* Skill avatars */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {skills.map((skill) => (
          <div key={skill.id} style={{ textAlign: 'center' }}>
            <div className={`skill-avatar ${activeSpeaker === skill.id ? 'active' : ''}`}>
              {skill.avatar}
            </div>
            <p style={{ fontSize: '0.75rem', marginTop: '0.375rem', color: activeSpeaker === skill.id ? 'var(--success)' : 'var(--text-secondary)' }}>
              {skill.name}
            </p>
            {activeSpeaker === skill.id && (
              <span className="speaking-indicator" style={{ fontSize: '0.625rem', color: 'var(--success)' }}>
                🟢 發言中
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Chat area */}
      <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            avatar={msg.skillAvatar}
            name={msg.skillName}
            content={msg.content}
            phase={msg.phase}
            round={msg.round}
            isStreaming={msg.isStreaming}
          />
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="card" style={{ borderColor: 'var(--danger)', marginTop: '1rem' }}>
          <p style={{ color: 'var(--danger)' }}>❌ 錯誤：{error}</p>
        </div>
      )}

      {/* Report */}
      {report && (
        <div style={{ marginTop: '2rem' }}>
          <ReportViewer report={report} />
        </div>
      )}

      {/* Token Usage Summary */}
      {report && tokenUsage && (
        <div
          className="card"
          style={{
            marginTop: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1rem',
          }}
        >
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 0.25rem' }}>
              輸入 Tokens
            </p>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--accent)' }}>
              {tokenUsage.input.toLocaleString()}
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 0.25rem' }}>
              輸出 Tokens
            </p>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--accent)' }}>
              {tokenUsage.output.toLocaleString()}
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 0.25rem' }}>
              總計 Tokens
            </p>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--warning)' }}>
              {tokenUsage.total.toLocaleString()}
            </p>
          </div>
          {durationMs && (
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 0.25rem' }}>
                耗時
              </p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                {(durationMs / 1000).toFixed(1)}s
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
