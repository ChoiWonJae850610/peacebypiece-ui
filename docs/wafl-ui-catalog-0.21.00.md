# WAFL UI Catalog 0.21.00

## 목적

`/ui` 카탈로그의 Button, Badge, Form 계열 스펙을 실제 렌더링 샘플과 함께 확장한다.

## 접근 조건 유지

`/ui`는 `NEXT_PUBLIC_APP_RUNTIME_MODE` 값이 아래 중 하나일 때만 접근한다.

- `development`
- `dev`
- `local`
- `test`
- `demo`

`production`, 빈 값, 알 수 없는 값은 404로 차단한다.

## 0.21.00 범위

- `WaflButton` variant/size/width/disabled 샘플 추가
- `WaflLinkButton` 샘플 유지 및 스펙 확장
- `WaflAddCardButton`, `WaflAddIconBubble` 스펙 항목 추가
- `AppBadge` tone/variant/size 샘플 추가
- `WaflInput`, `WaflTextarea`, select trigger, `WaflSelectableCard` 샘플 추가
- 컴포넌트별 props, size, tone, variant, 금지 사용 예, 실제 적용 화면 표 확장
- Button/Badge/Form 사용 기준 문서화

## 변경하지 않은 범위

- 실제 업무 화면 로직 변경 없음
- 기존 공통 컴포넌트 구현 변경 없음
- `/ui` production 차단 조건 변경 없음

## 다음 버전

0.21.01에서는 Surface 계열 스펙을 `WaflSurface`, `WaflSurfaceButton`, `WaflInfoBox`, `WaflInfoRow`, `WaflEmptyCard`, `WaflSelectableCard` 중심으로 세분화한다.
