'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [admin, setAdmin] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/auth/login');
          return;
        }
        const data = await res.json();
        const user = data.user;
        if (!user || user.role !== 'admin') {
          router.push('/');
          return;
        }
        setAdmin(user);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg-primary)',
        }}
      >
        <p style={{ color: 'var(--text-secondary)' }}>驗證管理員身份中...</p>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  const navItems = [
    { label: '儀表板', href: '/admin' },
    { label: '用戶管理', href: '/admin/users' },
    { label: 'Skill管理', href: '/admin/skills' },
    { label: '會議管理', href: '/admin/meetings' },
    { label: '操作記錄', href: '/admin/audit-log' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      {/* Top bar */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '1.5rem',
              padding: '0.5rem',
            }}
          >
            ☰
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            🛡️ 管理面板
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {admin.name || admin.email}
          </span>
          <a
            href="/api/auth/logout"
            style={{
              color: 'var(--accent)',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}
          >
            登出
          </a>
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div
          style={{
            width: sidebarOpen ? '250px' : '0',
            background: 'var(--bg-secondary)',
            borderRight: sidebarOpen ? '1px solid var(--border)' : 'none',
            overflow: 'hidden',
            transition: 'width 0.3s ease',
            flexShrink: 0,
          }}
        >
          <div style={{ padding: '1.5rem 0' }}>
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                style={{
                  display: 'block',
                  padding: '0.75rem 1.5rem',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  borderLeft: '3px solid transparent',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderLeftColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderLeftColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* Content area */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            background: 'var(--bg-primary)',
            padding: '2rem',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
