# docs 보관 이동 1차 0.19.94.8

## 목적

`docs/` 루트의 과거 작업 기록성 문서를 실제로 `docs/보관문서/` 하위로 이동한다. 이번 작업은 삭제가 아니라 보관 이동이며, 테스트가 어려운 기간의 저위험 정리 작업으로 기능 코드와 DB/API/R2 흐름은 변경하지 않는다.

## 기준

- 0.19.94.6에서 보관 후보로 분류된 176개 문서를 이동한다.
- 0.19.94.7에서 수동 검토 후 보관 후보로 확정한 9개 문서를 이동한다.
- 이동 대상 합계는 185개다.
- `docs/현재기준/`, `docs/정책문서/`, DB/API smoke, Playwright, 회사 파일 업로드 설계, 패치 자동화 안전장치 등 현행 기준 문서는 이동하지 않는다.

## 이동 집계

- `docs/보관문서/DB기록/`: 2개
- `docs/보관문서/wafl-a-type/`: 125개
- `docs/보관문서/설계초안/`: 10개
- `docs/보관문서/점검기록/`: 43개
- `docs/보관문서/테스트기록/`: 5개

## 이동 목록

| 기존 위치 | 이동 위치 |
| --- | --- |
| `docs/build-and-db-cleanup-0.19.68.md` | `docs/보관문서/DB기록/build-and-db-cleanup-0.19.68.md` |
| `docs/db-folder-audit-0.18.94.md` | `docs/보관문서/DB기록/db-folder-audit-0.18.94.md` |
| `docs/admin-responsive-table-shell-0.18.51.md` | `docs/보관문서/wafl-a-type/admin-responsive-table-shell-0.18.51.md` |
| `docs/admin-responsive-table-style-0.18.50.md` | `docs/보관문서/wafl-a-type/admin-responsive-table-style-0.18.50.md` |
| `docs/admin-responsive-table-typography-0.18.52.md` | `docs/보관문서/wafl-a-type/admin-responsive-table-typography-0.18.52.md` |
| `docs/admin-summary-metric-theme-0.18.56.md` | `docs/보관문서/wafl-a-type/admin-summary-metric-theme-0.18.56.md` |
| `docs/admin-table-grid-style-fix-0.19.02.md` | `docs/보관문서/wafl-a-type/admin-table-grid-style-fix-0.19.02.md` |
| `docs/customer-admin-table-state-refactor-0.19.04.md` | `docs/보관문서/wafl-a-type/customer-admin-table-state-refactor-0.19.04.md` |
| `docs/legacy-style-cleanup-0.19.51.md` | `docs/보관문서/wafl-a-type/legacy-style-cleanup-0.19.51.md` |
| `docs/material-order-wafl-ui-0.19.48.md` | `docs/보관문서/wafl-a-type/material-order-wafl-ui-0.19.48.md` |
| `docs/member-table-common-refactor-0.19.07.md` | `docs/보관문서/wafl-a-type/member-table-common-refactor-0.19.07.md` |
| `docs/partner-filter-select-0.18.43.md` | `docs/보관문서/wafl-a-type/partner-filter-select-0.18.43.md` |
| `docs/partner-filter-toolbar-0.18.44.md` | `docs/보관문서/wafl-a-type/partner-filter-toolbar-0.18.44.md` |
| `docs/partner-filter-toolbar-balance-0.18.47.md` | `docs/보관문서/wafl-a-type/partner-filter-toolbar-balance-0.18.47.md` |
| `docs/partner-filter-toolbar-overflow-0.18.46.md` | `docs/보관문서/wafl-a-type/partner-filter-toolbar-overflow-0.18.46.md` |
| `docs/partner-filter-toolbar-single-line-0.18.49.md` | `docs/보관문서/wafl-a-type/partner-filter-toolbar-single-line-0.18.49.md` |
| `docs/partner-filter-toolbar-wide-alignment-0.18.45.md` | `docs/보관문서/wafl-a-type/partner-filter-toolbar-wide-alignment-0.18.45.md` |
| `docs/partner-filter-toolbar-width-0.18.48.md` | `docs/보관문서/wafl-a-type/partner-filter-toolbar-width-0.18.48.md` |
| `docs/partner-responsive-list-0.18.40.md` | `docs/보관문서/wafl-a-type/partner-responsive-list-0.18.40.md` |
| `docs/partner-responsive-list-source-cleanup-0.18.41.md` | `docs/보관문서/wafl-a-type/partner-responsive-list-source-cleanup-0.18.41.md` |
| `docs/partner-top-area-responsive-0.18.42.md` | `docs/보관문서/wafl-a-type/partner-top-area-responsive-0.18.42.md` |
| `docs/stats-analysis-card-shell-0.18.59.md` | `docs/보관문서/wafl-a-type/stats-analysis-card-shell-0.18.59.md` |
| `docs/stats-analysis-cards-source-cleanup-0.18.58.md` | `docs/보관문서/wafl-a-type/stats-analysis-cards-source-cleanup-0.18.58.md` |
| `docs/stats-bar-row-component-0.18.76.md` | `docs/보관문서/wafl-a-type/stats-bar-row-component-0.18.76.md` |
| `docs/stats-date-range-calendar-action-button-0.18.67.md` | `docs/보관문서/wafl-a-type/stats-date-range-calendar-action-button-0.18.67.md` |
| `docs/stats-date-range-calendar-dom-width-0.18.66.md` | `docs/보관문서/wafl-a-type/stats-date-range-calendar-dom-width-0.18.66.md` |
| `docs/stats-date-range-calendar-footer-width-0.18.65.md` | `docs/보관문서/wafl-a-type/stats-date-range-calendar-footer-width-0.18.65.md` |
| `docs/stats-date-range-calendar-width-0.18.64.md` | `docs/보관문서/wafl-a-type/stats-date-range-calendar-width-0.18.64.md` |
| `docs/stats-factory-performance-table-0.18.69.md` | `docs/보관문서/wafl-a-type/stats-factory-performance-table-0.18.69.md` |
| `docs/stats-factory-performance-table-component-0.18.77.md` | `docs/보관문서/wafl-a-type/stats-factory-performance-table-component-0.18.77.md` |
| `docs/stats-period-action-buttons-0.18.62.md` | `docs/보관문서/wafl-a-type/stats-period-action-buttons-0.18.62.md` |
| `docs/stats-period-button-family-0.18.74.md` | `docs/보관문서/wafl-a-type/stats-period-button-family-0.18.74.md` |
| `docs/stats-period-controls-container-width-0.18.83.md` | `docs/보관문서/wafl-a-type/stats-period-controls-container-width-0.18.83.md` |
| `docs/stats-period-date-control-layout-0.18.61.md` | `docs/보관문서/wafl-a-type/stats-period-date-control-layout-0.18.61.md` |
| `docs/stats-period-icon-action-button-0.18.73.md` | `docs/보관문서/wafl-a-type/stats-period-icon-action-button-0.18.73.md` |
| `docs/stats-selected-period-badge-remove-0.18.79.md` | `docs/보관문서/wafl-a-type/stats-selected-period-badge-remove-0.18.79.md` |
| `docs/stats-workflow-header-container-width-0.18.82.md` | `docs/보관문서/wafl-a-type/stats-workflow-header-container-width-0.18.82.md` |
| `docs/storage-responsive-table-card-0.18.31.md` | `docs/보관문서/wafl-a-type/storage-responsive-table-card-0.18.31.md` |
| `docs/storage-summary-container-responsive-0.18.33.md` | `docs/보관문서/wafl-a-type/storage-summary-container-responsive-0.18.33.md` |
| `docs/storage-summary-source-cleanup-0.18.38.md` | `docs/보관문서/wafl-a-type/storage-summary-source-cleanup-0.18.38.md` |
| `docs/storage-trash-actions-badges-0.18.34.md` | `docs/보관문서/wafl-a-type/storage-trash-actions-badges-0.18.34.md` |
| `docs/storage-trash-container-responsive-0.18.32.md` | `docs/보관문서/wafl-a-type/storage-trash-container-responsive-0.18.32.md` |
| `docs/storage-trash-ui-stabilization-0.18.35.md` | `docs/보관문서/wafl-a-type/storage-trash-ui-stabilization-0.18.35.md` |
| `docs/system-storage-table-row-refactor-0.19.01.md` | `docs/보관문서/wafl-a-type/system-storage-table-row-refactor-0.19.01.md` |
| `docs/tablet-admin-responsive-reflow-0.18.24.md` | `docs/보관문서/wafl-a-type/tablet-admin-responsive-reflow-0.18.24.md` |
| `docs/tablet-android-scroll-stabilization-0.18.26.md` | `docs/보관문서/wafl-a-type/tablet-android-scroll-stabilization-0.18.26.md` |
| `docs/tablet-fluid-admin-layout-0.18.27.md` | `docs/보관문서/wafl-a-type/tablet-fluid-admin-layout-0.18.27.md` |
| `docs/tablet-landscape-admin-reflow-0.18.25.md` | `docs/보관문서/wafl-a-type/tablet-landscape-admin-reflow-0.18.25.md` |
| `docs/tablet-scroll-recovery-0.18.28.md` | `docs/보관문서/wafl-a-type/tablet-scroll-recovery-0.18.28.md` |
| `docs/toast-feedback-audit-0.19.08.md` | `docs/보관문서/wafl-a-type/toast-feedback-audit-0.19.08.md` |
| `docs/ui-admin-direct-dependency-audit-0.18.09.md` | `docs/보관문서/wafl-a-type/ui-admin-direct-dependency-audit-0.18.09.md` |
| `docs/ui-admin-select-application-0.18.02.md` | `docs/보관문서/wafl-a-type/ui-admin-select-application-0.18.02.md` |
| `docs/ui-admin-shim-0.18.01.md` | `docs/보관문서/wafl-a-type/ui-admin-shim-0.18.01.md` |
| `docs/ui-badge-variant-0.18.12.md` | `docs/보관문서/wafl-a-type/ui-badge-variant-0.18.12.md` |
| `docs/ui-button-variant-0.18.11.md` | `docs/보관문서/wafl-a-type/ui-button-variant-0.18.11.md` |
| `docs/ui-card-variant-0.18.10.md` | `docs/보관문서/wafl-a-type/ui-card-variant-0.18.10.md` |
| `docs/ui-common-rules-0.18.98.md` | `docs/보관문서/wafl-a-type/ui-common-rules-0.18.98.md` |
| `docs/ui-export-cleanup-0.19.54.md` | `docs/보관문서/wafl-a-type/ui-export-cleanup-0.19.54.md` |
| `docs/ui-foundation-components-0.17.81.md` | `docs/보관문서/wafl-a-type/ui-foundation-components-0.17.81.md` |
| `docs/ui-inline-select-editor-0.18.06.md` | `docs/보관문서/wafl-a-type/ui-inline-select-editor-0.18.06.md` |
| `docs/ui-inline-select-editor-0.18.07.md` | `docs/보관문서/wafl-a-type/ui-inline-select-editor-0.18.07.md` |
| `docs/ui-library-refactor-audit-0.17.79.md` | `docs/보관문서/wafl-a-type/ui-library-refactor-audit-0.17.79.md` |
| `docs/ui-member-system-select-application-0.18.03.md` | `docs/보관문서/wafl-a-type/ui-member-system-select-application-0.18.03.md` |
| `docs/ui-mobile-device-adjustment-0.18.18.md` | `docs/보관문서/wafl-a-type/ui-mobile-device-adjustment-0.18.18.md` |
| `docs/ui-native-select-closeout-0.18.05.md` | `docs/보관문서/wafl-a-type/ui-native-select-closeout-0.18.05.md` |
| `docs/ui-pc-common-wrapper-expansion-0.17.93.md` | `docs/보관문서/wafl-a-type/ui-pc-common-wrapper-expansion-0.17.93.md` |
| `docs/ui-pc-visual-review-0.18.19.md` | `docs/보관문서/wafl-a-type/ui-pc-visual-review-0.18.19.md` |
| `docs/ui-productization-checkpoint-0.18.00.md` | `docs/보관문서/wafl-a-type/ui-productization-checkpoint-0.18.00.md` |
| `docs/ui-responsive-device-switch-0.17.85.md` | `docs/보관문서/wafl-a-type/ui-responsive-device-switch-0.17.85.md` |
| `docs/ui-responsive-frame-0.17.89.md` | `docs/보관문서/wafl-a-type/ui-responsive-frame-0.17.89.md` |
| `docs/ui-responsive-impact-audit-0.17.84.md` | `docs/보관문서/wafl-a-type/ui-responsive-impact-audit-0.17.84.md` |
| `docs/ui-responsive-material-order-tabs-0.17.86.md` | `docs/보관문서/wafl-a-type/ui-responsive-material-order-tabs-0.17.86.md` |
| `docs/ui-responsive-material-sheet-0.17.91.md` | `docs/보관문서/wafl-a-type/ui-responsive-material-sheet-0.17.91.md` |
| `docs/ui-responsive-segmented-tabs-0.17.87.md` | `docs/보관문서/wafl-a-type/ui-responsive-segmented-tabs-0.17.87.md` |
| `docs/ui-responsive-workorder-side-sheet-0.17.92.md` | `docs/보관문서/wafl-a-type/ui-responsive-workorder-side-sheet-0.17.92.md` |
| `docs/ui-responsive-workorder-tabs-0.17.88.md` | `docs/보관문서/wafl-a-type/ui-responsive-workorder-tabs-0.17.88.md` |
| `docs/ui-section-listrow-0.18.13.md` | `docs/보관문서/wafl-a-type/ui-section-listrow-0.18.13.md` |
| `docs/ui-select-candidate-audit-0.17.97.md` | `docs/보관문서/wafl-a-type/ui-select-candidate-audit-0.17.97.md` |
| `docs/ui-select-tooltip-wrappers-0.17.95.md` | `docs/보관문서/wafl-a-type/ui-select-tooltip-wrappers-0.17.95.md` |
| `docs/ui-sheet-application-0.18.16.md` | `docs/보관문서/wafl-a-type/ui-sheet-application-0.18.16.md` |
| `docs/ui-sonner-toast-0.17.94.md` | `docs/보관문서/wafl-a-type/ui-sonner-toast-0.17.94.md` |
| `docs/ui-system-standards-select-0.18.04.md` | `docs/보관문서/wafl-a-type/ui-system-standards-select-0.18.04.md` |
| `docs/ui-tablet-device-adjustment-0.18.17.md` | `docs/보관문서/wafl-a-type/ui-tablet-device-adjustment-0.18.17.md` |
| `docs/ui-tanstack-table-candidates-0.18.20.md` | `docs/보관문서/wafl-a-type/ui-tanstack-table-candidates-0.18.20.md` |
| `docs/ui-toast-message-0.18.14.md` | `docs/보관문서/wafl-a-type/ui-toast-message-0.18.14.md` |
| `docs/ui-tooltip-application-0.18.15.md` | `docs/보관문서/wafl-a-type/ui-tooltip-application-0.18.15.md` |
| `docs/wafl-a-type-archive-audit-0.18.96.md` | `docs/보관문서/wafl-a-type/wafl-a-type-archive-audit-0.18.96.md` |
| `docs/wafl-action-button-0.19.37.md` | `docs/보관문서/wafl-a-type/wafl-action-button-0.19.37.md` |
| `docs/wafl-button-0.19.38.md` | `docs/보관문서/wafl-a-type/wafl-button-0.19.38.md` |
| `docs/wafl-datatable-common-0.19.34.md` | `docs/보관문서/wafl-a-type/wafl-datatable-common-0.19.34.md` |
| `docs/wafl-filterbar-scroll-0.19.30.md` | `docs/보관문서/wafl-a-type/wafl-filterbar-scroll-0.19.30.md` |
| `docs/wafl-filterbar-section-detail-0.19.31.md` | `docs/보관문서/wafl-a-type/wafl-filterbar-section-detail-0.19.31.md` |
| `docs/wafl-floating-toast-refactor-0.19.09.md` | `docs/보관문서/wafl-a-type/wafl-floating-toast-refactor-0.19.09.md` |
| `docs/wafl-member-common-width-orientation-0.19.36.md` | `docs/보관문서/wafl-a-type/wafl-member-common-width-orientation-0.19.36.md` |
| `docs/wafl-member-invitation-compact-bottom-0.19.21.md` | `docs/보관문서/wafl-a-type/wafl-member-invitation-compact-bottom-0.19.21.md` |
| `docs/wafl-member-invitation-responsive-share-0.19.22.md` | `docs/보관문서/wafl-a-type/wafl-member-invitation-responsive-share-0.19.22.md` |
| `docs/wafl-member-invitation-responsive-table-0.19.23.md` | `docs/보관문서/wafl-a-type/wafl-member-invitation-responsive-table-0.19.23.md` |
| `docs/wafl-member-invitation-table-width-0.19.25.md` | `docs/보관문서/wafl-a-type/wafl-member-invitation-table-width-0.19.25.md` |
| `docs/wafl-member-invite-action-column-layout-0.19.19.md` | `docs/보관문서/wafl-a-type/wafl-member-invite-action-column-layout-0.19.19.md` |
| `docs/wafl-member-invite-icon-layout-fix-0.19.17.md` | `docs/보관문서/wafl-a-type/wafl-member-invite-icon-layout-fix-0.19.17.md` |
| `docs/wafl-member-invite-icon-visibility-layout-0.19.18.md` | `docs/보관문서/wafl-a-type/wafl-member-invite-icon-visibility-layout-0.19.18.md` |
| `docs/wafl-member-invite-table-actions-0.19.16.md` | `docs/보관문서/wafl-a-type/wafl-member-invite-table-actions-0.19.16.md` |
| `docs/wafl-member-management-unified-screen-0.19.20.md` | `docs/보관문서/wafl-a-type/wafl-member-management-unified-screen-0.19.20.md` |
| `docs/wafl-member-responsive-collapse-0.19.24.md` | `docs/보관문서/wafl-a-type/wafl-member-responsive-collapse-0.19.24.md` |
| `docs/wafl-member-width-orientation-0.19.35.md` | `docs/보관문서/wafl-a-type/wafl-member-width-orientation-0.19.35.md` |
| `docs/wafl-modal-0.19.41.md` | `docs/보관문서/wafl-a-type/wafl-modal-0.19.41.md` |
| `docs/wafl-page-hero-summary-theme-0.19.26.md` | `docs/보관문서/wafl-a-type/wafl-page-hero-summary-theme-0.19.26.md` |
| `docs/wafl-page-hero-summary-theme-2-0.19.27.md` | `docs/보관문서/wafl-a-type/wafl-page-hero-summary-theme-2-0.19.27.md` |
| `docs/wafl-section-description-actions-0.19.33.md` | `docs/보관문서/wafl-a-type/wafl-section-description-actions-0.19.33.md` |
| `docs/wafl-section-panel-common-0.19.28.md` | `docs/보관문서/wafl-a-type/wafl-section-panel-common-0.19.28.md` |
| `docs/wafl-section-spacing-action-slot-0.19.29.md` | `docs/보관문서/wafl-a-type/wafl-section-spacing-action-slot-0.19.29.md` |
| `docs/wafl-settings-0.19.43.md` | `docs/보관문서/wafl-a-type/wafl-settings-0.19.43.md` |
| `docs/wafl-settings-detail-0.19.44.md` | `docs/보관문서/wafl-a-type/wafl-settings-detail-0.19.44.md` |
| `docs/wafl-state-0.19.40.md` | `docs/보관문서/wafl-a-type/wafl-state-0.19.40.md` |
| `docs/wafl-table-density-0.19.42.md` | `docs/보관문서/wafl-a-type/wafl-table-density-0.19.42.md` |
| `docs/wafl-toast-0.19.39.md` | `docs/보관문서/wafl-a-type/wafl-toast-0.19.39.md` |
| `docs/wafl-toast-followup-ui-fix-0.19.13.md` | `docs/보관문서/wafl-a-type/wafl-toast-followup-ui-fix-0.19.13.md` |
| `docs/wafl-toast-icon-member-invite-fix-0.19.14.md` | `docs/보관문서/wafl-a-type/wafl-toast-icon-member-invite-fix-0.19.14.md` |
| `docs/wafl-toast-lucide-member-action-fix-0.19.15.md` | `docs/보관문서/wafl-a-type/wafl-toast-lucide-member-action-fix-0.19.15.md` |
| `docs/wafl-toast-single-standard-0.19.10.md` | `docs/보관문서/wafl-a-type/wafl-toast-single-standard-0.19.10.md` |
| `docs/wafl-trash-actions-stats-refresh-0.19.32.md` | `docs/보관문서/wafl-a-type/wafl-trash-actions-stats-refresh-0.19.32.md` |
| `docs/wafl-ui-system-0.19.50.md` | `docs/보관문서/wafl-a-type/wafl-ui-system-0.19.50.md` |
| `docs/wafl-ui-system.md` | `docs/보관문서/wafl-a-type/wafl-ui-system.md` |
| `docs/workorder-sidepanel-attachment-memo-ui-0.19.61.md` | `docs/보관문서/wafl-a-type/workorder-sidepanel-attachment-memo-ui-0.19.61.md` |
| `docs/workorder-wafl-ui-0.19.46.md` | `docs/보관문서/wafl-a-type/workorder-wafl-ui-0.19.46.md` |
| `docs/workspace-page-shell-refactor-0.19.03.md` | `docs/보관문서/wafl-a-type/workspace-page-shell-refactor-0.19.03.md` |
| `docs/workspace-tablet-responsive-0.18.23.md` | `docs/보관문서/wafl-a-type/workspace-tablet-responsive-0.18.23.md` |
| `docs/doc-archive-policy-audit-0.18.95.md` | `docs/보관문서/설계초안/doc-archive-policy-audit-0.18.95.md` |
| `docs/material-order-wafl-component-scope-0.19.47.md` | `docs/보관문서/설계초안/material-order-wafl-component-scope-0.19.47.md` |
| `docs/stats-selected-period-badge-scope-0.18.70.md` | `docs/보관문서/설계초안/stats-selected-period-badge-scope-0.18.70.md` |
| `docs/storage-tablet-design-0.18.29.md` | `docs/보관문서/설계초안/storage-tablet-design-0.18.29.md` |
| `docs/system-admin-operations-design-0.19.74.md` | `docs/보관문서/설계초안/system-admin-operations-design-0.19.74.md` |
| `docs/ui-library-dependency-stack-0.17.80.md` | `docs/보관문서/설계초안/ui-library-dependency-stack-0.17.80.md` |
| `docs/ui-sheet-wrapper-0.17.90.md` | `docs/보관문서/설계초안/ui-sheet-wrapper-0.17.90.md` |
| `docs/wafl-toast-loading-policy-0.19.12.md` | `docs/보관문서/설계초안/wafl-toast-loading-policy-0.19.12.md` |
| `docs/workorder-low-risk-feature-plan-0.19.57.md` | `docs/보관문서/설계초안/workorder-low-risk-feature-plan-0.19.57.md` |
| `docs/workorder-wafl-component-scope-0.19.45.md` | `docs/보관문서/설계초안/workorder-wafl-component-scope-0.19.45.md` |
| `docs/cloudflare-worker-audit-0.18.93.md` | `docs/보관문서/점검기록/cloudflare-worker-audit-0.18.93.md` |
| `docs/current-baseline-doc-audit-0.18.90.md` | `docs/보관문서/점검기록/current-baseline-doc-audit-0.18.90.md` |
| `docs/customer-admin-feedback-message-refactor-0.19.05.md` | `docs/보관문서/점검기록/customer-admin-feedback-message-refactor-0.19.05.md` |
| `docs/formatter-label-helper-audit-0.18.99.md` | `docs/보관문서/점검기록/formatter-label-helper-audit-0.18.99.md` |
| `docs/material-order-action-status-display-0.19.64.md` | `docs/보관문서/점검기록/material-order-action-status-display-0.19.64.md` |
| `docs/partner-source-cleanup-0.18.53.md` | `docs/보관문서/점검기록/partner-source-cleanup-0.18.53.md` |
| `docs/partner-source-cleanup-build-fix-0.18.55.md` | `docs/보관문서/점검기록/partner-source-cleanup-build-fix-0.18.55.md` |
| `docs/project-readme-refresh-0.18.89.md` | `docs/보관문서/점검기록/project-readme-refresh-0.18.89.md` |
| `docs/project-source-cleanup-audit-0.18.87.md` | `docs/보관문서/점검기록/project-source-cleanup-audit-0.18.87.md` |
| `docs/scripts-folder-audit-0.18.92.md` | `docs/보관문서/점검기록/scripts-folder-audit-0.18.92.md` |
| `docs/source-artifact-ignore-audit-0.18.91.md` | `docs/보관문서/점검기록/source-artifact-ignore-audit-0.18.91.md` |
| `docs/source-refactor-analysis-0.19.53.md` | `docs/보관문서/점검기록/source-refactor-analysis-0.19.53.md` |
| `docs/source-refactor-audit-0.18.97.md` | `docs/보관문서/점검기록/source-refactor-audit-0.18.97.md` |
| `docs/stats-bar-row-cleanup-0.18.75.md` | `docs/보관문서/점검기록/stats-bar-row-cleanup-0.18.75.md` |
| `docs/stats-build-error-fix-0.18.86.md` | `docs/보관문서/점검기록/stats-build-error-fix-0.18.86.md` |
| `docs/stats-date-range-calendar-popover-0.18.63.md` | `docs/보관문서/점검기록/stats-date-range-calendar-popover-0.18.63.md` |
| `docs/stats-inline-toggle-cleanup-0.18.71.md` | `docs/보관문서/점검기록/stats-inline-toggle-cleanup-0.18.71.md` |
| `docs/stats-overview-source-cleanup-0.18.57.md` | `docs/보관문서/점검기록/stats-overview-source-cleanup-0.18.57.md` |
| `docs/stats-period-controls-calendar-0.18.60.md` | `docs/보관문서/점검기록/stats-period-controls-calendar-0.18.60.md` |
| `docs/stats-period-controls-source-cleanup-0.18.84.md` | `docs/보관문서/점검기록/stats-period-controls-source-cleanup-0.18.84.md` |
| `docs/stats-period-preset-and-tabs-0.18.68.md` | `docs/보관문서/점검기록/stats-period-preset-and-tabs-0.18.68.md` |
| `docs/stats-period-preset-toggle-0.18.72.md` | `docs/보관문서/점검기록/stats-period-preset-toggle-0.18.72.md` |
| `docs/stats-tab-rendering-source-cleanup-0.18.85.md` | `docs/보관문서/점검기록/stats-tab-rendering-source-cleanup-0.18.85.md` |
| `docs/stats-workflow-header-depth-0.18.80.md` | `docs/보관문서/점검기록/stats-workflow-header-depth-0.18.80.md` |
| `docs/stats-workflow-header-tab-align-0.18.81.md` | `docs/보관문서/점검기록/stats-workflow-header-tab-align-0.18.81.md` |
| `docs/stats-workflow-section-source-cleanup-0.18.78.md` | `docs/보관문서/점검기록/stats-workflow-section-source-cleanup-0.18.78.md` |
| `docs/storage-formatter-refactor-0.19.00.md` | `docs/보관문서/점검기록/storage-formatter-refactor-0.19.00.md` |
| `docs/storage-trash-density-0.18.30.md` | `docs/보관문서/점검기록/storage-trash-density-0.18.30.md` |
| `docs/storage-trash-header-alignment-0.18.39.md` | `docs/보관문서/점검기록/storage-trash-header-alignment-0.18.39.md` |
| `docs/storage-trash-source-cleanup-0.18.37.md` | `docs/보관문서/점검기록/storage-trash-source-cleanup-0.18.37.md` |
| `docs/storage-trash-visual-polish-0.18.36.md` | `docs/보관문서/점검기록/storage-trash-visual-polish-0.18.36.md` |
| `docs/ui-select-application-0.17.96.md` | `docs/보관문서/점검기록/ui-select-application-0.17.96.md` |
| `docs/ui-workorder-list-select-0.17.98.md` | `docs/보관문서/점검기록/ui-workorder-list-select-0.17.98.md` |
| `docs/ui-workorder-modal-select-0.17.99.md` | `docs/보관문서/점검기록/ui-workorder-modal-select-0.17.99.md` |
| `docs/version-constant-split-0.19.11.md` | `docs/보관문서/점검기록/version-constant-split-0.19.11.md` |
| `docs/workorder-action-status-display-0.19.60.md` | `docs/보관문서/점검기록/workorder-action-status-display-0.19.60.md` |
| `docs/workorder-device-field-alignment-0.18.22.md` | `docs/보관문서/점검기록/workorder-device-field-alignment-0.18.22.md` |
| `docs/workorder-device-order-info-alignment-0.18.21.md` | `docs/보관문서/점검기록/workorder-device-order-info-alignment-0.18.21.md` |
| `docs/workorder-display-copy-cleanup-0.19.58.md` | `docs/보관문서/점검기록/workorder-display-copy-cleanup-0.19.58.md` |
| `docs/workorder-display-copy-cleanup-0.19.59.md` | `docs/보관문서/점검기록/workorder-display-copy-cleanup-0.19.59.md` |
| `docs/workorder-material-order-complexity-analysis-0.19.55.md` | `docs/보관문서/점검기록/workorder-material-order-complexity-analysis-0.19.55.md` |
| `docs/workorder-material-order-copy-cleanup-0.19.63.md` | `docs/보관문서/점검기록/workorder-material-order-copy-cleanup-0.19.63.md` |
| `docs/workorder-pdf-copy-status-0.19.62.md` | `docs/보관문서/점검기록/workorder-pdf-copy-status-0.19.62.md` |
| `docs/customer-admin-ui-final-qa-0.19.52.md` | `docs/보관문서/테스트기록/customer-admin-ui-final-qa-0.19.52.md` |
| `docs/dev-test-route-audit-0.18.88.md` | `docs/보관문서/테스트기록/dev-test-route-audit-0.18.88.md` |
| `docs/function-addition-stabilization-qa-0.19.56.md` | `docs/보관문서/테스트기록/function-addition-stabilization-qa-0.19.56.md` |
| `docs/qa-stabilization-checklist-0.19.65.md` | `docs/보관문서/테스트기록/qa-stabilization-checklist-0.19.65.md` |
| `docs/wafl-responsive-qa-0.19.49.md` | `docs/보관문서/테스트기록/wafl-responsive-qa-0.19.49.md` |

## 적용 주의

- 이번 패치의 삭제 목록은 루트 문서 파일만 포함한다.
- 폴더 삭제는 포함하지 않는다.
- 한글 경로는 UTF-8 zip filename flag를 사용해 보존한다.
- npm run build 미실행 — 사용자가 로컬에서 확인.
