/**
 * Simple localStorage-based auth to replace Firebase Auth.
 * Users just enter a display name — no Google login required.
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface LocalUser {
  uid: string;
  displayName: string;
  email: string; // generated placeholder
}

interface AuthContextType {
  user: LocalUser | null;
  loading: boolean;
  login: (displayName: string) => void;
  logout: () => void;
}

const AUTH_KEY = 'skill-meeting:auth';

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const login = (displayName: string) => {
    // Check if existing user with same name
    const stored = localStorage.getItem(AUTH_KEY);
    let existing: LocalUser | null = null;
    try {
      if (stored) existing = JSON.parse(stored);
    } catch { /* ignore */ }

    const u: LocalUser = existing && existing.displayName === displayName
      ? existing
      : {
          uid: uuidv4(),
          displayName,
          email: `${displayName.toLowerCase().replace(/\s+/g, '.')}@local`,
        };

    localStorage.setItem(AUTH_KEY, JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
