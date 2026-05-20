---
title: WAFL A-TYPE Data Screens Visual Pass
version: 0.15.16
status: applied
updated: 2026-05-20
---

# 37. 고객사 관리자 데이터 화면 visual pass

## 1. 대상

```txt
/admin/files
/admin/partners
/admin/stats
```

## 2. 목적

0.15.7과 0.15.10에서 저장소, 협력업체, 통계 화면의 A-TYPE section/surface 기준을 1차 정리했지만 visual 체감은 약했다. 0.15.16에서는 기능 로직은 유지하고 상단 hero, 카드 밀도, 주요 정보의 시각 위계를 강화한다.

## 3. 적용 기준

```txt
- 화면 상단에 목적이 분명한 hero surface를 둔다.
- 주요 지표는 hero 또는 hero 바로 아래 큰 카드로 배치한다.
- 필터와 목록은 시각적으로 분리한다.
- 상태/기간/사용량 badge는 semantic tone을 사용한다.
- 테이블·목록 로직, API, DB query는 변경하지 않는다.
```

## 4. 저장소 관리

```txt
- 저장소 요약 영역을 Storage control hero로 감싼다.
- 사용량/파일 운영/파일 유형 3개 핵심 카드를 hero 내부 grid로 배치한다.
- 휴지통 목록은 기존 동작을 유지한다.
```

## 5. 협력업체 관리

```txt
- 협력업체 header와 summary cards를 Partner network hero로 묶는다.
- 업체 추가 버튼은 hero 우측 주요 액션으로 둔다.
- 필터와 목록은 기존 controller/action 흐름을 유지한다.
```

## 6. 통계정보

```txt
- 운영 누적 지표 section을 visual hero 성격으로 강화한다.
- 선택 기간 badge를 상단 action으로 노출한다.
- 통계 계산, 기간 필터, chart rendering은 변경하지 않는다.
```

## 7. 비대상

```txt
- /admin/files 휴지통 restore/purge flow
- /admin/partners create/update modal
- /admin/stats repository/chart data
- DB/API/R2/권한/세션 로직
- 모바일/태블릿 전용 레이아웃
```
