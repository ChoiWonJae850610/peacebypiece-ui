# runtimeMode 실제 사용 플래그 정리 — 0.11.83

## 목적

`lib/runtime/runtimeMode.ts`에 남아 있던 미래 대비용 플래그를 제거하고, 현재 실제 화면과 디버그 경로에서 사용하는 값만 남긴다.

## 유지한 값

### `APP_RUNTIME_MODE`

- 현재 실행 모드 표시와 visibility 계산 기준으로 사용한다.
- `NEXT_PUBLIC_APP_RUNTIME_MODE=development`일 때만 `development`로 해석한다.
- 환경변수 미설정 또는 다른 값은 모두 `production`으로 해석한다.

### `RUNTIME_VISIBILITY.showDiagnostics`

- 진단/debug 표시 기준으로 사용한다.
- `isDebugFeatureEnabled()`의 상위 visibility 조건이다.

### `RUNTIME_VISIBILITY.showRepositoryBadges`

- 작업지시서 화면의 DB 연결/repository badge 표시 기준으로 사용한다.
- 운영 모드에서는 숨긴다.

### `RUNTIME_VISIBILITY.showUserSwitchingTools`

- 로그인 도입 전 임시 사용자 변경 도구 표시 기준으로 사용한다.
- 운영 모드에서는 숨긴다.

### `DEV_DEBUG_FLAGS`

- `AdminHistoryDebugPanel`의 debug flag 목록 표시와 `isDebugFeatureEnabled()`에서 사용한다.
- 현재 모든 debug flag 기본값은 `false`다.

### `isDebugFeatureEnabled()`

- debug panel 또는 문서 확인용 개발 기능 표시 여부 계산에 사용한다.
- `showDiagnostics`가 꺼져 있으면 항상 `false`다.

### `WORKORDER_CATEGORY_RECOMMENDATION_ENABLED`

- 작업지시서 생성/제목 수정 시 카테고리 추천 실험 기능을 제어한다.
- 현재 기본값은 `false`다.

## 제거한 값

### `isProductionMode`

- 외부 사용처가 없어 제거했다.
- 필요하면 `APP_RUNTIME_MODE === "production"`으로 직접 판단하거나, 실제 사용 시점에 다시 추가한다.

### `RUNTIME_VISIBILITY.showDevTools`

- 현재 직접 사용처가 없어 제거했다.
- 향후 여러 개발 도구를 하나로 묶을 필요가 생기면 다시 추가한다.

### `RUNTIME_VISIBILITY.showSeedTools`

- 현재 직접 사용처가 없어 제거했다.
- seed/reset/mock UI 정리 작업을 실제로 진행할 때 별도 플래그로 다시 추가한다.

### exported `isDevelopmentMode`

- 외부 사용처가 없어 export하지 않고 내부 계산용 `const`로 축소했다.

## 운영/개발 기준

### 운영 모드

```env
# NEXT_PUBLIC_APP_RUNTIME_MODE 미설정
```

- dev/debug UI 숨김
- DB 연결 badge 숨김
- 사용자 변경 톱니바퀴 숨김

### 개발 모드

```env
NEXT_PUBLIC_APP_RUNTIME_MODE=development
```

- dev/debug UI 표시 가능
- DB 연결 badge 표시
- 사용자 변경 톱니바퀴 표시

## 다음 점검 후보

- seed/reset/mock 관련 UI가 실제로 남아 있는지 전수 검색
- debug panel이 운영 route에서 접근 가능한지 확인
- `DEV_DEBUG_FLAGS` 자체를 runtimeMode에 둘지, 별도 `debugFlags.ts`로 분리할지 검토
