# 0.18.64 통계정보 달력 팝오버 폭 보정

## 목적
- 통계정보 기간 분석 달력 팝오버의 우측 빈 여백 제거
- 달력 grid 폭과 팝오버 폭을 맞춤
- 하단 비우기/완료 아이콘 버튼을 달력 하단 폭 안에 배치

## 변경
- AdminDateRangePicker 팝오버를 고정 224px 폭에서 calendar content 기준 w-fit 구조로 변경
- DayPicker root/month/week grid 폭을 명시해 오른쪽 빈 column을 줄임
- 하단 footer 폭을 calendar content 폭과 동일하게 맞춤

## 유지
- 날짜 범위 선택 로직 유지
- 비우기/완료 접근성 label 유지
- 통계 기간 적용 흐름 유지
- WorkspaceShell 변경 없음
