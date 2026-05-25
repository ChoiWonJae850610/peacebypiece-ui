---
title: WAFL A-TYPE Customer Admin Stats Screen
version: 1.0
baseline_source: peacebypiece-ui-0.16.47
status: implemented-first-pass
updated: 2026-05-20
---

# 31. 고객사 관리자 통계정보 A-TYPE 구현 기준

## 1. 적용 범위

```txt
대상 route: /admin/stats
대상 component: components/admin/dashboard/AdminStatsDashboard.tsx
```

이번 단계는 통계 화면의 PC A-TYPE section 구조 1차 정리다.

## 2. 구조 기준

```txt
AdminShell
  AdminSection: 운영 누적 지표
    AdminSummaryMetricCards

  AdminSection: 작업흐름분석
    AdminSegmentedTabs
    production / factory / period tab content
```

## 3. 유지한 기능

```txt
- 누적 생산 / 납기 지연율 / 검수·불량률 / 저장소 사용량 계산
- 생산 구성 donut chart
- 업체 성과 table
- 기간별 분석 date range picker
- 기간별 TOP 5 전환
- URL query 기반 section/topMode 유지
```

## 4. 변경한 표현 기준

```txt
- 상단 요약 카드는 “운영 누적 지표” section으로 분리한다.
- 작업흐름분석은 별도 section으로 분리한다.
- 선택 기간은 section action badge로 노출한다.
- chart/table 내부 로직은 변경하지 않는다.
```

## 5. 금지

```txt
- 통계 repository 계산 변경 금지
- 기간 필터 query 동작 변경 금지
- Recharts data shape 변경 금지
- DB/API/R2/권한/세션 흐름 변경 금지
```

## 6. 다음 정리 후보

```txt
- /admin/stats chart tooltip tone 추가 정리
- 통계 empty state를 AdminEmptyState tone 기준으로 더 통일
- tablet/mobile에서는 table을 card list로 전환
- 0.16.x 이후 DeviceKind 기반 레이아웃 분기
```
