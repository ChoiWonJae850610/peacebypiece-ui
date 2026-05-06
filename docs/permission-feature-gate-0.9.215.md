# 0.9.215 — 권한/feature flag 체계 설계

## 목적

이번 버전은 고객사 관리자 UI에서 사용할 기능별 권한 코드와 요금제 feature flag 기준을 코드 상수와 문서로 고정한다. 실제 DB schema, role_permission seed, API 차단, 화면 권한 적용은 후속 버전에서 분리한다.

## 변경 범위

- `lib/permissions/permissionPolicy.ts`
  - 작업지시서 CRUD, 메모 CRUD, 첨부 CRUD, 워크플로우 액션, 기준정보, 통계, 운영 권한 코드를 분리했다.
  - 기존 `workorder.edit`, `workorder.request_review`, `partner.manage` 등 legacy permission alias는 제거하지 않고 유지했다.
  - `PERMISSION_GROUPS`를 추가해 권한 설정 UI가 그룹 단위로 렌더링할 수 있게 했다.

- `lib/permissions/featureFlagPolicy.ts`
  - Basic / Standard / Growth / Premium / Enterprise 요금제 기준 feature flag를 추가했다.
  - 통계 feature key와 개발중 기능 표시 기준을 분리했다.

- `lib/permissions/index.ts`
  - feature flag policy export를 추가했다.

## 권한 그룹

### 작업지시서

- `workorder.create`
- `workorder.read`
- `workorder.update`
- `workorder.delete`
- `workorder.reorder`

### 워크플로우 액션

- `workflow.requestReview`
- `workflow.completeReview`
- `workflow.reject`
- `workflow.requestOrder`
- `workflow.inspect`
- `workflow.complete`

### 메모

- `memo.create`
- `memo.read`
- `memo.update`
- `memo.delete`

### 첨부/디자인

- `attachment.create`
- `attachment.read`
- `attachment.update`
- `attachment.delete`
- `attachment.restore`
- `attachment.purge`

### 기준정보

- `partner.create`
- `partner.read`
- `partner.update`
- `partner.delete`
- `productType.create`
- `productType.read`
- `productType.update`
- `productType.delete`
- `unit.create`
- `unit.read`
- `unit.update`
- `unit.delete`
- `processType.create`
- `processType.read`
- `processType.update`
- `processType.delete`

### 통계/요금제 기능

- `stats.basic`
- `stats.category`
- `stats.factory`
- `stats.reorder`
- `stats.quality`
- `stats.storageAdvanced`
- `stats.export`
- `stats.system`

### 운영

- `inventory.manage`
- `member.invite`
- `billing.manage`
- `storage.manage`
- `system.storage.manage`

## feature flag 기준

| feature key | 최소 요금제 | 상태 | 기준 |
|---|---:|---|---|
| `stats.basic` | Basic | active | 기본 작업/저장소 통계 |
| `stats.category` | Standard | preview | 생산품유형 통계 |
| `stats.factory` | Standard | preview | 협력업체/공장 성과 |
| `stats.reorder` | Growth | preview | 리오더 통계 |
| `stats.quality` | Premium | planned | 검수/불량 통계 |
| `stats.storageAdvanced` | Premium | planned | 저장소 고급 통계 |
| `stats.export` | Premium | planned | 통계 내보내기 |
| `stats.system` | System | preview | 시스템관리자 전용 |
| `workorder.drawing` | Premium | planned | 드로잉 라이브러리 도입 후보 |
| `notification.policy` | Premium | development | 개발중 기능 |
| `notification.service` | Enterprise | development | 개발중 기능 |
| `ai.workorderNameSuggestion` | Enterprise | development | 개발중 기능 |

## DB 반영 기준

이번 버전에서는 DB schema를 변경하지 않는다.

후속 DB 반영이 필요한 경우:

1. `permissions` seed에 신규 permission code를 추가한다.
2. `role_permissions` seed에 역할별 기본값을 추가한다.
3. `plan_features` 또는 `company_plan_features` 계열 테이블을 추가할지 결정한다.
4. API route에서 permission/feature gate를 실제로 차단한다.

## SQL DDL 필요 여부

불필요.

## 전체 리셋 필요 여부

불필요.

## 테스트 케이스

1. `APP_VERSION`이 `0.9.215`인지 확인한다.
2. `lib/permissions/permissionPolicy.ts`에서 `PERMISSION_GROUPS`가 export되는지 확인한다.
3. 기존 legacy permission alias가 제거되지 않았는지 확인한다.
4. `lib/permissions/featureFlagPolicy.ts`에서 `canUsePlanFeature("Basic", "stats.basic")`이 `true`인지 확인한다.
5. `canUsePlanFeature("Basic", "stats.category")`가 `false`인지 확인한다.
6. `package.json`과 `package-lock.json`이 변경되지 않았는지 확인한다.
