# WAFL / PeaceByPiece 문서 목록

- 기준 앱 버전: `0.20.02`
- 0.19.94.10: 문서 정리 종료 기준을 확정하고 자동테스트 복귀 기준을 문서화했다.
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
- [company-files-db-api-0.19.95.md](company-files-db-api-0.19.95.md)
- [company-files-ui-0.19.96.md](company-files-ui-0.19.96.md)
- [company-files-r2-upload-0.19.97.md](company-files-r2-upload-0.19.97.md)
- [company-file-review-design-0.19.98.md](company-file-review-design-0.19.98.md)
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
- [policy-reagreement-blocking-design-0.20.00.md](policy-reagreement-blocking-design-0.20.00.md)
- [policy-reagreement-db-api-0.20.01.md](policy-reagreement-db-api-0.20.01.md)
- [policy-reagreement-ui-0.20.02.md](policy-reagreement-ui-0.20.02.md)

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

현재 v8 기준으로 사용자가 테스트 가능 상태를 명시했으므로 이후 기능 작업은 자동테스트 복귀를 전제로 진행한다. 기능 코드, DB/API, R2, 권한, 정책 차단, 요금제/저장소 제한처럼 영향 범위가 있는 작업은 패치 적용 후 최소 다음 자동테스트를 우선 확인한다.

- DB/API 변경 포함: `npm run test:smoke:db-api`
- 화면/라우팅/권한 변경 포함: `npm run test:e2e`
- 릴리스 후보 또는 큰 기능 묶음: `npm run build` + `npm run test:smoke:db-api` + `npm run test:e2e`

ChatGPT/container에서는 `npm run build`를 실행하지 않고, 사용자가 로컬에서 확인한다. Playwright 산출물인 `playwright-report/`, `test-results/`는 생성 산출물로 보고 필요 시 삭제 가능하지만, 기능 소스 폴더 삭제는 금지한다.

## 6. 0.19.94.9 점검 결과

- docs 루트 잔여 md 파일: 44개
- 보관 이동 후 직접 링크가 깨질 수 있는 과거 0.18~0.19 초반 문서 목록은 `docs/README.md`의 직접 링크에서 제거했다.
- 과거 문서는 `docs/보관문서/` 하위 분류를 통해 접근한다.
- 기능 코드, DB schema, API route, R2 업로드 흐름은 변경하지 않았다.

상세 문서: [docs 루트 잔여 문서 점검 0.19.94.9](docs-root-residual-audit-0.19.94.9.md)


## 7. 0.19.94.10 문서 정리 마무리 판단

- docs 루트 잔여 문서 44개는 최근 운영·정책·DB/API smoke·Playwright·회사 파일 업로드 관련 활성 문서로 유지한다.
- `docs/보관문서/README.md`를 추가해 보관 문서 접근 기준을 명시한다.
- `docs/현재기준/README.md`를 추가해 기능 작업 전 확인해야 할 현재 기준 문서 묶음을 명시한다.
- 문서 정리 1차는 종료하고, 다음 버전부터는 `0.19.95` 고객사 회사 파일 DB/API 1차로 기능 작업에 복귀한다.
- 기능 작업 복귀 후 테스트는 자동테스트 중심으로 진행한다.

상세 문서: [문서 정리 마무리 및 자동테스트 복귀 기준 0.19.94.10](docs-cleanup-completion-0.19.94.10.md)
- [시스템관리자 회사 파일 검토 UI/API 1차](./company-file-review-ui-api-0.19.99.md)


## 8. 0.20.00 정책 강제 재동의/차단 UX 설계

중요 정책 변경 시 사용자에게 재동의를 요구하고, 미동의 상태에서는 업무 화면 진입을 제한하는 UX 기준을 문서화했다.

- 재동의 대상: `policy_versions.requires_reagreement = true`인 활성 필수 정책
- 차단 대상: 고객사 관리자와 일반 멤버의 업무 화면
- 예외 허용: 정책 열람, 재동의 제출, 로그아웃, 고객지원 안내
- 시스템관리자 운영 화면은 별도 정책으로 분리 검토
- 실제 DB/API/라우팅 차단 구현은 `0.20.01` 이후 단계에서 진행한다.

상세 문서: [정책 강제 재동의/차단 UX 설계 0.20.00](policy-reagreement-blocking-design-0.20.00.md)

## 9. 0.20.01 정책 재동의 필요 상태 DB/API 1차

중요 정책 변경 시 현재 사용자에게 재동의가 필요한 정책 목록을 조회하고, 재동의 완료 기록을 저장하는 DB/API 계약을 추가했다.

- 조회 API: `GET /api/policies/reagreement`
- 저장 API: `POST /api/policies/reagreement`
- 기준 필드: `policy_versions.requires_reagreement`
- 저장 테이블: 기존 `policy_agreements` 사용
- 신규 DB schema 없음
- DB/API smoke test에 재동의 pending/저장 후 해소 계약 추가

상세 문서: [정책 재동의 필요 상태 DB/API 1차 0.20.01](policy-reagreement-db-api-0.20.01.md)


## 10. 0.20.02 정책 재동의 안내 UI 1차

`0.20.01`의 재동의 필요 상태 DB/API를 `/workspace/legal` 화면에 연결했다.

- 재동의 필요 상태 패널 추가
- 재동의 대상/완료/남은 건수 표시
- 재동의 필요 문서 목록 표시
- `필수 정책 전체 재동의` 버튼 추가
- `GET /api/policies/reagreement`, `POST /api/policies/reagreement` 연결
- Playwright E2E에 재동의 안내/저장 mock 테스트 추가
- 업무 접근 차단은 아직 연결하지 않음

상세 문서: [정책 재동의 안내 UI 1차 0.20.02](policy-reagreement-ui-0.20.02.md)
