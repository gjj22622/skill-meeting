import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Skill Meeting - AI 圓桌討論',
  description: '讓 AI 角色進行多輪圓桌討論，產出結構化報告',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>
        <nav
          style={{
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border)',
            padding: '0.75rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
          }}
        >
          <a href="/" style={{ fontSize: '1.25rem', fontWeight: 700, textDecoration: 'none', color: 'var(--text-primary)' }}>
            🏛️ Skill Meeting
          </a>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}>
              會議列表
            </a>
            <a href="/skills" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}>
              Skill 管理
            </a>
            <a href="/meeting/new" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}>
              新會議
            </a>
          </div>
        </nav>
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
