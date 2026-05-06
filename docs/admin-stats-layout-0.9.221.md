# 0.9.221 — 관리자 통계 화면 정보 구조 재정리

## 목적

관리자 통계 화면이 카드가 나열된 형태로 보이는 문제를 줄이고, 제품 화면처럼 핵심 KPI → Basic 통계 → 요금제 preview → 운영 기준 순서로 정보 위계를 재정리한다.

## 반영 범위

- `/admin/dashboard` 통계 화면 구조 재정리
- 상단 핵심 KPI 4개 중심 배치
- Basic 통계 차트 우선 표시
- Basic / Standard / Growth / Premium preview 버튼 추가
- Standard/Growth/Premium preview 영역을 Basic 통계 아래로 정리
- 캐싱 정책, summary table 검토, 성능 기준은 접힘 영역으로 이동

## 설계 판단

### 1. 고객이 먼저 봐야 할 정보

통계 화면 상단에는 작업지시서 수, 협력업체 수, 파일 사용량, 완료 작업 수 같은 핵심 KPI를 먼저 표시한다.

### 2. 요금제 preview

실제 요금제 권한이 완성되기 전까지는 임시 preview 버튼으로 Basic / Standard / Growth / Premium 노출 범위를 확인한다.

### 3. 운영 기준은 하단으로 이동

캐싱 정책, summary table/materialized view 검토, 성능 측정 기준은 제품 통계 정보라기보다 개발/운영 기준이다. 그래서 통계 화면 하단의 접힘 영역으로 분리한다.

## SQL DDL 필요 여부

불필요.

## 전체 리셋 필요 여부

불필요.

## package 변경 여부

없음.

## 테스트 기준

1. `/admin/dashboard` 접속
2. 상단에 관리자 통계 요약과 기간 필터가 표시되는지 확인
3. 핵심 KPI 4개가 먼저 표시되는지 확인
4. Basic 통계 차트가 상단 중심 영역에 표시되는지 확인
5. Basic / Standard / Growth / Premium 보기 버튼이 표시되는지 확인
6. 고급 통계 preview가 요금제 preview 아래에 표시되는지 확인
7. 캐싱/summary/성능 기준이 하단 접힘 영역 안으로 이동했는지 확인
8. 기존 통계 차트 값이 유지되는지 확인
