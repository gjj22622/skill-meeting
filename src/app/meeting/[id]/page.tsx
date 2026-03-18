'use client';

import { useState, useEffect, use } from 'react';
import { Meeting, Skill } from '@/lib/types';
import { getMeetings, getAllSkills } from '@/lib/skill-store';
import MeetingRoom from '@/components/meeting-room';

export default function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    const allMeetings = getMeetings();
    const found = allMeetings.find((m: Meeting) => m.id === id);
    if (found) {
      setMeeting(found);
      const allSkills = getAllSkills();
      const selected = found.skillIds
        .map((sid: string) => allSkills.find((s: Skill) => s.id === sid))
        .filter(Boolean) as Skill[];
      setSkills(selected);
    }
  }, [id]);

  if (!meeting) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>找不到此會議</p>
        <a href="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}>
          回到首頁
        </a>
      </div>
    );
  }

  return <MeetingRoom meeting={meeting} skills={skills} />;
}
