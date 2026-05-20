---
title: WAFL A-TYPE System Admin Screens
version: 1.0
baseline_source: peacebypiece-ui-0.15.8
status: draft-final
updated: 2026-05-20
---

# 29. 시스템관리자 화면 A-TYPE 적용 기준

## 1. 범위

이번 기준은 시스템관리자 주요 화면의 shell과 surface 구조를 정리한다.

```txt
대상:
- /system
- /system/companies
- /system/storage-usage

제외:
- /system/audit-logs
- /system/billing
- /system/standards
- /system/category-rules
- 시스템관리자 멤버관리
```

## 2. Shell 원칙

```txt
- 시스템관리자 화면은 SystemShell을 사용한다.
- 고객사 관리자 AdminShell과 시스템관리자 SystemShell을 억지로 합치지 않는다.
- route layout은 접근 권한과 route 경계를 담당한다.
- shell은 화면 배경, page container, 공통 surface 폭을 담당한다.
- 개별 page/component는 도메인 UI와 데이터 표시만 담당한다.
```

## 3. URL 원칙

```txt
- /system URL은 유지한다.
- route group 내부 폴더명은 URL에 노출하지 않는다.
- /system/companies, /system/storage-usage 직접 접근은 기존처럼 유지한다.
```

## 4. 이번 구현

```txt
- /system 홈은 기존 SystemShell 구조를 유지한다.
- /system/companies는 main/div wrapper를 제거하고 SystemShell을 적용한다.
- /system/storage-usage는 main/div wrapper를 제거하고 SystemShell을 적용한다.
- 기존 header, summary, table, purge candidate 동작은 변경하지 않는다.
```

## 5. 후속 작업

```txt
0.15.x 후속:
- /system/audit-logs A-TYPE 정리
- /system/billing A-TYPE 정리
- /system/standards A-TYPE 정리
- /system/category-rules A-TYPE 정리

0.16.x 이후:
- tablet/mobile 전용 구조
- system table → card list 전환
- drawer/sheet 정책 적용
```

## 6. QA

```txt
[ ] /system 홈이 기존 메뉴와 카드 구조를 유지하는가?
[ ] /system/companies 고객사 초대/가입 승인 흐름이 그대로 동작하는가?
[ ] /system/storage-usage 저장소 후보 조회/삭제 요청 흐름이 그대로 동작하는가?
[ ] SystemShell 적용 후 page padding과 max-width가 중복되지 않는가?
[ ] AdminShell과 SystemShell이 섞이지 않았는가?
```
