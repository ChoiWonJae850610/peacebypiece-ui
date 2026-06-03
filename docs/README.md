# WAFL / PeaceByPiece 문서 목록

- 0.19.30: WAFL Page Hero / Summary Card 공통화 2차 — 협력업체관리·저장소관리·환경설정 상단 구조와 설정 카드 계열을 theme token 기반 공통 UI로 정리.
- 0.19.32: WAFL FilterBar 세부 보정 — 멤버/협력업체 필터 깊이 통일, 섹션 count 제거, 요약 단위 표시, 저장소 휴지통 action 정렬, 협력업체 스크롤 재보정
- 기준 앱 버전: `0.19.32`
- 문서 정리 기준: 현재 개발 기준 문서와 보관 문서를 분리하고, 테스트 불가 기간에는 DB/API/R2/권한/상태 흐름을 건드리지 않는 저위험 정리 작업을 우선한다.

## 1. 현재 기준 문서

- [WAFL Page Hero / Summary Card 공통화 2차 0.19.30](wafl-page-hero-summary-theme-2-0.19.30.md)
- [WAFL 멤버관리 responsive/접기 보정 0.19.24](wafl-member-responsive-collapse-0.19.24.md)

현재 개발·테스트·리팩토링에서 우선 확인해야 하는 문서는 `docs/현재기준/`에 둔다.

- [리팩토링 규칙](현재기준/리팩토링-규칙.md)
- [소스 구조](현재기준/소스-구조.md)
- [라우팅 구조](현재기준/라우팅-구조.md)
- [데이터베이스 구조](현재기준/데이터베이스-구조.md)
- [데이터베이스 쿼리·인덱스 정책](현재기준/데이터베이스-쿼리-인덱스-정책.md)
- [작업지시서 상태 구조](현재기준/작업지시서-상태-구조.md)
- [워크스페이스 경계](현재기준/워크스페이스-경계.md)
- [고객사 통계 지표](현재기준/고객사-통계-지표.md)
- [시스템 통계 지표](현재기준/시스템-통계-지표.md)
- [통계 저장소 구조](현재기준/통계-저장소-구조.md)
- [초대 정책 설계](현재기준/초대-정책-설계.md)
- [요금·저장소 정책 설계](현재기준/요금-저장소-정책-설계.md)
- [원단·부자재 데이터베이스 설계](현재기준/원단-부자재-데이터베이스-설계.md)
- [원단·부자재 발주 설계](현재기준/원단-부자재-발주-설계.md)
- [full-reset 검증](현재기준/full-reset-검증.md)

## 2. 정책 문서

서비스 약관, 개인정보처리방침, 요금·환불·저장소·데이터 보관 정책은 `docs/정책문서/`에 둔다.

- [정책 문서 README](정책문서/README.md)
- [정책 문서 구성](정책문서/00-정책-문서-구성.md)
- [정책 결정사항](정책문서/91-정책-결정사항.md)
- [정책 기반 개발 우선순위](정책문서/정책기반-개발우선순위.md)
- 고객 공개용 초안: `docs/정책문서/고객공개/`

## 3. 보관 문서

과거 설계 기록, 점검 기록, WAFL A-Type 누적 문서는 `docs/보관문서/`에 둔다.

- `docs/보관문서/wafl-a-type/`
- `docs/보관문서/점검기록/`
- `docs/보관문서/테스트기록/`
- `docs/보관문서/설계초안/`
- `docs/보관문서/DB기록/`

보관 문서는 삭제 대상이 아니라 과거 판단 근거로 유지한다. 현재 개발 기준으로 사용할 때는 먼저 `docs/현재기준/` 문서와 충돌 여부를 확인한다.

## 4. 문서 파일명 규칙

- 신규 문서는 한글 파일명을 기본으로 한다.
- 파일명은 길이를 과도하게 늘리지 않는다.
- 공백 대신 하이픈(`-`)을 사용한다.
- 버전 기록이 필요한 경우 파일명 끝에 `0.16.49`처럼 붙인다.
- Git 관례상 최상위 인덱스 파일은 `README.md`를 유지한다.
## 5. 테스트 불가 기간 정리 원칙

사용자가 테스트 가능하다고 명시하기 전까지는 테스트 불가 상태로 본다. 이 기간에는 문서 최신화, 소스 점검, 로컬 생성물 제거, 명백한 타입 오류 수정처럼 영향 범위가 좁은 작업을 우선한다. 권한, DB schema, R2, 첨부/메모, 작업지시서 상태 전환, 삭제/복원/purge 흐름은 직접 필요한 경우가 아니면 수정하지 않는다.

- [0.18.87 프로젝트 소스 정리 점검](project-source-cleanup-audit-0.18.87.md)

- [0.18.88 개발/테스트 라우트 점검](dev-test-route-audit-0.18.88.md)


- [0.18.89 프로젝트 루트 README 최신화](project-readme-refresh-0.18.89.md)
- [0.18.90 현재 기준 문서 점검](current-baseline-doc-audit-0.18.90.md)
- [0.18.91 로컬 산출물 ignore 기준 점검](source-artifact-ignore-audit-0.18.91.md)
- [0.18.92 scripts 폴더 사용 범위 점검](scripts-folder-audit-0.18.92.md)
- [0.18.93 Cloudflare Worker 보관 기준 점검](cloudflare-worker-audit-0.18.93.md)
- [0.18.94 DB 보조 SQL 보관 기준 점검](db-folder-audit-0.18.94.md)
- [0.18.95 문서 분류 기준 점검](doc-archive-policy-audit-0.18.95.md)
- [0.18.96 WAFL A-Type 보관문서 점검](wafl-a-type-archive-audit-0.18.96.md)

- [0.18.97 전체 소스 리팩토링 감사 1차](source-refactor-audit-0.18.97.md)
- [0.18.98 공통 UI 규칙 기준](ui-common-rules-0.18.98.md)
- [0.18.99 formatter/label helper 점검](formatter-label-helper-audit-0.18.99.md)
- [0.19.00 저장소/용량 formatter 공통화 1차](storage-formatter-refactor-0.19.00.md)
- [0.19.01 시스템 저장소 삭제 후보 row/table 구조 보정](system-storage-table-row-refactor-0.19.01.md)
- [0.19.02 AdminTable grid style 상속 보정](admin-table-grid-style-fix-0.19.02.md)
- [0.19.03 고객사 관리자 WorkspacePageShell 공통화 1차](workspace-page-shell-refactor-0.19.03.md)
- [0.19.04 고객사 관리자 Empty/Loading 상태 공통화 1차](customer-admin-table-state-refactor-0.19.04.md)

- [0.19.06 멤버관리 row/scroll 회귀 보정](member-directory-scroll-regression-fix-0.19.06.md)

- [0.19.07 멤버관리 테이블 공통화 2차](member-table-common-refactor-0.19.07.md)
- [0.19.08 토스트/피드백 전체 소스 전수 감사](toast-feedback-audit-0.19.08.md)
- [0.19.09 WAFL floating toast 공통화 1차](wafl-floating-toast-refactor-0.19.09.md)
- [0.19.10 WAFL Toast 단일 규격 확정](wafl-toast-single-standard-0.19.10.md)
- [0.19.11 APP_VERSION 분리 및 app.ts 상수 복구](version-constant-split-0.19.11.md)
- [0.19.12 WAFL Toast loading 정책 보정](wafl-toast-loading-policy-0.19.12.md)
- [0.19.13 WAFL Toast 실제 검수 보정 및 주변 UI 회귀 보정](wafl-toast-followup-ui-fix-0.19.13.md)
- [0.19.14 Toast icon-first 규격과 멤버 초대 목록 보정](wafl-toast-icon-member-invite-fix-0.19.14.md)
- [0.19.15 Toast lucide icon 보정과 멤버 초대 action button 재정리](wafl-toast-lucide-member-action-fix-0.19.15.md)
- [0.19.16 멤버 초대 목록 컬럼과 disabled icon action 보정](wafl-member-invite-table-actions-0.19.16.md)
- [0.19.17 멤버 초대 목록 icon-only action과 카드 비율 보정](wafl-member-invite-icon-layout-fix-0.19.17.md)


- [0.19.18 멤버 초대 아이콘 버튼 표시 및 카드 비율 보정](./wafl-member-invite-icon-visibility-layout-0.19.18.md)
- [0.19.19 멤버 초대 작업 아이콘 정렬과 초대 카드 폭 보정](./wafl-member-invite-action-column-layout-0.19.19.md)


- [0.19.20 멤버관리 단일 화면 구조 정리](wafl-member-management-unified-screen-0.19.20.md)
- [0.19.21 멤버관리 초대 관리 하단 compact 구조 정리](wafl-member-invitation-compact-bottom-0.19.21.md)
- [0.19.22 멤버 초대 관리 PC/모바일 역할 분리](wafl-member-invitation-responsive-share-0.19.22.md)

- [0.19.23 멤버 초대 목록 responsive 기준 보정](wafl-member-invitation-responsive-table-0.19.23.md)
- [0.19.26 WAFL theme 기반 Page Hero/Summary Card 공통화 1차](wafl-page-hero-summary-theme-0.19.26.md)
- 0.19.30: WAFL 본문 섹션 카드 공통화 1차 — WaflSectionPanel 추가 및 통계/멤버/협력업체/저장소 본문 섹션 구조 정렬

## 0.19.33

- WAFL section description action slot alignment refined.
- Storage trash actions stay on the description line but align to the section right edge.
- Statistics analysis tabs return to the description-line action position above the divider.
