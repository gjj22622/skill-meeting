import { LocalUser } from "../lib/auth-context";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { subscribeMeeting, subscribeMessages, subscribeReports } from "../lib/store";
import { Meeting, Report, Message } from "../types";
import { Download, ChevronLeft, Calendar, Users, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { cn } from "../lib/utils";

export default function ReportPage({ user }: { user: LocalUser }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showFullHistory, setShowFullHistory] = useState(false);

  useEffect(() => {
    if (!id) return;

    const unsubMeeting = subscribeMeeting(id, (m) => {
      if (m) {
        setMeeting(m);
      } else {
        navigate("/");
      }
    });

    const unsubReports = subscribeReports(id, (reports) => {
      if (reports.length > 0) {
        setReport(reports[reports.length - 1]);
      }
    });

    const unsubMessages = subscribeMessages(id, (msgs) => {
      setMessages(msgs);
    });

    return () => {
      unsubMeeting();
      unsubReports();
      unsubMessages();
    };
  }, [id]);

  const downloadMarkdown = () => {
    if (!report) return;
    const blob = new Blob([report.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SkillMeeting_Report_${id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!meeting || !report) return null;

  return (
    <div className="max-w-4xl mx-auto p-8 pb-24">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-sm font-bold opacity-40 hover:opacity-100 transition-opacity mb-8 uppercase tracking-widest"
      >
        <ChevronLeft size={16} /> 返回會議列表
      </button>

      <div className="bg-white border border-[#141414] rounded-[40px] overflow-hidden shadow-2xl">
        {/* Report Header */}
        <div className="bg-[#141414] text-white p-12">
          <div className="flex items-center justify-between mb-8">
            <div className="text-xs uppercase tracking-[0.3em] font-bold opacity-60">討論報告書</div>
            <button
              onClick={downloadMarkdown}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-xs font-bold uppercase tracking-widest"
            >
              <Download size={14} /> 下載 Markdown
            </button>
          </div>
          <h1 className="text-5xl font-serif italic mb-12 leading-tight">{meeting.topic}</h1>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-8 border-t border-white/10">
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-widest font-bold opacity-40 flex items-center gap-1">
                <Calendar size={10} /> 日期
              </div>
              <div className="font-serif italic">{format(new Date(meeting.createdAt), "yyyy年MM月dd日", { locale: zhTW })}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-widest font-bold opacity-40 flex items-center gap-1">
                <Users size={10} /> 參與角色
              </div>
              <div className="font-serif italic">{meeting.skillIds.length} 位專家</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-widest font-bold opacity-40 flex items-center gap-1">
                <MessageSquare size={10} /> 討論輪數
              </div>
              <div className="font-serif italic">{meeting.rounds} 輪</div>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="p-12 prose prose-lg max-w-none prose-headings:font-serif prose-headings:italic prose-hr:border-[#141414]/10">
          <ReactMarkdown>{report.content}</ReactMarkdown>
        </div>

        {/* Full History Toggle */}
        <div className="px-12 pb-12">
          <button
            onClick={() => setShowFullHistory(!showFullHistory)}
            className="w-full py-6 border-t border-[#141414]/10 flex items-center justify-between group"
          >
            <span className="text-xs uppercase tracking-widest font-bold opacity-40 group-hover:opacity-100 transition-opacity">
              {showFullHistory ? "隱藏完整對話記錄" : "查看完整對話記錄"}
            </span>
            <ChevronLeft size={20} className={cn("transition-transform duration-300", showFullHistory ? "rotate-90" : "-rotate-90")} />
          </button>

          {showFullHistory && (
            <div className="space-y-8 pt-8 animate-in fade-in slide-in-from-top-4 duration-500">
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-[#141414]/5 flex items-center justify-center text-xl shrink-0">
                    {msg.skillAvatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-serif italic text-sm">{msg.skillName}</span>
                      <span className="text-[8px] uppercase tracking-widest font-bold opacity-30">
                        {msg.phase === 'opening' ? "開場" : `Round ${msg.round}`}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
