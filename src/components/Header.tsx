import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, LogIn, UserPlus, ShieldAlert, Trees } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      await signOut();
      navigate('/login');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-bamboo-border">
      <div className="max-w-[768px] mx-auto px-5 h-16 flex items-center justify-between">
        {/* 로고 영역 */}
        <Link to="/board" className="flex items-center gap-2 text-brand-blue font-bold text-lg hover:opacity-90 transition-opacity">
          <Trees className="w-6 h-6 text-brand-blue" />
          <span className="font-plus-jakarta tracking-tight">휴먼 대나무숲</span>
          {user?.role === 'admin' && (
            <span className="flex items-center gap-1 bg-status-rejected text-status-rejected-text text-xs font-semibold px-2 py-0.5 rounded-full">
              <ShieldAlert className="w-3 h-3" />
              관리자
            </span>
          )}
        </Link>

        {/* 네비게이션 액션 */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden sm:flex flex-col items-end text-xs">
                <span className="font-semibold text-bamboo-text-main">{user.nickname}님</span>
                <span className="text-bamboo-text-muted text-[10px]">
                  {user.role === 'admin' ? '운영본부 관리자' : '일반 수강생'}
                </span>
              </div>

              {user.role === 'admin' ? (
                <Link
                  to="/admin"
                  className="text-xs font-medium text-brand-blue bg-blue-50 px-3 py-1.5 rounded-bamboo-input hover:bg-blue-100 transition-colors"
                >
                  대시보드
                </Link>
              ) : (
                <Link
                  to="/board"
                  className="text-xs font-medium text-bamboo-text-muted hover:text-bamboo-text-main transition-colors"
                >
                  피드
                </Link>
              )}

              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-xs text-bamboo-text-muted hover:text-status-rejected-text transition-colors font-medium px-2 py-1.5 rounded-bamboo-input hover:bg-red-50"
                title="로그아웃"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">로그아웃</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="flex items-center gap-1 text-xs text-bamboo-text-muted hover:text-brand-blue transition-colors font-medium px-3 py-1.5 rounded-bamboo-input hover:bg-gray-100"
              >
                <LogIn className="w-4 h-4" />
                로그인
              </Link>
              <Link
                to="/signup"
                className="flex items-center gap-1 text-xs text-white bg-brand-blue hover:bg-brand-blue-hover transition-colors font-medium px-3 py-1.5 rounded-bamboo-input shadow-soft"
              >
                <UserPlus className="w-4 h-4" />
                회원가입
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
