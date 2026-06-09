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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  -- 익명 보장을 위해 작성자 ID(user_id)를 직접 저장하지 않음.
);

-- 3. Comments Table (익명 댓글 테이블)
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  -- 익명 보장을 위해 작성자 ID(user_id)를 직접 저장하지 않음.
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

-- 4.1 작성자 추적용 비밀 테이블 (익명성 유지 및 권한 제어 목적)
CREATE TABLE public.post_authors (
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.comment_authors (
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
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

-- 5.1 Trigger: 게시글 작성 시 비밀리에 작성자 기록
CREATE OR REPLACE FUNCTION public.track_post_author()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.post_authors (post_id, user_id) VALUES (NEW.id, auth.uid());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_post_created
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE PROCEDURE public.track_post_author();

-- 5.2 Trigger: 댓글 작성 시 비밀리에 작성자 기록
CREATE OR REPLACE FUNCTION public.track_comment_author()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.comment_authors (comment_id, user_id) VALUES (NEW.id, auth.uid());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE PROCEDURE public.track_comment_author();


-- Row Level Security (RLS) 설정 (보안 강화)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_authors ENABLE ROW LEVEL SECURITY;

-- 정책 (Policies) 정의
-- users: 누구나 조회 가능, 쓰기/수정은 트리거 또는 자기 자신만 가능
CREATE POLICY "Users are readable by everyone" ON public.users 
  FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users 
  FOR UPDATE USING (auth.uid() = id);

-- post_authors & comment_authors (오직 본인과 관리자만 조회 가능)
CREATE POLICY "Authors can read their own post author mapping" ON public.post_authors 
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Authors can read their own comment author mapping" ON public.comment_authors 
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- posts: 누구나 조회 가능, 로그인한 사용자 누구나 작성 가능, 수정/삭제는 본인 또는 관리자만 가능
CREATE POLICY "Posts are readable by everyone" ON public.posts 
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.posts 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authors or admins can update posts" ON public.posts 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.post_authors WHERE post_id = id AND user_id = auth.uid()) 
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Authors or admins can delete posts" ON public.posts 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.post_authors WHERE post_id = id AND user_id = auth.uid()) 
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- comments: 누구나 조회 가능, 로그인한 사용자 누구나 작성 가능, 수정은 본인만, 삭제는 본인/관리자
CREATE POLICY "Comments are readable by everyone" ON public.comments 
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.comments 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authors can update their own comments" ON public.comments 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.comment_authors WHERE comment_id = id AND user_id = auth.uid())
  );
CREATE POLICY "Authors or admins can delete comments" ON public.comments 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.comment_authors WHERE comment_id = id AND user_id = auth.uid()) 
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- votes: 누구나 조회 가능, 로그인한 사용자 누구나 본인 이름으로 투표 가능, 수정/삭제(투표 취소) 가능
CREATE POLICY "Votes are readable by everyone" ON public.votes 
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote for themselves" ON public.votes 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "Users can update their own votes" ON public.votes 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own votes" ON public.votes 
  FOR DELETE USING (auth.uid() = user_id);
