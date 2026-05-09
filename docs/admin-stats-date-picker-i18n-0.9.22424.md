# 0.9.22424 — 관리자 통계 날짜 선택 i18n 보정

## 목표
관리자 통계 화면의 직접 기간 선택 영역에서 브라우저 native `input[type=date]`가 OS/브라우저 언어를 따라 한국어 placeholder와 달력 UI를 표시하던 문제를 제거한다.

## 변경 사항
- `/admin/dashboard` 직접 기간 선택 입력을 native date input에서 앱 제어형 연/월/일 select로 변경했다.
- `연도-월-일`, native calendar의 `오늘`, `삭제`, 요일/월 표시가 브라우저 언어로 노출되는 문제를 피했다.
- 연/월/일 placeholder는 `dashboardPage.dateSelectYear`, `dateSelectMonth`, `dateSelectDay` i18n key를 사용한다.
- 선택 기간 badge의 `30일` 같은 서버 기본 label은 현재 locale 기준 label로 변환해 표시한다.

## 판단
native date picker는 브라우저/OS locale의 영향을 받으므로 앱 i18n dictionary만으로 완전히 제어하기 어렵다. 이번 버전에서는 완전한 calendar library 도입 대신, 기존 수동 입력 방지 정책을 유지하면서 select 기반 입력으로 범위를 최소화했다.

## DB 변경
없음.

## 테스트
1. 영어 locale에서 `/admin/dashboard` 진입
2. 시작일/종료일 필드가 `Year / Month / Day`로 표시되는지 확인
3. native calendar popup이 열리지 않는지 확인
4. 선택 기간 badge가 `30 days`로 표시되는지 확인
5. 한국어 locale에서 `연도 / 월 / 일` 기준으로 표시되는지 확인
