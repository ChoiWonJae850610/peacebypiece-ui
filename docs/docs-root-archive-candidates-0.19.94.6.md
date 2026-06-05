# docs 루트 보관 후보 목록 0.19.94.6

## 목적

테스트가 어려운 기간에 `docs/` 루트 문서를 바로 이동·삭제하지 않고, 먼저 현행 유지/보관 후보/수동 검토로 분류한다. 이번 문서는 실제 파일 이동이나 삭제 없이 다음 정리 패치의 판단 기준만 만든다.

## 분석 기준

- `docs/현재기준/`, `docs/정책문서/`, `docs/보관문서/` 하위 문서는 이번 분류에서 제외한다.
- 이번 문서는 `docs/*.md` 루트 파일만 대상으로 한다.
- 정책, DB smoke, Playwright, 패치 자동화, 회사 파일 업로드, 최근 운영 기능 문서는 현행 유지로 본다.
- 과거 WAFL UI 공통화, responsive, toolbar, source cleanup, audit, QA 성격의 버전별 작업 기록은 보관 후보로 본다.
- 이름만으로 현행성 판단이 어려운 문서는 수동 검토 대상으로 둔다.

## 집계

- docs 루트 md 파일: 226개
- 현행 유지: 41개
- 보관 후보: 176개
- 수동 검토: 9개

## 현행 유지

현재 개발 기준, 테스트 기준, 정책 기준, 최근 운영 기능 기준에 연결된 문서다. 이동하지 않는다.

- `README.md`
- `company-account-request-approval-application-0.19.78.md`
- `company-account-request-system-reviewer-0.19.77.md`
- `company-approval-required-policy-agreement-0.19.84.md`
- `company-file-upload-design-0.19.94.md`
- `customer-settings-feature-design-0.19.72.md`
- `customer-settings-request-history-0.19.73.md`
- `db-api-smoke-test-0.19.85.md`
- `db-api-smoke-test-scope-expansion-0.19.88.md`
- `db-api-smoke-test-scope-expansion-fix-0.19.88.1.md`
- `db-api-smoke-test-sql-fix-0.19.86.md`
- `db-api-smoke-test-success-baseline-0.19.87.md`
- `docs-archive-plan-0.19.94.5.md`
- `member-directory-quick-status-actions-0.19.71.md`
- `member-directory-responsive-list-0.18.54.md`
- `member-directory-scroll-regression-fix-0.19.06.md`
- `member-lifecycle-db-api-0.19.67.md`
- `member-lifecycle-design-0.19.66.md`
- `member-lifecycle-ui-0.19.69.md`
- `member-policy-access-entry-0.19.81.md`
- `member-self-withdrawal-ui-0.19.70.md`
- `navigation-feedback-logout-confirm-0.19.92.md`
- `partner-phone-duplicate-contract-0.19.93.1.md`
- `patch-automation-delete-safety-0.19.94.4.md`
- `personal-language-switcher-development-only-0.19.93.md`
- `playwright-cookie-and-create-workorder-enter-fix-0.19.92.1.md`
- `playwright-e2e-test-plan-0.19.89.md`
- `playwright-environment-fix-0.19.90.1.md`
- `playwright-environment-setup-0.19.90.md`
- `playwright-policy-settings-e2e-0.19.91.md`
- `playwright-workspace-selector-stabilization-0.19.92.2.md`
- `playwright-workspace-smoke-softening-0.19.92.3.md`
- `policy-agreement-status-ui-0.19.83.md`
- `policy-document-management-design-0.19.79.md`
- `policy-public-documents-0.19.80.md`
- `policy-version-agreement-db-api-0.19.82.md`
- `project-doc-sql-script-cleanup-audit-0.19.94.3.md`
- `project-file-structure-audit-0.19.94.1.md`
- `project-file-structure-cleanup-0.19.94.2.md`
- `system-company-account-request-review-0.19.75.md`
- `system-company-account-request-review-action-0.19.76.md`

## 보관 후보

현행 기능의 직접 기준이라기보다 과거 작업 기록, UI 누적 개선 기록, 점검 기록 성격이 강한 문서다. 다음 단계에서 `docs/보관문서/점검기록/`, `docs/보관문서/테스트기록/`, `docs/보관문서/설계초안/`, `docs/보관문서/wafl-a-type/` 중 하나로 이동할 후보로 둔다.

- `admin-responsive-table-shell-0.18.51.md`
- `admin-responsive-table-style-0.18.50.md`
- `admin-responsive-table-typography-0.18.52.md`
- `admin-summary-metric-theme-0.18.56.md`
- `admin-table-grid-style-fix-0.19.02.md`
- `build-and-db-cleanup-0.19.68.md`
- `cloudflare-worker-audit-0.18.93.md`
- `current-baseline-doc-audit-0.18.90.md`
- `customer-admin-feedback-message-refactor-0.19.05.md`
- `customer-admin-table-state-refactor-0.19.04.md`
- `customer-admin-ui-final-qa-0.19.52.md`
- `db-folder-audit-0.18.94.md`
- `dev-test-route-audit-0.18.88.md`
- `doc-archive-policy-audit-0.18.95.md`
- `formatter-label-helper-audit-0.18.99.md`
- `function-addition-stabilization-qa-0.19.56.md`
- `legacy-style-cleanup-0.19.51.md`
- `material-order-action-status-display-0.19.64.md`
- `material-order-wafl-component-scope-0.19.47.md`
- `material-order-wafl-ui-0.19.48.md`
- `member-table-common-refactor-0.19.07.md`
- `partner-filter-select-0.18.43.md`
- `partner-filter-toolbar-0.18.44.md`
- `partner-filter-toolbar-balance-0.18.47.md`
- `partner-filter-toolbar-overflow-0.18.46.md`
- `partner-filter-toolbar-single-line-0.18.49.md`
- `partner-filter-toolbar-wide-alignment-0.18.45.md`
- `partner-filter-toolbar-width-0.18.48.md`
- `partner-responsive-list-0.18.40.md`
- `partner-responsive-list-source-cleanup-0.18.41.md`
- `partner-source-cleanup-0.18.53.md`
- `partner-source-cleanup-build-fix-0.18.55.md`
- `partner-top-area-responsive-0.18.42.md`
- `project-readme-refresh-0.18.89.md`
- `project-source-cleanup-audit-0.18.87.md`
- `qa-stabilization-checklist-0.19.65.md`
- `scripts-folder-audit-0.18.92.md`
- `source-artifact-ignore-audit-0.18.91.md`
- `source-refactor-analysis-0.19.53.md`
- `source-refactor-audit-0.18.97.md`
- `stats-analysis-card-shell-0.18.59.md`
- `stats-analysis-cards-source-cleanup-0.18.58.md`
- `stats-bar-row-cleanup-0.18.75.md`
- `stats-bar-row-component-0.18.76.md`
- `stats-build-error-fix-0.18.86.md`
- `stats-date-range-calendar-action-button-0.18.67.md`
- `stats-date-range-calendar-dom-width-0.18.66.md`
- `stats-date-range-calendar-footer-width-0.18.65.md`
- `stats-date-range-calendar-popover-0.18.63.md`
- `stats-date-range-calendar-width-0.18.64.md`
- `stats-factory-performance-table-0.18.69.md`
- `stats-factory-performance-table-component-0.18.77.md`
- `stats-inline-toggle-cleanup-0.18.71.md`
- `stats-overview-source-cleanup-0.18.57.md`
- `stats-period-action-buttons-0.18.62.md`
- `stats-period-button-family-0.18.74.md`
- `stats-period-controls-calendar-0.18.60.md`
- `stats-period-controls-container-width-0.18.83.md`
- `stats-period-controls-source-cleanup-0.18.84.md`
- `stats-period-date-control-layout-0.18.61.md`
- `stats-period-icon-action-button-0.18.73.md`
- `stats-period-preset-and-tabs-0.18.68.md`
- `stats-period-preset-toggle-0.18.72.md`
- `stats-selected-period-badge-remove-0.18.79.md`
- `stats-selected-period-badge-scope-0.18.70.md`
- `stats-tab-rendering-source-cleanup-0.18.85.md`
- `stats-workflow-header-container-width-0.18.82.md`
- `stats-workflow-header-depth-0.18.80.md`
- `stats-workflow-header-tab-align-0.18.81.md`
- `stats-workflow-section-source-cleanup-0.18.78.md`
- `storage-formatter-refactor-0.19.00.md`
- `storage-responsive-table-card-0.18.31.md`
- `storage-summary-container-responsive-0.18.33.md`
- `storage-summary-source-cleanup-0.18.38.md`
- `storage-tablet-design-0.18.29.md`
- `storage-trash-actions-badges-0.18.34.md`
- `storage-trash-container-responsive-0.18.32.md`
- `storage-trash-density-0.18.30.md`
- `storage-trash-header-alignment-0.18.39.md`
- `storage-trash-source-cleanup-0.18.37.md`
- `storage-trash-ui-stabilization-0.18.35.md`
- `storage-trash-visual-polish-0.18.36.md`
- `system-admin-operations-design-0.19.74.md`
- `system-storage-table-row-refactor-0.19.01.md`
- `tablet-admin-responsive-reflow-0.18.24.md`
- `tablet-android-scroll-stabilization-0.18.26.md`
- `tablet-fluid-admin-layout-0.18.27.md`
- `tablet-landscape-admin-reflow-0.18.25.md`
- `tablet-scroll-recovery-0.18.28.md`
- `toast-feedback-audit-0.19.08.md`
- `ui-admin-direct-dependency-audit-0.18.09.md`
- `ui-admin-select-application-0.18.02.md`
- `ui-admin-shim-0.18.01.md`
- `ui-badge-variant-0.18.12.md`
- `ui-button-variant-0.18.11.md`
- `ui-card-variant-0.18.10.md`
- `ui-common-rules-0.18.98.md`
- `ui-export-cleanup-0.19.54.md`
- `ui-inline-select-editor-0.18.06.md`
- `ui-inline-select-editor-0.18.07.md`
- `ui-library-refactor-audit-0.17.79.md`
- `ui-member-system-select-application-0.18.03.md`
- `ui-mobile-device-adjustment-0.18.18.md`
- `ui-native-select-closeout-0.18.05.md`
- `ui-pc-visual-review-0.18.19.md`
- `ui-productization-checkpoint-0.18.00.md`
- `ui-responsive-device-switch-0.17.85.md`
- `ui-responsive-frame-0.17.89.md`
- `ui-responsive-impact-audit-0.17.84.md`
- `ui-responsive-material-order-tabs-0.17.86.md`
- `ui-responsive-material-sheet-0.17.91.md`
- `ui-responsive-segmented-tabs-0.17.87.md`
- `ui-responsive-workorder-side-sheet-0.17.92.md`
- `ui-responsive-workorder-tabs-0.17.88.md`
- `ui-section-listrow-0.18.13.md`
- `ui-select-candidate-audit-0.17.97.md`
- `ui-sheet-application-0.18.16.md`
- `ui-system-standards-select-0.18.04.md`
- `ui-tablet-device-adjustment-0.18.17.md`
- `ui-tanstack-table-candidates-0.18.20.md`
- `ui-toast-message-0.18.14.md`
- `ui-tooltip-application-0.18.15.md`
- `version-constant-split-0.19.11.md`
- `wafl-a-type-archive-audit-0.18.96.md`
- `wafl-action-button-0.19.37.md`
- `wafl-button-0.19.38.md`
- `wafl-datatable-common-0.19.34.md`
- `wafl-filterbar-scroll-0.19.30.md`
- `wafl-filterbar-section-detail-0.19.31.md`
- `wafl-floating-toast-refactor-0.19.09.md`
- `wafl-member-common-width-orientation-0.19.36.md`
- `wafl-member-invitation-compact-bottom-0.19.21.md`
- `wafl-member-invitation-responsive-share-0.19.22.md`
- `wafl-member-invitation-responsive-table-0.19.23.md`
- `wafl-member-invitation-table-width-0.19.25.md`
- `wafl-member-invite-action-column-layout-0.19.19.md`
- `wafl-member-invite-icon-layout-fix-0.19.17.md`
- `wafl-member-invite-icon-visibility-layout-0.19.18.md`
- `wafl-member-invite-table-actions-0.19.16.md`
- `wafl-member-management-unified-screen-0.19.20.md`
- `wafl-member-responsive-collapse-0.19.24.md`
- `wafl-member-width-orientation-0.19.35.md`
- `wafl-modal-0.19.41.md`
- `wafl-page-hero-summary-theme-0.19.26.md`
- `wafl-page-hero-summary-theme-2-0.19.27.md`
- `wafl-responsive-qa-0.19.49.md`
- `wafl-section-description-actions-0.19.33.md`
- `wafl-section-panel-common-0.19.28.md`
- `wafl-section-spacing-action-slot-0.19.29.md`
- `wafl-settings-0.19.43.md`
- `wafl-settings-detail-0.19.44.md`
- `wafl-state-0.19.40.md`
- `wafl-table-density-0.19.42.md`
- `wafl-toast-0.19.39.md`
- `wafl-toast-followup-ui-fix-0.19.13.md`
- `wafl-toast-icon-member-invite-fix-0.19.14.md`
- `wafl-toast-loading-policy-0.19.12.md`
- `wafl-toast-lucide-member-action-fix-0.19.15.md`
- `wafl-toast-single-standard-0.19.10.md`
- `wafl-trash-actions-stats-refresh-0.19.32.md`
- `wafl-ui-system-0.19.50.md`
- `wafl-ui-system.md`
- `workorder-action-status-display-0.19.60.md`
- `workorder-device-field-alignment-0.18.22.md`
- `workorder-device-order-info-alignment-0.18.21.md`
- `workorder-display-copy-cleanup-0.19.58.md`
- `workorder-display-copy-cleanup-0.19.59.md`
- `workorder-low-risk-feature-plan-0.19.57.md`
- `workorder-material-order-complexity-analysis-0.19.55.md`
- `workorder-material-order-copy-cleanup-0.19.63.md`
- `workorder-pdf-copy-status-0.19.62.md`
- `workorder-sidepanel-attachment-memo-ui-0.19.61.md`
- `workorder-wafl-component-scope-0.19.45.md`
- `workorder-wafl-ui-0.19.46.md`
- `workspace-page-shell-refactor-0.19.03.md`
- `workspace-tablet-responsive-0.18.23.md`

## 수동 검토

파일명만으로 이동 위치를 확정하기 어려운 문서다. 내용을 열어 현행 기준인지, 보관 기록인지 확인한 뒤 이동한다.

- `ui-foundation-components-0.17.81.md`
- `ui-library-dependency-stack-0.17.80.md`
- `ui-pc-common-wrapper-expansion-0.17.93.md`
- `ui-select-application-0.17.96.md`
- `ui-select-tooltip-wrappers-0.17.95.md`
- `ui-sheet-wrapper-0.17.90.md`
- `ui-sonner-toast-0.17.94.md`
- `ui-workorder-list-select-0.17.98.md`
- `ui-workorder-modal-select-0.17.99.md`

## 다음 정리 원칙

1. 테스트 불가 기간에는 실제 이동·삭제를 하지 않는다.
2. 이동을 하더라도 삭제가 아니라 `docs/보관문서/` 하위 이동을 우선한다.
3. `docs/현재기준/`, `docs/정책문서/`, DB/API/Playwright/패치 자동화 문서는 삭제 금지다.
4. 이동 패치에서는 삭제 목록에 폴더 경로를 넣지 않는다.
5. 문서 이동 시 `docs/README.md` 링크를 먼저 조정한다.
