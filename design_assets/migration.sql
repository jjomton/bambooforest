-- ==========================================
-- 대나무숲 신고/블라인드 기능 마이그레이션 DDL
-- 기존 데이터 유지 상태에서 실행 가능한 점진적 스크립트
-- ==========================================

-- 1. 기존 테이블에 블라인드 컬럼 추가
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_blinded BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS is_blinded BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. 신규 reports 테이블 생성
CREATE TABLE IF NOT EXISTS public.reports (
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

-- 3. reports RLS 설정 및 정책 추가
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 정책: 로그인 유저가 자신 이름으로 신고 생성 가능
DROP POLICY IF EXISTS "Authenticated users can create reports for themselves" ON public.reports;
CREATE POLICY "Authenticated users can create reports for themselves" ON public.reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- 정책: 관리자만 모든 신고 조회 가능
DROP POLICY IF EXISTS "Admins can select all reports" ON public.reports;
CREATE POLICY "Admins can select all reports" ON public.reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- 4. 신고가 쌓였을 때 자동 블라인드 처리 트리거 함수 정의 (3회 이상 누적 시)
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

-- 5. 트리거 선언
DROP TRIGGER IF EXISTS on_report_created ON public.reports;
CREATE TRIGGER on_report_created
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE PROCEDURE public.handle_auto_blind();
