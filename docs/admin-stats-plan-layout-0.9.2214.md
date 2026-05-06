# 0.9.2214 관리자 통계 화면 요금제 포함 구조 정리

## 목적

관리자 통계 화면에서 Basic / Standard / Growth / Premium을 선택할 때 카드가 아래로 계속 누적되는 느낌을 줄이고, 선택한 요금제의 핵심 지표가 먼저 보이도록 재배치한다.

## 화면 위치

- `/admin/dashboard`
- 고객 관리자 > 통계 화면

## 정책

상위 요금제는 하위 요금제 통계를 모두 포함한다.

- Basic: Basic 통계
- Standard: Basic + Standard 통계
- Growth: Basic + Standard + Growth 통계
- Premium: Basic + Standard + Growth + Premium 통계

다만 화면 배치는 하위 요금제 카드를 단순 누적하지 않고 선택 요금제 중심으로 재구성한다.

## 화면 구조

1. 상단 제목/기간/요금제 선택
2. KPI Strip
3. Main Insight
4. Included Plan Summary
5. Supporting Metrics
6. 운영/개발 기준 접힘 영역

## 0.9.2214 변경 기준

- `/admin/dashboard` 경로를 상단 설명에 명시한다.
- 선택 요금제 설명에 하위 요금제 포함 정책을 반영한다.
- 상위 요금제 선택 시 하위 요금제 통계를 `Included Plan Summary`와 `Supporting Metrics`로 압축 표시한다.
- Standard/Growth/Premium 화면은 선택 요금제의 핵심 지표를 Main Insight에 먼저 배치한다.
- 추가 차트 라이브러리는 도입하지 않는다.
- Recharts 기존 구성만 유지한다.

## runtime flag

- `DEBUG_FLAGS.adminStatsPlanSwitcher`
  - true: 요금제 선택 버튼 표시
  - false: 요금제 선택 버튼 숨김

- `DEBUG_FLAGS.adminStatsDevSections`
  - true: 운영/개발 기준 표시
  - false: 운영/개발 기준 숨김

## SQL DDL 필요 여부

불필요.

## 전체 리셋 필요 여부

불필요.

## 테스트 케이스

1. `/admin/dashboard` 접속
2. Basic 선택 시 기본 운영 흐름 중심 표시 확인
3. Standard 선택 시 Basic 포함 배지와 생산품유형/협력업체 중심 배치 확인
4. Growth 선택 시 Basic/Standard 포함 배지와 리오더 중심 배치 확인
5. Premium 선택 시 Basic/Standard/Growth 포함 배지와 Premium 준비 상태 중심 배치 확인
6. `DEBUG_FLAGS.adminStatsPlanSwitcher = false` 설정 시 요금제 선택 버튼이 숨겨지는지 확인
7. `DEBUG_FLAGS.adminStatsDevSections = false` 설정 시 운영/개발 기준 영역이 숨겨지는지 확인
