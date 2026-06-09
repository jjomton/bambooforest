# PowerShell npm 스크립트 실행 제한 (UnauthorizedAccess) 해결

## 🚨 문제 상황 (Symptom)
윈도우 기반 학원 PC 터미널에서 `npm install` 및 `npm run dev` 실행 시 아래와 같이 스크립트 로드가 차단되는 보안 예외 오류가 발생함.
```text
npm : 이 시스템에서 스크립트를 실행할 수 없으므로 C:\Program Files\nodejs\npm.ps1 파일을 로드할 수 없습니다.
자세한 내용은 about_Execution_Policies(https://go.microsoft.com/fwlink/?LinkID=135170)를 참조하십시오.
CategoryInfo : 보안 오류 (UnauthorizedAccess)
```

---

## 🔍 원인 분석 (Cause)
* **원인:** Windows PowerShell의 기본 실행 정책(Execution Policy)이 서명되지 않은 외부 `.ps1` 스크립트의 실행을 차단하도록 되어 있음.
* **상세:** Node.js의 `npm` 명령어는 내부적으로 PowerShell 스크립트(`npm.ps1`)를 호출하여 실행되는데, 윈도우 OS 보안 장벽에 가로막혀 가동되지 못한 현상임.

---

## 🛠️ 해결 조치 (Solution)
* **조치:** 전역 설정을 변경하지 않고, 현재 실행 중인 프로세스 세션에 한해서만 보안 정책을 우회하도록 아래 명령어를 적용하여 안전하게 해결함.
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
  ```
* **팁:** AI 도구를 활용하여 종속성을 설치할 때는 단일 명령어로 실행 정책을 우회하는 쉘 기법을 적용함:
  ```powershell
  powershell -ExecutionPolicy Bypass -Command "npm install @notionhq/client"
  ```

---

## 💡 배운 점 (Lesson Learned)
* 공용 PC(학원 PC) 등 권한 제한이 있는 환경에서는 시스템 전역 설정을 건드리는 것보다 `-Scope Process`를 이용해 가상 세션 내에서 일시적으로 권한을 획득하는 우회법이 훨씬 안전하고 효율적임을 인지함.
