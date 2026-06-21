# Simulator R2 Local Plan Fix 0.23.73

## 목적
PowerShell 24번 `Simulator R2 Plan`과 25번 `Simulator R2 Local Generate`가 실제 DB seed metadata 없이도 실행되도록 분리한다.

## 변경
- Plan·Generate는 `tools/simulator/fixtures/r2/local-small-scenario.json`만 사용한다.
- Plan은 DB/R2 접속, 로컬 파일 생성, manifest 생성을 하지 않는다.
- Local Generate는 `.tmp/simulator/r2/files`와 manifest만 생성한다.
- Upload·Verify·All은 향후 명시적인 dev/test 통합 실행에서만 DB metadata를 읽는다.

## 안전성
- production DB/R2 접근 없음
- Full Reset 및 seed 선행 불필요
- 실제 R2 업로드 없음
