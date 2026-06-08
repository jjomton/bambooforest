import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, isMockEnabled, mockDb } from '@/lib/supabaseClient';
import { Layout } from '@/components/Layout';
import { Trees, AlertCircle, Check } from 'lucide-react';

export const PostCreate: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // 폼 입력 상태
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // 피드백 상태
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // 로그인되지 않은 사용자는 로그인 화면으로 리다이렉트
  useEffect(() => {
    if (!authLoading && !user) {
      alert('로그인이 필요한 화면입니다. 로그인 페이지로 이동합니다.');
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!title.trim()) {
      setErrorMsg('제목을 입력해 주세요.');
      return;
    }
    if (!content.trim()) {
      setErrorMsg('본문 내용을 입력해 주세요.');
      return;
    }

    setSaving(true);

    try {
      if (isMockEnabled) {
        await mockDb.createPost(title, content);
      } else {
        // 실제 Supabase 삽입
        // 중요: 익명성 보장 원칙에 따라 user_id나 어떠한 식별 컬럼도 전달하지 않음.
        const { error } = await supabase
          .from('posts')
          .insert([{ title, content }]);

        if (error) throw error;
      }

      setSuccessMsg('건의글이 성공적으로 등록되었습니다. 피드로 이동합니다.');
      setTimeout(() => {
        navigate('/board');
      }, 1500);
    } catch (err: any) {
      setErrorMsg('글 등록에 실패했습니다: ' + (err.message || '알 수 없는 오류'));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-bamboo-text-muted mt-3">권한을 확인하는 중...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[640px] mx-auto bg-white rounded-bamboo-card p-8 shadow-soft border border-bamboo-border/50">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-bamboo-border/40">
          <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
            <Trees className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-bamboo-text-main">새 건의사항 등록</h2>
            <p className="text-xs text-bamboo-text-muted">완전 익명으로 등록되며, 누구도 작성자를 알 수 없습니다.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 제목 필드 */}
          <div>
            <label htmlFor="title" className="block text-xs font-semibold text-bamboo-text-muted mb-1.5">
              건의 제목
            </label>
            <input
              id="title"
              type="text"
              required
              maxLength={200}
              placeholder="불편 사항 혹은 개선 아이디어의 제목을 입력하세요."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-transparent rounded-bamboo-input focus:bg-white focus:border-brand-blue outline-none transition-all"
            />
          </div>

          {/* 본문 텍스트 영역 */}
          <div>
            <label htmlFor="content" className="block text-xs font-semibold text-bamboo-text-muted mb-1.5">
              건의 상세 내용
            </label>
            <textarea
              id="content"
              required
              rows={8}
              placeholder="구체적인 고충 내용, 영향받는 영역, 제안하는 조치 방안 등을 자유롭고 솔직하게 기재해 주세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-transparent rounded-bamboo-input focus:bg-white focus:border-brand-blue outline-none transition-all resize-none"
            />
          </div>

          {/* 알림 배너 */}
          <div className="bg-blue-50 text-brand-blue border border-blue-100 rounded-bamboo-input p-3 text-xs leading-relaxed">
            💡 <strong>대나무숲 익명 보장 안내:</strong> 이 시스템은 DB 레벨에서도 작성자의 ID나 IP를 매핑하지 않습니다. 안심하고 솔직한 의견을 남겨주세요. 다만, 본문에 본인을 유추할 수 있는 개인정보를 기재하지 않도록 주의해 주시기 바랍니다.
          </div>

          {/* 피드백 상태 메시지 */}
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

          {/* 버튼 영역 */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-bamboo-border/40">
            <button
              type="button"
              onClick={() => navigate('/board')}
              disabled={saving}
              className="px-5 py-2.5 border border-bamboo-border/60 text-bamboo-text-muted hover:bg-gray-50 rounded-bamboo-input text-xs font-semibold transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-bamboo-input text-xs font-bold shadow-soft transition-colors disabled:opacity-50"
            >
              {saving ? '등록 중...' : '건의글 등록'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
