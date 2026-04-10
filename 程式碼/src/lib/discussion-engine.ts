import { GoogleGenAI } from "@google/genai";
import { DiscussionEvent, Meeting, Message, Skill, Phase } from "../types";
import { addMessage, updateMeeting, addReport } from "./store";
import { v4 as uuidv4 } from "uuid";

export class DiscussionEngine {
  private ai: GoogleGenAI;
  private meeting: Meeting;
  private skills: Skill[];
  private messages: Message[] = [];
  private totalInputTokens = 0;
  private totalOutputTokens = 0;
  private startTime: number = 0;

  constructor(meeting: Meeting, skills: Skill[]) {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    this.meeting = meeting;
    this.skills = skills;
  }

  private saveMessage(skill: Skill, content: string, phase: Phase, round: number, signature?: string): Message {
    const message: Message = {
      id: uuidv4(),
      meetingId: this.meeting.id,
      skillId: skill.id,
      skillName: skill.name,
      skillAvatar: skill.avatar,
      round,
      phase,
      content,
      signature,
      createdAt: new Date().toISOString(),
    };

    this.messages.push(message);
    addMessage(this.meeting.id, message);
    return message;
  }

  private doUpdateMeeting(updates: Partial<Meeting>) {
    this.meeting = { ...this.meeting, ...updates };
    updateMeeting(this.meeting.id, updates);
  }

  private formatSignature(skill: Skill) {
    return skill.signature.style
      .replace("{name}", skill.name)
      .replace("{expertise}", skill.expertise.join("、"));
  }

  private getHistoryText() {
    return this.messages
      .map(m => `[${m.skillName}]: ${m.content}`)
      .join("\n\n");
  }

  private updateTokenUsage(response: any) {
    if (response.usageMetadata) {
      this.totalInputTokens += response.usageMetadata.promptTokenCount || 0;
      this.totalOutputTokens += response.usageMetadata.candidatesTokenCount || 0;

      this.doUpdateMeeting({
        totalInputTokens: this.totalInputTokens,
        totalOutputTokens: this.totalOutputTokens,
      });
    }
  }

  async *run(): AsyncGenerator<DiscussionEvent> {
    try {
      this.startTime = Date.now();
      this.doUpdateMeeting({ startTime: new Date().toISOString() });

      // Phase 1: Opening
      yield { type: 'phase_change', phase: 'opening' };
      this.doUpdateMeeting({ currentPhase: 'opening', status: 'running' });

      for (const skill of this.skills) {
        const prompt = `
          你現在是 ${skill.name}。
          你的背景：${skill.personality}
          你的專長：${skill.expertise.join(", ")}

          會議主題：${this.meeting.topic}
          參考資料：${this.meeting.sourceData || "無"}
          會議目標：${this.meeting.goalType}

          這是會議的開場階段。請針對主題給出你的初始觀點。
          請保持你的角色設定。
        `;

        const response = await this.ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
        });

        this.updateTokenUsage(response);

        const content = response.text || "";
        const message = this.saveMessage(skill, content, 'opening', 0);
        yield { type: 'message', message };
      }

      // Phase 2: Discussion
      yield { type: 'phase_change', phase: 'discussion' };
      this.doUpdateMeeting({ currentPhase: 'discussion' });

      for (let round = 1; round <= this.meeting.rounds; round++) {
        yield { type: 'round_change', round };
        this.doUpdateMeeting({ currentRound: round });

        for (const skill of this.skills) {
          const history = this.getHistoryText();
          const prompt = `
            你現在是 ${skill.name}。
            你的背景：${skill.personality}
            你的專長：${skill.expertise.join(", ")}

            會議主題：${this.meeting.topic}
            會議目標：${this.meeting.goalType}

            目前是第 ${round} 輪討論（總共 ${this.meeting.rounds} 輪）。

            以下是之前的討論記錄：
            ${history}

            請閱讀其他人的觀點，進行自我反思 (self-critique)，提出修正後的觀點或反駁，並提出追問或補充問題。
            請保持你的角色設定，並試圖朝著會議目標（${this.meeting.goalType}）推進。
          `;

          const response = await this.ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
          });

          this.updateTokenUsage(response);

          const content = response.text || "";
          const message = this.saveMessage(skill, content, 'discussion', round);
          yield { type: 'message', message };
        }
      }

      // Phase 3: Summary
      yield { type: 'phase_change', phase: 'summary' };
      this.doUpdateMeeting({ currentPhase: 'summary' });

      const summaryPrompt = `
        你是一位專業的會議記錄員。請根據以下多輪討論的內容，整理出一份結構化的會議報告。

        討論內容：
        ${this.getHistoryText()}

        報告應包含：
        1. 共識結論
        2. 分歧觀點
        3. 待釐清問題

        請以 Markdown 格式輸出。
      `;

      const summaryResponse = await this.ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: summaryPrompt,
      });

      this.updateTokenUsage(summaryResponse);

      const summaryContent = summaryResponse.text || "";
      yield { type: 'summary', content: summaryContent };

      // Phase 4: Signatures
      yield { type: 'phase_change', phase: 'signature' };
      this.doUpdateMeeting({ currentPhase: 'signature' });

      let fullReport = `# 🏛️ Skill Meeting 討論報告\n\n## 📋 會議資訊\n- 主題：${this.meeting.topic}\n- 日期：${new Date().toLocaleDateString()}\n- 參與者：${this.skills.map(s => s.name).join(", ")}\n- 討論輪數：${this.meeting.rounds} 輪\n\n${summaryContent}\n\n## ✍️ 簽署\n`;

      for (const skill of this.skills) {
        const signature = this.formatSignature(skill);
        fullReport += `\n---\n${signature}\n---`;
      }

      // Save report
      addReport(this.meeting.id, {
        id: uuidv4(),
        meetingId: this.meeting.id,
        content: fullReport,
        createdAt: new Date().toISOString(),
      });

      const endTime = Date.now();
      const durationSeconds = Math.floor((endTime - this.startTime) / 1000);

      yield { type: 'complete', content: fullReport };
      this.doUpdateMeeting({
        status: 'completed',
        endTime: new Date().toISOString(),
        durationSeconds,
      });
    } catch (error: any) {
      console.error("Discussion Error:", error);
      const endTime = Date.now();
      const durationSeconds = Math.floor((endTime - this.startTime) / 1000);
      yield { type: 'error', error: error.message };
      this.doUpdateMeeting({
        status: 'failed',
        endTime: new Date().toISOString(),
        durationSeconds,
      });
    }
  }
}
