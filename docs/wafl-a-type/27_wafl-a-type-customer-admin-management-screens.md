---
title: WAFL A-TYPE Customer Admin Management Screens
version: 0.1
baseline_source: peacebypiece-ui-0.15.6
status: applied
updated: 2026-05-20
---

# 27. 고객사 관리자 관리 화면 A-TYPE 적용 기준

## 1. 대상

```txt
/admin/members
/admin/settings
```

## 2. 적용 범위

```txt
- 고객사 관리자 홈 이후의 2차 관리 화면을 A-TYPE 공통 섹션 구조로 정리한다.
- 멤버관리와 환경설정은 같은 AdminShell 안에서 동작하되, 화면 목적은 분리한다.
- 기능/API/DB/R2/권한 로직은 직접 목표가 아니면 변경하지 않는다.
```

## 3. 멤버관리 화면

### 3.1 구조

```txt
SummaryCards
A-TYPE Section Header
SegmentedTabs
Invite Builder / Invitation Table
Member Directory / Permission Modal
```

### 3.2 원칙

```txt
- 상단 요약 카드는 재직중 / 승인 대기 / 퇴사·비활성 기준을 유지한다.
- 초대 링크 수는 멤버 상태 요약이 아니라 초대 탭 내부에서 확인한다.
- 탭 전환 헤더는 AdminSection 구조를 사용한다.
- 초대 생성과 멤버 목록은 AdminPanelSection 구조를 유지한다.
- 권한 모달은 기존 dirty/focus/닫기 정책을 깨지 않는다.
```

## 4. 환경설정 화면

### 4.1 구조

```txt
A-TYPE Settings Hub
Settings Menu Cards
Account / Standards / Billing / Feedback Panels
```

### 4.2 원칙

```txt
- 환경설정은 고객사 관리자 홈 카드가 아니라 상단 톱니바퀴 진입을 유지한다.
- 개인별 언어/테마 설정은 개인 설정에서 관리한다.
- 회사 정보 변경, 계정 비활성화, 요금제 변경 요청은 시스템관리자 검토 흐름으로 분리한다.
- raw Tailwind color class를 줄이고 pbp semantic token을 사용한다.
```

## 5. PC 우선 정책

```txt
- 이번 단계는 PC 화면 정리다.
- 모바일/태블릿 전용 layout은 구현하지 않는다.
- 다만 이후 card list, sheet, tablet portrait 전환을 막는 구조는 만들지 않는다.
```

## 6. 다음 단계

```txt
0.15.7 — 고객사 관리자 저장소/통계/협력업체 화면 A-TYPE 1차
0.15.8 — 시스템관리자 주요 화면 A-TYPE 1차
0.16.x — DeviceKind 및 모바일/태블릿 본격 적용
```
