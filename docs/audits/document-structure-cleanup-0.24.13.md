# Document Structure Cleanup Audit — 0.24.13

## 목적

0.24.13은 PDF/R2/Functions 같은 기능 개발을 바로 진행하기 전에 문서 진입점과 폴더 역할을 정리하는 버전이다. 목표는 Codex가 매번 repository 전체와 보관 문서를 다시 읽지 않도록 현재 기준 문서와 보관 문서의 경계를 명확히 하는 것이다.

## 적용 판단

이번 패치는 대량 문서 이동을 하지 않는다. 0.24.11에서 이미 대규모 cleanup이 수행되었고, 현재 남은 `docs root` 문서들은 기능·정책·과거 회귀 근거가 섞여 있어 자동 대량 이동보다 기준 문서 보강이 안전하다.

대신 다음 기준을 추가한다.

- `docs/현재기준/document-management.md`: 문서 계층, 검색 제외, Vercel QA 흐름
- `docs/README.md`: 현재 기준/보관/감사/정책 문서 역할 재정리
- `docs/codex-current-state.md`: 0.24.13 작업 시작 매니페스트와 다음 버전 라우팅
- `docs/productization-roadmap.md`: 0.24.13 결과와 다음 0.24.14 경계
- `pending-tests.md`: 0.24.13 문서 구조 수동 확인 항목

## 대량 이동 보류 이유

- 정책/DB/권한/PDF/R2 관련 과거 문서는 출시 전 회귀 원인 확인에 필요할 수 있다.
- Codex 사용량이 제한된 상태에서 대량 참조 검증은 위험하다.
- 현재 목표는 삭제가 아니라 다음 기능 개발 전에 읽기 경로를 줄이는 것이다.

## 0.24.13 완료 기준

- APP_VERSION이 0.24.13으로 갱신된다.
- 현재 문서 진입점이 `docs/codex-current-state.md`와 `docs/현재기준/document-management.md`로 명확해진다.
- Roadmap의 현재 작업이 0.24.13, 다음 작업이 0.24.14로 표시된다.
- 보관 문서 기본 제외와 root 문서 최소화 원칙이 문서화된다.
- DB/R2/Seed/Reset/Cleanup/Migration은 실행하지 않는다.

## 후속 작업

0.24.14에서는 Functions 90% 구현/검증 정리를 진행한다. 이때 Codex는 보관 문서를 기본 검색하지 말고 `docs/codex-current-state.md`, `lib/internal/roadmap/roadmap-0.24.14.ts`, `lib/functions/catalog.ts`, `tools/pipeline/README.md`를 우선 읽는다.
