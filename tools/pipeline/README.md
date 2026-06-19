# PeaceByPiece Auto Pipeline

## 실행

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\pipeline\peacebypiece-auto-pipeline.ps1
```

`tools/pipeline/peacebypiece-auto-pipeline.ps1` is the canonical PowerShell menu entry point and is tracked in Git. Patch, old-version, backup, temporary, and copied PowerShell variants remain ignored by `.gitignore`.

설정은 `pipeline.config.psd1`에서 관리합니다. DB URL, 비밀번호, R2 key, token 같은 비밀값은 이 파일에 넣지 않습니다.

## 프로젝트 루트

`Paths.ProjectDir`가 비어 있으면 스크립트 위치(`tools/pipeline`)에서 두 단계 위의 프로젝트 루트를 자동 사용합니다.

## Simulator DB 승인

`Simulator.ApprovedDbFingerprint`는 DB URL의 host/database 조합을 해시한 식별값입니다. Seed와 cleanup은 현재 연결 대상의 fingerprint가 이 값과 정확히 일치할 때만 실행됩니다.

## Reset Database Schema Guard

Development/test menu 9 requires the exact confirmation phrase `RESET WAF-FN SCHEMA`. Before the SQL runner can be prepared, the menu calls the shared reset guard in `pipeline-common.ps1` and blocks production runtime, missing/unknown runtime, non-PostgreSQL URLs, approved fingerprint mismatch, non-`wafl-fn` prefix, and confirmation mismatch. Logs must report only PASS/BLOCKED style status and must not print the DB URL, host, database name, credential, token, secret, or actual fingerprint.

## 스크립트 구성

- `peacebypiece-auto-pipeline.ps1`: 메인 메뉴, npm dev/build 토글, 개발·테스트 메뉴
- `download-watcher.ps1`: 다운로드 폴더 감시 루프
- `pipeline-common.ps1`: 공통 설정 로드, 경로, 로그 및 기본 유틸
- `pipeline-patch-processing.ps1`: commit-meta 파싱, 다운로드 완료 판별, ZIP/경로 검증, 패치 적용, Git/build/archive 처리
- `pipeline.config.psd1`: 사용자 환경 경로와 실행 옵션

메인 메뉴 1번은 `download-watcher.ps1`을 숨김 백그라운드 PowerShell 프로세스로 시작·종료합니다. watcher PID, 상태 JSON, heartbeat, 로그는 설정된 Logs 경로에 저장되며 메인 메뉴를 종료해도 watcher는 계속 실행됩니다.

메인 메뉴 구성:

1. Download 폴더 감시 시작/종료 토글
2. npm run dev 시작/종료 토글
3. 패치 적용 후 자동 Build 토글
4. Flush folders - 산출물 폴더 비우기
5. 개발 / 테스트 도구

Separate PowerShell uploads are not needed when Git already carries the current canonical script. Use an external PowerShell upload only when a newer script-only copy exists outside the repository or when a task explicitly asks for script-only handoff.
