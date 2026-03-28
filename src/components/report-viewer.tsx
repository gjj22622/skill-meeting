'use client';

import { MeetingReport } from '@/lib/types';
import { generateMarkdownReport } from '@/lib/report-generator';

interface ReportViewerProps {
  report: MeetingReport;
}

export default function ReportViewer({ report }: ReportViewerProps) {
  function downloadReport() {
    const md = generateMarkdownReport(report);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skill-meeting-${report.topic}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>📄 討論報告</h2>
        <button className="btn-primary" onClick={downloadReport}>
          ⬇️ 下載報告 (Markdown)
        </button>
      </div>

      {/* Meeting info */}
      <div className="report-section">
        <h3 style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--accent)' }}>📋 會議資訊</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
          <div><span style={{ color: 'var(--text-secondary)' }}>主題：</span>{report.topic}</div>
          <div><span style={{ color: 'var(--text-secondary)' }}>日期：</span>{new Date(report.date).toLocaleDateString('zh-TW')}</div>
          <div><span style={{ color: 'var(--text-secondary)' }}>參與者：</span>{report.participants.map((p) => `${p.avatar} ${p.name}`).join('、')}</div>
          <div><span style={{ color: 'var(--text-secondary)' }}>討論輪數：</span>{report.totalRounds} 輪</div>
        </div>
      </div>

      {/* Consensus */}
      <div className="report-section">
        <h3 style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--success)' }}>💡 共識結論</h3>
        <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{report.consensus || '（無）'}</div>
      </div>

      {/* Disagreements */}
      <div className="report-section">
        <h3 style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--warning)' }}>⚔️ 分歧觀點</h3>
        <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{report.disagreements || '（無）'}</div>
      </div>

      {/* Open questions */}
      <div className="report-section">
        <h3 style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--accent)' }}>❓ 待釐清問題</h3>
        <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{report.openQuestions || '（無）'}</div>
      </div>

      {/* Action items */}
      <div className="report-section">
        <h3 style={{ fontWeight: 600, marginBottom: '0.75rem', color: '#10b981' }}>🎯 行動建議</h3>
        <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{report.actionItems || '（無）'}</div>
      </div>

      {/* Signatures */}
      <div className="report-section">
        <h3 style={{ fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>✍️ 簽署</h3>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {report.signatures.map((sig, i) => (
            <div
              key={i}
              style={{
                padding: '1rem',
                background: 'var(--bg-card)',
                borderRadius: '0.5rem',
                borderLeft: '3px solid var(--accent)',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
              }}
            >
              {sig}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
