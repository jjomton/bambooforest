import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, isMockEnabled, mockDb } from '@/lib/supabaseClient';
import { Layout } from '@/components/Layout';
import { Calendar, ChevronLeft, MessageSquare, ThumbsUp, Star, AlertCircle, ShieldCheck, CornerDownRight, Flag } from 'lucide-react';
import { containsProfanity, getDetectedProfanities } from '@/lib/profanityFilter';

interface PostDetailData {
  id: string;
  title: string;
  content: string;
  status: 'pending' | 'accepted' | 'rejected';
  admin_comment: string | null;
  is_blinded: boolean;
  created_at: string;
}

interface CommentItem {
  id: string;
  content: string;
  is_blinded: boolean;
  created_at: string;
  parent_id?: string | null;
}

export const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // 데이터 상태
  const [post, setPost] = useState<PostDetailData | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState('');
  
  // 나의 글/댓글 상태
  const [isAuthor, setIsAuthor] = useState(false);
  const [myCommentIds, setMyCommentIds] = useState<Set<string>>(new Set());
  
  // 수정 모드 상태
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  
  // 답글 모드 상태
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  
  // 투표 통계 및 유저 투표 상태
  const [voteStats, setVoteStats] = useState({ totalCount: 0, averageScore: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number> });
  const [userVotedScore, setUserVotedScore] = useState<number | null>(null); // null 이면 미투표
  
  // 관리자 전용 제어 상태
  const [adminStatus, setAdminStatus] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [adminCommentInput, setAdminCommentInput] = useState('');

  // UI 상태
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingVote, setSubmittingVote] = useState(false);
  const [submittingAdmin, setSubmittingAdmin] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [error, setError] = useState('');

  const loadAllData = async () => {
    if (!id) return;
    setLoading(true);
    setError('');

    try {
      if (isMockEnabled) {
        // 1. 게시글 상세 조회 (블라인드 여부에 상관없이 가져와 프론트에서 분기 판단)
        const postData = await mockDb.getPostById(id, true);
        if (!postData) {
          setError('해당 게시글을 찾을 수 없습니다.');
          return;
        }
        setPost(postData);
        setAdminStatus(postData.status);
        setAdminCommentInput(postData.admin_comment || '');

        // 2. 댓글 목록 조회 (블라인드 여부에 상관없이 가져와 프론트에서 가공)
        const commentsList = await mockDb.getComments(id, true);
        setComments(commentsList);

        // 3. 투표 정보 및 통계 조회
        const stats = await mockDb.getVotes(id);
        setVoteStats(stats);

        // 4. 유저가 로그인해있다면 중복투표 여부 검사
        if (user) {
          const userVote = await mockDb.getUserVote(id, user.id);
          if (userVote) {
            setUserVotedScore(userVote.score);
          }
        }
      } else {
        // 실제 Supabase 연동
        // 1. 게시글 로드 (is_blinded 속성이 스키마에 추가되었으므로 select에 포함됨)
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', id)
          .single();

        if (postError || !postData) {
          setError('게시글을 찾을 수 없거나 데이터베이스 오류가 발생했습니다.');
          return;
        }
        setPost(postData);
        setAdminStatus(postData.status);
        setAdminCommentInput(postData.admin_comment || '');

        // 2. 댓글 로드
        const { data: commentsList, error: commentsError } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', id)
          .order('created_at', { ascending: true });

        if (!commentsError && commentsList) {
          setComments(commentsList);
        }

        // 3. 투표 통계 연산
        const { data: votesList, error: votesError } = await supabase
          .from('votes')
          .select('score, user_id')
          .eq('post_id', id);

        if (!votesError && votesList) {
          const totalCount = votesList.length;
          let averageScore = 0;
          const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          
          if (totalCount > 0) {
            const sum = votesList.reduce((acc, v) => {
              const scoreVal = v.score as 1 | 2 | 3 | 4 | 5;
              distribution[scoreVal] = (distribution[scoreVal] || 0) + 1;
              return acc + v.score;
            }, 0);
            averageScore = Number((sum / totalCount).toFixed(1));
          }

          setVoteStats({ totalCount, averageScore, distribution });

          // 4. 로그인 유저의 중복 투표 사전 검출
          if (user) {
            const userVote = votesList.find((v) => v.user_id === user.id);
            if (userVote) {
              setUserVotedScore(userVote.score);
            }
          }
        }
        
        // 5. 로그인 유저의 글/댓글 작성자 여부 확인
        if (user) {
          const { data: postAuthorData } = await supabase
            .from('post_authors')
            .select('post_id')
            .eq('post_id', id);
          if (postAuthorData && postAuthorData.length > 0) {
            setIsAuthor(true);
            setEditTitle(postData.title);
            setEditContent(postData.content);
          }

          const { data: commentAuthorData } = await supabase
            .from('comment_authors')
            .select('comment_id');
          if (commentAuthorData) {
            const myIds = new Set<string>(commentAuthorData.map((c: any) => c.comment_id));
            setMyCommentIds(myIds);
          }
        }
      }
    } catch (err: any) {
      setError('데이터를 가져오는 중 문제가 발생했습니다: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [id, user]);

  // 댓글 작성 처리 (대댓글 포함)
  const handleCommentSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    if (!user) {
      alert('댓글 작성을 위해 로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    const contentToSubmit = parentId ? replyContent : newComment;
    if (!id || !contentToSubmit.trim() || submittingComment) return;

    // 비속어 필터링
    if (containsProfanity(contentToSubmit)) {
      const badWords = getDetectedProfanities(contentToSubmit);
      alert(`댓글 내용에 부적절한 비속어가 포함되어 있어 등록할 수 없습니다. (감지된 단어: ${badWords.join(', ')})`);
      return;
    }

    setSubmittingComment(true);
    try {
      if (isMockEnabled) {
        const added = await mockDb.createComment(id, contentToSubmit, parentId);
        setComments([...comments, added as CommentItem]);
        setMyCommentIds((prev) => new Set(prev).add(added.id));
      } else {
        // 실제 댓글 삽입 (작성자 식별을 저장하지 않음)
        const { data, error: insertError } = await supabase
          .from('comments')
          .insert([{ post_id: id, content: contentToSubmit, parent_id: parentId }])
          .select();

        if (insertError) throw insertError;
        if (data) {
          setComments([...comments, data[0]]);
          setMyCommentIds((prev) => new Set(prev).add(data[0].id));
        }
      } // <- 이 중괄호가 빠져있었음
      
      if (parentId) {
        setReplyContent('');
        setReplyingToId(null);
      } else {
        setNewComment('');
      }
    } catch (err: any) {
      alert('댓글 등록 실패: ' + err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  // 게시글 신고
  const handleReportPost = async () => {
    if (!user) {
      alert('신고를 하려면 먼저 로그인해 주세요.');
      navigate('/login');
      return;
    }
    if (!id) return;

    const reason = prompt('이 게시글을 신고하는 사유를 입력해 주세요:');
    if (reason === null) return; // 취소

    setSubmittingReport(true);
    try {
      if (isMockEnabled) {
        await mockDb.reportPost(id, user.id, reason);
      } else {
        const { error: reportError } = await supabase
          .from('reports')
          .insert([{ post_id: id, user_id: user.id, reason }]);

        if (reportError) throw reportError;
      }
      alert('신고가 성공적으로 접수되었습니다. (동일 게시물 누적 3회 신고 시 자동 블라인드 처리)');
      loadAllData(); // 화면 갱신
    } catch (err: any) {
      alert('신고 처리 실패: ' + err.message);
    } finally {
      setSubmittingReport(false);
    }
  };

  // 댓글 신고
  const handleReportComment = async (commentId: string) => {
    if (!user) {
      alert('신고를 하려면 먼저 로그인해 주세요.');
      navigate('/login');
      return;
    }

    const reason = prompt('이 댓글을 신고하는 사유를 입력해 주세요:');
    if (reason === null) return; // 취소

    setSubmittingReport(true);
    try {
      if (isMockEnabled) {
        await mockDb.reportComment(commentId, user.id, reason);
      } else {
        const { error: reportError } = await supabase
          .from('reports')
          .insert([{ comment_id: commentId, user_id: user.id, reason }]);

        if (reportError) throw reportError;
      }
      alert('댓글 신고가 접수되었습니다. (동일 댓글 누적 3회 신고 시 자동 블라인드 처리)');
      loadAllData(); // 화면 갱신
    } catch (err: any) {
      alert('신고 처리 실패: ' + err.message);
    } finally {
      setSubmittingReport(false);
    }
  };

  // 공감도 투표 실행
  const handleVote = async (score: number) => {
    if (!user) {
      alert('공감 투표는 로그인한 사용자만 참여 가능합니다.');
      navigate('/login');
      return;
    }
    if (!id || submittingVote) return;

    setSubmittingVote(true);
    try {
      if (isMockEnabled) {
        await mockDb.vote(id, user.id, score);
        setUserVotedScore(score);
      } else {
        // 실제 Supabase 삽입/수정/삭제
        if (userVotedScore === score) {
          // 투표 취소
          const { error: deleteError } = await supabase
            .from('votes')
            .delete()
            .match({ post_id: id, user_id: user.id });
          if (deleteError) throw deleteError;
          setUserVotedScore(null);
        } else if (userVotedScore !== null) {
          // 투표 점수 변경
          const { error: updateError } = await supabase
            .from('votes')
            .update({ score })
            .match({ post_id: id, user_id: user.id });
          if (updateError) throw updateError;
          setUserVotedScore(score);
        } else {
          // 새 투표
          const { error: voteError } = await supabase
            .from('votes')
            .insert([{ post_id: id, user_id: user.id, score }]);
          if (voteError) throw voteError;
          setUserVotedScore(score);
        }
      }
      
      // 투표 통계 강제 리로드
      if (isMockEnabled) {
        const stats = await mockDb.getVotes(id);
        setVoteStats(stats);
      } else {
        const { data: votesList } = await supabase
          .from('votes')
          .select('score')
          .eq('post_id', id);
        
        if (votesList) {
          const totalCount = votesList.length;
          let averageScore = 0;
          const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          if (totalCount > 0) {
            const sum = votesList.reduce((acc, v) => {
              const scoreVal = v.score as 1 | 2 | 3 | 4 | 5;
              distribution[scoreVal] = (distribution[scoreVal] || 0) + 1;
              return acc + v.score;
            }, 0);
            averageScore = Number((sum / totalCount).toFixed(1));
          }
          setVoteStats({ totalCount, averageScore, distribution });
        }
      }

      if (userVotedScore === score) alert('투표가 취소되었습니다.');
      else if (userVotedScore !== null) alert('투표 점수가 변경되었습니다.');
      else alert('투표해 주셔서 감사합니다!');
    } catch (err: any) {
      alert('투표 반영 실패: ' + err.message);
    } finally {
      setSubmittingVote(false);
    }
  };

  // 관리자 상태 변경 처리
  const handleAdminUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'admin' || !id) {
      alert('권한이 없습니다.');
      return;
    }

    setSubmittingAdmin(true);
    try {
      if (isMockEnabled) {
        const updated = await mockDb.updatePostStatus(id, adminStatus, adminCommentInput || null);
        setPost(updated);
      } else {
        const { error: updateError } = await supabase
          .from('posts')
          .update({
            status: adminStatus,
            admin_comment: adminCommentInput || null,
          })
          .eq('id', id);

        if (updateError) throw updateError;
        
        setPost((prev) =>
          prev
            ? { ...prev, status: adminStatus, admin_comment: adminCommentInput || null }
            : null
        );
      }
      alert('게시글 상태 및 관리자 의견이 반영되었습니다.');
    } catch (err: any) {
      alert('상태 저장 실패: ' + err.message);
    } finally {
      setSubmittingAdmin(false);
    }
  };

  // 게시글 수정/삭제 핸들러
  const handleDeletePost = async () => {
    if (!window.confirm('정말 이 게시글을 삭제하시겠습니까? 관련 댓글과 투표도 모두 삭제됩니다.')) return;
    try {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
      alert('삭제되었습니다.');
      navigate('/board');
    } catch (err: any) {
      alert('게시글 삭제 실패: ' + err.message);
    }
  };

  const handleEditPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) return;
    try {
      const { error } = await supabase.from('posts').update({ title: editTitle, content: editContent }).eq('id', id);
      if (error) throw error;
      setPost(prev => prev ? { ...prev, title: editTitle, content: editContent } : null);
      setIsEditingPost(false);
    } catch (err: any) {
      alert('게시글 수정 실패: ' + err.message);
    }
  };

  // 댓글 수정/삭제 핸들러
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('이 댓글을 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err: any) {
      alert('댓글 삭제 실패: ' + err.message);
    }
  };

  const handleEditCommentSubmit = async (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    if (!editCommentContent.trim()) return;
    try {
      const { error } = await supabase.from('comments').update({ content: editCommentContent }).eq('id', commentId);
      if (error) throw error;
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: editCommentContent } : c));
      setEditingCommentId(null);
      setEditCommentContent('');
    } catch (err: any) {
      alert('댓글 수정 실패: ' + err.message);
    }
  };

  // 상태 뱃지 생성 함수
  const getStatusBadge = (status: 'pending' | 'accepted' | 'rejected') => {
    switch (status) {
      case 'accepted':
        return (
          <span className="text-xs font-semibold bg-status-accepted text-status-accepted-text px-2.5 py-1 rounded-full">
            수용됨
          </span>
        );
      case 'rejected':
        return (
          <span className="text-xs font-semibold bg-status-rejected text-status-rejected-text px-2.5 py-1 rounded-full">
            불수용
          </span>
        );
      default:
        return (
          <span className="text-xs font-semibold bg-status-pending text-status-pending-text px-2.5 py-1 rounded-full">
            검토 대기
          </span>
        );
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-bamboo-text-muted">상세 내용을 불러오는 중...</p>
        </div>
      </Layout>
    );
  }

  if (post && post.is_blinded && user?.role !== 'admin') {
    return (
      <Layout>
        <div className="max-w-[500px] mx-auto my-20 bg-white rounded-bamboo-card p-8 shadow-soft border border-status-rejected/30 text-center">
          <div className="w-16 h-16 bg-red-50 text-status-rejected-text rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-bamboo-text-main">블라인드 처리된 건의글입니다.</h2>
          <p className="text-sm text-bamboo-text-muted mt-2 mb-6">
            이 게시글은 다수의 수강생들의 신고 누적(3회 이상) 또는 커뮤니티 가이드라인 위반으로 인해 블라인드 처리되었습니다.
          </p>
          <Link
            to="/board"
            className="inline-block px-5 py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-bold rounded-bamboo-input shadow-soft transition-colors"
          >
            대나무숲 피드로 돌아가기
          </Link>
        </div>
      </Layout>
    );
  }

  if (error || !post) {
    return (
      <Layout>
        <div className="flex items-center gap-2 text-status-rejected-text bg-status-rejected p-4 rounded-bamboo-card mb-4">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error || '게시글이 존재하지 않습니다.'}</span>
        </div>
        <Link to="/board" className="inline-flex items-center gap-1.5 text-sm text-brand-blue font-bold hover:underline">
          <ChevronLeft className="w-4 h-4" /> 목록으로 돌아가기
        </Link>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* 상단 네비게이션 */}
      <div className="mb-6">
        <Link to="/board" className="inline-flex items-center gap-1 text-sm text-bamboo-text-muted hover:text-bamboo-text-main transition-colors font-semibold">
          <ChevronLeft className="w-4 h-4" /> 목록으로
        </Link>
      </div>

      <div className="space-y-6">
        {/* 게시글 메인 카드 */}
        <article className="bg-white rounded-bamboo-card p-6 sm:p-8 border border-bamboo-border/30 shadow-soft">
          {post.is_blinded && user?.role === 'admin' && (
            <div className="mb-4 bg-status-rejected text-status-rejected-text px-4 py-2.5 rounded-bamboo-input text-xs font-bold flex items-center gap-2 shadow-sm">
              <AlertCircle className="w-4 h-4" />
              <span>관리자 안내: 이 게시글은 신고 누적으로 블라인드 처리되었습니다. (일반 사용자에게 노출되지 않음)</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 mb-4">
            {getStatusBadge(post.status)}
            <div className="flex items-center gap-1 text-xs text-bamboo-text-muted/70">
              <Calendar className="w-4 h-4" />
              <span>{new Date(post.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}</span>
            </div>
          </div>

          {isEditingPost ? (
            <form onSubmit={handleEditPostSubmit} className="mb-6 space-y-4">
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-4 py-2.5 text-lg sm:text-xl font-bold text-bamboo-text-main bg-gray-50 border border-transparent rounded-bamboo-input focus:bg-white focus:border-brand-blue outline-none transition-all"
              />
              <textarea
                required
                rows={8}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-4 py-3 text-sm sm:text-base text-bamboo-text-main bg-gray-50 border border-transparent rounded-bamboo-input focus:bg-white focus:border-brand-blue outline-none transition-all resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingPost(false)}
                  className="px-4 py-2 text-sm font-semibold text-bamboo-text-muted hover:text-bamboo-text-main transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white text-sm font-bold rounded-bamboo-input shadow-soft transition-colors"
                >
                  수정 완료
                </button>
              </div>
            </form>
          ) : (
            <>
              <h1 className="text-lg sm:text-xl font-bold text-bamboo-text-main mb-4 leading-tight">
                {post.title}
              </h1>

              <p className="text-sm sm:text-base text-bamboo-text-muted/95 leading-relaxed whitespace-pre-wrap pb-6 border-b border-bamboo-border/40">
                {post.content}
              </p>
            </>
          )}

          <div className="flex items-center justify-between pt-4 text-xs text-bamboo-text-muted">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-bamboo-text-muted/80 bg-gray-100 px-2.5 py-1 rounded">
                익명 대나무
              </span>
              {isAuthor && !isEditingPost && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsEditingPost(true)} className="px-3 py-1 text-xs font-bold text-bamboo-text-main bg-white hover:bg-brand-blue hover:text-white border border-bamboo-border shadow-sm rounded transition-colors">
                    수정
                  </button>
                  <button onClick={handleDeletePost} className="px-3 py-1 text-xs font-bold text-status-rejected-text bg-white hover:bg-status-rejected border border-status-rejected-text/30 shadow-sm rounded transition-colors">
                    삭제
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-3.5 h-3.5 text-brand-blue" />
                공감 평균 <strong className="text-brand-blue font-bold">{voteStats.averageScore}</strong>
                <span className="text-[10px] text-bamboo-text-muted/60">({voteStats.totalCount}명 참여)</span>
              </span>
              <button
                onClick={handleReportPost}
                disabled={submittingReport}
                className="flex items-center gap-1 text-bamboo-text-muted/60 hover:text-status-rejected-text transition-colors font-semibold cursor-pointer"
                title="신고하기"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>신고</span>
              </button>
            </div>
          </div>
        </article>

        {/* 관리자 처리 의견 및 뱃지 노출 (일반 유저에게 노출되는 수용/불수용 내역) */}
        {post.status !== 'pending' && (
          <div className={`rounded-bamboo-card p-6 border shadow-soft ${
            post.status === 'accepted' 
              ? 'bg-blue-50/50 border-blue-100' 
              : 'bg-red-50/30 border-red-100'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className={`w-5 h-5 ${
                post.status === 'accepted' ? 'text-brand-blue' : 'text-status-rejected-text'
              }`} />
              <h3 className="text-sm font-bold text-bamboo-text-main">
                운영진 고충 처리 결과 ({post.status === 'accepted' ? '수용' : '불수용'})
              </h3>
            </div>
            {post.admin_comment ? (
              <p className="text-sm text-bamboo-text-muted/95 leading-relaxed pl-7">
                {post.admin_comment}
              </p>
            ) : (
              <p className="text-xs text-bamboo-text-muted italic pl-7">
                등록된 상세 처리 의견이 없습니다.
              </p>
            )}
          </div>
        )}

        {/* 공감도 투표 컴포넌트 */}
        <section className="bg-white rounded-bamboo-card p-6 border border-bamboo-border/30 shadow-soft">
          <h3 className="text-sm font-bold text-bamboo-text-main mb-1">이 고충에 얼마나 공감하시나요?</h3>
          <p className="text-xs text-bamboo-text-muted mb-4">공감 점수를 매겨주세요 (1점: 낮음 ~ 5점: 매우 공감)</p>
          
          <div className="grid grid-cols-5 gap-1.5 sm:gap-3 mb-4">
            {[1, 2, 3, 4, 5].map((score) => {
              const isSelected = userVotedScore === score;
              
              return (
                <button
                  key={score}
                  onClick={() => handleVote(score)}
                  disabled={submittingVote}
                  className={`flex flex-col items-center justify-center py-2.5 rounded-bamboo-input font-bold transition-all ${
                    isSelected
                      ? 'bg-brand-blue text-white shadow-soft scale-105'
                      : 'bg-gray-50 text-bamboo-text-muted hover:bg-brand-blue/10 hover:text-brand-blue border border-transparent hover:border-brand-blue/30'
                  }`}
                >
                  <Star className={`w-4 h-4 mb-0.5 ${
                    isSelected ? 'fill-white text-white' : 'text-current'
                  }`} />
                  <span className="text-xs">{score}점</span>
                </button>
              );
            })}
          </div>

          {userVotedScore !== null && (
            <div className="bg-blue-50 text-brand-blue px-3 py-2 rounded-bamboo-input text-xs font-semibold text-center shadow-sm border border-blue-100">
              🎉 이미 {userVotedScore}점으로 공감 투표에 참여하셨습니다. (같은 점수를 누르면 취소됩니다)
            </div>
          )}

          {!user && (
            <div className="text-center text-xs text-bamboo-text-muted/80 bg-gray-50 py-2 rounded">
              투표를 하려면{' '}
              <Link to="/login" className="text-brand-blue font-semibold hover:underline">
                로그인
              </Link>
              이 필요합니다.
            </div>
          )}
        </section>

        {/* [관리자 전용] 처리 상태 변경 패널 */}
        {user?.role === 'admin' && (
          <section className="bg-stone-50 border-2 border-dashed border-bamboo-border rounded-bamboo-card p-6 shadow-soft">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-bamboo-border">
              <ShieldCheck className="w-5 h-5 text-brand-blue" />
              <h3 className="text-sm font-extrabold text-bamboo-text-main">
                운영 총괄 관리자 패널 (Admin Only)
              </h3>
            </div>
            
            <form onSubmit={handleAdminUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-bamboo-text-muted mb-1.5">
                  건의 처리 상태 설정
                </label>
                <select
                  value={adminStatus}
                  onChange={(e) => setAdminStatus(e.target.value as any)}
                  className="w-full sm:w-48 px-3 py-2 text-sm bg-white border border-bamboo-border rounded-bamboo-input outline-none focus:border-brand-blue transition-colors"
                >
                  <option value="pending">검토 대기 (pending)</option>
                  <option value="accepted">수용 처리 (accepted)</option>
                  <option value="rejected">불수용 처리 (rejected)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-bamboo-text-muted mb-1.5">
                  관리자 의견 (일반 수강생에게 공개됨)
                </label>
                <textarea
                  rows={4}
                  placeholder="의견을 남겨 수강생들의 고충에 적극적인 피드백을 전달해 주세요."
                  value={adminCommentInput}
                  onChange={(e) => setAdminCommentInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-bamboo-border rounded-bamboo-input outline-none focus:border-brand-blue transition-all resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingAdmin}
                  className="px-5 py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-bold rounded-bamboo-input shadow-soft transition-colors disabled:opacity-50"
                >
                  {submittingAdmin ? '의견 적용 중...' : '처리 결과 저장'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* 댓글 피드 영역 */}
        <section className="bg-white rounded-bamboo-card p-6 border border-bamboo-border/30 shadow-soft">
          <div className="flex items-center gap-1.5 mb-6">
            <MessageSquare className="w-5 h-5 text-bamboo-text-muted" />
            <h3 className="text-sm font-bold text-bamboo-text-main">
              댓글 피드 ({comments.length})
            </h3>
          </div>

          {/* 댓글 목록 */}
          {comments.length === 0 ? (
            <div className="text-center py-8 text-xs text-bamboo-text-muted/75 italic border-b border-bamboo-border/30 mb-6">
              아직 등록된 댓글이 없습니다. 첫 댓글을 남겨보세요!
            </div>
          ) : (
            <div className="space-y-4 mb-6 pb-6 border-b border-bamboo-border/30">
              {comments.filter(c => !c.parent_id).map((comment) => (
                <div key={comment.id} className="space-y-3">
                  {/* 원본(부모) 댓글 */}
                  <div className="flex items-start gap-2 text-sm bg-gray-50/50 p-4 rounded-bamboo-card border border-bamboo-border/20">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-bamboo-text-muted">익명 대나무</span>
                          <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-bamboo-border">
                            {myCommentIds.has(comment.id) && !comment.is_blinded && (
                              <>
                                <button onClick={() => { setEditingCommentId(comment.id); setEditCommentContent(comment.content); }} className="px-1.5 py-0.5 text-[10px] font-bold bg-gray-100 hover:bg-brand-blue hover:text-white text-bamboo-text-muted rounded transition-colors border border-gray-200 shadow-sm">
                                  수정
                                </button>
                                <button onClick={() => handleDeleteComment(comment.id)} className="px-1.5 py-0.5 text-[10px] font-bold bg-gray-100 hover:bg-status-rejected text-status-rejected-text rounded transition-colors border border-status-rejected-text/30 shadow-sm">
                                  삭제
                                </button>
                              </>
                            )}
                            {!comment.is_blinded && (
                              <button onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)} className="px-1.5 py-0.5 text-[10px] font-bold bg-gray-100 hover:bg-brand-blue hover:text-white text-bamboo-text-muted rounded transition-colors border border-gray-200 shadow-sm">
                                답글
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-bamboo-text-muted/60">
                            {new Date(comment.created_at).toLocaleDateString('ko-KR', {
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {(!comment.is_blinded || user?.role === 'admin') && (
                            <button
                              type="button"
                              onClick={() => handleReportComment(comment.id)}
                              disabled={submittingReport}
                              className="text-[10px] text-bamboo-text-muted/50 hover:text-status-rejected-text flex items-center gap-0.5 cursor-pointer font-semibold transition-colors"
                              title="신고"
                            >
                              <Flag className="w-2.5 h-2.5" />
                              <span>신고</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {comment.is_blinded && user?.role === 'admin' && (
                        <div className="text-[10px] text-status-rejected-text font-bold mb-1 bg-red-50 px-2 py-0.5 rounded inline-block">
                          ⚠️ 관리자 안내: 블라인드 처리된 댓글입니다. (일반 유저에게 가려짐)
                        </div>
                      )}

                      {editingCommentId === comment.id ? (
                        <form onSubmit={(e) => handleEditCommentSubmit(e, comment.id)} className="mt-2 space-y-2">
                          <textarea
                            required
                            rows={2}
                            value={editCommentContent}
                            onChange={(e) => setEditCommentContent(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-white border border-bamboo-border rounded focus:border-brand-blue outline-none resize-none transition-all"
                          />
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setEditingCommentId(null)} className="text-xs text-bamboo-text-muted hover:text-bamboo-text-main font-semibold">취소</button>
                            <button type="submit" className="text-xs text-brand-blue hover:text-brand-blue-hover font-bold">완료</button>
                          </div>
                        </form>
                      ) : (
                        <p className={`text-bamboo-text-main text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                          comment.is_blinded && user?.role !== 'admin' ? 'text-status-rejected-text/70 italic bg-red-50/20 px-2.5 py-1.5 rounded border border-status-rejected/10' : ''
                        }`}>
                          {comment.is_blinded && user?.role !== 'admin'
                            ? '신고 누적으로 인해 블라인드 처리된 댓글입니다.'
                            : comment.content}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 대댓글 및 답글 폼 영역 */}
                  <div className="pl-6 sm:pl-8 space-y-3">
                    {comments.filter(reply => reply.parent_id === comment.id).map(reply => (
                      <div key={reply.id} className="flex items-start gap-2 text-sm bg-gray-50/80 p-3 rounded-bamboo-card border border-bamboo-border/10 relative">
                        <CornerDownRight className="w-4 h-4 text-bamboo-text-muted/40 absolute -left-5 sm:-left-7 top-3" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-bamboo-text-muted">익명 대나무</span>
                              {myCommentIds.has(reply.id) && !reply.is_blinded && (
                                <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-bamboo-border">
                                  <button onClick={() => { setEditingCommentId(reply.id); setEditCommentContent(reply.content); }} className="px-1.5 py-0.5 text-[10px] font-bold bg-gray-100 hover:bg-brand-blue hover:text-white text-bamboo-text-muted rounded transition-colors border border-gray-200 shadow-sm">수정</button>
                                  <button onClick={() => handleDeleteComment(reply.id)} className="px-1.5 py-0.5 text-[10px] font-bold bg-gray-100 hover:bg-status-rejected text-status-rejected-text rounded transition-colors border border-status-rejected-text/30 shadow-sm">삭제</button>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-bamboo-text-muted/60">
                                {new Date(reply.created_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {(!reply.is_blinded || user?.role === 'admin') && (
                                <button
                                  type="button"
                                  onClick={() => handleReportComment(reply.id)}
                                  disabled={submittingReport}
                                  className="text-[10px] text-bamboo-text-muted/50 hover:text-status-rejected-text flex items-center gap-0.5 cursor-pointer font-semibold transition-colors"
                                  title="신고"
                                >
                                  <Flag className="w-2.5 h-2.5" />
                                  <span>신고</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {reply.is_blinded && user?.role === 'admin' && (
                            <div className="text-[10px] text-status-rejected-text font-bold mb-1 bg-red-50 px-2 py-0.5 rounded inline-block">
                              ⚠️ 관리자 안내: 블라인드 처리된 댓글입니다. (일반 유저에게 가려짐)
                            </div>
                          )}

                          {editingCommentId === reply.id ? (
                            <form onSubmit={(e) => handleEditCommentSubmit(e, reply.id)} className="mt-2 space-y-2">
                              <textarea required rows={2} value={editCommentContent} onChange={(e) => setEditCommentContent(e.target.value)} className="w-full px-3 py-2 text-xs bg-white border border-bamboo-border rounded focus:border-brand-blue outline-none resize-none transition-all" />
                              <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setEditingCommentId(null)} className="text-xs text-bamboo-text-muted hover:text-bamboo-text-main font-semibold">취소</button>
                                <button type="submit" className="text-xs text-brand-blue hover:text-brand-blue-hover font-bold">완료</button>
                              </div>
                            </form>
                          ) : (
                            <p className={`text-bamboo-text-main text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                              reply.is_blinded && user?.role !== 'admin' ? 'text-status-rejected-text/70 italic bg-red-50/20 px-2.5 py-1.5 rounded border border-status-rejected/10' : ''
                            }`}>
                              {reply.is_blinded && user?.role !== 'admin'
                                ? '신고 누적으로 인해 블라인드 처리된 댓글입니다.'
                                : reply.content}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                    {replyingToId === comment.id && (
                      <form onSubmit={(e) => handleCommentSubmit(e, comment.id)} className="flex flex-col gap-2 relative mt-2">
                        <CornerDownRight className="w-4 h-4 text-bamboo-text-muted/40 absolute -left-5 sm:-left-7 top-3" />
                        <textarea
                          required
                          rows={2}
                          placeholder="답글을 입력하세요 (익명 보장)"
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-brand-blue/30 rounded focus:bg-white focus:border-brand-blue outline-none transition-all resize-none shadow-sm"
                        />
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setReplyingToId(null)} className="px-3 py-1.5 text-xs font-semibold text-bamboo-text-muted hover:text-bamboo-text-main transition-colors">취소</button>
                          <button type="submit" disabled={submittingComment || !replyContent.trim()} className="px-3 py-1.5 text-xs font-bold bg-brand-blue hover:bg-brand-blue-hover text-white rounded shadow-soft transition-colors disabled:opacity-50">
                            {submittingComment ? '등록 중...' : '답글 달기'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 댓글 작성창 */}
          {user ? (
            <form onSubmit={handleCommentSubmit} className="space-y-3">
              <textarea
                required
                rows={3}
                placeholder="댓글 역시 완전히 익명으로 게시되니 안심하고 기재해 주세요."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 border border-transparent rounded-bamboo-input focus:bg-white focus:border-brand-blue outline-none transition-all resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-bold rounded-bamboo-input shadow-soft transition-colors disabled:opacity-50"
                >
                  {submittingComment ? '게시 중...' : '댓글 등록'}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-gray-50 rounded-bamboo-input p-4 text-center text-xs text-bamboo-text-muted">
              댓글을 쓰려면{' '}
              <Link to="/login" className="text-brand-blue font-semibold hover:underline">
                로그인
              </Link>
              이 필요합니다.
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};
