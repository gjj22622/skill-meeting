import { LocalUser } from "../lib/auth-context";
import { useEffect, useState } from "react";
import { subscribeMeetings } from "../lib/store";
import { Meeting } from "../types";
import { Link } from "react-router-dom";
import { Plus, Calendar, MessageSquare, CheckCircle, Play, FileText } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

export default function HomePage({ user }: { user: LocalUser }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeMeetings(user.uid, (list) => {
      setMeetings(list);
      setLoading(false);
    });
    return unsubscribe;
  }, [user.uid]);

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-5xl font-serif italic mb-2">我的會議</h1>
          <p className="text-gray-500 font-sans">查看過往的討論記錄或發起新的圓桌會議。</p>
        </div>
        <Link
          to="/meeting/new"
          className="flex items-center gap-2 px-6 py-3 bg-[#141414] text-white rounded-full hover:scale-105 transition-transform font-sans font-medium"
        >
          <Plus size={20} />
          發起新會議
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-white/50 border border-[#141414]/10 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-[#141414]/10 rounded-3xl">
          <p className="text-gray-400 font-serif italic text-2xl mb-4">尚無會議記錄</p>
          <Link to="/meeting/new" className="text-[#141414] underline font-medium">發起您的第一個 AI 圓桌討論</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.map((meeting) => (
            <Link
              key={meeting.id}
              to={meeting.status === 'completed' ? `/reports/${meeting.id}` : `/meeting/${meeting.id}`}
              className="group bg-white border border-[#141414] rounded-3xl p-6 hover:bg-[#141414] hover:text-white transition-all duration-300 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold opacity-60">
                  <Calendar size={14} />
                  {format(new Date(meeting.createdAt), "yyyy/MM/dd", { locale: zhTW })}
                </div>
                {meeting.status === 'completed' ? (
                  <CheckCircle size={20} className="text-green-500 group-hover:text-green-400" />
                ) : meeting.status === 'running' ? (
                  <Play size={20} className="text-blue-500 animate-pulse" />
                ) : (
                  <MessageSquare size={20} className="opacity-40" />
                )}
              </div>

              <h3 className="text-2xl font-serif italic mb-4 line-clamp-2 leading-tight">
                {meeting.topic}
              </h3>

              <div className="mt-auto pt-4 border-t border-[#141414]/10 group-hover:border-white/20 flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest font-bold opacity-60">
                  {meeting.rounds} 輪討論
                </span>
                <div className="flex items-center gap-1 text-sm font-medium">
                  {meeting.status === 'completed' ? (
                    <span className="flex items-center gap-1"><FileText size={14} /> 查看報告</span>
                  ) : (
                    <span className="flex items-center gap-1"><Play size={14} /> 進入會議室</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
