# 0.9.22426 — 관리자 통계 React DayPicker popover UX 정리

## 목표

`/admin/dashboard`의 직접 기간 선택 달력을 페이지 안에 상시 노출하지 않고, 날짜 표시 영역을 클릭했을 때만 작은 popover로 표시한다.

## 변경 내용

- `React DayPicker`는 유지한다.
- 기존 인라인 대형 달력 영역을 제거했다.
- 시작일/종료일 표시 영역을 버튼형 트리거로 변경했다.
- 트리거 클릭 시 달력 popover가 열린다.
- 달력 외부 클릭 시 popover가 닫힌다.
- Escape 입력 시 popover가 닫힌다.
- 날짜 값은 `input[type=date]`, text input, select를 사용하지 않는다.
- 사용자는 날짜를 직접 타이핑할 수 없고, 달력 날짜 클릭으로만 기간을 선택한다.
- 기존 한국어/영어 locale 연결은 유지한다.
- 미래 날짜 선택 차단 정책은 유지한다.

## 적용 범위

- `components/admin/dashboard/AdminStatsDashboard.tsx`

## 비고

이번 버전은 UX 정리이며 DB schema 변경은 없다.
