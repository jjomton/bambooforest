import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, isMockEnabled, mockDb } from '@/lib/supabaseClient';
import { Layout } from '@/components/Layout';
import { Search, PenTool, MessageSquare, ThumbsUp, ChevronLeft, ChevronRight, Calendar, AlertCircle } from 'lucide-react';

interface PostItem {
  id: string;
  title: string;
  content: string;
  status: 'pending' | 'accepted' | 'rejected';
  admin_comment: string | null;
  created_at: string;
  averageScore: number;
  totalVotes: number;
  commentCount: number;
}

export const BoardList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // 검색 및 페이지네이션 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showMyPostsOnly, setShowMyPostsOnly] = useState(false);
  const postsPerPage = 5;

  // 데이터 상태
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [myPostIds, setMyPostIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 게시글 관련 부가 데이터(댓글 수, 투표 등) 로드 함수
  const fetchPostStats = async (postList: any[]): Promise<PostItem[]> => {
    if (isMockEnabled) {
      // Mock 모드는 이미 데이터가 입혀져서 넘어옴
      const enriched = await Promise.all(
        postList.map(async (p) => {
          const { averageScore, totalCount } = await mockDb.getVotes(p.id);
          const comments = await mockDb.getComments(p.id);
          return {
            ...p,
            averageScore,
            totalVotes: totalCount,
            commentCount: comments.length,
          };
        })
      );
      return enriched;
    }

    // 실제 Supabase 모드
    const enriched = await Promise.all(
      postList.map(async (post) => {
        // 1. 투표수 및 평균 연산
        const { data: votesData, error: votesError } = await supabase
          .from('votes')
          .select('score')
          .eq('post_id', post.id);

        let averageScore = 0;
        let totalVotes = 0;

        if (!votesError && votesData) {
          totalVotes = votesData.length;
          if (totalVotes > 0) {
            const sum = votesData.reduce((acc, v) => acc + v.score, 0);
            averageScore = Number((sum / totalVotes).toFixed(1));
          }
        }

        // 2. 댓글수 연산
        const { count, error: commentsError } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        const commentCount = !commentsError && count ? count : 0;

        return {
          ...post,
          averageScore,
          totalVotes,
          commentCount,
        };
      })
    );

    return enriched;
  };

  const loadPosts = async () => {
    setLoading(true);
    setError('');
    try {
      if (isMockEnabled) {
        const rawPosts = await mockDb.getPosts(activeQuery);
        const enriched = await fetchPostStats(rawPosts);
        setPosts(enriched);
      } else {
        let query = supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (activeQuery) {
          // or 조건으로 제목이나 본문에 검색어 매칭
          query = query.or(`title.ilike.%${activeQuery}%,content.ilike.%${activeQuery}%`);
        }

        if (user) {
          const { data: myAuthorships } = await supabase
            .from('post_authors')
            .select('post_id');
            
          if (myAuthorships) {
            const myIdsSet = new Set<string>(myAuthorships.map(a => a.post_id));
            setMyPostIds(myIdsSet);
            
            if (showMyPostsOnly) {
              if (myIdsSet.size > 0) {
                query = query.in('id', Array.from(myIdsSet));
              } else {
                setPosts([]);
                setLoading(false);
                return;
              }
            }
          }
        }

        const { data, error: fetchError } = await query;
        if (fetchError) throw fetchError;

        if (data) {
          const enriched = await fetchPostStats(data);
          setPosts(enriched);
        }
      }
    } catch (err: any) {
      setError('게시글을 가져오는 도중 문제가 발생했습니다: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
    setCurrentPage(1); // 검색 쿼리가 변경되면 1페이지로 리셋
  }, [activeQuery, showMyPostsOnly, user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(searchQuery);
  };

  // 페이지네이션 가공
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / postsPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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

  const handleWriteClick = () => {
    if (!user) {
      alert('로그인이 필요한 서비스입니다. 로그인 화면으로 이동합니다.');
      navigate('/login');
    } else {
      navigate('/board/new');
    }
  };

  return (
    <Layout>
      {/* 검색 바 및 글쓰기 버튼 상단 영역 */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder="제목이나 내용으로 검색해보세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-bamboo-input shadow-soft border border-transparent focus:border-brand-blue outline-none text-sm transition-all"
            />
            <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-bamboo-text-muted/50" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveQuery('');
                }}
                className="absolute right-3 top-2.5 text-xs text-bamboo-text-muted/50 hover:text-bamboo-text-main"
              >
                초기화
              </button>
            )}
          </form>

          <button
            onClick={handleWriteClick}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-bamboo-input font-semibold text-sm shadow-soft transition-colors shrink-0"
          >
            <PenTool className="w-4 h-4" />
            건의글 쓰기
          </button>
        </div>
        
        {/* 내가 쓴 글만 보기 필터 */}
        {user && (
          <div className="flex items-center justify-end px-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={showMyPostsOnly} 
                onChange={(e) => setShowMyPostsOnly(e.target.checked)} 
                className="w-4 h-4 text-brand-blue bg-white border-bamboo-border/50 rounded focus:ring-brand-blue focus:ring-2 cursor-pointer transition-all"
              />
              <span className="text-sm font-semibold text-bamboo-text-muted group-hover:text-brand-blue transition-colors">
                내가 쓴 글만 보기
              </span>
            </label>
          </div>
        )}
      </div>

      {/* 로딩 및 에러 처리 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-bamboo-text-muted">대나무 숲 게시글을 불러오는 중...</p>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-status-rejected-text bg-status-rejected p-4 rounded-bamboo-card">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-bamboo-card border border-bamboo-border/30 shadow-soft">
          <p className="text-bamboo-text-muted text-sm font-medium">아직 등록된 건의사항이 없습니다.</p>
          <p className="text-xs text-bamboo-text-muted/70 mt-1">첫 번째 고충 건의를 작성하여 대나무숲을 밝혀주세요!</p>
        </div>
      ) : (
        <>
          {/* 게시글 카드 목록 */}
          <div className="space-y-4">
            {currentPosts.map((post) => (
              <Link
                key={post.id}
                to={`/board/${post.id}`}
                className="block bg-white rounded-bamboo-card p-6 border border-bamboo-border/30 hover:border-brand-blue/30 shadow-soft transition-all duration-200"
              >
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(post.status)}
                    {myPostIds.has(post.id) && (
                      <span className="text-[10px] font-bold bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded border border-brand-blue/20">
                        내가 쓴 글
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-bamboo-text-muted/70">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(post.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-bamboo-text-main mb-2 line-clamp-1 hover:text-brand-blue transition-colors">
                  {post.title}
                </h3>
                
                <p className="text-sm text-bamboo-text-muted/95 leading-relaxed line-clamp-2 mb-4">
                  {post.content}
                </p>

                <div className="flex items-center justify-between border-t border-bamboo-border/40 pt-4 text-xs text-bamboo-text-muted">
                  <span className="font-semibold text-bamboo-text-muted/80 bg-gray-100 px-2 py-0.5 rounded">
                    익명 대나무
                  </span>
                  
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <ThumbsUp className="w-3.5 h-3.5 text-brand-blue/70" />
                      공감 <strong className="text-brand-blue">{post.averageScore}</strong>
                      <span className="text-[10px] text-bamboo-text-muted/60">({post.totalVotes}명)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-bamboo-text-muted/70" />
                      댓글 <strong className="text-bamboo-text-main">{post.commentCount}</strong>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* 페이지네이션 컨트롤 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-8">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 bg-white border border-bamboo-border/50 text-bamboo-text-muted rounded-bamboo-input hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => paginate(page)}
                  className={`w-9 h-9 text-xs font-bold rounded-bamboo-input transition-colors ${
                    currentPage === page
                      ? 'bg-brand-blue text-white shadow-soft'
                      : 'bg-white border border-bamboo-border/50 text-bamboo-text-muted hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 bg-white border border-bamboo-border/50 text-bamboo-text-muted rounded-bamboo-input hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
};
