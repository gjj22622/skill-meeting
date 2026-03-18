'use client';

interface ChatBubbleProps {
  avatar: string;
  name: string;
  content: string;
  phase: string;
  round?: number;
  isStreaming?: boolean;
}

export default function ChatBubble({ avatar, name, content, phase, round, isStreaming }: ChatBubbleProps) {
  const phaseLabels: Record<string, string> = {
    opening: '開場陳述',
    discussion: '討論',
    summary: '總結',
  };

  return (
    <div className="chat-bubble">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '1.5rem' }}>{avatar}</span>
        <div>
          <span style={{ fontWeight: 600 }}>{name}</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
            {phaseLabels[phase] || phase}
            {round ? ` · 第 ${round} 輪` : ''}
          </span>
        </div>
        {isStreaming && (
          <span className="speaking-indicator" style={{ color: 'var(--success)', fontSize: '0.75rem', marginLeft: 'auto' }}>
            ● 發言中
          </span>
        )}
      </div>
      <div style={{ color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
        {content}
        {isStreaming && <span className="speaking-indicator">▌</span>}
      </div>
    </div>
  );
}
