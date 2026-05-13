# 0.11.24 관리자 기간 선택 컴포넌트 분리

## 목적
관리자 통계 화면 내부에 직접 구현되어 있던 기간 선택 달력 UI를 공통 컴포넌트로 분리한다.

## 변경 범위
- `components/admin/common/AdminDateRangePicker.tsx` 추가
- `components/admin/dashboard/AdminStatsDashboard.tsx`에서 공통 기간 선택 컴포넌트 사용
- `lib/constants/app.ts`의 `APP_VERSION`을 `0.11.24`로 갱신

## 유지한 사항
- 통계 API 호출 구조
- custom period query string 구조
- 시작일/종료일 검증 로직
- 미래 날짜 제한
- 달력 UI className과 표시 문구
- Recharts 기반 차트 구조

## 후속 작업 후보
- 관리자/시스템 전체 date input 사용처를 `AdminDateRangePicker` 또는 별도 `AdminDateInput` 기준으로 통합
- 모바일/tablet 폭에서 달력 popover 위치와 scroll lock 동작 점검
