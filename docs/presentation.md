---
marp: true
theme: gaia
_class: lead
paginate: true
backgroundColor: #f8fafc
color: #1e293b
style: |
  section {
    font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
    padding: 50px;
    font-size: 1.8rem;
  }
  h1 {
    color: #0f172a;
    font-size: 2.8rem;
    border-bottom: 3px solid #0284c7;
  section::after {
    content: counter(page) " / " counter(pages);
    position: absolute;
    right: 30px;
    bottom: 18px;
    font-size: 0.85rem;
    color: #64748b;
  }
    padding-bottom: 10px;
  h2 {
    color: #0284c7;
    font-size: 2.2rem;
    margin-top: 20px;
  }
  footer {
    font-size: 0.8rem;
    color: #64748b;
  }
  strong {
    color: #0369a1;
  }
  code {
    background-color: #e2e8f0;
    color: #0f172a;
    font-size: 0.9em;
    padding: 2px 6px;
    border-radius: 4px;
  }
  pre {
    background-color: #0f172a;
    color: #f8fafc;
    padding: 15px;
    border-radius: 8px;
    font-size: 0.8em;
  }
  table {
    font-size: 0.9em;
    width: 100%;
    border-collapse: collapse;
  }
  th {
    background-color: #0284c7;
    color: white;
    padding: 8px;
  }
  td {
    border-bottom: 1px solid #cbd5e1;
    padding: 8px;
  }
---

# 🌲 휴먼센터 대나무숲 고도화 프로젝트
## 익명 건의·고충 관리 시스템 최종 발표

* **발표자:** 안민영 대표 (PM & Security Infra)
* **개발 기간:** 2026.06
* **개발 팀원:** 안민영, 김종록, 김혜라

---

# 📋 목차 (Index)

## 목차

1. 프로젝트 개요
  - 1.1 문제 정의 및 프로젝트 목표
  - 1.2 팀원 역할 분담 (R&R)
  - 1.3 개발 일정 및 기술 스택
2. 프로젝트 설계
  - 2.1 핵심 고도화 요구사항 (PRD v2.0)
  - 2.2 RLS 기반 익명 권한 제어 보안 설계
  - 2.3 시스템 아키텍처 구조
  - 2.4 데이터베이스 관계도 (ERD)
3. 핵심 기능 구현
  - 3.1 텍스트 비속어 필터링 알고리즘
  - 3.2 누적 신고 기반 자동 블라인드 트리거
4. 통합 테스트 및 검증
  - 4.1 통합 테스트 시나리오
  - 4.2 빌드 검증 결과
5. 결론 및 향후 확장 계획
6. 프로젝트 회고
7. Q & A

---

# 1. 프로젝트 개요
## 1.1 문제 정의 및 프로젝트 목표
* **현황 분석:** 학원 수강생의 시설/학업 불편사항 건의 창구 부족
* **심리적 장벽:** 기명 건의 시 불이익 우려로 인한 소통 부재
* **해결 목표:**
  * **완벽한 익명성 보장**으로 자유로운 소통 공간 개설
  * 실시간 댓글/대댓글을 통한 토론 및 피드백 활성화
  * 비속어 필터와 신고 제도를 통한 건전한 환경 조성

---

# 1. 프로젝트 개요
## 1.2 팀원 역할 분담 (R&R)
* **안민영 (PM / Security / Infra)**
  * 전체 일정 조율, Supabase RLS 정책 설계, Notion API 자동 연동 구축, CI/CD 구축
* **김종록 (DB / BE)**
  * 테이블 관계도 모델링, 실시간 계층형 댓글 및 대댓글 시스템 API 구현
* **김혜라 (FE / UX)**
  * 프론트엔드 CSS 모바일 반응형 최적화, 비속어 필터 적용 및 모더레이션 대시보드 화면 설계

---

# 1. 프로젝트 개요
## 1.3 개발 일정 및 기술 스택
* **개발 스케줄:** 
  * 요구사항 정의(PRD v2.0) ➡️ DB 설계 ➡️ MVP 구현 ➡️ 모더레이션/대댓글 고도화 ➡️ 통합 병합 검증
* **기술 스택:**

| Layer | Technology Stack |
| :--- | :--- |
| **Frontend** | React (v19), TypeScript, Vite, Tailwind CSS (v4) |
| **Backend** | Supabase (Authentication, PostgreSQL Database) |
| **Automation** | Node.js, Notion API Client, GitHub Actions |

---

# 2. 프로젝트 설계
## 2.1 핵심 고도화 요구사항 (PRD v2.0)
* **F-700 익명성 강화:** IP/식별자의 임시 단방향 해싱 처리
* **F-800 소통 다각화:** 2단계 계층형 대댓글(답글) 구조 지원 및 실시간 동기화
* **F-900 모더레이션:** 부적절 단어 자동 차단 및 누적 신고 블라인드
* **CI/CD:** PR 시 린트/빌드 자동 검증을 통한 마스터 브랜치 보호

---

# 2. 프로젝트 설계
## 2.2 RLS 기반 익명 권한 제어 보안 설계 (★ 핵심 성과)
* **어려움:** 작성자 식별 데이터 유출을 막으면서 본인 글만 수정/삭제 허용
* **해결 조치 (Shadow Mapping Table 패턴 적용):**
  * `posts` 테이블에 `user_id`를 저장하지 않아 조회 시 원천 유출 차단
  * 별도의 비밀 매핑 테이블 `post_authors`에 `(글ID, 유저ID)` 비밀 보관
  * DB 트리거가 글 작성 시 사용자 컨텍스트(`auth.uid()`)를 읽어 매핑 테이블에 기록
  * RLS가 비밀 매핑 테이블을 대조하여 본인 글만 `UPDATE`/`DELETE` 권한 부여
  * `post_authors` 테이블은 RLS로 본인과 관리자 외 조회 절대 불가

---

# 2. 프로젝트 설계
## 2.3 시스템 아키텍처 구조

```
    ┌─────────────────────────┐
    │  React SPA 클라이언트   │
    └────────────┬────────────┘
                 │ (HTTPS API 호출)
    ┌────────────▼────────────┐
    │     Supabase BaaS       │
    │  ┌───────────────────┐  │
    │  │   Supabase Auth   │  │
    │  └─────────┬─────────┘  │
    │  ┌─────────▼─────────┐  │
    │  │ Row Level Security│  │
    │  └─────────┬─────────┘  │
    │  ┌─────────▼─────────┐  │
    │  │ PostgreSQL DB     │  │
    │  └───────────────────┘  │
    └─────────────────────────┘
```

---

# 2. 프로젝트 설계
## 2.4 데이터베이스 관계도 (ERD)
* **7개 테이블간의 관계성 모델링**
  * **users:** 가입 시 트리거가 생성하여 역할(role: user/admin) 분류
  * **posts & comments:** 익명성을 지키는 본문 테이블
  * **post_authors & comment_authors:** RLS용 비밀 매핑 테이블
  * **votes:** 중복 평점(1~5점) 투표 방지 유니크 제약 설정
  * **reports:** 게시글 및 댓글 신고용 통합 스키마 구성

---

# 3. 핵심 기능 구현
## 3.1 텍스트 비속어 필터링 알고리즘
* **구현 파일:** `src/lib/profanityFilter.ts`
* **검사 논리:** 
  * 비속어/음란 단어 블랙리스트 사전 구축
  * 특수문자/공백 우회 시도를 정규식으로 정제한 후 검증
* **버그 해결:** 
  * 통합 과정에서 대댓글 작성 시 일반 댓글창 값을 검사하던 기획 논리 결함을 발견
  * 실제 등록되는 대댓글 본문(`contentToSubmit`)을 검사하도록 병합 시 전격 수정 조치 완료

---

# 3.1 비속어 필터링 구현 코드 예시

```typescript
// src/pages/PostDetail.tsx
const contentToSubmit = parentId ? replyContent : newComment;
if (!id || !contentToSubmit.trim() || submittingComment) return;

// 대댓글과 원댓글 구분 없이 최종 본문 비속어 검증
if (containsProfanity(contentToSubmit)) {
  const badWords = getDetectedProfanities(contentToSubmit);
  alert(`비속어가 포함되어 있어 등록할 수 없습니다. (감지 단어: ${badWords.join(', ')})`);
  return;
}
```

---

# 3. 핵심 기능 구현
## 3.2 누적 신고 기반 자동 블라인드 트리거
* **정책:** 동일 게시글 또는 댓글에 대해 누적 신고 **3회 이상** 시 자동 감춤
* **PostgreSQL Trigger:**
```sql
CREATE OR REPLACE FUNCTION public.handle_auto_blind()
RETURNS TRIGGER AS $$
BEGIN
  -- 게시글 신고 카운트가 3회 이상일 때
  IF NEW.post_id IS NOT NULL AND (SELECT COUNT(*) FROM reports WHERE post_id = NEW.post_id) >= 3 THEN
    UPDATE public.posts SET is_blinded = TRUE WHERE id = NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

# 4. 통합 테스트 및 검증
## 4.1 통합 테스트 시나리오
1. **일반 사용자:** 로그인 ➡️ 글 작성 ➡️ 비속어 필터 작동 확인 ➡️ 공점 투표 ➡️ 대댓글 작성 ➡️ 특정 부적절 댓글 신고 3회 중첩
2. **데이터베이스:** `handle_auto_blind` 트리거에 의해 자동으로 블라인드 플래그 활성화 확인
3. **관리자:** 모더레이션 대시보드에서 블라인드 항목 모니터링 및 복구 조치

## 4.2 빌드 검증 결과
* Vite 및 TypeScript 정적 빌드 테스트 통과 (`npm run build` 성공)
* 로컬스토리지 Mock API 검증 및 실서버 Supabase 연동 통과

---

# 4. 결론: 4대 핵심 트러블슈팅 이력
* **① PowerShell 실행 제한:** `ExecutionPolicy Bypass` 세션 선언으로 npm 차단 우회
* **② Git Identity 미등록:** 로컬 git config 사용자 서명 지정으로 머지 충돌 완결
* **③ Notion API 404:** 타겟 데이터베이스에 `bambooforest` 봇 연결 추가 공유 허용
* **④ 빌드 타입 에러:** 대댓글 mock 데이터 객체의 `is_blinded` 필드 누락 디버깅 해결

---

# 5. 결론 및 향후 확장 계획
* **종합 성과:** 
  * 3인 협업 브랜치 통합 및 실무 수준 Git CI/CD 파이프라인 정립
  * BaaS 인프라를 활용하여 서버 없이 견고한 익명 보안 및 자정 시스템 구현
* **향후 로드맵:**
  * **AI 감정 분석 연동:** 고충 본문을 인공지능이 분석하여 카테고리 자동 라벨링
  * **안전한 알림 전송:** 익명성을 해치지 않으며 피드백 알림을 전송하는 웹푸시 구축

---

# 6. 프로젝트 회고
* **대표 안민영:** Supabase RLS 설계를 통해 서버리스 백엔드의 강력한 행 단위 보안 제어 능력을 체득할 수 있었습니다.
* **팀원 김종록:** 계층형 대댓글 자가 참조 스키마 구성과 대댓글 UI 연동에서 까다로운 상태 동기화 기법을 훈련했습니다.
* **팀원 김혜라:** 복잡한 모더레이션 화면과 모바일 대응 반응형 CSS를 마크업하며 사용자 친화적인 웹 접근성을 확보했습니다.

---

# Q & A

### 경청해 주셔서 감사합니다.
* 질문이 있으시면 편하게 말씀해 주십시오.
