# 0.11.82 runtimeMode 구조 1차 개편

## 목적

`lib/constants/runtimeMode.ts`에 섞여 있던 개발/운영 표시 기준을 `lib/runtime/runtimeMode.ts`로 이동하고, runtimeMode의 역할을 운영 화면에서 개발·진단 UI를 숨기는 기준으로 단순화한다.

## 변경 기준

- 기존 위치: `lib/constants/runtimeMode.ts`
- 새 위치: `lib/runtime/runtimeMode.ts`
- 운영 기본값: `NEXT_PUBLIC_APP_RUNTIME_MODE` 미설정 시 `production`
- 개발 표시: `NEXT_PUBLIC_APP_RUNTIME_MODE=development`일 때만 활성화

## 공개 플래그

```ts
RUNTIME_VISIBILITY = {
  showDevTools,
  showDiagnostics,
  showRepositoryBadges,
  showUserSwitchingTools,
  showSeedTools,
}
```

## 적용한 UI

- 작업지시서 좌측 상단 사용자 변경 톱니바퀴: `showUserSwitchingTools`
- 작업지시서 모바일 상단 사용자 변경 톱니바퀴: `showUserSwitchingTools`
- 사용자 변경 권한 모달 표시: `showUserSwitchingTools`
- 작업지시서 DB 연결 배지: `showRepositoryBadges`
- 작업지시서 모바일 DB 연결 배지: `showRepositoryBadges`

## 유지한 호환 항목

- `isDebugFeatureEnabled("orderInfoHubPanel")`
- `isDebugFeatureEnabled("orderRequestDocumentDebug")`
- `WORKORDER_CATEGORY_RECOMMENDATION_ENABLED`

다만 위 항목들도 새 위치인 `lib/runtime/runtimeMode.ts`에서만 export한다.

## 삭제

- `lib/constants/runtimeMode.ts`

## 운영 설정 예시

운영에서는 환경변수를 넣지 않아도 기본적으로 `production`으로 동작한다.

```text
NEXT_PUBLIC_APP_RUNTIME_MODE 미설정
```

또는 명시적으로:

```text
NEXT_PUBLIC_APP_RUNTIME_MODE=production
```

## 개발 설정 예시

```text
NEXT_PUBLIC_APP_RUNTIME_MODE=development
```

이 경우 작업지시서 사용자 변경 톱니바퀴, DB 연결 배지, 진단 표시가 노출된다.

## 다음 점검

- seed/reset/mock UI가 남아 있다면 `showSeedTools` 기준으로 이동한다.
- 운영에 필요 없는 진단 panel은 `showDiagnostics` 기준으로 감싼다.
