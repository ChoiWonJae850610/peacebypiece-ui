# 0.11.81 runtimeMode 플래그 전수 분석 및 dev/production UI 기준 정리

## 목적

`lib/constants/runtimeMode.ts`의 현재 플래그가 어떤 UI를 제어하는지 전수 확인하고, 운영 화면에서 숨겨야 하는 개발·테스트 전용 UI 기준을 정리한다.

이번 버전은 분석/기준 정리 버전이다. 실제 플래그 코드 구조 개편은 다음 버전에서 진행한다.

## 현재 파일 위치

현재 런타임 플래그 파일은 사용자가 언급한 `lib/runtimeMode.ts`가 아니라 다음 경로에 있다.

```text
lib/constants/runtimeMode.ts
```

## 현재 구조

```ts
export type AppRuntimeMode = "development" | "production";

export const APP_RUNTIME_MODE: AppRuntimeMode = "development";

export const DEBUG_FLAGS = {
  orderInfoHubPanel: false,
  adminHistoryDebugPanel: true,
  adminStatsDevSections: true,
  adminStatsPlanSwitcher: true,
  orderRequestDocumentDebug: false,
} as const;

export function isDevelopmentRuntime(mode: AppRuntimeMode = APP_RUNTIME_MODE) {
  return mode === "development";
}

export function isDebugFeatureEnabled(flag: DebugFlagKey) {
  return isDevelopmentRuntime() && DEBUG_FLAGS[flag];
}

export const WORKORDER_CATEGORY_RECOMMENDATION_ENABLED = false;
```

## 사용처 조사

| 항목 | 현재 값 | 실제 사용처 | 판단 |
|---|---:|---|---|
| `APP_RUNTIME_MODE` | `development` | `AdminHistoryDebugPanel`, `isDebugFeatureEnabled` | 운영 배포에서도 항상 development로 고정될 위험이 있음 |
| `DEBUG_FLAGS.orderInfoHubPanel` | `false` | `lib/workorder/presentation/workOrderDetailSectionProps.ts` | 작업지시서 발주정보 hub 디버그 패널. dev-only 유지 |
| `DEBUG_FLAGS.adminHistoryDebugPanel` | `true` | 현재 직접 표시 조건으로 쓰이는 곳 확인 안 됨. `AdminHistoryDebugPanel` 내부 표시용으로만 사용 | 미사용 또는 잔여 가능성. 정리 후보 |
| `DEBUG_FLAGS.adminStatsDevSections` | `true` | 현재 코드 직접 사용처 확인 안 됨. 과거 문서에만 언급 | 미사용 또는 잔여 가능성. 정리 후보 |
| `DEBUG_FLAGS.adminStatsPlanSwitcher` | `true` | 현재 코드 직접 사용처 확인 안 됨. 과거 문서에만 언급 | 미사용 또는 잔여 가능성. 정리 후보 |
| `DEBUG_FLAGS.orderRequestDocumentDebug` | `false` | `OrderRequestConfirmModal` | 발주요청 문서 preview 디버그. dev-only 유지 |
| `WORKORDER_CATEGORY_RECOMMENDATION_ENABLED` | `false` | `CreateWorkOrderModal`, `WorkOrderHeaderSection` | 실험 기능. 운영 기본 false 유지 |

## 문제점

### 1. runtime mode가 코드에 hardcoded 되어 있음

현재 `APP_RUNTIME_MODE`가 `"development"`로 직접 고정되어 있다.

```ts
export const APP_RUNTIME_MODE: AppRuntimeMode = "development";
```

이 구조에서는 Vercel Production에서도 개발 모드로 판단될 수 있다. 운영 환경에서 개발·테스트 UI가 노출될 위험이 있다.

### 2. DEBUG_FLAGS 안에 실제 사용처가 불명확한 항목이 섞여 있음

다음 3개는 현재 코드 직접 사용처가 확인되지 않는다.

```text
adminHistoryDebugPanel
adminStatsDevSections
adminStatsPlanSwitcher
```

문서상 과거 용도는 남아 있으나 현재 UI를 직접 제어하지 않는다면 제거 또는 `legacy` 분리 대상이다.

### 3. dev/test/experimental/prod-only 구분이 섞여 있음

현재 `DEBUG_FLAGS` 하나에 다음 성격이 섞여 있다.

```text
- 디버그 패널
- 개발 중 통계 화면
- 플랜 전환 실험 UI
- 발주문서 preview 진단
- 카테고리 추천 실험 기능
```

운영 전환 전에 의미별로 분리해야 한다.

## 정리 기준 제안

### A. runtime mode

런타임 모드는 코드 상수보다 환경변수 기반으로 바꾸는 것이 맞다.

```ts
export type AppRuntimeMode = "development" | "preview" | "production";
```

권장 기준:

```text
local 개발: development
Vercel Preview: preview
Vercel Production: production
```

환경변수 후보:

```text
NEXT_PUBLIC_APP_RUNTIME_MODE=development | preview | production
```

값이 없으면 안전하게 `production`으로 fallback하는 것이 운영 관점에서 낫다.

### B. 플래그 분류

권장 구조:

```ts
export const DEV_ONLY_FLAGS = {
  workorderUserSwitcher: false,
  dbConnectionBadge: false,
  orderInfoHubPanel: false,
  orderRequestDocumentDebug: false,
} as const;

export const EXPERIMENTAL_FLAGS = {
  workorderCategoryRecommendation: false,
} as const;

export const LEGACY_DEBUG_FLAGS = {
  adminHistoryDebugPanel: false,
  adminStatsDevSections: false,
  adminStatsPlanSwitcher: false,
} as const;
```

### C. 운영 화면에서 숨길 UI

운영 배포에서는 기본적으로 아래 UI를 숨긴다.

```text
- 작업지시서 화면 사용자 변경 톱니바퀴
- DB 연결 배지
- 디버그 패널
- 발주문서 preview debug
- 통계 dev section / plan switcher
- 과거 히스토리 debug panel
```

### D. 운영에서도 남겨야 할 UI

아래 UI는 dev flag 대상이 아니다.

```text
- 관리자 홈 버튼
- 작업지시서 홈 버튼
- 환경설정 진입 버튼
- 저장소/통계/멤버관리/협력업체관리 카드
- 일반 사용자용 오류 메시지
```

## 다음 작업 권장안

### 0.11.82 — runtimeMode 구조 1차 개편

수정 범위:

```text
1. APP_RUNTIME_MODE를 환경변수 기반으로 변경
2. 기본 fallback은 production으로 설정
3. DEV_ONLY_FLAGS / EXPERIMENTAL_FLAGS / LEGACY_DEBUG_FLAGS 분리
4. isDevOnlyFeatureEnabled helper 추가
5. 기존 isDebugFeatureEnabled는 호환용으로 일단 유지
6. 작업지시서 사용자 변경 톱니바퀴, DB 연결 배지를 dev-only 대상으로 묶을 준비
```

### 0.11.83 — 작업지시서 dev-only UI 실제 분리

수정 범위:

```text
1. 사용자 변경 톱니바퀴 dev-only 처리
2. DB 연결 배지 dev-only 처리
3. 운영 mode에서는 숨김
4. 개발 mode에서는 기존처럼 표시
```

### 0.11.84 — legacy debug flag 제거/정리

수정 범위:

```text
1. 미사용 flag 제거 또는 legacy 문서화
2. AdminHistoryDebugPanel 사용 여부 결정
3. 통계 dev section / plan switcher 잔여 코드 여부 최종 점검
```

## 이번 버전 결론

현재 runtimeMode는 운영/개발 분리 기준으로 쓰기에는 불명확하다. 특히 `APP_RUNTIME_MODE = "development"` 하드코딩은 운영 배포 전에 정리해야 한다.

다음 버전에서는 코드를 바로 바꾸되, 실제 UI 제거까지 한 번에 하지 말고 런타임 판정 구조부터 분리하는 것이 안전하다.
