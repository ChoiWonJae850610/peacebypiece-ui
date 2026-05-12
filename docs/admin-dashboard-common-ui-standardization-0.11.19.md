# 0.11.19 관리자 대시보드 공통 UI 적용

## 목적

관리자 홈/운영 대시보드에 남아 있던 직접 작성 상태 라벨과 액션 링크를 공통 관리자 UI 컴포넌트 기준으로 정리한다.

## 변경 범위

- `components/admin/dashboard/AdminConsoleSections.tsx`
  - 운영 관리 카드의 상태 라벨을 `AdminStatusBadge`로 전환
  - 카드 하단의 화면 열기/준비중 표시를 `AdminStatusBadge` 기준으로 전환
- `components/admin/dashboard/AdminOperationsDashboard.tsx`
  - 오늘 작업 수, 작업 상태, 우선순위, 첨부 수 라벨을 `AdminStatusBadge`로 전환
  - 작업지시서 열기 링크를 `AdminLinkButton`으로 전환
  - 오늘 작업 없음 상태를 `AdminEmptyState`로 전환
- `lib/constants/app.ts`
  - `APP_VERSION`을 `0.11.19`로 갱신

## 제외 범위

- 운영 대시보드 데이터 조회 로직 변경 없음
- 작업지시서 이동 경로 변경 없음
- 관리자 권한/카드 노출 조건 변경 없음
- i18n key 변경 없음
- DB/API 변경 없음
