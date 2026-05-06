# 0.9.2213 관리자 통계 화면 재배치/시각 밀도 보정

## 목적

0.9.2211~0.9.2212에서 Basic / Standard / Growth / Premium 선택 구조와 문구 정리는 진행했지만, 상위 요금제를 선택할수록 카드가 아래로 누적되어 제품 화면처럼 보이지 않는 문제가 남아 있었다.

이번 버전은 요금제 선택 시 통계 카드가 단순히 추가되는 것이 아니라, 선택 요금제의 목적에 맞게 KPI와 메인 차트가 재배치되도록 정리한다.

## 적용 기준

- Basic: 작업지시서 흐름, 협력업체 분포, 파일 사용량 중심
- Standard: 생산품유형과 협력업체 성과 중심
- Growth: 리오더와 생산 단계 중심
- Premium: 품질/납기/내보내기 준비 상태 중심

## runtime flag

`lib/constants/runtimeMode.ts`에 `adminStatsPlanSwitcher` flag를 추가했다.

- `true`: Basic / Standard / Growth / Premium 선택 버튼을 표시한다.
- `false`: 요금제 선택 버튼을 숨기고 내부 기본 요금제 화면만 표시한다.

현재는 서비스 전 개발 검토 단계이므로 `true`를 기본값으로 둔다.

## SQL DDL 필요 여부

불필요.

## 전체 리셋 필요 여부

불필요.

## package 변경 여부

없음.

## 테스트 기준

1. `/admin/dashboard`에서 요금제 선택 버튼이 보이는지 확인한다.
2. Basic 선택 시 기본 운영 지표 중심으로 보이는지 확인한다.
3. Standard 선택 시 생산품유형/협력업체 성과 중심으로 재배치되는지 확인한다.
4. Growth 선택 시 리오더/생산 단계 중심으로 재배치되는지 확인한다.
5. Premium 선택 시 준비 상태 중심으로 재배치되는지 확인한다.
6. `adminStatsPlanSwitcher`를 false로 바꾸면 요금제 선택 UI가 숨겨지는지 확인한다.
