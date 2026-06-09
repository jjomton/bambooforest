# Notion API 404 Object Not Found 권한 오류 해결

## 🚨 문제 상황 (Symptom)
로컬 에러 로그를 노션 데이터베이스로 전송하는 스크립트(`sync_to_notion.js`) 실행 시, 정확한 데이터베이스 ID를 전달했음에도 404 오류가 발생함.
```text
@notionhq/client warn: request fail {
  code: 'object_not_found',
  message: 'Could not find database with ID: 37a84146... Make sure the relevant pages and databases are shared with your integration "bambooforest".'
}
```

---

## 🔍 원인 분석 (Cause)
* **원인:** Notion API 통합 열쇠(Secret Token)는 생성되었으나, 대상 페이지 및 데이터베이스에 대해 해당 API의 접근 권한이 연결(Connection)되어 있지 않음.
* **상세:** 노션은 철저한 제로 트러스트(Zero Trust) 보안 정책을 따르므로, 페이지 소유자가 직접 개별 페이지의 `...` 메뉴를 통해 외부 연결(`bambooforest`)을 명시적으로 허용해 주어야만 통신이 개방됨.

---

## 🛠️ 해결 조치 (Solution)
* **조치:** 노션 브라우저 화면 ➡️ `⚡ 트러블슈팅 에러 사전` 전체 페이지 이동 ➡️ 우측 상단 `...` 클릭 ➡️ `연결 추가` 메뉴에서 생성해 둔 `bambooforest`를 선택하여 접근 권한을 직접 매핑해 줌으로써 통신을 개방함.

---

## 💡 배운 점 (Lesson Learned)
* 외부 API 통신 제어 시에는 엔드포인트 URL과 인증키(Token) 값의 일치뿐만 아니라, 대상 리소스(Database) 단에서의 개별 접근 제어 목록(ACL)이 정상 허용되어 있는지 반드시 점검해야 함을 학습함.
