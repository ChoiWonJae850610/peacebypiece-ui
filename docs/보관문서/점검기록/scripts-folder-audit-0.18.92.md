# scripts 폴더 사용 범위 점검 — 0.18.92

## 목적

테스트 불가 상태에서 프로젝트 내부 `scripts/` 폴더의 사용 범위를 문서화한다. 이번 버전은 스크립트 동작을 바꾸지 않고, 실행 조건과 위험 범위를 명확히 하는 저위험 정리만 수행한다.

## 확인 대상

- `scripts/seed-r2-demo-files.mjs`
- `scripts/seed-r2-demo-files-usage.md`
- `scripts/README.md`

## 판단

`seed-r2-demo-files.mjs`는 개발 DB seed와 R2 더미 파일을 맞추기 위한 보조 스크립트다. 운영 앱 런타임 화면 코드가 아니며, 사용자 테스트가 불가능한 현재 상태에서는 로직 변경 대상이 아니다.

## 이번 변경

- `scripts/README.md`를 추가해 폴더 용도와 실행 제한을 문서화했다.
- `seed-r2-demo-files-usage.md`의 기준 버전을 최신화했다.
- 운영 DB/R2에서 실행하지 말아야 한다는 경고를 보강했다.
- 실제 운영 첨부 경로 정책과 개발 fixture 경로 정책이 다를 수 있음을 명시했다.

## 보류

다음 항목은 테스트 가능 상태 전까지 보류한다.

- R2 더미 파일 생성 스크립트의 storage key 정책 변경
- DB seed 구조와 스크립트 쿼리 동시 변경
- Worker 업로드/검증 요청 형식 변경
- 실제 R2 업로드 동작 검증

## 영향 범위

- UI 변경 없음
- DB schema 변경 없음
- API 변경 없음
- R2 Worker 변경 없음
- 권한/작업지시서 상태/첨부/메모/휴지통/purge 흐름 변경 없음
