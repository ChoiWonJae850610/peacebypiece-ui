# 0.9.2211 관리자 통계 화면 요금제 선택 구조 도입

## 목표

관리자 통계 화면에서 Basic, Standard, Growth, Premium 통계가 한 화면에 모두 나열되어 혼란스러운 문제를 줄이기 위해 상단 요금제 선택 구조를 도입한다.

## 변경 기준

- 기간 필터는 기존처럼 상단 우측에 유지한다.
- 기간 필터 아래에 Basic / Standard / Growth / Premium 선택 버튼을 배치한다.
- 선택된 요금제에 따라 아래 통계 본문이 단계적으로 바뀌도록 한다.
- 기존 요금제 preview 카드 나열 구조는 제거한다.
- Basic은 기본 KPI, 작업지시서 흐름, 협력업체 분포, 파일 사용량, 기본 저장소/생산 단계만 보여준다.
- Standard는 Basic에 생산품유형과 협력업체 성과를 추가한다.
- Growth는 Standard에 리오더 preview를 추가한다.
- Premium은 Growth에 Premium 준비 상태를 추가한다.

## 운영/개발 기준 영역

운영/개발 기준 영역은 `lib/constants/runtimeMode.ts`의 `DEBUG_FLAGS.adminStatsDevSections` 값이 true일 때만 표시한다.

서비스 전 개발/검증 단계에서는 true로 유지할 수 있다. 제품 노출 단계에서는 false로 전환해 고객 통계 화면에서 개발 기준 설명이 보이지 않게 한다.

## DB / package 변경 여부

- DB schema 변경 없음
- SQL DDL 없음
- full reset 불필요
- package.json / package-lock.json 변경 없음

## 확인 항목

1. `/admin/dashboard` 상단에서 기간 필터 아래 요금제 버튼이 보이는지 확인한다.
2. Basic 선택 시 Basic 통계만 보이는지 확인한다.
3. Standard 선택 시 생산품유형/협력업체 성과가 추가되는지 확인한다.
4. Growth 선택 시 리오더 영역이 추가되는지 확인한다.
5. Premium 선택 시 Premium 준비 상태가 추가되는지 확인한다.
6. `DEBUG_FLAGS.adminStatsDevSections`가 false일 때 운영/개발 기준 영역이 숨겨지는지 확인한다.
