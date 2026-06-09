# PowerShell npm 스크립트 실행 오류 해결 (UnauthorizedAccess)

## 🚨 문제 상황 (Symptom)
* **발생 상황:** 학원 PC(Windows) 터미널에서 `npm install` 및 `npm run dev` 명령을 실행하려 할 때 스크립트 로드 차단 오류 발생.
* **에러 메시지:**
  ```text
  npm : 이 시스템에서 스크립트를 실행할 수 없으므로 C:\Program Files\nodejs\npm.ps1 파일을 로드할 수 없습니다.
  자세한 내용은 about_Execution_Policies(https://go.microsoft.com/fwlink/?LinkID=135170)를 참조하십시오.
  + CategoryInfo          : 보안 오류: (:) [], PSSecurityException
  + FullyQualifiedErrorId : UnauthorizedAccess
  ```

---

## 🔍 원인 분석 (Cause)
* Windows PowerShell은 기본 보안 설정(Execution Policy)으로 인해 서명되지 않은 외부 `.ps1` 스크립트의 실행을 시스템 보호 차원에서 엄격히 금지합니다.
* Node.js의 `npm` 명령 실행 시 필요한 내부 실행 파일이 PowerShell 스크립트로 구성되어 있어서 차단된 것입니다.

---

## 🛠️ 해결 방법 (Solution)
* 현재 열려 있는 PowerShell 세션에 한해 임시로 보안 감시를 우회하도록 터미널에 아래 명령을 실행한 후 npm 명령을 가동했습니다.
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
  ```

---

## 💡 배운 점 및 예방책 (Lesson Learned)
* 윈도우 환경의 PowerShell은 기본적으로 강력한 보안 상태를 유지합니다.
* 학원 PC처럼 관리자 권한이 없거나 재부팅 시 초기화되는 환경에서는 전역 설정을 바꾸는 것보다 `-Scope Process` 옵션으로 현재 세션에서만 안전하게 Bypass(우회)하는 방식이 매우 유용합니다.
