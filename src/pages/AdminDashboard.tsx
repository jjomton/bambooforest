import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, isMockEnabled, mockDb } from '@/lib/supabaseClient';
import { Layout } from '@/components/Layout';
import { ShieldAlert, BarChart3, AlertCircle, CheckCircle, XCircle, FileText, Star, ChevronRight, RefreshCw } from 'lucide-react';

interface AdminStats {
  totalPosts: number;
  pendingPosts: number;
  acceptedPosts: number;
  rejectedPosts: number;
  topPosts: Array<{
    id: string;
    title: string;
    content: string;
    status: 'pending' | 'accepted' | 'rejected';
    admin_comment: string | null;
    created_at: string;
    averageScore: number;
    totalCount: number;
  }>;
}

interface AdminPostItem {
  id: string;
  title: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  averageScore?: number;
  totalVotes?: number;
}

export const AdminDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // 대시보드 상태
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [posts, setPosts] = useState<AdminPostItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  
  // UI 상태
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    setError('');
    try {
      if (isMockEnabled) {
        // 1. 통계 데이터
        const statData = await mockDb.getStats();
        setStats(statData);

        // 2. 전체 게시글 데이터 (필터용)
        const allPosts = await mockDb.getPosts();
        
        // 투표 수 매핑
        const enriched = await Promise.all(
          allPosts.map(async (p) => {
            const { averageScore, totalCount } = await mockDb.getVotes(p.id);
            return {
              ...p,
              averageScore,
              totalVotes: totalCount,
            };
          })
        );
        setPosts(enriched);
      } else {
        // 실제 Supabase 모드
        // 1. 전체 게시글 조회
        const { data: allPosts, error: fetchError } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        if (allPosts) {
          // 2. 게시글별 투표 정보 가져오기 및 가공
          const enriched: AdminPostItem[] = await Promise.all(
            allPosts.map(async (post) => {
              const { data: votes, error: vErr } = await supabase
                .from('votes')
                .select('score')
                .eq('post_id', post.id);

              let averageScore = 0;
              let totalVotes = 0;

              if (!vErr && votes) {
                totalVotes = votes.length;
                if (totalVotes > 0) {
                  const sum = votes.reduce((acc, v) => acc + v.score, 0);
                  averageScore = Number((sum / totalVotes).toFixed(1));
                }
              }

              return {
                ...post,
                averageScore,
                totalVotes,
              };
            })
          );

          setPosts(enriched);

          // 3. 통계 연산
          const totalPosts = enriched.length;
          const pendingPosts = enriched.filter((p) => p.status === 'pending').length;
          const acceptedPosts = enriched.filter((p) => p.status === 'accepted').length;
          const rejectedPosts = enriched.filter((p) => p.status === 'rejected').length;

          // 공감 평균 및 투표수 기준 Top 5 정렬
          const topPosts = [...enriched]
            .map((p) => ({
              id: p.id,
              title: p.title,
              content: '',
              status: p.status,
              admin_comment: null,
              created_at: p.created_at,
              averageScore: p.averageScore || 0,
              totalCount: p.totalVotes || 0,
            }))
            .sort((a, b) => b.averageScore - a.averageScore || b.totalCount - a.totalCount)
            .slice(0, 5);

          setStats({
            totalPosts,
            pendingPosts,
            acceptedPosts,
            rejectedPosts,
            topPosts,
          });
        }
      }
    } catch (err: any) {
      setError('대시보드 데이터 로드에 실패했습니다: ' + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // 권한 확인 및 로드
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        // 관리자가 아닐 경우 아래 JSX에서 403 화면 렌더링하도록 둠
        setLoading(false);
      } else {
        loadDashboardData();
      }
    }
  }, [user, authLoading]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // 탭 필터링 적용
  const filteredPosts = posts.filter((post) => {
    if (activeTab === 'all') return true;
    return post.status === activeTab;
  });

  const getStatusBadge = (status: 'pending' | 'accepted' | 'rejected') => {
    switch (status) {
      case 'accepted':
        return (
          <span className="text-[11px] font-semibold bg-status-accepted text-status-accepted-text px-2 py-0.5 rounded-full">
            수용됨
          </span>
        );
      case 'rejected':
        return (
          <span className="text-[11px] font-semibold bg-status-rejected text-status-rejected-text px-2 py-0.5 rounded-full">
            불수용
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-semibold bg-status-pending text-status-pending-text px-2 py-0.5 rounded-full">
            대기
          </span>
        );
    }
  };

  // 1. 비로그인 혹은 일반 유저 403 경고 화면
  if (!authLoading && (!user || user.role !== 'admin')) {
    return (
      <Layout>
        <div className="max-w-[500px] mx-auto my-20 bg-white rounded-bamboo-card p-8 shadow-soft border border-status-rejected/30 text-center">
          <div className="w-16 h-16 bg-red-50 text-status-rejected-text rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-bamboo-text-main">접근 권한이 없습니다.</h2>
          <p className="text-sm text-bamboo-text-muted mt-2 mb-6">
            이 페이지는 교육 센터 운영 관리자 전용 공간입니다. 권한이 있는 관리자 계정으로 로그인해 주시기 바랍니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              to="/login"
              className="px-5 py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-bold rounded-bamboo-input shadow-soft transition-colors"
            >
              관리자 로그인
            </Link>
            <Link
              to="/board"
              className="px-5 py-2.5 border border-bamboo-border text-bamboo-text-muted hover:bg-gray-50 rounded-bamboo-input text-xs font-semibold transition-colors"
            >
              대나무숲 피드로 돌아가기
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* 관리자 헤더 */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-bamboo-border/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-bamboo-text-main">운영 통계 대시보드</h1>
            <p className="text-xs text-bamboo-text-muted">수강생 고충 건의사항 현황 및 우선순위를 관리합니다.</p>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-bamboo-border text-xs text-bamboo-text-muted rounded-bamboo-input bg-white hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-bamboo-text-muted mt-3">데이터를 집계 중입니다...</p>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-status-rejected-text bg-status-rejected p-4 rounded-bamboo-card mb-6">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      ) : stats ? (
        <div className="space-y-8">
          {/* 통계 위젯 카드 레이아웃 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 전체 */}
            <div className="bg-white p-5 rounded-bamboo-card border border-bamboo-border/30 shadow-soft">
              <span className="text-xs font-semibold text-bamboo-text-muted block">전체 접수 건</span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl font-extrabold text-bamboo-text-main">{stats.totalPosts}</span>
                <span className="text-xs text-bamboo-text-muted font-normal">건</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-brand-blue h-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            {/* 검토 대기 */}
            <div className="bg-white p-5 rounded-bamboo-card border border-bamboo-border/30 shadow-soft">
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-bamboo-text-muted" />
                <span className="text-xs font-semibold text-bamboo-text-muted">검토 대기</span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl font-extrabold text-bamboo-text-muted">{stats.pendingPosts}</span>
                <span className="text-xs text-bamboo-text-muted font-normal">건</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div 
                  className="bg-bamboo-text-muted h-full" 
                  style={{ width: `${stats.totalPosts ? (stats.pendingPosts / stats.totalPosts) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* 수용 */}
            <div className="bg-white p-5 rounded-bamboo-card border border-bamboo-border/30 shadow-soft">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-brand-blue" />
                <span className="text-xs font-semibold text-bamboo-text-muted">수용 처리</span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl font-extrabold text-brand-blue">{stats.acceptedPosts}</span>
                <span className="text-xs text-brand-blue font-normal">건</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div 
                  className="bg-brand-blue h-full" 
                  style={{ width: `${stats.totalPosts ? (stats.acceptedPosts / stats.totalPosts) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* 불수용 */}
            <div className="bg-white p-5 rounded-bamboo-card border border-bamboo-border/30 shadow-soft">
              <div className="flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-status-rejected-text" />
                <span className="text-xs font-semibold text-bamboo-text-muted">불수용 처리</span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl font-extrabold text-status-rejected-text">{stats.rejectedPosts}</span>
                <span className="text-xs text-status-rejected-text font-normal">건</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div 
                  className="bg-status-rejected-text h-full" 
                  style={{ width: `${stats.totalPosts ? (stats.rejectedPosts / stats.totalPosts) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 왼쪽: 전체 상태 리스트 및 필터 (col-span-2) */}
            <div className="md:col-span-2 space-y-4">
              <div className="bg-white rounded-bamboo-card p-6 border border-bamboo-border/30 shadow-soft">
                <div className="flex items-center justify-between mb-6 pb-2 border-b border-bamboo-border/30">
                  <h2 className="text-sm font-bold text-bamboo-text-main flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-brand-blue" />
                    건의사항 관리 목록
                  </h2>
                  <span className="text-xs text-bamboo-text-muted/80 font-medium">총 {filteredPosts.length}건</span>
                </div>

                {/* 탭 필터 */}
                <div className="flex border-b border-bamboo-border/40 gap-4 mb-4 text-xs font-bold text-bamboo-text-muted">
                  {(['all', 'pending', 'accepted', 'rejected'] as const).map((tab) => {
                    const label = tab === 'all' ? '전체' : tab === 'pending' ? '대기' : tab === 'accepted' ? '수용' : '불수용';
                    const isActive = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-2.5 px-1 relative transition-colors ${
                          isActive ? 'text-brand-blue' : 'hover:text-bamboo-text-main'
                        }`}
                      >
                        {label}
                        {isActive && (
                          <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-blue rounded-full"></span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* 필터된 포스트 목록 */}
                {filteredPosts.length === 0 ? (
                  <div className="text-center py-12 text-xs text-bamboo-text-muted/70 italic">
                    선택하신 상태에 해당하는 건의사항이 없습니다.
                  </div>
                ) : (
                  <div className="divide-y divide-bamboo-border/40">
                    {filteredPosts.map((post) => (
                      <Link
                        key={post.id}
                        to={`/board/${post.id}`}
                        className="flex items-center justify-between py-3.5 group hover:bg-gray-50/50 px-2 rounded transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-4">
                          <div className="shrink-0">{getStatusBadge(post.status)}</div>
                          <span className="text-xs sm:text-sm font-bold text-bamboo-text-main line-clamp-1 group-hover:text-brand-blue transition-colors">
                            {post.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <span className="hidden sm:inline text-[11px] text-bamboo-text-muted/70">
                            {new Date(post.created_at).toLocaleDateString('ko-KR')}
                          </span>
                          <span className="flex items-center gap-0.5 text-xs text-brand-blue font-semibold">
                            <Star className="w-3.5 h-3.5 text-brand-blue fill-brand-blue" />
                            {post.averageScore || 0}
                          </span>
                          <ChevronRight className="w-4 h-4 text-bamboo-text-muted/40 group-hover:text-bamboo-text-main transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 오른쪽: 공감도 높은 Top 5 건의글 */}
            <div className="space-y-4">
              <div className="bg-white rounded-bamboo-card p-6 border border-bamboo-border/30 shadow-soft">
                <div className="flex items-center gap-1.5 mb-6 pb-2 border-b border-bamboo-border/30">
                  <Star className="w-4 h-4 text-brand-blue fill-brand-blue" />
                  <h2 className="text-sm font-bold text-bamboo-text-main">
                    공감도 높은 건의사항 Top 5
                  </h2>
                </div>

                {stats.topPosts.length === 0 ? (
                  <div className="text-center py-8 text-xs text-bamboo-text-muted/70 italic">
                    집계된 공감 투표 데이터가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {stats.topPosts.map((post, idx) => (
                      <Link
                        key={post.id}
                        to={`/board/${post.id}`}
                        className="block p-3.5 rounded-bamboo-input border border-bamboo-border/30 hover:border-brand-blue/30 bg-gray-50/30 hover:bg-white transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-5 h-5 bg-blue-50 text-brand-blue text-[11px] font-bold flex items-center justify-center rounded-full">
                            {idx + 1}
                          </span>
                          {getStatusBadge(post.status)}
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-bamboo-text-main line-clamp-1 mb-2">
                          {post.title}
                        </h4>

                        <div className="flex items-center justify-between text-[11px] text-bamboo-text-muted">
                          <span className="flex items-center gap-1 font-semibold text-brand-blue">
                            <Star className="w-3.5 h-3.5 text-brand-blue fill-brand-blue" />
                            평균 {post.averageScore}점
                          </span>
                          <span>{post.totalCount}명 참여</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Layout>
  );
};
