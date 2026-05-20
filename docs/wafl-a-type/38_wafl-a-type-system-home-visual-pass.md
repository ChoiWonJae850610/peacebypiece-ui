---
title: WAFL A-TYPE System Home Visual Pass
version: 1.0
baseline_source: peacebypiece-ui-0.15.16
status: applied
updated: 2026-05-20
---

# 38. 시스템관리자 홈 visual pass

## 1. 목적

`/system` 홈은 시스템관리자가 고객사 운영, 저장소 삭제, 감사로그, 요금제, 기준정보로 진입하는 첫 화면이다.

0.15.17에서는 기존 navigation card 중심 화면을 다음 기준으로 보정한다.

```txt
- 큰 brand hero block
- 주요 운영 진입 3개 quick card
- 시스템 운영 통계 overview 직접 노출
- 운영 메뉴 card grid 유지
```

## 2. 적용 범위

```txt
대상:
- /system
- components/system/SystemConsoleShell.tsx

제외:
- /system/companies
- /system/storage-usage
- /system/audit-logs
- /system/billing
- /system/standards
- DB/API/R2/권한/세션 로직
```

## 3. 화면 구조

```txt
SystemShell
  System visual hero
    좌측: 시스템관리자 메시지 / version / action
    우측: 고객사 운영 / 저장소 삭제 / 감사 로그 quick cards
  SystemStatsOverview
  운영 메뉴 card grid
```

## 4. 유지 원칙

```txt
- 시스템관리자 shell과 고객사 관리자 shell은 분리한다.
- URL은 변경하지 않는다.
- 기존 navigation target은 유지한다.
- visual pass는 기능 변경과 분리한다.
- 모바일/태블릿 전용 구현은 DeviceKind 이후 진행한다.
```

## 5. QA

```txt
[ ] /system 접속 시 큰 brand hero block이 보이는가?
[ ] 고객사 관리, 저장소 삭제, 감사 로그 quick card가 보이는가?
[ ] 시스템 통계 overview가 홈에서 보이는가?
[ ] 운영 메뉴 card link가 기존 URL로 이동하는가?
[ ] /system/companies, /system/storage-usage 기존 동작이 깨지지 않는가?
```
