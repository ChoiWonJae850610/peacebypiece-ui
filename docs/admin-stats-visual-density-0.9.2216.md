# 0.9.2216 — 관리자 통계 화면 최종 시각 밀도 점검

## 목적

`/admin/dashboard` 통계 화면에서 요금제별 통계가 카드 누적처럼 보이는 문제를 줄이고, 요금제 선택 UI와 포함 범위 안내를 더 작고 명확하게 정리한다.

## 변경 기준

- 상위 요금제는 하위 요금제 통계를 모두 포함한다.
- 포함 범위는 별도 대형 카드가 아니라 상단 compact scope bar로 표시한다.
- Basic / Standard / Growth / Premium 선택 버튼은 `DEBUG_FLAGS.adminStatsPlanSwitcher`가 켜진 경우에만 표시한다.
- 운영/개발 기준은 기존 `DEBUG_FLAGS.adminStatsDevSections`가 켜진 경우에만 표시한다.
- 통계 화면의 주요 흐름은 KPI → 선택 요금제 메인 통계 → 포함 Basic 핵심 통계 → 운영/개발 기준 순서로 유지한다.

## UI 조정

- `Included Plan Summary` 대형 카드 제거
- `Plan scope` compact bar 추가
- Basic 포함 통계 문구 축소
- `/admin/dashboard` 헤더 설명 축소
- 선택 요금제 정보는 상단에 짧게 표시

## SQL DDL 필요 여부

불필요.

## 전체 리셋 필요 여부

불필요.

## 테스트 케이스

1. `/admin/dashboard` 접속
2. Basic / Standard / Growth / Premium 전환
3. 상단 `Plan scope`에서 포함 범위가 표시되는지 확인
4. Standard 이상에서 Basic 핵심 통계가 표시되는지 확인
5. 기존 대형 Included Plan 카드가 사라졌는지 확인
6. `DEBUG_FLAGS.adminStatsPlanSwitcher = false`일 때 요금제 선택 버튼이 숨겨지는지 확인
7. `DEBUG_FLAGS.adminStatsDevSections = false`일 때 운영/개발 기준이 숨겨지는지 확인
