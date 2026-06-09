# 📄 대나무숲 프로젝트 실전 트러블슈팅 및 인프라 구축 보고서
> **협업 파이프라인 구축 중 발생한 기술적 난제와 해결 과정 아카이브**

본 문서는 대표님과 팀원 2명이 프로젝트를 셋업하며 로컬 컴퓨터, Git, Notion API, Supabase DB 연동 과정에서 발생한 실제 트러블슈팅 사례를 최종 개발 결과보고서에 즉시 탑재할 수 있도록 정돈한 실전 기술 보고서입니다.

---

## 📂 [Troubleshooting 1] PowerShell npm 스크립트 실행 제한

### 🚨 1. 문제 상황 (Symptom)
윈도우 기반 학원 PC 터미널에서 `npm install` 및 `npm run dev` 실행 시 아래와 같이 스크립트 로드가 차단되는 보안 예외 오류가 발생함.
```text
npm : 이 시스템에서 스크립트를 실행할 수 없으므로 C:\Program Files\nodejs\npm.ps1 파일을 로드할 수 없습니다.
자세한 내용은 about_Execution_Policies(https://go.microsoft.com/fwlink/?LinkID=135170)를 참조하십시오.
CategoryInfo : 보안 오류 (UnauthorizedAccess)
```

### 🔍 2. 원인 분석 (Cause)
* **원인:** Windows PowerShell의 기본 실행 정책(Execution Policy)이 서명되지 않은 외부 `.ps1` 스크립트의 실행을 차단하도록 되어 있음.
* **상세:** Node.js의 `npm` 명령어는 내부적으로 PowerShell 스크립트(`npm.ps1`)를 호출하여 실행되는데, 윈도우 OS 보안 장벽에 가로막혀 가동되지 못한 현상임.

### 🛠️ 3. 해결 조치 (Solution)
* **조치:** 전역 설정을 변경하지 않고, 현재 실행 중인 프로세스 세션에 한해서만 보안 정책을 우회하도록 아래 명령어를 적용하여 안전하게 해결함.
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
  ```
* **팁:** AI 도구를 활용하여 종속성을 설치할 때는 단일 명령어로 실행 정책을 우회하는 쉘 기법을 적용함:
  ```powershell
  powershell -ExecutionPolicy Bypass -Command "npm install @notionhq/client"
  ```

### 💡 4. 배운 점 (Lesson Learned)
* 공용 PC(학원 PC) 등 권한 제한이 있는 환경에서는 시스템 전역 설정을 건드리는 것보다 `-Scope Process`를 이용해 가상 세션 내에서 일시적으로 권한을 획득하는 우회법이 훨씬 안전하고 효율적임을 인지함.

---

## 📂 [Troubleshooting 2] Git Commit Author 식별자 미등록

### 🚨 1. 문제 상황 (Symptom)
코드 수정을 마친 후 `git commit` 명령을 수행했을 때, 아래의 경고와 함께 커밋 저장이 거부됨.
```text
Author identity unknown
*** Please tell me who you are.
fatal: unable to auto-detect email address
```

### 🔍 2. 원인 분석 (Cause)
* **원인:** 로컬 Git에 개발자의 식별 정보(`user.email`, `user.name`)가 등록되지 않은 무명 상태임.
* **상세:** Git은 모든 변경 이력에 작성자 메타데이터를 필수로 포함하여 히스토리를 보존해야 하는데, 최초 셋업 PC에서 이 정보가 기재되지 않아 발생함.

### 🛠️ 3. 해결 조치 (Solution)
* **조치:** 터미널에 깃허브 계정과 일치하는 글로벌 정보를 선언하여 서명을 마침.
  ```powershell
  git config --global user.email "your-email@github.com"
  git config --global user.name "your-github-username"
  ```

### 💡 4. 배운 점 (Lesson Learned)
* Git은 분산 버전 관리 시스템으로서 코드 변경의 오너십(Ownership)을 매우 중요하게 다루며, 협업을 시작할 때는 개발자 정보의 일치가 선행되어야 함을 깨달음.

---

## 📂 [Troubleshooting 3] Notion API 404 Object Not Found 권한 오류

### 🚨 1. 문제 상황 (Symptom)
로컬 에러 로그를 노션 데이터베이스로 전송하는 스크립트(`sync_to_notion.js`) 실행 시, 정확한 데이터베이스 ID를 전달했음에도 404 오류가 발생함.
```text
@notionhq/client warn: request fail {
  code: 'object_not_found',
  message: 'Could not find database with ID: 37a84146... Make sure the relevant pages and databases are shared with your integration "bambooforest".'
}
```

### 🔍 2. 원인 분석 (Cause)
* **원인:** Notion API 통합 열쇠(Secret Token)는 생성되었으나, 대상 페이지 및 데이터베이스에 대해 해당 API의 접근 권한이 연결(Connection)되어 있지 않음.
* **상세:** 노션은 철저한 제로 트러스트(Zero Trust) 보안 정책을 따르므로, 페이지 소유자가 직접 개별 페이지의 `...` 메뉴를 통해 외부 연결(`bambooforest`)을 명시적으로 허용해 주어야만 통신이 개방됨.

### 🛠️ 3. 해결 조치 (Solution)
* **조치:** 노션 브라우저 화면 ➡️ `⚡ 트러블슈팅 에러 사전` 전체 페이지 이동 ➡️ 우측 상단 `...` 클릭 ➡️ `연결 추가` 메뉴에서 생성해 둔 `bambooforest`를 선택하여 접근 권한을 직접 매핑해 줌으로써 통신을 개방함.

### 💡 4. 배운 점 (Lesson Learned)
* 외부 API 통신 제어 시에는 엔드포인트 URL and 인증키(Token) 값의 일치뿐만 아니라, 대상 리소스(Database) 단에서의 개별 접근 제어 목록(ACL)이 정상 허용되어 있는지 반드시 점검해야 함을 학습함.

---

## 📂 [Troubleshooting 4] Supabase DB 스키마 갱신 및 마이그레이션 정책 수립

### 🚨 1. 문제 상황 (Symptom)
팀원이 구현한 익명 글/댓글 수정 삭제 권한 제어 테이블(`post_authors`, `comment_authors`) 스키마 사양을 로컬에서는 병합 완료했으나, 클라우드 DB(Supabase) 서버에 이를 안전하게 적용할 최적의 방안에 대한 의사결정이 요구됨.

### 🔍 2. 원인 분석 (Cause)
* **분석:**
  * **방안 A (DROP 후 재생성):** DB 구조가 간단한 프로토타입 단계에서 충돌을 피할 수 있어 빠르지만, 기존 가입 유저와 테스트 데이터가 소실됨.
  * **방안 B (ALTER 및 정책 수정):** 기존 데이터를 보존할 수 있으나, 기존 RLS 정책을 수동으로 drop하고 재생성해야 해서 쿼리 작성 리소스가 발생함.

### 🛠️ 3. 해결 조치 (Solution)
* **조치:** 훈련 프로젝트의 기동성을 고려하여, 테스트 데이터를 초기화하더라도 오류 가능성이 제로인 **[방안 A]를 채택**하여 `DROP TABLE CASCADE` 명령 실행 후 최신 `schema.sql` 전체를 Supabase SQL Editor에서 실행함으로써 일괄 리셋 및 갱신을 성료함.
* **마이그레이션 예외 수립:** 향후 데이터 보존을 위해 `CREATE TABLE IF NOT EXISTS` 구조와 `DROP POLICY IF EXISTS`를 혼합한 정교한 마이그레이션 SQL 문을 별도로 프로젝트에 남겨두어 대비함.

### 💡 5. 배운 점 (Lesson Learned)
* 데이터베이스 고도화 시에는 로컬 코드의 병합뿐만 아니라, 클라우드 환경의 스키마 상태(Schema State)를 동기화하는 '마이그레이션 전략' 설계가 동반되어야 안정적인 서비스를 유지할 수 있음을 배움.
