---
title: WAFL A-TYPE Router Layout Implementation
version: 0.15.1
baseline_source: peacebypiece-ui-0.15.0
status: applied
audience: developer
updated: 2026-05-20
---

# 22. Router / Layout 구현 기준

## 1. 목적

0.15.1에서는 A-TYPE 화면 전환 전에 Next.js App Router의 내부 폴더 구조를 route group 기준으로 정리한다.

핵심 목표는 다음과 같다.

```txt
- 사용자에게 보이는 URL은 유지한다.
- 내부 app 폴더는 public / admin / system / workspace 영역으로 분리한다.
- 고객사 관리자, 시스템관리자, 작업자/멤버 영역의 layout 책임을 분리한다.
- 이후 PC A-TYPE UI 적용과 모바일/태블릿 확장을 위한 기반을 만든다.
```

## 2. Route Group 구조

Next.js route group의 괄호 폴더명은 URL에 노출되지 않는다.

0.15.1 기준 구조는 다음과 같다.

```txt
app/
  layout.tsx
  globals.css
  favicon.ico

  (public)/
    page.tsx                 → /
    login/page.tsx           → /login
    pending/page.tsx         → /pending
    service-paused/page.tsx  → /service-paused
    invite/...               → /invite/...

  (admin)/
    admin/layout.tsx         → /admin layout
    admin/page.tsx           → /admin
    admin/members/page.tsx   → /admin/members
    admin/settings/page.tsx  → /admin/settings
    ...

  (system)/
    system/layout.tsx        → /system layout
    system/page.tsx          → /system
    system/companies/page.tsx
    ...

  (workspace)/
    workspace/layout.tsx     → /workspace layout
    workspace/page.tsx       → /workspace
    worker/layout.tsx        → /worker layout
    worker/page.tsx          → /worker
```

## 3. URL 유지 정책

이번 정리는 내부 폴더 구조만 변경한다.

유지해야 하는 public URL은 다음과 같다.

```txt
/
/login
/pending
/service-paused
/invite/company/[token]
/invite/member/[token]
/invite/error
/admin
/admin/members
/admin/settings
/admin/files
/admin/stats
/admin/partners
/system
/system/companies
/system/storage-usage
/workspace
/worker
```

route group 이름인 `(public)`, `(admin)`, `(system)`, `(workspace)`는 URL에 나타나면 안 된다.

## 4. Layout 책임

### 4.1 RootLayout

RootLayout은 전역 provider만 담당한다.

```txt
- Theme provider
- i18n provider
- Current user provider
- Repository provider
- global CSS
```

특정 권한이나 회사 상태는 RootLayout에 넣지 않는다.

### 4.2 Public routes

Public 영역은 로그인, 초대, 승인대기, 서비스 중지 같은 진입/예외 화면을 담당한다.

```txt
- auth guard를 기본 적용하지 않는다.
- 필요한 경우 page 단위에서 token/session을 확인한다.
- 로그인 문구와 초대 화면은 A-TYPE 특수 화면 기준을 적용한다.
```

### 4.3 Admin routes

Admin 영역은 고객사 관리자와 승인된 고객사 멤버가 접근하는 업무 관리 영역이다.

```txt
- requireWaflSessionForArea("admin")
- company access guard
- onboarding gate
- trial/service paused 상태 처리
```

AdminShell은 고객사 관리자 중심으로 유지한다.

### 4.4 System routes

System 영역은 시스템관리자 전용 영역이다.

```txt
- requireWaflSessionForArea("system")
- 고객사 onboarding gate와 분리
- SystemConsoleShell 또는 system 전용 shell 사용
```

AdminShell과 억지로 합치지 않는다.

### 4.5 Workspace / Worker routes

Workspace와 Worker는 일반 멤버/작업자 영역이다.

```txt
- requireWaflSessionForArea("worker")
- 작업지시서 및 개인 업무 중심
- PC A-TYPE 적용 후 태블릿/모바일 구조를 별도 확장한다.
```

## 5. 다음 리팩토링 기준

0.15.1 이후에는 아래 순서로 진행한다.

```txt
0.15.2 — AdminShell / SystemShell 책임 정리
0.15.3 — Admin 공통 컴포넌트 A-TYPE variant 1차
0.15.4 — Login / Invite / Error A-TYPE
0.15.5 — 고객사 관리자 주요 화면 A-TYPE
0.15.6 — 시스템관리자 주요 화면 A-TYPE
0.16.x — 태블릿/모바일 DeviceKind 및 화면 확장
```

## 6. 금지

```txt
- route group 정리 중 URL 변경 금지
- /admin, /system, /workspace, /worker 경로 변경 금지
- public route에 admin guard 섞기 금지
- system route에 고객사 onboarding gate 섞기 금지
- 모바일/태블릿 화면 구현을 이번 단계에 섞지 않기
```
