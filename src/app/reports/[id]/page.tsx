'use client';

import { useState, useEffect, use } from 'react';
import { Meeting } from '@/lib/types';
import { getMeetings } from '@/lib/skill-store';
import ReportViewer from '@/components/report-viewer';

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [meeting, setMeeting] = useState<Meeting | null>(null);

  useEffect(() => {
    const allMeetings = getMeetings();
    const found = allMeetings.find((m: Meeting) => m.id === id);
    if (found) setMeeting(found);
  }, [id]);

  if (!meeting || !meeting.report) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>找不到報告</p>
        <a href="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}>
          回到首頁
        </a>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <a href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.875rem' }}>
          ← 回到會議列表
        </a>
      </div>
      <ReportViewer report={meeting.report} />
    </div>
  );
}
