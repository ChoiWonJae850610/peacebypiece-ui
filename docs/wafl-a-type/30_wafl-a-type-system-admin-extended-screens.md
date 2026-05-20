---
title: WAFL A-TYPE System Admin Extended Screens
version: 1.0
baseline_source: peacebypiece-ui-0.15.9
status: implemented
updated: 2026-05-20
---

# 30. 시스템관리자 확장 화면 A-TYPE 구현 기준

## 1. 적용 범위

```txt
/system/audit-logs
/system/billing
/system/standards
```

0.15.8에서 `/system`, `/system/companies`, `/system/storage-usage`에 적용한 SystemShell 기준을 확장 화면에도 적용한다.

## 2. 구현 원칙

```txt
- 시스템관리자 화면은 고객사 관리자 AdminShell과 통합하지 않는다.
- SystemShell은 system route의 page padding, background, max width를 담당한다.
- 화면 컴포넌트는 header, summary, table, policy section 등 content 구조만 담당한다.
- 기능 로직, API, DB, R2, 권한, 세션 흐름은 직접 목표가 아니면 수정하지 않는다.
```

## 3. 이번 적용 내용

```txt
감사로그:
- SystemShell wrapper 적용
- header/card/table 주변 surface를 semantic token 기준으로 보정
- 감사로그 조회/필터/테이블 데이터 구조 변경 없음

요금제:
- SystemShell wrapper 적용
- skeleton 설계 화면의 header/card/input surface를 semantic token 기준으로 보정
- 실제 요금제 변경 API 연결 없음

기준정보:
- SystemShell wrapper 적용
- sample row/table/card surface를 semantic token 기준으로 보정
- 기준정보 설계 데이터와 하위 route 변경 없음
```

## 4. 후속 후보

```txt
/system/category-rules
/system/standards/processes
/system/standards/units
/system/standards/product-templates
/system/standards/regression
/system/standards/seed-status
```

위 화면들은 구조와 인터랙션이 더 복잡하므로 별도 버전에서 처리한다.

## 5. QA

```txt
[ ] /system/audit-logs 접속 시 page padding이 중복되지 않는가?
[ ] /system/billing 접속 시 요금제 skeleton 화면이 기존처럼 표시되는가?
[ ] /system/standards 접속 시 기준정보 설계 화면이 기존처럼 표시되는가?
[ ] 감사로그 필터 query가 기존대로 유지되는가?
[ ] SystemShell 적용 후 화면 폭이 과도하게 좁아지지 않는가?
[ ] 고객사 관리자 /admin 화면에는 영향이 없는가?
```
