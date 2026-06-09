import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isMockEnabled, mockAuth } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isMockEnabled) {
        await mockAuth.signIn(email, password);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }

      // Context 상태 동기화 및 갱신
      await refreshUser();

      // 계정 권한 확인을 위해 잠시 유저 정보 로드 대기 후 리다이렉트
      // 임시로 refreshUser 직후 localStorage나 mockAuth 등에서 role을 검출하여 분기 처리
      if (isMockEnabled) {
        const currentUser = mockAuth.getUser();
        if (currentUser?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/board');
        }
      } else {
        // 실제 Supabase Auth의 경우 public.users 테이블 정보 쿼리 필요
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profile?.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/board');
          }
        } else {
          navigate('/board');
        }
      }
    } catch (err: any) {
      // 보안상 "계정 존재 여부 노출 금지" 조건 반영
      // 즉, 이메일 혹은 비밀번호 오류라는 중립적인 에러 메시지 노출
      setErrorMsg('이메일 또는 비밀번호가 올바르지 않습니다.');
      console.error('로그인 에러:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-[400px] mx-auto my-8 sm:my-16 bg-white rounded-bamboo-card p-6 sm:p-8 shadow-soft border border-bamboo-border/50">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center mb-3">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-bamboo-text-main">대나무숲 로그인</h2>
          <p className="text-xs text-bamboo-text-muted mt-1">
            계정에 로그인하여 건의사항을 확인하세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이메일 */}
          <div>
            <label className="block text-xs font-semibold text-bamboo-text-muted mb-1.5">이메일</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-bamboo-text-muted/60">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-transparent rounded-bamboo-input focus:bg-white focus:border-brand-blue outline-none transition-all"
              />
            </div>
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-xs font-semibold text-bamboo-text-muted mb-1.5">비밀번호</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-bamboo-text-muted/60">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-transparent rounded-bamboo-input focus:bg-white focus:border-brand-blue outline-none transition-all"
              />
            </div>
          </div>

          {/* 에러 메시지 */}
          {errorMsg && (
            <div className="flex items-center gap-1.5 text-xs text-status-rejected-text bg-status-rejected px-3 py-2.5 rounded-bamboo-input">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white text-sm font-bold rounded-bamboo-input shadow-soft disabled:opacity-50 transition-colors mt-2"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-bamboo-text-muted border-t border-bamboo-border/50 pt-4">
          처음 오셨나요?{' '}
          <Link to="/signup" className="text-brand-blue font-semibold hover:underline">
            회원가입하기
          </Link>
        </div>
      </div>
    </Layout>
  );
};
