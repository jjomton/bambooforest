-- 1. Users Table (auth.users와 연동되는 공개 사용자 정보 테이블)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Posts Table (익명 건의글 테이블)
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  admin_comment TEXT,
  is_blinded BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  -- 익명 보장을 위해 작성자 ID(user_id)를 저장하지 않음.
);

-- 3. Comments Table (익명 댓글 테이블)
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_blinded BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  -- 익명 보장을 위해 작성자 ID(user_id)를 저장하지 않음.
);

-- 4. Votes Table (공감도 투표 테이블)
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  score SMALLINT NOT NULL CHECK (score >= 1 AND score <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- 중복 투표 방지를 위한 복합 유니크 제약
  CONSTRAINT unique_post_user_vote UNIQUE (post_id, user_id)
);

-- 5. Trigger: auth.users 테이블에 새 가입자가 생기면 public.users에 자동 복사
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, nickname, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nickname', '익명 대나무'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger 선언
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Row Level Security (RLS) 설정 (보안 강화)
-- public.users, public.posts, public.comments, public.votes 테이블 RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- 정책 (Policies) 정의
-- users: 누구나 조회 가능, 쓰기/수정은 트리거 또는 자기 자신만 가능
CREATE POLICY "Users are readable by everyone" ON public.users 
  FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users 
  FOR UPDATE USING (auth.uid() = id);

-- posts: 누구나 조회 가능, 로그인한 사용자 누구나 작성 가능, 관리자만 수정 가능
CREATE POLICY "Posts are readable by everyone" ON public.posts 
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.posts 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update posts" ON public.posts 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- comments: 누구나 조회 가능, 로그인한 사용자 누구나 작성 가능
CREATE POLICY "Comments are readable by everyone" ON public.comments 
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.comments 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- votes: 누구나 조회 가능, 로그인한 사용자 누구나 본인 이름으로 투표 가능 (보안 상 투표 내역은 조회만 가능하며, 타인의 user_id는 SELECT할 수 없음)
CREATE POLICY "Votes are readable by everyone" ON public.votes 
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote for themselves" ON public.votes 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- 6. Reports Table (신고 테이블)
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- 한 사람이 게시글이나 댓글을 중복 신고하는 것을 방지
  CONSTRAINT unique_post_user_report UNIQUE (post_id, user_id),
  CONSTRAINT unique_comment_user_report UNIQUE (comment_id, user_id),
  
  -- 게시글 혹은 댓글 중 하나만 신고 대상으로 등록되도록 제한
  CONSTRAINT check_target_exists CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR 
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- reports RLS 설정
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 정책: 로그인 유저가 자신 이름으로 신고 생성 가능, 관리자만 모든 신고 조회 가능
CREATE POLICY "Authenticated users can create reports for themselves" ON public.reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Admins can select all reports" ON public.reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- 7. Trigger: 신고가 쌓였을 때 자동 블라인드 처리 (3회 이상 누적 시)
CREATE OR REPLACE FUNCTION public.handle_auto_blind()
RETURNS TRIGGER AS $$
DECLARE
  report_count INTEGER;
BEGIN
  IF NEW.post_id IS NOT NULL THEN
    -- 게시글 신고 건수 계산
    SELECT COUNT(*) INTO report_count FROM public.reports WHERE post_id = NEW.post_id;
    
    IF report_count >= 3 THEN
      UPDATE public.posts SET is_blinded = TRUE WHERE id = NEW.post_id;
    END IF;
  ELSIF NEW.comment_id IS NOT NULL THEN
    -- 댓글 신고 건수 계산
    SELECT COUNT(*) INTO report_count FROM public.reports WHERE comment_id = NEW.comment_id;
    
    IF report_count >= 3 THEN
      UPDATE public.comments SET is_blinded = TRUE WHERE id = NEW.comment_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_report_created
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE PROCEDURE public.handle_auto_blind();

