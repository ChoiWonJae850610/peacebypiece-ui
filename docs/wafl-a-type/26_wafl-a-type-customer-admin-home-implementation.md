---
title: WAFL A-TYPE Customer Admin Home Implementation
version: 0.15.5
baseline_source: peacebypiece-ui-0.15.4
status: applied
updated: 2026-05-20
---

# 26. 고객사 관리자 홈 A-TYPE 적용 1차

## 1. 목적

0.15.5는 고객사 관리자 메인(`/admin`)을 A-TYPE 기준으로 정리하는 1차 작업이다.

범위는 PC 고객사 관리자 홈의 구조와 시각 기준 정리에 한정한다.  
모바일/태블릿 전용 레이아웃, DB/API/R2/권한/세션 흐름은 수정하지 않는다.

## 2. 적용 대상

```txt
app/(admin)/admin/page.tsx
components/admin/dashboard/AdminOperationsDashboard.tsx
components/admin/dashboard/AdminConsoleSections.tsx
```

## 3. 적용 기준

```txt
- AdminShell 안에서 고객사 관리자 홈을 유지한다.
- 운영 대시보드는 작업지시서 흐름을 먼저 보여준다.
- 업무 바로가기는 A-TYPE 카드 그리드로 정리한다.
- 고객사 관리자 홈의 주요 카드 구성은 다음 5개로 유지한다.
  - 작업지시서 업무 화면
  - 협력업체 관리
  - 저장소 관리
  - 통계정보
  - 멤버 관리
- 환경설정은 홈 카드에서 제외하고 상단 톱니바퀴 진입을 유지한다.
```

## 4. 구현 원칙

```txt
- 신규 raw hex 색상 class를 추가하지 않는다.
- 공개/시스템 화면과 고객사 관리자 홈을 섞지 않는다.
- Admin 공통 컴포넌트 variant를 우선 사용한다.
- 권한/세션/DB 조회 흐름을 변경하지 않는다.
- 모바일/태블릿 대응은 구조만 막지 않고 후속 버전에서 처리한다.
```

## 5. 다음 단계

```txt
0.15.6 — 고객사 관리자 주요 화면 A-TYPE 적용 2차
대상 후보:
- /admin/members
- /admin/settings
- /admin/files
- /admin/stats
- /admin/partners
```
