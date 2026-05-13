# 관리자/시스템 Card·Section 패턴 조사 — 0.11.31

## 목적

버튼, 배지, 빈 상태, 테이블 패턴 정리 이후 다음 공통화 대상인 Card·Section·Header 패턴의 잔여 중복을 조사한다. 이번 버전은 조사 문서화 중심이며, 화면 구조나 업무 동작은 변경하지 않는다.

## 조사 범위

- `app/admin/**`
- `app/system/**`
- `components/admin/**`
- `components/system/**`

## 확인한 반복 패턴

### 1. 기본 카드 wrapper

반복 형태:

```tsx
rounded-3xl border border-stone-200 bg-white p-5 shadow-sm
rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm
rounded-[30px] border border-stone-200 bg-white p-4 shadow-sm
```

주요 후보:

- `app/admin/files/page.tsx`
- `app/system/storage-usage/page.tsx`
- `app/system/category-rules/page.tsx`
- `components/admin/members/AdminMemberManagementDashboard.tsx`
- `components/admin/settings/AdminSettingsHub.tsx`
- `components/admin/notification/AdminNotificationSettingsSection.tsx`
- `components/system/SystemConsoleShell.tsx`
- `components/system/SystemStatsOverview.tsx`
- `components/system/companies/SystemCompanyApprovalConsole.tsx`
- `components/system/standards/*`

판단:

- 현재 `components/admin/layout/AdminCard.tsx`가 이미 존재한다.
- 다만 위치가 `layout` 하위라 일반 공통 UI로 쓰기에는 역할이 약간 애매하다.
- 다음 단계에서 `components/admin/common/AdminCard.tsx`를 새로 만들지, 기존 `components/admin/layout/AdminCard.tsx`를 확장할지 먼저 결정해야 한다.

### 2. 섹션 헤더 패턴

반복 형태:

```tsx
<header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
  <p className="text-xs font-semibold uppercase tracking-[...] text-stone-400">...</p>
  <h1 className="...">...</h1>
  <p className="...">...</p>
</header>
```

주요 후보:

- `app/system/category-rules/page.tsx`
- `app/system/storage-usage/page.tsx`
- `components/system/SystemConsoleShell.tsx`
- `components/system/access/SystemAccessStabilityCheckpoint.tsx`
- `components/system/audit/SystemAuditLogsDesignPage.tsx`
- `components/system/companies/SystemCompanyApprovalConsole.tsx`
- `components/system/standards/*`
- `components/admin/invitations/CompanyMemberInviteSkeleton.tsx`

판단:

- 시스템관리자 화면에 특히 중복이 많다.
- `AdminSectionHeader` 또는 `AdminPageHeader` 성격의 컴포넌트가 필요하다.
- 단, topbar와 페이지 header는 역할이 다르므로 하나로 무리하게 합치지 않는 것이 안전하다.

### 3. Summary card / metric card 패턴

반복 형태:

```tsx
<article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
  <p className="text-xs ...">...</p>
  <p className="text-2xl ...">...</p>
</article>
```

주요 후보:

- `app/system/storage-usage/page.tsx`
- `components/system/SystemStatsOverview.tsx`
- `components/admin/members/AdminMemberManagementDashboard.tsx`
- `components/admin/dashboard/AdminStatsDashboard.tsx`
- `components/admin/files/FileStorageSummary.tsx`

판단:

- dashboard/stat 화면에서 반복이 크다.
- `AdminMetricCard` 또는 `AdminSummaryCard`로 별도 분리하는 것이 `AdminCard` 하나로 모든 것을 처리하는 것보다 안전하다.
- 값, 보조 설명, 상태 배지, progress 표현이 화면마다 다르므로 1차에서는 wrapper만 공통화하는 편이 안전하다.

### 4. 안내/도움말/info card 패턴

반복 형태:

```tsx
rounded-2xl border border-stone-100 bg-stone-50/70 px-4 py-3
rounded-2xl bg-stone-50 p-3
rounded-xl bg-stone-50 px-3 py-2
```

주요 후보:

- `components/admin/dashboard/AdminCompletionAuditPanel.tsx`
- `components/admin/dashboard/AdminDbConnectionAuditPanel.tsx`
- `components/admin/settings/AdminPolicyOverview.tsx`
- `components/admin/history/AdminWorkOrderHistoryItem.tsx`
- `components/system/category-rules/*`

판단:

- 정보성 박스는 시각 톤이 조금씩 다르다.
- 바로 공통화하면 미세한 UI 밀도 차이가 깨질 가능성이 있다.
- `AdminInfoBox` 후보로 별도 조사 후 진행하는 것이 낫다.

### 5. Footer action row 패턴

반복 형태:

```tsx
<div className="flex justify-end gap-2">
<div className="flex flex-wrap items-center justify-end gap-2">
```

주요 후보:

- `components/admin/files/fileTrashSectionModals.tsx`
- `components/admin/partnerMaster/*Modal*.tsx`
- `components/admin/standards/*Modal*.tsx`
- `app/system/category-rules/CategoryRulesManager.tsx`
- `components/system/category-rules/CategoryValuesModal.tsx`

판단:

- 이 영역은 Card/Section보다 Modal 패턴 정리와 더 직접적으로 연결된다.
- 0.11.35 이후 AdminModal 조사 라인에서 함께 처리하는 편이 안전하다.

## 우선순위 판단

### 1순위: Section/Page Header

이유:

- 시스템관리자 화면에 중복이 많다.
- 업무 로직과 거의 분리되어 있다.
- API, DB, R2, 권한 로직에 영향이 없다.

추천 다음 작업:

- `components/admin/common/AdminSectionHeader.tsx` 추가
- 시스템관리자 화면 1곳에만 적용
- 예: `/system/storage-usage` 상단 header

### 2순위: Base Card wrapper

이유:

- 반복량이 많다.
- 다만 기존 `components/admin/layout/AdminCard.tsx`와 역할 중복이 있다.

추천:

- 기존 `AdminCard`의 역할을 먼저 검토
- 일반 공통 컴포넌트로 이동할지, layout 전용으로 유지하고 새 common card를 만들지 결정

### 3순위: Metric/Summary Card

이유:

- 통계, 저장소, 시스템 홈에서 반복이 많다.
- 값/단위/상태/보조 설명 조합이 다양하므로 wrapper부터 단계적으로 처리해야 한다.

### 후순위: Info box / footer action row

이유:

- Info box는 화면별 톤 차이가 크다.
- Footer action row는 Modal 공통화와 같이 다루는 것이 적절하다.

## 0.11.32 제안 범위

작업명:

- `AdminSectionHeader` / `AdminCard` 1차 추가

추천 실제 반영 범위:

1. `components/admin/common/AdminSectionHeader.tsx` 추가
2. 필요하면 `components/admin/common/AdminCard.tsx` 추가
3. `/system/storage-usage` 상단 header 1곳만 적용
4. 기존 storage purge 목록/action 로직은 변경하지 않음

주의:

- 기존 `components/admin/layout/AdminCard.tsx`와 이름 충돌을 피해야 한다.
- `AdminCard`를 새로 추가할 경우 기존 layout card와 import 경로 혼동이 생길 수 있으므로 파일명은 `AdminPanelCard.tsx` 또는 `AdminSurfaceCard.tsx`도 검토할 수 있다.
- 이번 단계에서는 대규모 일괄 치환을 하지 않는다.

## 이번 버전 변경 사항

- 조사 문서 추가
- `APP_VERSION`을 `0.11.31`로 갱신
- 화면 동작 변경 없음
- DB/API/R2 변경 없음
