# 🌿 3인 협업 Git 브랜치 전략 및 CI/CD 실무 훈련 교재
> **안민영 대표님과 팀원 2명이 함께 겪어볼 실전 개발 파이프라인 워크북**

이 문서는 안민영 대표님과 팀원 2명이 대나무숲 고도화 프로젝트(v2.0)를 개발하며, 실제 IT 기업의 제품 릴리즈 사이클과 동일한 방식으로 **브랜치 작업, 코드 리뷰(CI), 그리고 자동 배포(CD)**를 겪어볼 수 있도록 설계된 실습 가이드입니다.

본 가이드는 실제 프로덕션에 나가는 `main` 브랜치의 안전성을 지키기 위해, 중간 개발 기지인 **`develop` 브랜치를 기준으로 작업하는 실무 표준 협업 구조**를 따릅니다.

---

## 🛠️ 준비 단계: 개발용 `develop` 브랜치 가져오기 (최초 1회)

김종록 팀원이 원격 저장소에 이미 `develop` 브랜치를 생성해 두었으므로, 대표님과 김혜라 팀원은 이를 로컬로 안전하게 가져와 싱크를 맞춥니다.

```powershell
# 1. 원격의 최신 브랜치 정보 갱신
git fetch

# 2. 원격의 develop 브랜치를 추적하는 로컬 develop 브랜치 생성 및 이동
git checkout develop
```

---

## 📅 1단계: R&R별 브랜치 파기 및 첫 개발 시작

이제 각 팀원은 자신의 PC 터미널에서 `develop` 브랜치를 기준으로 독자적인 작업 공간을 생성합니다.

### 👑 안민영: `feature/security-infra`
* **담당 역할:** 보안 고도화 (닉네임 생성기, IP 해싱) 및 인프라 연동
* **명령어:**
  ```powershell
  git checkout develop
  git pull origin develop
  git checkout -b feature/security-infra
  ```

### 👤 김종록: `feature/comment-thread`
* **담당 역할:** 댓글 및 대댓글(답글) 시스템 DB 설계 및 UI 연동
* **명령어:**
  ```powershell
  git checkout develop
  git pull origin develop
  git checkout -b feature/comment-thread
  ```

### 👤 김혜라: `feature/moderation-ux`
* **담당 역할:** 비속어 필터링, 신고 블라인드 API 및 프론트 반응형 CSS
* **명령어:**
  ```powershell
  git checkout develop
  git pull origin develop
  git checkout -b feature/moderation-ux
  ```

---

## 🚀 2단계: 코드 수정 및 깃허브에 내 브랜치 푸시(Push)

각자 자신의 역할을 수행하며 코드를 수정하고, 이를 원격 저장소에 업로드합니다.

1. **코드 작성:** 각자 할당받은 영역의 파일을 편집합니다.
2. **수정 파일 스테이징 및 커밋:**
   ```powershell
   git add .
   git commit -m "feat: [기능 명칭] 구현 완료"
   ```
3. **깃허브에 업로드:**
   ```powershell
   # 최초 1회만 -u 옵션을 주고 올립니다.
   git push -u origin [자신의-브랜치명]
   ```

---

## 🔍 3단계: Pull Request (PR) 생성 및 코드 리뷰 훈련

각자 코드를 올렸다면, 개발용 `develop` 브랜치에 합쳐달라는 요청(PR)을 **GitHub 웹사이트**를 통해 보내고 검토합니다.

> **[IMPORTANT] Base 브랜치를 `develop`으로 지정해야 합니다!**
> * GitHub에서 PR을 생성할 때, 코드가 최종 도달할 대상인 **Base 브랜치를 `main`이 아닌 `develop`으로 설정**해 주어야 합니다.
> * 즉, `base: develop` ⬅️ `compare: feature/[기능명]` 상태로 PR을 오픈합니다.

1. **PR 생성:** GitHub 저장소 페이지의 `Compare & pull request`를 누르고 Base를 `develop`로 설정한 후 PR을 오픈합니다.
2. **코드 리뷰 진행:**
   * 안민영 대표님은 김종록, 김혜라 팀원이 올린 PR의 코드를 검토하고 피드백 및 승인(Approve)을 진행합니다.
3. **Merge 실행:** 리뷰가 승인되면 `develop` 브랜치로 머지(Merge)합니다.

---

## 🧪 4단계: CI (지속적 통합 - GitHub Actions) 체감 훈련

프로젝트 루트에 세팅된 `.github/workflows/ci.yml` 파일이 `develop`와 `main` 브랜치 모두에 대해 자동 빌드 검증을 지원합니다.

### 💡 실습 시나리오: 빌드가 깨지는 상황 연출하기
1. 팀원 중 한 명이 고의로 코드에 컴파일 에러를 냅니다. (예: `App.tsx` 파일 아무 곳에나 `const test = ;` 처럼 문법 파괴 코드 삽입)
2. 해당 코드를 커밋하고 push하여 `dev` 브랜치로 향하는 PR을 올립니다.
3. GitHub의 해당 PR 페이지로 이동하면, **GitHub Actions가 자동으로 빌드를 돌리기 시작**합니다.
4. 잠시 후, 빌드가 실패하여 깃허브가 **`주황색/빨간색 X 표시`**와 함께 **`이 PR은 빌드가 깨졌으므로 Merged를 추천하지 않습니다`**라는 경고창을 띄우는 것을 팀원들과 눈으로 확인합니다.
5. 에러를 수정한 후 다시 push하면, 다시 자동으로 감지하여 **`초록색 체크표시(Passed)`**로 바뀌는 모습을 목격합니다.

---

## 🌐 5단계: CD (지속적 배포 - Netlify) 실시간 배포 훈련

현업에서는 보통 `develop` 머지 시 '테스트용(Staging) 배포'가 일어나고, `main` 머지 시 '실제 서비스 배포(Production)'가 일어납니다. 훈련 단계에서는 **`develop` 브랜치 머지 시 자동으로 테스트 링크가 배포되도록** 설정해 봅니다.

1. **Netlify 저장소 연결:** [Netlify](https://www.netlify.com)에 가입한 뒤 `Add new site` ➡️ `Import an existing project`를 선택합니다.
2. **저장소 연결:** 안민영 대표님의 깃허브 저장소를 선택하고 연동합니다.
3. **배포 대상 브랜치 지정:**
   * **Production Branch:** `develop` (스프린트 중 실시간 기능 동기화 확인용)
   * **Build Command:** `npm run build`
   * **Publish Directory:** `dist`
4. **배포 시작:** 설정 완료를 누르면 Netlify가 로컬 `develop` 코드를 가져가 빌드한 후 `https://임시주소.netlify.app` 링크를 생성해 줍니다.
5. **실시간 배포 확인:** 팀원들의 기능 브랜치 PR이 승인되어 `develop`에 머지될 때마다, Netlify가 자동으로 배포를 돌려 **실시간으로 웹사이트가 갱신되어 새로고침만으로 기능이 즉시 반영되는 모습**을 다 같이 모니터링합니다.
6. **최종 릴리즈 배포 (`develop` ➡️ `main`):** 모든 스프린트가 끝나 기능이 완벽히 검증되면, GitHub에서 `base: main` ⬅️ `compare: develop`로 PR을 만들어 최종 메인 서비스에 반영합니다.
