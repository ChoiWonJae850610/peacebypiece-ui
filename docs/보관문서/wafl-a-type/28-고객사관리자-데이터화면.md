---
title: WAFL A-TYPE Customer Admin Data Screens Implementation
version: 0.15.7
baseline_source: peacebypiece-ui-0.16.47
status: implemented
updated: 2026-05-20
---

# 28. 고객사 관리자 데이터 화면 A-TYPE 적용 기준

## 1. 범위

이번 문서는 고객사 관리자 주요 데이터 화면의 A-TYPE 1차 적용 기준을 정리한다.

대상 화면:

```txt
/admin/files
/admin/stats
/admin/partners
```

## 2. 공통 원칙

```txt
- 기능 로직, API, DB, R2 동작은 변경하지 않는다.
- PC 화면의 surface, panel, table tone을 먼저 정리한다.
- 모바일/태블릿 전용 구현은 다음 단계로 분리한다.
- 고객사 관리자 shell, navigation, route는 유지한다.
```

## 3. 저장소 관리

```txt
/admin/files
```

정리 기준:

```txt
- 페이지 최상위 container는 A-TYPE surface token을 사용한다.
- 휴지통, 작업지시서 저장소, 파일 목록은 기존 동작을 유지한다.
- 삭제/복원/purge action flow는 변경하지 않는다.
- 파일/작업지시서 묶음 행의 선택, 상세, 확인 모달 동작은 유지한다.
```

확인 항목:

```txt
- 저장소 사용량 카드 표시
- 휴지통 새로고침
- 선택 복원
- 선택 삭제
- 비우기
- 작업지시서 묶음 상세/복원/삭제 preview
```

## 4. 통계정보

```txt
/admin/stats
```

정리 기준:

```txt
- 기존 통계 계산 repository와 query scope는 변경하지 않는다.
- 기간 필터, 탭 전환, Top 기준 전환, 차트/테이블 표시는 유지한다.
- A-TYPE 공통 컴포넌트 적용은 단계적으로 진행한다.
```

확인 항목:

```txt
- 누적/기간 지표 표시
- 기간 선택
- 생산품 유형 drill-down
- 업체 성과
- 저장소 사용량 지표
- empty state
```

## 5. 협력업체 관리

```txt
/admin/partners
```

정리 기준:

```txt
- 페이지 최상위 panel을 A-TYPE surface token으로 정리한다.
- 검색, 유형 필터, 상태 필터, 정렬, 행 클릭 동작은 유지한다.
- 협력업체 생성/수정 modal 동작은 변경하지 않는다.
- 기준정보 관리 권한에 따른 외주공정 저장 제한은 기존 권한 guard 기준을 유지한다.
```

확인 항목:

```txt
- 검색
- 유형 필터
- 상태 필터
- 정렬
- 생성/수정 modal
- 외주공정 설정
```

## 6. 다음 단계

```txt
- /admin/files 세부 section token 정리
- /admin/stats 공통 chart/card variant 정리
- /admin/partners modal/form token 정리
- 태블릿/모바일 전환 전 AdminTable → CardList 전략 분리
```
