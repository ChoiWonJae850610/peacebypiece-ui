# PeaceByPiece / WAFL 문서 인덱스

이 폴더는 프로젝트 운영 기준 문서를 보관한다.

## 현재 기준 문서

- `wafl-a-type/00_wafl-a-type-doc-index.md` — WAFL A-TYPE 문서 세트 인덱스
- `wafl-a-type/01_wafl-a-type-source-audit.md` — 소스 분석 요약
- `wafl-a-type/02_wafl-a-type-design-tokens.md` — 디자인 토큰
- `wafl-a-type/03_wafl-a-type-component-spec.md` — 공통 컴포넌트
- `wafl-a-type/04_wafl-a-type-device-layout-rules.md` — 기기별 화면 규칙
- `wafl-a-type/05_wafl-a-type-page-templates.md` — 화면 템플릿
- `wafl-a-type/06_wafl-a-type-state-empty-error-rules.md` — 상태/빈 상태/에러
- `wafl-a-type/07_wafl-a-type-form-validation-rules.md` — 폼/검증/제출
- `wafl-a-type/08_wafl-a-type-modal-drawer-sheet-rules.md` — 모달/드로어/시트
- `wafl-a-type/09_wafl-a-type-permission-ui-rules.md` — 권한별 UI 노출
- `wafl-a-type/10_wafl-a-type-i18n-copy-rules.md` — i18n/copy
- `wafl-a-type/11_wafl-a-type-implementation-architecture.md` — 구현 아키텍처
- `wafl-a-type/12_wafl-a-type-refactor-roadmap.md` — 전환 로드맵
- `wafl-a-type/13_wafl-a-type-qa-checklist.md` — QA 체크리스트
- `wafl-a-type/14_wafl-a-type-share-pwa-app-strategy.md` — 공유/PWA/앱 전략
- `wafl-a-type/15_wafl-a-type-data-permission-policy.md` — 데이터/권한/API guard 정책
- `wafl-a-type/16_wafl-a-type-db-schema-policy.md` — DB schema/reset/seed 정책
- `wafl-a-type/17_wafl-a-type-r2-file-policy.md` — R2/파일 정책
- `wafl-a-type/18_wafl-a-type-auth-session-policy.md` — 인증/세션/역할 판정 정책
- `wafl-a-type/19_wafl-a-type-release-test-policy.md` — 패치/릴리즈/테스트 정책
- `wafl-a-type/20_wafl-a-type-page-inventory.md` — route별 화면 인벤토리
- `wafl-a-type/21_wafl-a-type-source-refactor-audit.md` — A-TYPE 적용 전 소스 구조 감사 및 리팩토링 방향
- `wafl-a-type/22_wafl-a-type-router-layout-implementation.md` — route group 기반 Router/Layout 구현 기준
- `wafl-a-type/23_wafl-a-type-shell-responsibility.md` — Admin/System/Workspace shell 책임 분리 기준
- `wafl-a-type/24_wafl-a-type-admin-component-variants.md` — Admin 공통 컴포넌트 variant 구현 기준
- `wafl-a-type/25_wafl-a-type-login-invite-error-implementation.md` — Login/Invite/Error A-TYPE 구현 기준
- `wafl-a-type/26_wafl-a-type-customer-admin-home-implementation.md` — 고객사 관리자 홈 A-TYPE 구현 기준
- `wafl-a-type/27_wafl-a-type-customer-admin-management-screens.md` — 고객사 관리자 멤버관리/환경설정 A-TYPE 구현 기준
- `wafl-a-type/28_wafl-a-type-customer-admin-data-screens.md` — 고객사 관리자 저장소/통계/협력업체 A-TYPE 구현 기준
- `wafl-a-type/29_wafl-a-type-system-admin-screens.md` — 시스템관리자 주요 화면 A-TYPE 구현 기준
- `wafl-a-type/30_wafl-a-type-system-admin-extended-screens.md` — 시스템관리자 확장 화면 A-TYPE 구현 기준
- `wafl-a-type/31_wafl-a-type-admin-stats-screen.md` — 고객사 관리자 통계정보 A-TYPE 구현 기준
- `wafl-a-type/32_wafl-a-type-system-standards-detail-screens.md` — 시스템관리자 기준정보 세부 화면 A-TYPE 구현 기준
- `wafl-a-type/33_wafl-a-type-workspace-worker-structure-audit.md` — Workspace/Worker 화면 구조 점검
- `wafl-a-type/34_wafl-a-type-system-admin-remaining-screens.md` — 시스템관리자 잔여 화면 A-TYPE 구현 기준
- `wafl-a-type/35_wafl-a-type-customer-admin-home-visual-pass.md` — 고객사 관리자 홈 visual pass 기준

## 정리 정책

과거 버전별 작업 메모는 현재 제품 기준과 충돌할 수 있으므로 기준 문서로 사용하지 않는다. 0.15.12부터 기준 문서는 `docs/wafl-a-type/` 안의 00~35 문서로 통일한다.

삭제된 과거 문서 목록은 `wafl-a-type/legacy-docs-cleanup-0.14.9.md`에 기록한다.

## 현재 작업 기준

```txt
현재 기준: 0.15.14
PC A-TYPE 전환 우선
tablet/mobile 전용 구현은 0.16.x 이후
DB/API/R2/권한/세션 흐름은 직접 목표가 아니면 변경하지 않는다.
```
