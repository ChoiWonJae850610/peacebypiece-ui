# 0.12.5 공통 UI semantic class 점검

## 목적

작업지시서 화면에서 시작한 semantic theme token 기준을 공통 UI 계층으로 확장하기 전, 공통 버튼·카드·필터·토글 컴포넌트가 직접 색상 class 대신 의미 기반 class를 사용하도록 1차 정리했다.

## 반영 범위

- `AdminButton` / `AdminLinkButton`
  - `primary`, `secondary`, `danger`, `ghost` variant를 action semantic class 기준으로 정리했다.
- `AdminCard`, `AdminSection`, `AdminStatCard`, `AdminActionTile`
  - 관리자 화면 공통 카드 계열을 `pbp-admin-card` / `pbp-admin-card-interactive` / `pbp-admin-action-tile` 기준으로 정리했다.
- `AdminFilterBar`
  - 필터 영역 wrapper를 `pbp-admin-filter-bar` 기준으로 정리했다.
- `StatusToggle`
  - 토글 track/thumb 색상을 theme variable 기반 class로 정리했다.
- `defaultLight.ts`와 `globals.css :root`
  - action danger/ghost, toggle 관련 CSS variable을 동기화했다.

## 이번 버전에서 하지 않은 것

- 개인 환경설정 theme 선택 UI 연결은 하지 않았다.
- 개별 화면 내부에 남은 직접 Tailwind 색상 class 전수 제거는 하지 않았다.
- 전체 앱의 모든 카드/버튼을 한 번에 리팩토링하지 않았다.

## 확인 항목

- 관리자 홈 카드와 운영 관리 카드가 기존과 크게 달라지지 않는지 확인한다.
- 공통 AdminButton의 primary/secondary/danger/ghost variant가 정상 표시되는지 확인한다.
- StatusToggle ON/OFF 표시가 기존 의미를 유지하는지 확인한다.
- theme provider 적용 후에도 `default-light` 기준 색상이 유지되는지 확인한다.
