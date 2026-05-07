# 0.9.2224 — 통계 직접 기간 선택 DB 조회 연결

## 목표

고객관리자 통계정보 화면(`/admin/dashboard`)에서 직접 선택한 시작일과 종료일이 실제 DB 집계 조건에 반영되도록 연결한다.

## 적용 범위

- 최근 7일
- 최근 30일
- 직접 선택: `startDate` ~ `endDate`

직접 선택은 URL query로 유지한다.

```text
/admin/dashboard?period=custom&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

## 집계 기준

직접 선택 기간은 기간별 분석 영역에만 적용한다.

- 작업흐름분석
- 기간별 리오더 TOP5
- 생산품 유형 분석
- 업체 성과
- 업체별 납기/검수 지표

상단 현재 시점 요약은 기간 필터 영향을 받지 않는다.

- 누적 생산
- 누적 납기 지연율
- 누적 검수/불량률
- 현재 저장소 사용량

## 날짜 검증 기준

직접 선택 기간은 아래 형식만 허용한다.

```text
YYYY-MM-DD
```

시작일이 종료일보다 늦거나 날짜가 누락되면 최근 30일 기준으로 fallback한다.

## SQL DDL 필요 여부

불필요.

## 전체 리셋 필요 여부

불필요.

## 테스트

1. `/admin/dashboard?period=7d` 접속 시 최근 7일 기준 표시
2. `/admin/dashboard?period=30d` 접속 시 최근 30일 기준 표시
3. `/admin/dashboard?period=custom&startDate=2026-05-01&endDate=2026-05-07` 접속 시 직접 선택 기간 기준 표시
4. 잘못된 직접 선택 기간은 최근 30일로 fallback
5. 상단 현재 시점 요약은 기간 변경과 무관하게 유지
