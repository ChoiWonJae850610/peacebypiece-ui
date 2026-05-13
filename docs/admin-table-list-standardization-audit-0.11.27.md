# 0.11.27 관리자 Table/List 잔여 패턴 조사

## 목적

0.11.x 공통 UI 정리 라인에서 `AdminTable`, `AdminEmptyState`, `AdminButton`, `AdminStatusBadge` 적용 이후에도 관리자/시스템 화면에 남아 있는 직접 list/table/empty/loading/error 패턴을 조사한다.

이번 버전은 문서화 중심이다. 작업지시서, 저장소, R2 purge, 가입 승인, 권한 저장 등 동작 로직은 변경하지 않았다.

## 조사 범위

- `components/admin/**`
- `components/system/**`
- `app/admin/**`
- `app/system/**`

조사 키워드:

- 직접 table 계열: `<table`, `<thead`, `<tbody`
- 직접 list 계열: `<ul`, `<ol`, `<li`
- 상태 UI 계열: `loading`, `Loading`, `불러오는`, `error`, `Error`, `오류`, `empty`, `Empty`, `없습니다`, `데이터가 없습니다`
- 공통 컴포넌트 적용 확인: `AdminTable`, `AdminEmptyState`

## 요약 결과

### 1. 직접 table 태그

현재 조사 범위에서 직접 `<table>`, `<thead>`, `<tbody>` 사용은 확인되지 않았다.

판단:

- 관리자/시스템의 실제 표 형태 화면은 대부분 `AdminTable`로 이동한 상태다.
- 다음 단계는 table 태그 치환보다 `AdminTable` 사용 화면의 column 정의, empty 문구, row action 패턴을 정리하는 편이 적합하다.

### 2. AdminTable 적용 확인 화면

아래 화면은 이미 `AdminTable`을 사용한다.

- `components/admin/dashboard/AdminStatsDashboard.tsx`
- `components/admin/files/FileListSection.tsx`
- `components/admin/files/FileTrashSection.tsx`
- `components/admin/files/WorkOrderStorageSection.tsx`
- `components/admin/partnerMaster/PartnerMasterList.tsx`
- `components/system/audit/SystemAuditLogsDesignPage.tsx`
- `components/system/billing/SystemCompanyPlanSkeleton.tsx`
- `components/system/companies/SystemCompanyApprovalConsole.tsx`
- `components/system/storage/SystemStoragePurgeCandidatesClient.tsx`

판단:

- `AdminTable` 자체 도입은 1차 완료로 본다.
- 파일/저장소 화면은 삭제/복원/R2 purge 흐름이 연결되어 있으므로 0.11.28에서 UI wrapper 정리만 해야 한다.
- 시스템 저장소 실제 삭제 후보 화면도 purge 로직 변경 없이 table 표현만 점검해야 한다.

### 3. 직접 list 패턴 잔여

직접 `<ul>/<ol>/<li>`는 주로 설명/정책/설계 메모성 목록에 남아 있다.

확인된 주요 파일:

- `components/admin/settings/AdminPolicyOverview.tsx`
- `components/system/access/SystemAccessStabilityCheckpoint.tsx`
- `components/system/audit/SystemAuditLogsDesignPage.tsx`
- `components/system/billing/SystemCompanyPlanSkeleton.tsx`
- `components/system/invitations/SystemCustomerInviteSkeleton.tsx`
- `components/system/standards/SystemProcessStandardsPage.tsx`
- `components/system/standards/SystemProductTemplateStandardsPage.tsx`
- `components/system/standards/SystemStandardsDesignPage.tsx`
- `components/system/standards/SystemStandardsRegressionPage.tsx`
- `components/system/standards/SystemStandardsSeedStatusPage.tsx`
- `components/system/standards/SystemUnitStandardsPage.tsx`

판단:

- 대부분은 데이터 테이블이 아니라 안내/결정사항/정책 설명 목록이다.
- 즉시 `AdminTable`로 바꿀 대상은 아니다.
- 다음 Card/Section 공통화 단계에서 `AdminInfoList`, `AdminDecisionList`, `AdminChecklist` 같은 가벼운 공통 컴포넌트 후보로 묶는 것이 적합하다.

### 4. Empty UI 적용 상태

`AdminEmptyState` 적용 화면:

- `components/admin/dashboard/AdminOperationsDashboard.tsx`
- `components/admin/dashboard/AdminStatsDashboard.tsx`
- `components/admin/history/AdminHistoryList.tsx`
- `components/admin/members/AdminMemberManagementDashboard.tsx`
- `components/admin/settings/AdminSettingsHub.tsx`
- `components/system/category-rules/CategoryRuleEditorPanel.tsx`
- `components/system/category-rules/CategoryRuleListPanel.tsx`
- `components/system/category-rules/CategoryRulePanelShared.tsx`
- `components/system/standards/SystemProductTemplateStandardsPage.tsx`

직접 empty 문구가 남아 있는 주요 화면:

- `components/admin/dashboard/AdminBasicStatsCharts.tsx`
- `components/admin/files/FileListSection.tsx`
- `components/admin/files/FileTrashSection.tsx`
- `components/admin/files/WorkOrderStorageSection.tsx`
- `components/admin/standards/AdminFilePolicySettingsModal.tsx`
- `components/admin/standards/AdminItemCategoryManagementModal.tsx`
- `components/admin/standards/AdminUnitManagementModal.tsx`
- `components/system/audit/SystemAuditLogsDesignPage.tsx`
- `components/system/billing/SystemCompanyPlanSkeleton.tsx`
- `components/system/companies/SystemCompanyApprovalConsole.tsx`

판단:

- 파일/휴지통/작업지시서 저장소 영역은 이미 `AdminTable`의 `emptyLabel` 또는 특화 empty UI를 쓰는 경우가 있어 무조건 치환하면 오히려 회귀 위험이 있다.
- 0.11.28에서는 `/admin/files` 범위 안에서만 empty/loading/error 표현을 확인하고, 삭제/복원 동작은 건드리지 않는 방식이 안전하다.

### 5. Loading/Error UI 잔여

직접 loading/error 상태가 남아 있는 주요 파일:

- `components/admin/members/AdminMemberManagementDashboard.tsx`
- `components/admin/partnerMaster/PartnerMasterList.tsx`
- `components/admin/settings/AdminSettingsHub.tsx`
- `components/admin/standards/AdminFilePolicySettingsModal.tsx`
- `components/admin/standards/AdminNotificationPolicySettingsModal.tsx`
- `components/system/companies/SystemCompanyApprovalConsole.tsx`
- `components/system/storage/SystemStoragePurgeCandidatesClient.tsx`
- `components/system/standards/SystemProcessStandardsPage.tsx`
- `components/system/standards/SystemProductTemplateStandardsPage.tsx`
- `components/system/standards/SystemUnitStandardsPage.tsx`

판단:

- 상태 변수 이름과 API 오류 처리는 각 도메인 로직과 연결되어 있으므로 단순 문자열 치환은 피해야 한다.
- 공통화 방향은 `AdminInlineMessage`, `AdminLoadingState`, `AdminErrorState` 후보를 설계한 뒤 화면별로 1~2곳만 적용하는 순서가 적합하다.
- i18n 정리 라인인 0.11.46 이후와도 연결된다.

## 1차 우선순위

### 0.11.28 후보: 관리자 저장소/첨부 목록

대상:

- `components/admin/files/FileListSection.tsx`
- `components/admin/files/FileTrashSection.tsx`
- `components/admin/files/WorkOrderStorageSection.tsx`
- `components/admin/files/fileTrashSectionColumns.tsx`
- `components/admin/files/fileTrashSectionModals.tsx`

주의:

- 삭제/복원/R2 purge action 변경 금지
- `AdminTable` column/empty/loading 표현 점검 중심
- 고객관리자 문구에서 `연결 첨부` 같은 표현 사용 금지
- `문서 n개, 디자인 n개, 메모 n개` 같은 role 기반 표현 유지

### 0.11.29 후보: 멤버/초대 목록

대상:

- `components/admin/members/AdminMemberManagementDashboard.tsx`

주의:

- `join_requests` 승인/거절 API 변경 금지
- `member_permissions` 저장 로직 변경 금지
- 초대 생성/승인 대기/승인 멤버 목록의 empty/loading/error UI만 정리

### 0.11.30 후보: 시스템관리자 잔여 화면

대상:

- `components/system/storage/SystemStoragePurgeCandidatesClient.tsx`
- `components/system/companies/SystemCompanyApprovalConsole.tsx`
- `components/system/standards/SystemProcessStandardsPage.tsx`
- `components/system/standards/SystemProductTemplateStandardsPage.tsx`
- `components/system/standards/SystemUnitStandardsPage.tsx`

주의:

- 시스템 저장소 purge 실제 처리 로직 변경 금지
- 고객사 승인/거절 로직 변경 금지
- 기준정보 API 응답 포맷 변경 금지

## 공통 컴포넌트 후보

이번 조사 결과만 기준으로 보면 다음 후보가 적합하다.

- `AdminInlineMessage`
  - 작은 성공/오류/안내 메시지
  - modal 내부 error message에도 사용 가능
- `AdminLoadingState`
  - `AdminEmptyState`와 구분되는 loading 전용 상태
- `AdminInfoList`
  - 정책/결정사항/체크리스트 안내 목록
  - table이 아닌 설명용 `<ul>` 반복을 정리
- `AdminSection` / `AdminCard`
  - 0.11.31 이후 카드/섹션 공통화 라인에서 처리

## 이번 버전에서 실제 변경하지 않은 이유

- 직접 table 태그가 없어 즉시 치환 대상이 작다.
- 남은 list는 대부분 설명/정책 목록이라 `AdminTable` 대상이 아니다.
- loading/error는 API 상태 처리와 연결되어 있어 공통 컴포넌트 추가 없이 즉시 치환하면 중복 구조가 생긴다.
- 저장소/멤버/시스템 purge는 정상 동작 중인 action flow가 있으므로 이번 조사 패치에서 변경하지 않는다.

## 다음 작업 권장

0.11.28에서는 예정대로 관리자 저장소/첨부 목록의 Table/List 잔여 정리를 진행한다.

권장 범위는 `/admin/files` 관련 컴포넌트로 제한한다. 삭제/복원/R2 purge 로직은 그대로 두고, column/empty/loading/error 표현과 공통 컴포넌트 사용 여부만 점검하는 것이 안전하다.
