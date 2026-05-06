# PeaceByPiece 통계 API/DTO 설계

- 기준 버전: 0.9.202
- 이전 기준 문서:
  - `docs/stats-indicator-plan-0.9.200.md`
  - `docs/stats-data-source-map-0.9.201.md`
- 목적: 0.9.201에서 분류한 통계 가능/부분 가능/불가능 지표를 기준으로 고객관리자/시스템관리자 통계 API와 DTO 응답 구조를 설계한다.
- 비목표: 실제 API route 구현, SQL query 구현, chart UI 구현, DB schema 변경, index 추가, Recharts/TanStack Query 도입

---

## 1. 설계 원칙

### 1.1 API는 SQL aggregate 결과만 반환한다

통계 화면에서 raw row를 받아 프론트에서 대량 계산하지 않는다.

- API layer: request validation, auth/company scope 확인, 얇은 routing만 담당
- lib layer: aggregate query, DTO 조립, feature gate 판단 담당
- UI layer: DTO를 그대로 렌더링하고 비즈니스 판단을 하지 않는다.

### 1.2 company scope는 모든 고객관리자 통계 API의 필수 조건이다

고객관리자 API는 반드시 현재 company 기준으로만 집계한다.

- `companyId`는 클라이언트 입력값을 신뢰하지 않는다.
- 로그인/세션/권한 컨텍스트에서 결정한다.
- 시스템관리자 API만 명시적 `companyId` 필터를 받을 수 있다.

### 1.3 기간 필터는 API 공통 shape로 통일한다

모든 통계 API는 같은 기간 필터 구조를 사용한다.

```ts
export type StatsPeriodPreset =
  | "today"
  | "this_week"
  | "this_month"
  | "last_30_days"
  | "last_90_days"
  | "this_year"
  | "custom";

export type StatsPeriodRequest = {
  preset: StatsPeriodPreset;
  from?: string; // ISO date. custom일 때 필수
  to?: string; // ISO date. custom일 때 필수
  timezone?: string; // 기본 Asia/Seoul
};
```

정책:

- `from`, `to`는 inclusive date range로 해석한다.
- 서버에서는 timestamptz 경계로 변환한다.
- 기본 timezone은 `Asia/Seoul`이다.
- custom이 아니면 `from/to` 입력은 무시하거나 validation error로 처리한다. 실제 구현 시 한 가지 정책으로 고정한다.

### 1.4 부분 가능/불가능 지표는 DTO에서 명시한다

DB source가 부족한 지표를 빈 차트로 조용히 표시하지 않는다.

```ts
export type StatsAvailability = "available" | "partial" | "unavailable";

export type StatsUnavailableReason =
  | "requires_completed_at"
  | "requires_received_at"
  | "requires_inspection_event"
  | "requires_operation_log"
  | "requires_feature_gate"
  | "requires_storage_policy"
  | "requires_status_transition_log"
  | "not_in_plan";
```

### 1.5 요금제 잠금은 API와 UI 양쪽에서 처리한다

- API는 plan/feature 기준으로 해당 section의 접근 가능 여부를 반환한다.
- UI는 API가 반환한 `locked`/`disabledReason`을 기준으로 잠금 카드 또는 preview를 표시한다.
- UI만 숨기고 API가 모든 데이터를 반환하는 구조는 금지한다.

---

## 2. 공통 DTO

### 2.1 기본 응답 envelope

```ts
export type StatsApiMeta = {
  version: "0.9.202";
  generatedAt: string;
  timezone: string;
  period: StatsResolvedPeriod;
  companyId?: string;
  planCode?: string;
};

export type StatsResolvedPeriod = {
  preset: StatsPeriodPreset;
  from: string;
  to: string;
  previousFrom?: string;
  previousTo?: string;
};

export type StatsApiResponse<T> = {
  ok: true;
  meta: StatsApiMeta;
  data: T;
  warnings?: StatsWarning[];
};

export type StatsWarning = {
  code: StatsUnavailableReason | "estimated" | "policy_required";
  message: string;
  target?: string;
};
```

### 2.2 카드/차트 공통 DTO

```ts
export type StatsMetricCard = {
  key: string;
  label: string;
  value: number;
  unit?: "count" | "bytes" | "percent" | "won" | "days";
  previousValue?: number;
  changeRate?: number;
  availability: StatsAvailability;
  disabledReason?: StatsUnavailableReason;
};

export type StatsSeriesPoint = {
  date: string;
  value: number;
  label?: string;
};

export type StatsBreakdownItem = {
  key: string;
  label: string;
  value: number;
  unit?: "count" | "bytes" | "percent" | "won";
  ratio?: number;
};

export type StatsLockedSection = {
  key: string;
  title: string;
  requiredFeature: string;
  requiredPlan?: string;
  disabledReason: "not_in_plan" | "requires_feature_gate";
};
```

### 2.3 Feature gate DTO

```ts
export type StatsFeatureKey =
  | "stats.basic"
  | "stats.category"
  | "stats.factory"
  | "stats.quality"
  | "stats.storage"
  | "stats.export"
  | "stats.system"
  | "stats.performance";

export type StatsFeatureGate = {
  key: StatsFeatureKey;
  enabled: boolean;
  requiredPlan?: "basic" | "standard" | "premium" | "enterprise";
  reason?: "included" | "not_in_plan" | "disabled_by_admin" | "requires_schema";
};
```

현재 `plans`, `company_plan_assignments`만으로는 coarse-grained 판단만 가능하다. 세부 feature flag는 0.9.215에서 별도 설계한다.

---

## 3. 고객관리자 통계 API

### 3.1 `GET /api/admin/stats/overview`

목적:

- 고객관리자 메인 또는 통계 첫 화면에서 쓰는 기본 요약 데이터 제공
- Basic 플랜에서 노출 가능한 최소 통계 포함

Request query:

```ts
export type AdminStatsOverviewRequest = StatsPeriodRequest;
```

Response data:

```ts
export type AdminStatsOverviewDto = {
  cards: {
    totalWorkOrders: StatsMetricCard;
    activeWorkOrders: StatsMetricCard;
    completedWorkOrders: StatsMetricCard;
    reorderRate: StatsMetricCard;
    activeStorageBytes: StatsMetricCard;
    trashStorageBytes: StatsMetricCard;
  };
  workOrderStatus: StatsBreakdownItem[];
  monthlyCreated: StatsSeriesPoint[];
  recentWorkOrders: AdminStatsRecentWorkOrder[];
  lockedSections: StatsLockedSection[];
  featureGates: StatsFeatureGate[];
};

export type AdminStatsRecentWorkOrder = {
  id: string;
  title: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
};
```

Source:

- `spec_sheets`
- `attachments`
- `attachment_trash_items`
- `plans`
- `company_plan_assignments`

주의:

- `completedWorkOrders`는 현재 `completed_at`이 없으므로 status 기준 count만 가능하다.
- 월별 완료 추이는 이 endpoint에 넣지 않는다. 별도 workorders endpoint에서 partial로 표현한다.

### 3.2 `GET /api/admin/stats/workorders`

목적:

- 작업지시서 상태/생성/완료/리오더 통계 제공

Response data:

```ts
export type AdminStatsWorkOrdersDto = {
  statusBreakdown: StatsBreakdownItem[];
  createdTrend: StatsSeriesPoint[];
  completedTrend: StatsSeriesPoint[];
  reorder: {
    totalReorders: StatsMetricCard;
    reorderRate: StatsMetricCard;
    topReorderCategories: StatsBreakdownItem[];
  };
  availability: {
    completedTrend: StatsAvailability;
    completedTrendReason?: StatsUnavailableReason;
  };
};
```

Source:

- `spec_sheets`
- `item_categories`

주의:

- `completedTrend`는 `completed_at` 추가 전까지 `partial` 처리한다.
- `reorder_round > 0`을 기본 리오더 기준으로 둔다.
- `is_rework`는 재작업으로 분리할 수 있도록 DTO 확장 여지를 둔다.

### 3.3 `GET /api/admin/stats/categories`

목적:

- 1차/2차/3차 분류별 생산량/작업 수량 집계

Response data:

```ts
export type AdminStatsCategoriesDto = {
  categoryLevel1: StatsBreakdownItem[];
  categoryLevel2: StatsBreakdownItem[];
  categoryLevel3: StatsBreakdownItem[];
  topOrderQuantityByCategory3: StatsBreakdownItem[];
  topReorderCategory3: StatsBreakdownItem[];
};
```

Source:

- `spec_sheets`
- `orders`
- `item_categories`

Feature:

- `stats.category`

주의:

- 미분류는 `uncategorized` key로 별도 반환한다.
- `orders.is_active` 기준을 쿼리에서 통일한다.

### 3.4 `GET /api/admin/stats/factories`

목적:

- 공장/협력업체별 발주 수량, 비용, 납기/품질 후보 통계 제공

Response data:

```ts
export type AdminStatsFactoriesDto = {
  orderCountByFactory: StatsBreakdownItem[];
  quantityByFactory: StatsBreakdownItem[];
  laborCostByFactory: StatsBreakdownItem[];
  lossCostByFactory: StatsBreakdownItem[];
  totalCostByFactory: StatsBreakdownItem[];
  delay: {
    delayedCountByFactory: StatsBreakdownItem[];
    delayRateByFactory: StatsBreakdownItem[];
    availability: StatsAvailability;
    disabledReason?: StatsUnavailableReason;
  };
  quality: {
    defectQuantityByFactory: StatsBreakdownItem[];
    defectRateByFactory: StatsBreakdownItem[];
    availability: StatsAvailability;
    disabledReason?: StatsUnavailableReason;
  };
};
```

Source:

- `orders`
- `partners`
- `admin_stats_events` 후보

Feature:

- `stats.factory`
- `stats.quality`

주의:

- 공장별 수량/비용은 가능하다.
- 납기 지연/불량률은 `received_at`, `completed_at`, 검수 event write flow 확인 전까지 `partial`로 반환한다.

### 3.5 `GET /api/admin/stats/materials`

목적:

- 원단/부자재/외주공정 사용량과 비용 통계 제공

Response data:

```ts
export type AdminStatsMaterialsDto = {
  materialUsageByVendor: StatsBreakdownItem[];
  materialCostByVendor: StatsBreakdownItem[];
  materialUsageByName: StatsBreakdownItem[];
  outsourcingCountByProcess: StatsBreakdownItem[];
  outsourcingCostByProcess: StatsBreakdownItem[];
  outsourcingCountByVendor: StatsBreakdownItem[];
};
```

Source:

- `spec_sheet_materials`
- `spec_sheet_outsourcing_lines`

주의:

- unit이 섞이면 단순 합산하지 않는다. `unit`별 group을 우선한다.
- 표기 흔들림 보정은 이번 API 설계 범위 밖이다.

### 3.6 `GET /api/admin/stats/storage`

목적:

- 저장소 사용량, 파일 유형별 용량, 휴지통/purge 상태 제공

Response data:

```ts
export type AdminStatsStorageDto = {
  cards: {
    totalUsedBytes: StatsMetricCard;
    activeBytes: StatsMetricCard;
    trashBytes: StatsMetricCard;
    purgePendingBytes: StatsMetricCard;
  };
  byFileType: StatsBreakdownItem[];
  byStorageState: StatsBreakdownItem[];
  purge: {
    requestedCount: StatsMetricCard;
    pendingCount: StatsMetricCard;
    succeededCount: StatsMetricCard;
    failedCount: StatsMetricCard;
  };
  policyWarnings: StatsWarning[];
};
```

Source:

- `attachments`
- `attachment_trash_items`
- `storage_usage_snapshots`
- `latest_storage_usage_snapshots`

주의:

- 통계 API에서 R2 listObjects를 직접 조회하지 않는다.
- DB metadata 기준으로 집계한다.
- 리오더 파일 참조/복사 정책 확정 전까지 logical/physical 용량 차이는 warning으로 표시한다.

---

## 4. 시스템관리자 통계 API

### 4.1 `GET /api/system/stats/companies`

목적:

- 고객사별 사용량, 작업지시서 수, 최근 활동, 요금제 현황 제공

Response data:

```ts
export type SystemStatsCompaniesDto = {
  cards: {
    totalCompanies: StatsMetricCard;
    activeCompanies: StatsMetricCard;
    totalWorkOrders: StatsMetricCard;
    storageRiskCompanies: StatsMetricCard;
  };
  companies: SystemStatsCompanyRow[];
  planBreakdown: StatsBreakdownItem[];
};

export type SystemStatsCompanyRow = {
  companyId: string;
  companyName: string;
  planCode: string;
  workOrderCount: number;
  monthlyCreatedCount: number;
  usedStorageBytes: number;
  storageLimitBytes: number;
  storageUsageRate: number;
  lastActivityAt?: string;
  riskLevel: "normal" | "warning" | "exceeded";
};
```

Source:

- `companies`
- `spec_sheets`
- `latest_storage_usage_snapshots`
- `company_plan_assignments`
- `plans`
- `history_logs` 후보

### 4.2 `GET /api/system/stats/storage`

목적:

- 전체 저장소 사용량, 고객사별 저장소 위험도, snapshot 기준 추이 제공

Response data:

```ts
export type SystemStatsStorageDto = {
  cards: {
    totalUsedBytes: StatsMetricCard;
    totalAttachmentCount: StatsMetricCard;
    warningCompanyCount: StatsMetricCard;
    exceededCompanyCount: StatsMetricCard;
  };
  topStorageCompanies: SystemStatsCompanyStorageRow[];
  storageTrend: StatsSeriesPoint[];
};

export type SystemStatsCompanyStorageRow = {
  companyId: string;
  companyName: string;
  usedStorageBytes: number;
  storageLimitBytes: number;
  usageRate: number;
  planCode: string;
};
```

Source:

- `storage_usage_snapshots`
- `latest_storage_usage_snapshots`
- `company_plan_assignments`
- `plans`

### 4.3 `GET /api/system/stats/purge`

목적:

- R2 purge 요청/대기/성공/실패 상태 추적

Response data:

```ts
export type SystemStatsPurgeDto = {
  cards: {
    requestedCount: StatsMetricCard;
    pendingCount: StatsMetricCard;
    succeededCount: StatsMetricCard;
    failedCount: StatsMetricCard;
    retryRequiredCount: StatsMetricCard;
  };
  failedReasons: StatsBreakdownItem[];
  recentFailures: SystemStatsPurgeFailureRow[];
};

export type SystemStatsPurgeFailureRow = {
  trashItemId: string;
  companyId: string;
  attachmentId: string;
  purgeStatus: string;
  purgeAttemptCount: number;
  lastPurgeAttemptAt?: string;
  lastPurgeError?: string;
};
```

Source:

- `attachment_trash_items`

주의:

- purge 성공/실패는 DB metadata 기준으로만 본다.
- Worker 직접 호출은 통계 API의 책임이 아니다.

### 4.4 `GET /api/system/stats/errors`

목적:

- API 에러율, R2 upload 실패율, 성능 통계 등 운영 지표 후보 제공

Response data:

```ts
export type SystemStatsErrorsDto = {
  availability: StatsAvailability;
  disabledReason?: StatsUnavailableReason;
  cards: {
    apiErrorRate: StatsMetricCard;
    r2UploadFailureRate: StatsMetricCard;
    r2PurgeFailureRate: StatsMetricCard;
    slowRequestCount: StatsMetricCard;
  };
  recentErrors: SystemStatsErrorRow[];
};

export type SystemStatsErrorRow = {
  id: string;
  companyId?: string;
  route: string;
  action?: string;
  errorCode?: string;
  message: string;
  createdAt: string;
  resolvedAt?: string;
};
```

Source:

- 현재는 `attachment_trash_items`의 purge 실패 일부만 가능
- API/R2 upload/성능 지표는 `system_error_logs` 또는 `operation_logs` 필요

주의:

- 0.9.202 기준으로 이 endpoint는 설계만 한다.
- 실제 구현 시 `availability: "partial"` 또는 `"unavailable"`을 반환하는 것이 맞다.

---

## 5. API route와 lib 계층 후보

실제 구현 시 후보 구조는 아래와 같다.

```text
app/api/admin/stats/overview/route.ts
app/api/admin/stats/workorders/route.ts
app/api/admin/stats/categories/route.ts
app/api/admin/stats/factories/route.ts
app/api/admin/stats/materials/route.ts
app/api/admin/stats/storage/route.ts

app/api/system/stats/companies/route.ts
app/api/system/stats/storage/route.ts
app/api/system/stats/purge/route.ts
app/api/system/stats/errors/route.ts

lib/stats/types.ts
lib/stats/period.ts
lib/stats/featureGate.ts
lib/stats/admin/overview.ts
lib/stats/admin/workorders.ts
lib/stats/admin/categories.ts
lib/stats/admin/factories.ts
lib/stats/admin/materials.ts
lib/stats/admin/storage.ts
lib/stats/system/companies.ts
lib/stats/system/storage.ts
lib/stats/system/purge.ts
lib/stats/system/errors.ts
```

원칙:

- `app/api`는 얇게 유지한다.
- request parsing, auth, response wrapping 외의 계산은 `lib/stats/*`로 분리한다.
- UI component에서 직접 SQL 또는 fetch response 계산을 하지 않는다.

---

## 6. Error response 기준

```ts
export type StatsApiErrorResponse = {
  ok: false;
  error: {
    code:
      | "UNAUTHORIZED"
      | "FORBIDDEN"
      | "INVALID_PERIOD"
      | "FEATURE_LOCKED"
      | "UNSUPPORTED_METRIC"
      | "INTERNAL_ERROR";
    message: string;
    target?: string;
  };
};
```

정책:

- 권한이 없으면 `FORBIDDEN` 또는 feature-locked response를 사용한다.
- 요금제 잠금은 화면에서 preview를 보여줘야 하므로 가능하면 `200 ok + lockedSections` 구조를 우선한다.
- 유효하지 않은 기간 필터는 `INVALID_PERIOD`로 처리한다.
- API 내부 에러는 상세 stack을 응답하지 않는다.

---

## 7. SQL DDL 필요 여부

불필요.

이번 버전은 API/DTO 설계 문서 추가와 APP_VERSION 변경만 수행한다.

- table 추가 없음
- column 추가 없음
- index 추가 없음
- full_reset.sql 수정 없음
- smoke test SQL 수정 없음

---

## 8. 전체 리셋 필요 여부

불필요.

DB schema 변경이 없으므로 전체 리셋, 마이그레이션, 데이터 초기화가 필요 없다.

---

## 9. 테스트 케이스

문서 적용 후 아래 항목을 확인한다.

1. `docs/stats-api-dto-plan-0.9.202.md` 문서가 존재한다.
2. 고객관리자 통계 API 후보가 overview/workorders/categories/factories/materials/storage로 분리되어 있다.
3. 시스템관리자 통계 API 후보가 companies/storage/purge/errors로 분리되어 있다.
4. 기간 필터 request shape가 공통 정의되어 있다.
5. feature gate DTO가 포함되어 있다.
6. 부분 가능/불가능 지표를 `availability`, `disabledReason`, `warnings`로 표현하는 기준이 포함되어 있다.
7. SQL DDL 필요 여부가 불필요로 명시되어 있다.
8. 전체 리셋 필요 여부가 불필요로 명시되어 있다.
9. `lib/constants/app.ts`의 `APP_VERSION`이 `0.9.202`로 변경되어 있다.

---

## 10. 다음 버전 작업 기준

### 0.9.203 — 통계용 schema/index 1차 설계 및 반영

- `completed_at`, order completion/received 기준, error/operation log, feature flag table 중 실제 반영할 항목을 확정한다.
- DB schema 변경 허용 버전으로 진행한다.
- `full_reset.sql`, smoke test SQL, 마이그레이션 필요 여부를 답변에 반드시 포함한다.
- 실제 index는 API 쿼리 기준으로 최소한만 추가한다.

