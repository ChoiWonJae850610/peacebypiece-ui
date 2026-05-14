# runtimeMode 작업지시서 표시 보정 — 0.11.84

## 목적

작업지시서 화면의 개발 전용 표시 요소가 runtimeMode 전달 누락 시에도 운영 화면에 노출되지 않도록 기본값을 보수적으로 정리한다.

## 확인 대상

- 작업지시서 PC 좌측 목록 상단 DB 연결 badge
- 작업지시서 PC 좌측 목록 상단 사용자 변경 톱니바퀴
- 작업지시서 모바일 상단 DB 연결 badge
- 작업지시서 모바일 상단 사용자 변경 톱니바퀴
- 임시 사용자 변경 modal open 조건

## 적용 기준

`lib/runtime/runtimeMode.ts`의 `RUNTIME_VISIBILITY`가 단일 기준이다.

- `NEXT_PUBLIC_APP_RUNTIME_MODE` 미설정: `production`으로 해석
- `NEXT_PUBLIC_APP_RUNTIME_MODE=production`: 운영 모드
- `NEXT_PUBLIC_APP_RUNTIME_MODE=development`: 개발 모드

## 보정 내용

### SidebarContent

`showRepositoryBadges`, `showUserSwitchingTools` props 기본값을 `false`로 변경했다.

상위 view model에서 runtimeMode 값을 명시적으로 전달하면 그 값을 따른다. 전달이 누락되면 운영 안전 기준으로 DB badge와 사용자 변경 톱니바퀴를 숨긴다.

### MobileTopBar

`showRepositoryBadges`, `showUserSwitchingTools` props 기본값을 `false`로 변경했다.

모바일 상단에서도 전달 누락 시 개발 전용 UI가 노출되지 않는다.

### modalBuilders

`showUserSwitchingTools` 기본값을 `false`로 변경했다.

전달 누락 시 permission modal이 열리지 않도록 해 임시 사용자 변경 기능이 운영 화면에 우발적으로 노출되는 것을 막는다.

## 기대 결과

### 운영 모드

```env
# NEXT_PUBLIC_APP_RUNTIME_MODE 미설정
```

또는

```env
NEXT_PUBLIC_APP_RUNTIME_MODE=production
```

- 작업지시서 DB 연결 badge 숨김
- 작업지시서 사용자 변경 톱니바퀴 숨김
- 임시 사용자 변경 modal 진입 차단

### 개발 모드

```env
NEXT_PUBLIC_APP_RUNTIME_MODE=development
```

- 작업지시서 DB 연결 badge 표시
- 작업지시서 사용자 변경 톱니바퀴 표시
- 임시 사용자 변경 modal 진입 가능

## 점검 메모

작업지시서 화면에서 직접 확인된 DB badge와 톱니바퀴 표시 기준은 유지하되, 하위 컴포넌트와 view model builder의 fallback 기본값만 운영 안전 기준으로 보정했다.
