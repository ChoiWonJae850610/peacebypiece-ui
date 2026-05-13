# 0.11.41 모바일 관리자 통계 화면 보정

## 목적

관리자 통계 화면(`/admin/dashboard`)에서 모바일/태블릿 폭에서 차트, 기간 선택, 요약 카드, Top list, 업체 성과 table이 화면 밖으로 밀리거나 과도하게 큰 여백을 만드는 문제를 줄인다.

## 수정 범위

- `components/admin/dashboard/AdminStatsDashboard.tsx`
- `components/admin/dashboard/AdminBasicStatsCharts.tsx`
- `lib/constants/app.ts`

## 반영 내용

### 1. 현재 요약 카드

- 작은 폭에서는 1열, `sm` 이상부터 2열, `xl` 이상에서 4열이 되도록 grid 기준을 보정했다.
- 카드의 padding, radius, value font-size를 모바일 기준으로 조금 줄이고 기존 PC 밀도는 유지했다.

### 2. 통계 섹션 탭

- 생산 구성 / 업체 성과 / 기간 분석 탭이 모바일에서 한 줄 가로 overflow로 접근 가능하도록 보정했다.
- 버튼은 줄어들지 않도록 `shrink-0`을 적용했다.

### 3. 생산 구성 차트

- Donut chart의 모바일 높이와 최대 폭을 줄였다.
- 범례 간격과 padding을 줄여 모바일에서 차트와 목록이 과도하게 길어지지 않도록 했다.
- 1차/2차 전환 버튼은 모바일에서 가로 overflow로 접근 가능하도록 했다.

### 4. 업체 성과 table

- 업체 성과 table row/header에 최소 폭을 주고 `AdminTable` 내부 overflow를 사용하도록 조정했다.
- 좁은 폭에서는 table 내용이 잘리는 대신 내부 가로 스크롤로 접근한다.

### 5. 기간 분석

- 기간 분석 상단 필터 영역을 모바일에서 세로 stack 기준으로 보정했다.
- `AdminDateRangePicker` wrapper의 모바일 `min-width`를 제거해 작은 화면에서 overflow가 발생하지 않도록 했다.
- 기간 버튼과 적용/초기화 버튼은 줄어들지 않도록 처리했다.

## 변경하지 않은 것

- 통계 API 호출 조건
- query string 구조
- 기간 선택 로직
- Recharts 데이터 구조
- 업체 성과 계산 로직
- 작업지시서/저장소/R2 purge 흐름
- DB schema

## 확인 항목

1. `/admin/dashboard` 모바일 폭 진입
2. 현재 요약 카드 1열 표시 확인
3. 생산 구성 탭의 donut chart와 범례가 화면 밖으로 밀리지 않는지 확인
4. 업체 성과 table이 내부 스크롤로 접근 가능한지 확인
5. 기간 분석의 날짜 선택기가 화면 밖으로 밀리지 않는지 확인
6. 7일/30일/custom 적용 버튼 동작 확인
7. PC 폭에서 기존 레이아웃 밀도가 크게 변하지 않았는지 확인
