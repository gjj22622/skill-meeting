import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useState } from "react";
import { useAuth, AuthProvider, LocalUser } from "./lib/auth-context";
import { Layout, Plus, Users, FileText, LogIn, LogOut, Home } from "lucide-react";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Pages
import HomePage from "./pages/HomePage";
import NewMeetingPage from "./pages/NewMeetingPage";
import MeetingRoomPage from "./pages/MeetingRoomPage";
import SkillsPage from "./pages/SkillsPage";
import ReportPage from "./pages/ReportPage";
import AdminPage from "./pages/AdminPage";

function AppInner() {
  const { user, loading, login, logout } = useAuth();
  const [nameInput, setNameInput] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E4E3E0]">
        <div className="animate-pulse text-2xl font-serif italic">Skill Meeting...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#E4E3E0] p-4 text-center">
        <h1 className="text-6xl font-serif italic mb-4 tracking-tight">Skill Meeting</h1>
        <p className="text-xl font-sans text-gray-600 mb-8 max-w-md">
          AI 多角色圓桌討論平台。讓專家 AI 為您進行深度辯論與決策。
        </p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <input
            type="text"
            placeholder="輸入您的名稱"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && nameInput.trim()) login(nameInput.trim()); }}
            className="w-full px-6 py-4 rounded-full border-2 border-[#141414] bg-white text-center font-sans text-lg focus:outline-none focus:ring-2 focus:ring-[#141414]/20"
          />
          <button
            onClick={() => { if (nameInput.trim()) login(nameInput.trim()); }}
            disabled={!nameInput.trim()}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-[#141414] text-white rounded-full hover:scale-105 transition-transform font-sans font-medium disabled:opacity-30"
          >
            <LogIn size={20} />
            進入平台
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-[#E4E3E0] flex flex-col font-sans text-[#141414]">
          {/* Navigation */}
          <nav className="border-b border-[#141414] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#E4E3E0] z-50">
            <Link to="/" className="text-2xl font-serif italic tracking-tight flex items-center gap-2">
              🏛️ Skill Meeting
            </Link>
            <div className="flex items-center gap-6">
              <Link to="/" className="hover:opacity-60 transition-opacity flex items-center gap-1 text-sm uppercase tracking-wider font-medium">
                <Home size={16} /> 會議列表
              </Link>
              <Link to="/skills" className="hover:opacity-60 transition-opacity flex items-center gap-1 text-sm uppercase tracking-wider font-medium">
                <Users size={16} /> Skill 管理
              </Link>
              <span className="text-sm opacity-40 font-medium">{user.displayName}</span>
              <button
                onClick={logout}
                className="hover:opacity-60 transition-opacity flex items-center gap-1 text-sm uppercase tracking-wider font-medium"
              >
                <LogOut size={16} /> 登出
              </button>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<HomePage user={user} />} />
              <Route path="/meeting/new" element={<NewMeetingPage user={user} />} />
              <Route path="/meeting/:id" element={<MeetingRoomPage user={user} />} />
              <Route path="/skills" element={<SkillsPage user={user} />} />
              <Route path="/reports/:id" element={<ReportPage user={user} />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
