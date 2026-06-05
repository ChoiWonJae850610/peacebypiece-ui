# WAFL / PeaceByPiece UI

- 기준 앱 버전: `0.19.94.8`
- 0.19.36: WAFL 공통 폭/회전 기준 보정 — 멤버관리도 Page Hero/Section/DataTable 공통 폭 규칙을 직접 타도록 정리하고 태블릿 회전 재측정을 강화
- 프로젝트 성격: 의류 생산·작업지시서·원단/부자재 발주·고객사 운영을 관리하는 WAFL 웹 UI
- 현재 작업 상태: 0.19.94.8 기준으로 docs 루트 보관 후보를 실제 `docs/보관문서/` 하위로 이동하여 루트 문서 밀도를 낮추고, 기능 코드/DB/API/R2 흐름은 변경하지 않는다.
- 리팩토링 작업 원칙: 저위험 공통 formatter/helper부터 실제 코드에 점진 적용하고, DB/API/R2/권한/상태 흐름은 직접 목표가 아니면 변경하지 않는다.

## 개발 실행

```bash
npm run dev
```

로컬 실행 후 브라우저에서 `http://localhost:3000`을 연다.

## 빌드 확인

```bash
npm run build
```

ChatGPT/container에서는 `npm run build`를 실행하지 않는다. 빌드 확인은 사용자가 로컬에서 수행하고, 실패 로그가 있으면 다음 패치에서 원인을 먼저 반영한다.

## 주요 문서

- 문서 인덱스: `docs/README.md`
- 현재 기준 문서: `docs/현재기준/`
- 정책 문서: `docs/정책문서/`
- 보관 문서: `docs/보관문서/`
- 누적 테스트 항목: `pending-tests.md`

## 작업 규칙 요약

- `APP_VERSION`, `commit-meta.md Version`, 패치 zip 파일명 버전은 일치해야 한다.
- 패치 zip은 flat 구조로 제공한다.
- `.env.local`, 실제 DB/R2 URL, 토큰, secret key는 포함하지 않는다.
- DB/API/R2/첨부/메모/휴지통/purge/권한/작업지시서 상태 흐름은 직접 목표가 아니면 변경하지 않는다.
- 공통 컴포넌트와 공통 유틸을 우선 사용하고, 화면 TSX에 도메인 로직을 과도하게 넣지 않는다.
- 고객 공개 문서와 UI에서는 서비스명을 WAFL 기준으로 유지한다.

## 현재 저위험 정리 흐름

최근 정리 흐름은 통계정보 소스 분리 이후 테스트 불가 상태에 맞춰 문서와 프로젝트 루트 정리를 우선한다.

- `docs/project-source-cleanup-audit-0.18.87.md`
- `docs/dev-test-route-audit-0.18.88.md`
- `docs/project-readme-refresh-0.18.89.md`
- `docs/current-baseline-doc-audit-0.18.90.md`
- `docs/source-artifact-ignore-audit-0.18.91.md`
- `docs/scripts-folder-audit-0.18.92.md`



## 0.19.94.4 패치 자동화 삭제 안전장치

- 패치 자동화 스크립트는 현재 프로젝트 zip 안에서 관리되지 않는 외부 도구로 확인되었다.
- 따라서 이번 버전은 스크립트 직접 수정이 아니라 삭제 목록 처리 원칙을 문서화한다.
- 패치 `삭제 파일 목록`에는 원칙적으로 파일만 넣고, 폴더 삭제는 생성 산출물 allowlist에서만 별도 clean 단계로 처리한다.
- `app/`, `components/`, `lib/`, `db/`, `scripts/`, `features/` 하위 폴더 단위 삭제는 기본 차단 대상으로 본다.

관련 문서: `docs/patch-automation-delete-safety-0.19.94.4.md`


## 0.19.94.5 docs archive 이동 계획

- 테스트 불가 기간에는 기능 코드 변경보다 문서 구조 정리를 우선한다.
- `docs/` 문서는 즉시 삭제하지 않고 현행/보관/삭제금지/후보 기준으로 먼저 분류한다.
- 버전별 패치 기록성 문서는 기본적으로 보관 후보로 보되, 최근 작업 기준 문서와 정책/DB/테스트 문서는 삭제하지 않는다.
- 실제 이동/삭제는 테스트 가능 상태 또는 명확한 보관 기준 확정 후 별도 패치에서 처리한다.

관련 문서: `docs/docs-archive-plan-0.19.94.5.md`


## 0.19.94.7 docs 수동 검토 후보 상세 분류

- 0.19.94.6에서 수동 검토로 남긴 UI 기반 문서 9개를 내용 기준으로 다시 분류했다.
- 9개 모두 현재 기능 기준 문서라기보다 0.17대 UI 도입·전환 기록이므로 보관 후보로 본다.
- 실제 이동/삭제는 하지 않고, 다음 보관 이동 패치에서 `docs/보관문서/설계초안/` 또는 `docs/보관문서/wafl-a-type/`으로 나누는 기준만 정리한다.

관련 문서: `docs/docs-manual-review-classification-0.19.94.7.md`

## 개발/시드 스크립트 안내

- `scripts/` 폴더는 운영 앱 런타임에 직접 포함되는 화면 코드가 아니라 개발·시드·검증 보조 스크립트 영역이다.
- R2 더미 파일 스크립트는 개발 DB와 초기화 가능한 테스트 R2에서만 실행한다.
- 실제 DB/R2 URL, Worker URL, secret 값은 문서와 Git에 기록하지 않는다.
- 테스트 불가 기간에는 스크립트 동작 변경보다 사용 범위 문서화와 실행 조건 정리를 우선한다.

## Cloudflare Worker 보관 기준

- `cloudflare/r2-upload-worker.js`는 R2 업로드·다운로드·삭제 요청을 중계하는 Worker 기준 파일이다.
- `cloudflare/pdf-generator-worker/`는 PDF 생성 Worker의 Wrangler 배포 기준 폴더다.
- `cloudflare/pdf-generator-worker.js`와 `cloudflare/pdf-generator-worker.wrangler.example.toml`은 과거/예시 진입점이므로 신규 배포 기준으로 사용하지 않는다.
- 테스트 불가 기간에는 Worker 코드 동작 변경보다 배포 기준과 보관 기준 문서화를 우선한다.

## DB 보조 파일 보관 기준

- `db/schema/`는 full reset 기준 schema와 smoke test를 둔다. 운영 DB에서 직접 실행하지 않는다.
- `db/migrations/`는 기존 개발 DB를 full reset 없이 보정할 때 참고하는 패치 SQL이다.
- `db/seed/`는 시스템 관리자·시스템 기준정보 같은 baseline 보조 seed를 둔다.
- `db/test/`는 개발 DB 검증과 수동 테스트 fixture 전용 SQL/문서를 둔다.
- 테스트 불가 기간에는 DB SQL 내용을 변경하지 않고 역할 분류와 실행 조건 문서화를 우선한다.
- `docs/doc-archive-policy-audit-0.18.95.md`
- `docs/toast-feedback-audit-0.19.08.md`
- `docs/wafl-floating-toast-refactor-0.19.09.md`
- `docs/wafl-toast-single-standard-0.19.10.md`
- `docs/wafl-member-management-unified-screen-0.19.20.md`
- `docs/wafl-member-invitation-compact-bottom-0.19.21.md`
- `docs/wafl-member-invitation-responsive-share-0.19.22.md`

## 보관문서 / WAFL A-Type 기준

- `docs/보관문서/wafl-a-type/`는 과거 A-Type 문서 묶음으로 유지한다.
- 현재 개발 기준과 충돌할 경우 `docs/현재기준/` 문서를 우선한다.
- 테스트 불가 기간에는 해당 문서 묶음을 삭제·이동하지 않고 수량, 역할, 충돌 가능성만 문서화한다.
- 관련 점검 문서: `docs/wafl-a-type-archive-audit-0.18.96.md`


## 공통 UI 규칙 기준

0.18.98부터 전체 화면 리팩토링 전에 공통 UI 규칙을 먼저 고정한다. 실제 화면 변경은 테스트 가능 범위와 회귀 위험을 확인한 뒤 단계적으로 적용한다.

- 관련 기준 문서: `docs/ui-common-rules-0.18.98.md`
- 우선 기준: Page Header/Action Bar, Table/List/Card, Modal, Button/Action, Badge/Status, Empty/Loading/Error, Scroll/Container width
- 신규 화면은 기존 화면별 임의 class 조합보다 공통 컴포넌트와 공통 variant를 우선 사용한다.
- 작업지시서/원단부자재/PDF/첨부/메모처럼 흐름이 복잡한 화면은 공통 규칙을 참고하되 동작 변경 없이 좁게 적용한다.

## 전체 소스 리팩토링 감사 기준

0.18.97부터 테스트 불가/부분 가능 전환 구간에 맞춰 전체 소스 공통화 감사를 시작한다. 첫 단계는 코드 변경보다 후보 분류를 우선한다.

- 관련 점검 문서: `docs/source-refactor-audit-0.18.97.md`
- 우선 점검 범위: `app/`, `components/`, `lib/`의 화면 조립, 공통 컴포넌트, formatter, 상태/권한 literal 비교, table/modal/card 규칙
- 테스트 가능 여부가 명확해지기 전까지 DB/API/R2/권한/상태 흐름을 바꾸는 리팩토링은 보류한다.

- 0.18.99: formatter/label helper 중복 후보 점검 및 정리 기준 문서화

## 0.19 리팩토링 진행

- `docs/storage-formatter-refactor-0.19.00.md`
- `docs/admin-table-grid-style-fix-0.19.02.md`
- `docs/workspace-page-shell-refactor-0.19.03.md`
- `docs/customer-admin-table-state-refactor-0.19.05.md`
- `docs/member-directory-scroll-regression-fix-0.19.06.md`
- `docs/member-table-common-refactor-0.19.07.md`
- `docs/toast-feedback-audit-0.19.08.md`
- `docs/wafl-floating-toast-refactor-0.19.09.md`
- `docs/wafl-toast-single-standard-0.19.10.md`
- `docs/wafl-member-management-unified-screen-0.19.20.md`
- `docs/wafl-member-invitation-compact-bottom-0.19.21.md`
- `docs/wafl-member-invitation-responsive-share-0.19.22.md`
- `docs/version-constant-split-0.19.11.md`
- `docs/wafl-toast-loading-policy-0.19.12.md`
- `docs/wafl-toast-followup-ui-fix-0.19.13.md`
- `docs/wafl-toast-icon-member-invite-fix-0.19.14.md`
- `docs/wafl-toast-lucide-member-action-fix-0.19.15.md`
- `docs/wafl-member-invite-table-actions-0.19.16.md`
- `docs/wafl-member-invite-icon-layout-fix-0.19.17.md`

## 0.19.23 변경 요약

- 멤버 초대 링크 목록은 모바일 세로 화면에서만 카드형으로 표시하고, 모바일 가로/태블릿/PC에서는 테이블형을 유지한다.
- 태블릿에서 PC용 복사 버튼과 공유 가능 버튼이 중복 노출되지 않도록 action 표시 조건을 분리했다.
- PC에서는 복사 disabled + 취소 조건부 활성, 공유 가능 화면에서는 공유/복사/취소 1세트만 표시한다.
- 0.19.30: WAFL 본문 섹션 카드 공통화 1차 — WaflSectionPanel 추가 및 통계/멤버/협력업체/저장소 본문 섹션 구조 정렬

## 0.19.33

- WAFL section description action slot alignment refined.
- Storage trash actions stay on the description line but align to the section right edge.
- Statistics analysis tabs return to the description-line action position above the divider.

## 0.19.94 파일 구조 정리 기준

- 0.19.94.1: 프로젝트 파일 구조 감사와 Playwright 산출물 제외 규칙을 추가했다.
- 0.19.94.2: Playwright 생성 산출물과 미사용 public 기본 SVG 정리를 반영했다.
- 0.19.94.3: 남은 문서/SQL/스크립트 정리 후보를 재분류하고, 테스트 불가 기간에는 삭제보다 현행/보관/보류 분류를 우선하기로 했다.
- 폴더 단위 삭제는 패치 스크립트에서 위험할 수 있으므로 commit-meta 삭제 목록에는 원칙적으로 실제 파일만 넣는다.
- `playwright-report/`, `test-results/`, `.next/`, `.tmp/` 같은 생성 산출물은 `.gitignore`와 별도 clean 단계로 관리한다.

## 0.19.94.6 docs 루트 보관 후보 목록

- `docs/*.md` 루트 문서를 현행 유지/보관 후보/수동 검토로 분류했다.
- 이번 버전에서는 실제 이동이나 삭제를 하지 않고, 다음 정리 패치의 기준 문서만 추가한다.
- 테스트 불가 기간에는 문서 이동도 기능 코드 변경과 섞지 않는다.

관련 문서: `docs/docs-root-archive-candidates-0.19.94.6.md`


## 0.19.94.8 docs 보관 이동 1차

- `docs/` 루트의 과거 작업 기록성 문서 185개를 `docs/보관문서/` 하위로 이동한다.
- 삭제가 아니라 보관 이동이며, 문서 내용은 유지한다.
- 이동 대상은 0.19.94.6/0.19.94.7에서 보관 후보로 확정된 문서만 포함한다.
- 기능 코드, DB schema, API route, R2 업로드 흐름은 변경하지 않는다.

관련 문서: `docs/docs-archive-move-0.19.94.8.md`
