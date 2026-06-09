# Git Commit Author 식별자 미등록 (Author identity unknown) 해결

## 🚨 문제 상황 (Symptom)
코드 수정을 마친 후 `git commit` 명령을 수행했을 때, 아래의 경고와 함께 커밋 저장이 거부됨.
```text
Author identity unknown
*** Please tell me who you are.
fatal: unable to auto-detect email address
```

---

## 🔍 원인 분석 (Cause)
* **원인:** 로컬 Git에 개발자의 식별 정보(`user.email`, `user.name`)가 등록되지 않은 무명 상태임.
* **상세:** Git은 모든 변경 이력에 작성자 메타데이터를 필수로 포함하여 히스토리를 보존해야 하는데, 최초 셋업 PC에서 이 정보가 기재되지 않아 발생함.

---

## 🛠️ 해결 조치 (Solution)
* **조치:** 터미널에 깃허브 계정과 일치하는 글로벌 정보를 선언하여 서명을 마침.
  ```powershell
  git config --global user.email "your-email@github.com"
  git config --global user.name "your-github-username"
  ```

---

## 💡 배운 점 (Lesson Learned)
* Git은 분산 버전 관리 시스템으로서 코드 변경의 오너십(Ownership)을 매우 중요하게 다루며, 협업을 시작할 때는 개발자 정보의 일치가 선행되어야 함을 깨달음.
