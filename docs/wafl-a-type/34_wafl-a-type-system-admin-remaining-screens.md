---
title: WAFL A-TYPE System Admin Remaining Screens
version: 1.0
baseline_source: peacebypiece-ui-0.15.13
status: updated
updated: 2026-05-20
---

# 34. 시스템관리자 잔여 화면 A-TYPE 적용 기준

## 1. 대상

```txt
/system/invites
/system/access-checkpoint
/system/standards/regression
/system/standards/seed-status
```

## 2. 적용 원칙

```txt
- URL은 변경하지 않는다.
- SystemShell을 시스템관리자 화면의 외곽 wrapper로 사용한다.
- page-level main/min-h-screen wrapper 중복을 제거한다.
- 기능/API/DB 저장 로직은 변경하지 않는다.
- 개발 점검 화면도 일반 시스템관리자 화면과 같은 surface/token 기준을 사용한다.
```

## 3. /system/invites

`/system/invites`는 독립 화면이 아니라 `/system/companies`로 redirect되는 호환 route로 유지한다.

```txt
- 초대 링크 생성과 고객사 승인 관리는 /system/companies에서 처리한다.
- 과거 링크 또는 북마크가 /system/invites를 가리켜도 /system/companies로 이동한다.
- 별도 UI shell을 만들지 않는다.
```

## 4. /system/access-checkpoint

안정화 점검 화면이다.

```txt
- SystemShell 적용
- 점검 범위/점검 항목/화면 안정/실제 연결 대기 요약 카드 유지
- 그룹별 체크 항목과 route link 유지
- 다음 실제 연결 후보 영역 유지
- raw stone 기반 배경/텍스트 class를 semantic token 기준으로 축소
```

## 5. /system/standards/regression

기준정보 DB-only 회귀 점검 화면이다.

```txt
- SystemShell 적용
- DB mode/ready summary panel 유지
- 각 check card와 value label 유지
- 회귀 점검 repository/API 로직 변경 금지
- 상태색은 status token 또는 AdminStatusBadge tone을 사용한다.
```

## 6. /system/standards/seed-status

기준정보 seed 상태 점검 화면이다.

```txt
- SystemShell 적용
- seed ready summary panel 유지
- 기준정보 item card 유지
- seed 안내 문구와 SQL 경로 표시 유지
- seedStatusRepository 로직 변경 금지
```

## 7. 확인 항목

```txt
[ ] /system/invites가 /system/companies로 redirect되는가?
[ ] /system/access-checkpoint가 SystemShell 기준으로 표시되는가?
[ ] /system/standards/regression이 SystemShell 기준으로 표시되는가?
[ ] /system/standards/seed-status가 SystemShell 기준으로 표시되는가?
[ ] page padding/max-width가 중복 적용되지 않는가?
[ ] 각 화면의 기존 버튼/link/API 동작이 유지되는가?
```
