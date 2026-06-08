import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isMockEnabled, mockAuth } from '@/lib/supabaseClient';

interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string, email: string): Promise<UserProfile> => {
    // 1. Mock 모드인 경우
    if (isMockEnabled) {
      const mockUsers = JSON.parse(localStorage.getItem('bf_users') || '[]');
      const found = mockUsers.find((u: any) => u.id === userId);
      return found || { id: userId, email, nickname: '익명 대나무', role: 'user' };
    }

    // 2. 실제 Supabase 데이터베이스 쿼리
    const { data, error } = await supabase
      .from('users')
      .select('id, email, nickname, role')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.warn('public.users 프로필을 찾을 수 없어 기본값을 반환합니다:', error);
      return { id: userId, email, nickname: '익명 대나무', role: 'user' };
    }

    return data as UserProfile;
  };

  const refreshUser = async () => {
    try {
      setLoading(true);
      if (isMockEnabled) {
        const currentUser = mockAuth.getUser();
        if (currentUser) {
          setUser({
            id: currentUser.id,
            email: currentUser.email,
            nickname: currentUser.nickname,
            role: currentUser.role,
          });
        } else {
          setUser(null);
        }
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id, session.user.email || '');
          setUser(profile);
        } else {
          setUser(null);
        }
      }
    } catch (err) {
      console.error('인증 정보를 가져오는 도중 오류 발생:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    if (!isMockEnabled) {
      // 실제 Supabase 로그인 상태 구독
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id, session.user.email || '');
          setUser(profile);
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const signOut = async () => {
    setLoading(true);
    if (isMockEnabled) {
      await mockAuth.signOut();
      setUser(null);
    } else {
      await supabase.auth.signOut();
      setUser(null);
    }
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.');
  }
  return context;
};
