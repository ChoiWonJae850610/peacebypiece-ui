# 0.18.66 통계정보 달력 팝오버 DOM 폭 보정

## 목적
- 통계정보 기간 분석 달력 팝오버의 오른쪽 빈 여백을 줄입니다.
- 달력 하단 완료 버튼의 형태가 깨지는 문제를 보정합니다.

## 변경
- `CALENDAR_PANEL_WIDTH_CLASS`를 날짜 grid 폭 기준으로 통일했습니다.
- DayPicker `months`, `month`, `nav`, `month_grid`, `weekday` class를 명시해 내부 요소가 불필요하게 넓어지지 않도록 보정했습니다.
- 완료 버튼에 `rounded-full`을 명시해 저장소관리 icon action button 계열과 같은 원형 형태를 유지하도록 했습니다.

## 유지
- 기간 선택/적용 로직은 변경하지 않았습니다.
- WorkspaceShell 스크롤 구조는 변경하지 않았습니다.
- DB/API 통계 조회 흐름은 변경하지 않았습니다.
