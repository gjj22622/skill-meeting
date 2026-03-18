import { MeetingReport } from './types';

export function generateMarkdownReport(report: MeetingReport): string {
  const participantList = report.participants
    .map((p) => `${p.avatar} ${p.name}`)
    .join('、');

  const transcript = report.fullTranscript
    .map((m) => {
      const roundInfo = m.round ? ` (第 ${m.round} 輪)` : '';
      const phaseMap = { opening: '開場陳述', discussion: '討論', summary: '總結' };
      return `### ${m.skillAvatar} ${m.skillName} — ${phaseMap[m.phase]}${roundInfo}\n\n${m.content}`;
    })
    .join('\n\n---\n\n');

  const signatureBlock = report.signatures
    .map((sig) => `---\n${sig}`)
    .join('\n\n');

  return `# 🏛️ Skill Meeting 討論報告

## 📋 會議資訊
- **主題**：${report.topic}
- **日期**：${new Date(report.date).toLocaleDateString('zh-TW')}
- **參與者**：${participantList}
- **討論輪數**：${report.totalRounds} 輪

---

## 💡 共識結論

${report.consensus || '（無）'}

---

## ⚔️ 分歧觀點

${report.disagreements || '（無）'}

---

## ❓ 待釐清問題

${report.openQuestions || '（無）'}

---

## 📝 完整對話記錄

${transcript}

---

## ✍️ 簽署

${signatureBlock}

---

*此報告由 Skill Meeting 自動產生*
`;
}
