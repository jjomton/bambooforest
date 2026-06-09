import { createClient } from '@supabase/supabase-js';
import { containsProfanity } from './profanityFilter';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isMockEnabled = !supabaseUrl || !supabaseAnonKey;

if (isMockEnabled) {
  console.warn(
    '⚠️ Supabase URL 또는 Anon Key가 제공되지 않았습니다. 로컬스토리지 기반의 Mocking 모드로 작동합니다.'
  );
}

// 실제 Supabase 클라이언트 (Mock 모드일 경우 빈 문자열로 인해 더미 객체 생성)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

/**
 * ----------------------------------------------------
 * 로컬스토리지 기반의 Mock API 모음
 * 백엔드 서버 없이 프론트엔드 내에서 독립적으로 기능을 검증할 수 있게 지원합니다.
 * ----------------------------------------------------
 */

const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const setLocalStorage = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Mock 상태 인터페이스
export interface MockUser {
  id: string;
  email: string;
  nickname: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface MockPost {
  id: string;
  title: string;
  content: string;
  status: 'pending' | 'accepted' | 'rejected';
  admin_comment: string | null;
  is_blinded: boolean;
  created_at: string;
}

export interface MockComment {
  id: string;
  post_id: string;
  content: string;
  is_blinded: boolean;
  created_at: string;
}

export interface MockVote {
  id: string;
  post_id: string;
  user_id: string;
  score: number;
  created_at: string;
}

export interface MockReport {
  id: string;
  post_id: string | null;
  comment_id: string | null;
  user_id: string;
  reason: string;
  created_at: string;
}

// 초기 데이터 셋업
if (isMockEnabled) {
  if (!localStorage.getItem('bf_users')) {
    setLocalStorage<MockUser[]>('bf_users', [
      {
        id: 'admin-uuid',
        email: 'admin@bamboo.com',
        nickname: '운영 총괄 관리자',
        role: 'admin',
        created_at: new Date().toISOString(),
      },
      {
        id: 'user-uuid-1',
        email: 'student@human.com',
        nickname: '행복한 대나무',
        role: 'user',
        created_at: new Date().toISOString(),
      },
    ]);
  }

  if (!localStorage.getItem('bf_posts')) {
    setLocalStorage<MockPost[]>('bf_posts', [
      {
        id: 'post-1',
        title: '강의실 에어컨 온도가 너무 낮아요 🥶',
        content: '3강의실 뒤쪽 자리는 에어컨 바람이 직접 와서 너무 춥습니다. 희망 온도를 25도나 26도로 조금만 조절해 주시거나 바람막이 설치를 요청드립니다. 장시간 수업 들을 때 손끝이 시릴 정도예요.',
        status: 'accepted',
        admin_comment: '불편을 드려 죄송합니다. 3강의실 뒤쪽 자리에 에어컨 바람막이를 오늘 중 설치 완료하겠습니다. 실내 희망 온도는 25.5도로 유지하도록 전 강사진 및 운영진에게 안내 조치하였습니다.',
        is_blinded: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1일 전
      },
      {
        id: 'post-2',
        title: '점심시간에 쉴 수 있는 휴게실이 혼잡해요.',
        content: '인원에 비해 휴게 공간이 좁고 의자가 부족해서 밖에서 대기하는 경우가 많습니다. 빈 강의실을 점심시간에 개방해 줄 수 있으신지 여쭙고 싶습니다.',
        status: 'pending',
        admin_comment: null,
        is_blinded: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4시간 전
      },
      {
        id: 'post-3',
        title: '커피머신 원두 보충 주기 단축 요청',
        content: '오후 3시쯤만 되면 에스프레소 머신의 원두가 다 떨어져서 정수기 물만 마시게 됩니다. 보충 주기를 반나절 단위로 당겨 주시면 감사하겠습니다.',
        status: 'rejected',
        admin_comment: '검토 결과, 현재 원두 보충은 매일 아침과 오후 1시 30분에 정기적으로 진행하고 있습니다. 원두 소비 패턴을 추가 모니터링하여 보충 주기가 적합한지 예산을 고려해 점검하겠습니다.',
        is_blinded: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8시간 전
      },
    ]);
  }

  if (!localStorage.getItem('bf_comments')) {
    setLocalStorage<MockComment[]>('bf_comments', [
      {
        id: 'c-1',
        post_id: 'post-1',
        content: '맞아요, 가디건 입어도 춥더라구요 ㅠㅠ 빠른 조치 감사드립니다!',
        is_blinded: false,
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: 'c-2',
        post_id: 'post-1',
        content: '바람막이 신의 한 수네요!',
        is_blinded: false,
        created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      },
      {
        id: 'c-3',
        post_id: 'post-2',
        content: '2층 빈 회의실도 낮시간엔 비어있던데 좋은 생각인 것 같아요.',
        is_blinded: false,
        created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
    ]);
  }

  if (!localStorage.getItem('bf_votes')) {
    setLocalStorage<MockVote[]>('bf_votes', [
      {
        id: 'v-1',
        post_id: 'post-1',
        user_id: 'user-uuid-1',
        score: 5,
        created_at: new Date().toISOString(),
      },
      {
        id: 'v-2',
        post_id: 'post-2',
        user_id: 'user-uuid-1',
        score: 4,
        created_at: new Date().toISOString(),
      },
    ]);
  }

  if (!localStorage.getItem('bf_reports')) {
    setLocalStorage<MockReport[]>('bf_reports', []);
  }
}

// 현재 로그인된 가상 유저 상태 관리
let currentMockUser: MockUser | null = (() => {
  const saved = localStorage.getItem('bf_current_user');
  return saved ? JSON.parse(saved) : null;
})();

export const mockAuth = {
  getUser: () => currentMockUser,
  
  signUp: async (email: string, password: string, nickname: string) => {
    const users = getLocalStorage<MockUser[]>('bf_users', []);
    if (users.some((u) => u.email === email)) {
      throw new Error('이미 존재하는 이메일입니다.');
    }
    const newUser: MockUser = {
      id: Math.random().toString(36).substring(2, 11),
      email,
      nickname,
      role: 'user', // 기본 일반 유저
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    setLocalStorage('bf_users', users);
    return { data: { user: newUser } };
  },

  signIn: async (email: string, password: string) => {
    const users = getLocalStorage<MockUser[]>('bf_users', []);
    const user = users.find((u) => u.email === email);
    if (!user) {
      throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
    // 비밀번호 체크는 프론트엔드 모의 환경이므로 생략 (가입 시 저장 가정)
    currentMockUser = user;
    localStorage.setItem('bf_current_user', JSON.stringify(user));
    return { data: { user } };
  },

  signOut: async () => {
    currentMockUser = null;
    localStorage.removeItem('bf_current_user');
  },
};

// Mock 데이터 처리용 API
export const mockDb = {
  getPosts: async (searchQuery: string = '', includeBlinded: boolean = false) => {
    const posts = getLocalStorage<MockPost[]>('bf_posts', []);
    let filtered = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (!includeBlinded) {
      filtered = filtered.filter((p) => !p.is_blinded);
    }
    // 최신순 정렬
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  getPostById: async (id: string, includeBlinded: boolean = false) => {
    const posts = getLocalStorage<MockPost[]>('bf_posts', []);
    const post = posts.find((p) => p.id === id) || null;
    if (post && post.is_blinded && !includeBlinded) {
      return null;
    }
    return post;
  },

  createPost: async (title: string, content: string) => {
    if (containsProfanity(title) || containsProfanity(content)) {
      throw new Error('작성 내용에 부적절한 비속어가 포함되어 있어 등록할 수 없습니다.');
    }
    const posts = getLocalStorage<MockPost[]>('bf_posts', []);
    const newPost: MockPost = {
      id: Math.random().toString(36).substring(2, 11),
      title,
      content,
      status: 'pending',
      admin_comment: null,
      is_blinded: false,
      created_at: new Date().toISOString(),
    };
    posts.unshift(newPost);
    setLocalStorage('bf_posts', posts);
    return newPost;
  },

  updatePostStatus: async (postId: string, status: 'pending' | 'accepted' | 'rejected', adminComment: string | null) => {
    const posts = getLocalStorage<MockPost[]>('bf_posts', []);
    const index = posts.findIndex((p) => p.id === postId);
    if (index === -1) throw new Error('게시글을 찾을 수 없습니다.');
    posts[index].status = status;
    posts[index].admin_comment = adminComment;
    setLocalStorage('bf_posts', posts);
    return posts[index];
  },

  getComments: async (postId: string, isAdmin: boolean = false) => {
    const comments = getLocalStorage<MockComment[]>('bf_comments', []);
    return comments
      .filter((c) => c.post_id === postId)
      .map((c) => {
        if (c.is_blinded && !isAdmin) {
          return {
            ...c,
            content: '신고 누적으로 인해 블라인드 처리된 댓글입니다.',
          };
        }
        return c;
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  createComment: async (postId: string, content: string) => {
    if (containsProfanity(content)) {
      throw new Error('작성 내용에 부적절한 비속어가 포함되어 있어 등록할 수 없습니다.');
    }
    const comments = getLocalStorage<MockComment[]>('bf_comments', []);
    const newComment: MockComment = {
      id: Math.random().toString(36).substring(2, 11),
      post_id: postId,
      content,
      is_blinded: false,
      created_at: new Date().toISOString(),
    };
    comments.push(newComment);
    setLocalStorage('bf_comments', comments);
    return newComment;
  },

  getVotes: async (postId: string) => {
    const votes = getLocalStorage<MockVote[]>('bf_votes', []);
    const postVotes = votes.filter((v) => v.post_id === postId);
    const totalCount = postVotes.length;
    const averageScore =
      totalCount > 0
        ? Number((postVotes.reduce((sum, v) => sum + v.score, 0) / totalCount).toFixed(1))
        : 0;

    // 각 점수별 분포 계산
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    postVotes.forEach((v) => {
      const s = v.score as 1 | 2 | 3 | 4 | 5;
      if (distribution[s] !== undefined) {
        distribution[s]++;
      }
    });

    return { totalCount, averageScore, distribution };
  },

  getUserVote: async (postId: string, userId: string) => {
    const votes = getLocalStorage<MockVote[]>('bf_votes', []);
    return votes.find((v) => v.post_id === postId && v.user_id === userId) || null;
  },

  vote: async (postId: string, userId: string, score: number) => {
    const votes = getLocalStorage<MockVote[]>('bf_votes', []);
    const existing = votes.find((v) => v.post_id === postId && v.user_id === userId);
    if (existing) {
      throw new Error('이미 이 게시글에 투표하셨습니다.');
    }
    const newVote: MockVote = {
      id: Math.random().toString(36).substring(2, 11),
      post_id: postId,
      user_id: userId,
      score,
      created_at: new Date().toISOString(),
    };
    votes.push(newVote);
    setLocalStorage('bf_votes', votes);
    return newVote;
  },

  getStats: async () => {
    const posts = getLocalStorage<MockPost[]>('bf_posts', []);
    const votes = getLocalStorage<MockVote[]>('bf_votes', []);

    // 스탯 집계는 블라인드 여부에 관계없이 전체 건수를 보여줍니다.
    const totalPosts = posts.length;
    const pendingPosts = posts.filter((p) => p.status === 'pending').length;
    const acceptedPosts = posts.filter((p) => p.status === 'accepted').length;
    const rejectedPosts = posts.filter((p) => p.status === 'rejected').length;

    // 공감도 높은 게시글 top 5 연산 (블라인드되지 않은 게시글에서 추출)
    const activePosts = posts.filter((p) => !p.is_blinded);
    const postsWithVotes = await Promise.all(
      activePosts.map(async (post) => {
        const { averageScore, totalCount } = await mockDb.getVotes(post.id);
        return {
          ...post,
          averageScore,
          totalCount,
        };
      })
    );

    // 평균 평점 및 투표 수가 높은 순으로 정렬 후 상위 5개 반환
    const topPosts = postsWithVotes
      .sort((a, b) => b.averageScore - a.averageScore || b.totalCount - a.totalCount)
      .slice(0, 5);

    return {
      totalPosts,
      pendingPosts,
      acceptedPosts,
      rejectedPosts,
      topPosts,
    };
  },

  // --- 신규 신고 관련 API ---
  reportPost: async (postId: string, userId: string, reason: string = '') => {
    const reports = getLocalStorage<MockReport[]>('bf_reports', []);
    const existing = reports.find((r) => r.post_id === postId && r.user_id === userId);
    if (existing) {
      throw new Error('이미 신고한 게시글입니다.');
    }
    const newReport: MockReport = {
      id: Math.random().toString(36).substring(2, 11),
      post_id: postId,
      comment_id: null,
      user_id: userId,
      reason,
      created_at: new Date().toISOString(),
    };
    reports.push(newReport);
    setLocalStorage('bf_reports', reports);

    // 자동 블라인드 처리 검사 (신고가 3회 이상 쌓이면 블라인드)
    const postReports = reports.filter((r) => r.post_id === postId);
    if (postReports.length >= 3) {
      const posts = getLocalStorage<MockPost[]>('bf_posts', []);
      const index = posts.findIndex((p) => p.id === postId);
      if (index !== -1) {
        posts[index].is_blinded = true;
        setLocalStorage('bf_posts', posts);
      }
    }
    return newReport;
  },

  reportComment: async (commentId: string, userId: string, reason: string = '') => {
    const reports = getLocalStorage<MockReport[]>('bf_reports', []);
    const existing = reports.find((r) => r.comment_id === commentId && r.user_id === userId);
    if (existing) {
      throw new Error('이미 신고한 댓글입니다.');
    }
    const newReport: MockReport = {
      id: Math.random().toString(36).substring(2, 11),
      post_id: null,
      comment_id: commentId,
      user_id: userId,
      reason,
      created_at: new Date().toISOString(),
    };
    reports.push(newReport);
    setLocalStorage('bf_reports', reports);

    // 자동 블라인드 처리 검사 (신고가 3회 이상 쌓이면 블라인드)
    const commentReports = reports.filter((r) => r.comment_id === commentId);
    if (commentReports.length >= 3) {
      const comments = getLocalStorage<MockComment[]>('bf_comments', []);
      const index = comments.findIndex((c) => c.id === commentId);
      if (index !== -1) {
        comments[index].is_blinded = true;
        setLocalStorage('bf_comments', comments);
      }
    }
    return newReport;
  },

  updatePostBlindStatus: async (postId: string, isBlinded: boolean) => {
    const posts = getLocalStorage<MockPost[]>('bf_posts', []);
    const index = posts.findIndex((p) => p.id === postId);
    if (index === -1) throw new Error('게시글을 찾을 수 없습니다.');
    posts[index].is_blinded = isBlinded;
    setLocalStorage('bf_posts', posts);

    // 블라인드 해제 시 신고 내역 리셋하여 관리 편의 제공
    if (!isBlinded) {
      const reports = getLocalStorage<MockReport[]>('bf_reports', []);
      const filteredReports = reports.filter((r) => r.post_id !== postId);
      setLocalStorage('bf_reports', filteredReports);
    }
    return posts[index];
  },

  updateCommentBlindStatus: async (commentId: string, isBlinded: boolean) => {
    const comments = getLocalStorage<MockComment[]>('bf_comments', []);
    const index = comments.findIndex((c) => c.id === commentId);
    if (index === -1) throw new Error('댓글을 찾을 수 없습니다.');
    comments[index].is_blinded = isBlinded;
    setLocalStorage('bf_comments', comments);

    // 블라인드 해제 시 신고 내역 리셋
    if (!isBlinded) {
      const reports = getLocalStorage<MockReport[]>('bf_reports', []);
      const filteredReports = reports.filter((r) => r.comment_id !== commentId);
      setLocalStorage('bf_reports', filteredReports);
    }
    return comments[index];
  },

  getReportedItems: async () => {
    const reports = getLocalStorage<MockReport[]>('bf_reports', []);
    const posts = getLocalStorage<MockPost[]>('bf_posts', []);
    const comments = getLocalStorage<MockComment[]>('bf_comments', []);

    // 1. 신고된 게시글 가공
    const reportedPosts = posts
      .map((post) => {
        const postReports = reports.filter((r) => r.post_id === post.id);
        return {
          ...post,
          reports: postReports,
          reportCount: postReports.length,
        };
      })
      .filter((p) => p.reportCount > 0 || p.is_blinded);

    // 2. 신고된 댓글 가공
    const reportedComments = comments
      .map((comment) => {
        const commentReports = reports.filter((r) => r.comment_id === comment.id);
        const parentPost = posts.find((p) => p.id === comment.post_id);
        return {
          ...comment,
          post_title: parentPost ? parentPost.title : '삭제된 게시글',
          reports: commentReports,
          reportCount: commentReports.length,
        };
      })
      .filter((c) => c.reportCount > 0 || c.is_blinded);

    return {
      reportedPosts: reportedPosts.sort((a, b) => b.reportCount - a.reportCount),
      reportedComments: reportedComments.sort((a, b) => b.reportCount - a.reportCount),
    };
  },
};
