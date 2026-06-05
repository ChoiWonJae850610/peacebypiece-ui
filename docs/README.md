# WAFL / PeaceByPiece 문서 목록

- 기준 앱 버전: `0.19.94.9`
- 0.19.94.9: docs 보관 이동 후 루트 잔여 문서와 README 링크 기준을 재점검했다.
- 문서 정리 기준: 현재 개발 기준 문서와 보관 문서를 분리하고, 테스트 불가 기간에는 기능 코드/DB/API/R2 흐름을 변경하지 않는 저위험 정리 작업을 우선한다.

## 1. 현재 기준 문서

현재 개발·테스트·리팩토링에서 우선 확인해야 하는 문서는 `docs/현재기준/`에 둔다.

- 리팩토링 규칙
- 소스 구조
- 라우팅 구조
- 데이터베이스 구조
- 데이터베이스 쿼리·인덱스 정책
- 작업지시서 상태 구조
- 워크스페이스 경계
- 고객사/시스템 통계 지표
- 원단·부자재 데이터베이스/발주 설계
- full-reset 검증

## 2. 정책 문서

서비스 약관, 개인정보처리방침, 요금·환불·저장소·데이터 보관 정책은 `docs/정책문서/`에 둔다.

- 정책 문서 README
- 정책 문서 구성
- 정책 결정사항
- 정책 기반 개발 우선순위
- 고객 공개용 초안: `docs/정책문서/고객공개/`

## 3. 보관 문서

과거 설계 기록, 점검 기록, WAFL A-Type 누적 문서는 `docs/보관문서/`에 둔다.

- `docs/보관문서/wafl-a-type/`
- `docs/보관문서/점검기록/`
- `docs/보관문서/테스트기록/`
- `docs/보관문서/설계초안/`
- `docs/보관문서/DB기록/`

보관 문서는 삭제 대상이 아니라 과거 판단 근거로 유지한다. 현재 개발 기준으로 사용할 때는 먼저 `docs/현재기준/` 문서와 충돌 여부를 확인한다.

## 4. docs 루트 잔여 문서

0.19.94.8 보관 이동 후 docs 루트에는 최근 운영·정책·DB/API smoke·Playwright·회사 파일 업로드 관련 문서만 남기는 방향으로 정리한다.

### 운영/정리 기준

- [docs-archive-move-0.19.94.8.md](docs-archive-move-0.19.94.8.md)
- [docs-archive-plan-0.19.94.5.md](docs-archive-plan-0.19.94.5.md)
- [docs-manual-review-classification-0.19.94.7.md](docs-manual-review-classification-0.19.94.7.md)
- [docs-root-archive-candidates-0.19.94.6.md](docs-root-archive-candidates-0.19.94.6.md)
- [patch-automation-delete-safety-0.19.94.4.md](patch-automation-delete-safety-0.19.94.4.md)
- [project-doc-sql-script-cleanup-audit-0.19.94.3.md](project-doc-sql-script-cleanup-audit-0.19.94.3.md)
- [project-file-structure-audit-0.19.94.1.md](project-file-structure-audit-0.19.94.1.md)
- [project-file-structure-cleanup-0.19.94.2.md](project-file-structure-cleanup-0.19.94.2.md)

### 회사/멤버/협력업체

- [company-account-request-approval-application-0.19.78.md](company-account-request-approval-application-0.19.78.md)
- [company-account-request-system-reviewer-0.19.77.md](company-account-request-system-reviewer-0.19.77.md)
- [company-approval-required-policy-agreement-0.19.84.md](company-approval-required-policy-agreement-0.19.84.md)
- [company-file-upload-design-0.19.94.md](company-file-upload-design-0.19.94.md)
- [customer-settings-feature-design-0.19.72.md](customer-settings-feature-design-0.19.72.md)
- [customer-settings-request-history-0.19.73.md](customer-settings-request-history-0.19.73.md)
- [member-directory-quick-status-actions-0.19.71.md](member-directory-quick-status-actions-0.19.71.md)
- [member-directory-responsive-list-0.18.54.md](member-directory-responsive-list-0.18.54.md)
- [member-directory-scroll-regression-fix-0.19.06.md](member-directory-scroll-regression-fix-0.19.06.md)
- [member-lifecycle-db-api-0.19.67.md](member-lifecycle-db-api-0.19.67.md)
- [member-lifecycle-design-0.19.66.md](member-lifecycle-design-0.19.66.md)
- [member-lifecycle-ui-0.19.69.md](member-lifecycle-ui-0.19.69.md)
- [member-policy-access-entry-0.19.81.md](member-policy-access-entry-0.19.81.md)
- [member-self-withdrawal-ui-0.19.70.md](member-self-withdrawal-ui-0.19.70.md)
- [partner-phone-duplicate-contract-0.19.93.1.md](partner-phone-duplicate-contract-0.19.93.1.md)
- [system-company-account-request-review-0.19.75.md](system-company-account-request-review-0.19.75.md)
- [system-company-account-request-review-action-0.19.76.md](system-company-account-request-review-action-0.19.76.md)

### 정책/약관

- [policy-agreement-status-ui-0.19.83.md](policy-agreement-status-ui-0.19.83.md)
- [policy-document-management-design-0.19.79.md](policy-document-management-design-0.19.79.md)
- [policy-public-documents-0.19.80.md](policy-public-documents-0.19.80.md)
- [policy-version-agreement-db-api-0.19.82.md](policy-version-agreement-db-api-0.19.82.md)

### DB/API smoke

- [db-api-smoke-test-0.19.85.md](db-api-smoke-test-0.19.85.md)
- [db-api-smoke-test-scope-expansion-0.19.88.md](db-api-smoke-test-scope-expansion-0.19.88.md)
- [db-api-smoke-test-scope-expansion-fix-0.19.88.1.md](db-api-smoke-test-scope-expansion-fix-0.19.88.1.md)
- [db-api-smoke-test-sql-fix-0.19.86.md](db-api-smoke-test-sql-fix-0.19.86.md)
- [db-api-smoke-test-success-baseline-0.19.87.md](db-api-smoke-test-success-baseline-0.19.87.md)

### Playwright/E2E

- [navigation-feedback-logout-confirm-0.19.92.md](navigation-feedback-logout-confirm-0.19.92.md)
- [personal-language-switcher-development-only-0.19.93.md](personal-language-switcher-development-only-0.19.93.md)
- [playwright-cookie-and-create-workorder-enter-fix-0.19.92.1.md](playwright-cookie-and-create-workorder-enter-fix-0.19.92.1.md)
- [playwright-e2e-test-plan-0.19.89.md](playwright-e2e-test-plan-0.19.89.md)
- [playwright-environment-fix-0.19.90.1.md](playwright-environment-fix-0.19.90.1.md)
- [playwright-environment-setup-0.19.90.md](playwright-environment-setup-0.19.90.md)
- [playwright-policy-settings-e2e-0.19.91.md](playwright-policy-settings-e2e-0.19.91.md)
- [playwright-workspace-selector-stabilization-0.19.92.2.md](playwright-workspace-selector-stabilization-0.19.92.2.md)
- [playwright-workspace-smoke-softening-0.19.92.3.md](playwright-workspace-smoke-softening-0.19.92.3.md)


## 5. 테스트 불가 기간 정리 원칙

사용자가 테스트 가능하다고 명시하기 전까지는 테스트 불가 상태로 본다. 이 기간에는 문서 최신화, 소스 점검, 로컬 생성물 제거, 명백한 타입 오류 수정처럼 영향 범위가 좁은 작업을 우선한다. 권한, DB schema, R2, 첨부/메모, 작업지시서 상태 전환, 삭제/복원/purge 흐름은 직접 필요한 경우가 아니면 수정하지 않는다.

## 6. 0.19.94.9 점검 결과

- docs 루트 잔여 md 파일: 44개
- 보관 이동 후 직접 링크가 깨질 수 있는 과거 0.18~0.19 초반 문서 목록은 `docs/README.md`의 직접 링크에서 제거했다.
- 과거 문서는 `docs/보관문서/` 하위 분류를 통해 접근한다.
- 기능 코드, DB schema, API route, R2 업로드 흐름은 변경하지 않았다.

상세 문서: [docs 루트 잔여 문서 점검 0.19.94.9](docs-root-residual-audit-0.19.94.9.md)
