import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isMockEnabled, mockAuth } from '@/lib/supabaseClient';
import { Layout } from '@/components/Layout';
import { UserPlus, Mail, Lock, User, Check, AlertCircle } from 'lucide-react';

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 상태 관리
  const [isEmailChecked, setIsEmailChecked] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // 이메일 유효성 검사 규칙
  const validateEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  // 이메일 중복 확인
  const handleCheckEmail = async () => {
    if (!validateEmail(email)) {
      setErrorMsg('올바른 이메일 형식이 아닙니다.');
      return;
    }

    setCheckingEmail(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isMockEnabled) {
        const mockUsers = JSON.parse(localStorage.getItem('bf_users') || '[]');
        const exists = mockUsers.some((u: any) => u.email === email);
        if (exists) {
          setErrorMsg('이미 등록된 이메일입니다.');
          setIsEmailChecked(false);
        } else {
          setSuccessMsg('사용 가능한 이메일입니다.');
          setIsEmailChecked(true);
        }
      } else {
        // 실제 Supabase public.users 테이블 단에서 동일한 이메일이 등록되어 있는지 사전 검사
        const { data, error } = await supabase
          .from('users')
          .select('email')
          .eq('email', email);

        if (error) throw error;

        if (data && data.length > 0) {
          setErrorMsg('이미 등록된 이메일입니다.');
          setIsEmailChecked(false);
        } else {
          setSuccessMsg('사용 가능한 이메일입니다.');
          setIsEmailChecked(true);
        }
      }
    } catch (err: any) {
      setErrorMsg('중복 확인 실패: ' + (err.message || '알 수 없는 오류'));
      setIsEmailChecked(false);
    } finally {
      setCheckingEmail(false);
    }
  };

  // 회원가입 전송
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isEmailChecked) {
      setErrorMsg('이메일 중복 확인을 먼저 진행해 주세요.');
      return;
    }
    if (nickname.trim().length < 2) {
      setErrorMsg('닉네임은 2자 이상 입력해 주세요.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);

    try {
      if (isMockEnabled) {
        await mockAuth.signUp(email, password, nickname);
        await mockAuth.signOut(); // 목업 환경에서도 자동 로그인 방지
      } else {
        // 실제 Supabase Auth 가입
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nickname: nickname,
              role: 'user', // 기본 회원가입 유저는 일반 유저
            },
          },
        });

        if (error) throw error;
        
        // 이메일 인증이 꺼져있을 경우 Supabase가 자동 로그인을 시켜버리므로, 
        // 의도한 로그인 플로우(회원가입 후 수동 로그인)를 위해 바로 강제 로그아웃 처리
        await supabase.auth.signOut();
      }

      setSuccessMsg('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || '회원가입 도중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-[400px] mx-auto my-12 bg-white rounded-bamboo-card p-8 shadow-soft border border-bamboo-border/50">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center mb-3">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-bamboo-text-main">대나무숲 회원가입</h2>
          <p className="text-xs text-bamboo-text-muted mt-1">
            고충을 솔직하게 나누기 위해 가입해 주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이메일 입력 및 중복확인 */}
          <div>
            <label className="block text-xs font-semibold text-bamboo-text-muted mb-1.5">이메일</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-bamboo-text-muted/60">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setIsEmailChecked(false); // 이메일 변경 시 재인증 필요
                  }}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-transparent rounded-bamboo-input focus:bg-white focus:border-brand-blue outline-none transition-all"
                />
              </div>
              <button
                type="button"
                onClick={handleCheckEmail}
                disabled={checkingEmail || !email}
                className="text-xs font-semibold text-brand-blue border border-brand-blue bg-white hover:bg-blue-50 px-3 py-2 rounded-bamboo-input disabled:opacity-50 transition-colors shrink-0"
              >
                {checkingEmail ? '확인 중...' : '중복 확인'}
              </button>
            </div>
          </div>

          {/* 닉네임 입력 */}
          <div>
            <label className="block text-xs font-semibold text-bamboo-text-muted mb-1.5">닉네임</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-bamboo-text-muted/60">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                placeholder="2자 이상 닉네임"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-transparent rounded-bamboo-input focus:bg-white focus:border-brand-blue outline-none transition-all"
              />
            </div>
          </div>

          {/* 비밀번호 입력 */}
          <div>
            <label className="block text-xs font-semibold text-bamboo-text-muted mb-1.5">비밀번호</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-bamboo-text-muted/60">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                placeholder="6자 이상 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-transparent rounded-bamboo-input focus:bg-white focus:border-brand-blue outline-none transition-all"
              />
            </div>
          </div>

          {/* 비밀번호 확인 입력 */}
          <div>
            <label className="block text-xs font-semibold text-bamboo-text-muted mb-1.5">비밀번호 확인</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-bamboo-text-muted/60">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                placeholder="비밀번호 재입력"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-transparent rounded-bamboo-input focus:bg-white focus:border-brand-blue outline-none transition-all"
              />
            </div>
          </div>

          {/* 피드백 메시지 표시 */}
          {errorMsg && (
            <div className="flex items-center gap-1.5 text-xs text-status-rejected-text bg-status-rejected px-3 py-2.5 rounded-bamboo-input">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-1.5 text-xs text-status-accepted-text bg-status-accepted px-3 py-2.5 rounded-bamboo-input">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 회원가입 제출 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white text-sm font-bold rounded-bamboo-input shadow-soft disabled:opacity-50 transition-colors mt-2"
          >
            {loading ? '가입하는 중...' : '가입하기'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-bamboo-text-muted border-t border-bamboo-border/50 pt-4">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-brand-blue font-semibold hover:underline">
            로그인하기
          </Link>
        </div>
      </div>
    </Layout>
  );
};
