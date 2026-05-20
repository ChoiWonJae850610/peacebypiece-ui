---
title: WAFL A-TYPE Source Refactor Audit
version: 0.1
baseline_source: peacebypiece-ui-0.14.9
status: draft-final
updated: 2026-05-20
---

# 21. A-TYPE 적용 전 소스 구조 감사

## 1. 목적

이 문서는 WAFL A-TYPE UI 적용 전에 현재 소스 구조를 점검하고, 바로 화면 작업으로 들어가기 전에 정리해야 할 router, layout, shell, component, permission, i18n, responsive 리스크를 분리한다.

이번 감사는 기능 수정이 아니라 다음 작업 순서를 정하기 위한 기준 문서다.

```txt
기준 소스: peacebypiece-ui-0.14.9
목표 버전: 0.15.0
빌드: 실행하지 않음
범위: app router / layout / shell / common components / UI debt / route visibility / A-TYPE 적용 순서
```

## 2. 전체 판단

```txt
바로 A-TYPE 화면 작업으로 들어가는 것은 가능하지만 권장하지 않는다.
먼저 router/layout/shell 구조를 안정화한 뒤 공통 컴포넌트와 화면 전환으로 가는 것이 안전하다.
```

주요 이유:

```txt
- 현재 app route 구조는 URL과 내부 폴더 구조가 직접 연결되어 있다.
- route group이 아직 없어 public/admin/system/workspace/worker 경계를 구조적으로 숨기지 못한다.
- AdminShell은 고객사 관리자 화면 중심이고 시스템관리자 화면은 별도 패턴이 섞여 있다.
- PC 고정 layout과 responsive layout 정책이 아직 분리되어 있지 않다.
- raw Tailwind color class와 hardcoded Korean text가 아직 많이 남아 있다.
- 일부 client component가 직접 fetch를 수행한다.
- 권한 UI와 API guard는 최근 보정됐지만 route inventory 전체 기준의 일괄 검증은 아직 필요하다.
```

## 3. 현재 route 구조

현재 `app` 주요 경로:

```txt
/
login
admin
system
workspace
worker
invite
pending
service-paused
me/settings
api
```

현재 내부 route group:

```txt
없음
```

즉, 현재 구조는 대체로 다음과 같다.

```txt
app/admin        → /admin
app/system       → /system
app/workspace    → /workspace
app/worker       → /worker
app/invite       → /invite
app/login        → /login
```

### 3.1 root와 login

```txt
app/page.tsx      → WaflLoginPage
app/login/page.tsx → WaflLoginPage
```

현재 `/`와 `/login`은 같은 로그인 화면을 렌더링한다. 사용자가 말한 “위치가 바뀌어도 / 위치로 그대로 보이게”라는 요구는 다음 중 하나로 정리할 수 있다.

```txt
A. / 를 대표 로그인 URL로 유지하고 /login은 보조 URL 또는 redirect로 둔다.
B. /login을 대표 로그인 URL로 두고 / 는 role별 redirect entry로 둔다.
C. route group을 도입해 내부 폴더 구조를 정리하되 URL은 그대로 유지한다.
```

추천은 C다. 내부 구조는 route group으로 정리하고, 사용자가 보는 URL은 `/`, `/admin`, `/system`, `/worker`를 유지한다.

## 4. route group 권장 구조

현재 URL을 바꾸지 않는 전제에서 다음 구조를 권장한다.

```txt
app/
  (public)/
    login/
    invite/
    pending/
    service-paused/
  (system)/
    system/
  (admin)/
    admin/
    me/
  (workspace)/
    workspace/
    worker/
  api/
```

중요 원칙:

```txt
- route group 이름은 URL에 노출되지 않는다.
- 기존 public URL은 유지한다.
- /admin, /system, /workspace, /worker, /invite 경로는 바꾸지 않는다.
- route group 도입은 기능 변경이 아니라 내부 구조 정리다.
```

적용 우선순위:

```txt
1. app/(public) route group
2. app/(admin) route group
3. app/(system) route group
4. app/(workspace) route group
```

한 번에 모두 옮기지 말고 한 버전에서 public/admin만 먼저 정리하는 것이 안전하다.

## 5. layout / shell 감사

### 5.1 RootLayout

현재 전역 provider는 다음을 감싼다.

```txt
PbpThemeProvider
I18nProvider
CurrentUserProvider
WorkorderRepositoryProvider
```

판단:

```txt
유지한다.
A-TYPE UI 전환에서 건드리지 않는다.
다만 WorkorderRepositoryProvider가 모든 route에 전역 적용되는 구조는 장기적으로 route group별 provider 분리 후보로 둔다.
```

### 5.2 AdminLayout

현재 `/admin` layout은 다음 gate를 포함한다.

```txt
requireWaflSessionForArea("admin", { allowBlockedCompanyAccess: true })
AdminCompanyAccessGate
AdminCompanyOnboardingGate
```

판단:

```txt
고객사 관리자 회사 접근/온보딩 흐름은 AdminLayout에 남겨도 된다.
A-TYPE 화면 작업 중 이 gate를 건드리지 않는다.
```

### 5.3 SystemLayout

현재 `/system` layout은 `requireWaflSessionForArea("system")`만 수행한다.

판단:

```txt
시스템관리자 shell은 page/component 단위에서 따로 구성되어 있다.
A-TYPE 전환 전 SystemShell 또는 SystemConsoleShell 기준을 명확히 해야 한다.
```

### 5.4 Workspace / Worker Layout

현재 `/workspace`와 `/worker`는 모두 `requireWaflSessionForArea("worker")`를 사용한다.

판단:

```txt
일반 멤버 홈과 작업지시서 업무 화면 경계가 명확해야 한다.
workspace = 멤버 홈
worker = 작업지시서 업무 화면
으로 문서와 코드 기준을 맞춘다.
```

## 6. AdminShell 감사

현재 `components/admin/layout/AdminShell.tsx`는 다음 특징이 있다.

```txt
- fixed inset-0 기반 전체 화면 shell
- max-w-[1480px] content frame
- AdminTopbar 포함
- background에 직접 gradient class 사용
- text-stone 계열 class 사용
- sidebar prop은 있지만 실제 sidebar rendering은 없음
```

판단:

```txt
A-TYPE 적용 전 AdminShell을 바로 대규모 수정하지 않는다.
먼저 AdminShell v1 기준을 문서화하고, PC/Tablet/Mobile shell 분리는 후속 단계로 둔다.
```

선행 정리 후보:

```txt
- background gradient를 semantic token 또는 system class로 이동
- contentMode 기준 명확화
- navigationItems prop 사용 여부 정리
- sidebar가 없는 구조를 dashboard-card navigation으로 확정
- mobile/tablet shell은 별도 컴포넌트로 분리
```

## 7. System shell 감사

시스템관리자 화면은 `SystemConsoleShell`, `systemSemanticClassNames`, 각 system page component가 섞여 있다.

판단:

```txt
고객사 관리자 AdminShell과 같은 컴포넌트로 무리하게 합치지 않는다.
공통 primitive는 공유하되 SystemShell은 별도 유지한다.
```

선행 정리 후보:

```txt
- SystemConsoleShell navigation card 구조 정리
- systemSemanticClassNames를 A-TYPE token alias와 매칭
- system page별 PageHeader/SummaryCards/List template 적용 여부 점검
```

## 8. 공통 컴포넌트 감사

현재 유지·정리할 공통 컴포넌트:

```txt
AdminButton
AdminIconButton
AdminCard
AdminTable
AdminFilterBar
AdminEmptyState
AdminStatusBadge
AdminSummaryMetricCards
AdminSegmentedTabs
AdminDateRangePicker
AdminModal
```

판단:

```txt
기존 Admin* 컴포넌트를 버리지 않고 A-TYPE 기준으로 승격한다.
새 Wafl* primitive를 즉시 만들기보다 Admin*를 먼저 안정화한다.
```

위험:

```txt
공통 컴포넌트를 한 번에 바꾸면 기존 모달, 테이블, 저장소, 멤버관리 화면에 회귀가 생길 수 있다.
```

적용 순서:

```txt
1. AdminButton / AdminCard / AdminStatusBadge
2. AdminEmptyState / AdminFilterBar
3. AdminModal
4. AdminTable
5. DateRange / SegmentedTabs
```

## 9. UI debt 수치 감사

0.14.9 소스 기준 간단 검색 결과:

```txt
raw arbitrary color class 후보: 약 90건
stone 계열 class 후보: 약 1,346건
slate 계열 class 후보: 약 9건
hardcoded Korean string 후보: 약 6,457건
client/component fetch 후보: 18개 컴포넌트, 약 46건
```

주의:

```txt
이 수치는 단순 검색 결과다.
문서, 주석, 허용 가능한 상수까지 포함될 수 있으므로 바로 삭제 대상으로 보면 안 된다.
```

우선 점검 파일:

```txt
components/auth/WaflLoginPage.tsx
components/invitations/CompanyInvitationJoinRequestPage.tsx
components/invitations/MemberInvitationJoinRequestPage.tsx
app/invite/error/page.tsx
components/admin/layout/AdminShell.tsx
components/admin/members/AdminMemberManagementDashboard.tsx
components/system/companies/SystemCompanyApprovalConsole.tsx
components/system/standards/*
```

## 10. fetch / action layer 감사

현재 일부 client component에서 직접 fetch를 수행한다.

예시 후보:

```txt
components/invitations/CompanyInvitationJoinRequestPage.tsx
components/invitations/MemberInvitationJoinRequestPage.tsx
components/invitations/PendingApprovalDashboard.tsx
components/me/PersonalSettingsPage.tsx
components/system/companies/SystemCompanyApprovalConsole.tsx
components/admin/companies/AdminCompanyOnboardingGate.tsx
components/admin/members/AdminMemberManagementDashboard.tsx
components/admin/settings/AdminSettingsHub.tsx
```

판단:

```txt
즉시 전부 제거하지 않는다.
A-TYPE 전환과 동시에 API 호출 구조를 대규모로 바꾸면 회귀 위험이 높다.
```

권장:

```txt
- 화면 UI 전환 전에는 fetch 제거를 목표로 하지 않는다.
- 기능 안정화가 필요한 화면부터 api client / action hook으로 분리한다.
- 초대/멤버/온보딩처럼 상태가 복잡한 화면은 별도 action hook 분리를 우선한다.
```

## 11. 권한 / route guard 감사

현재 큰 틀:

```txt
/system → system_admin
/admin → company_admin
/worker → member 또는 company_admin
/workspace → worker area guard 사용
```

판단:

```txt
routeGuard는 현재 유지한다.
다만 /workspace와 /worker가 모두 worker area로 묶이는 구조는 문서화가 필요하다.
```

후속 점검:

```txt
- /workspace 접근 권한: member와 company_admin 모두 허용 유지 여부
- /worker 접근 권한: 작업지시서 권한이 없는 member가 직접 접근할 때 처리
- /admin 하위 직접 URL 접근: company_admin만 허용
- API guard: UI 숨김과 서버 차단 동시 적용 여부
```

## 12. 문서와 실제 코드 불일치 후보

### 12.1 Sidebar

문서에는 PC에서 좌측 고정 사이드바 기준이 있으나, 고객사 관리자 IA는 최근 dashboard-card navigation으로 결정되었다.

정리 기준:

```txt
고객사 관리자:
- 좌측 sidebar 없음
- dashboard-card navigation 유지
- 상단 Topbar 유지

시스템관리자:
- 현재는 카드 navigation 중심
- 필요 시 별도 system shell에서 정리
```

### 12.2 Admin home cards

문서와 최근 결정 기준:

```txt
고객사 관리자 홈:
- 작업지시서 업무 화면
- 협력업체 관리
- 저장소 관리
- 통계정보
- 멤버 관리

환경설정:
- 홈 카드가 아니라 상단 톱니바퀴 진입
```

### 12.3 workspace / worker

정리 기준:

```txt
/workspace: 일반 멤버 홈
/worker: 작업지시서 업무 화면
```

## 13. 바로 수정하지 말아야 할 영역

A-TYPE 전환 중 다음은 직접 목표가 아니면 건드리지 않는다.

```txt
- R2 upload/delete/purge
- workorder attachments/memos
- storage trash restore/delete/purge
- company onboarding final submit
- member invitation token flow
- Google OAuth callback
- DB schema/full_reset
- billing access guard
```

## 14. 권장 작업 순서

### 0.15.1 — Router/Layout 구조 정리 1차

```txt
목표:
- route group 도입 가능성 반영
- URL 유지
- public/admin/system/workspace 내부 경계 정리
- layout 중복과 shell 책임 문서 기준으로 정리

수정 후보:
- app/(public)/*
- app/(admin)/*
- app/(system)/*
- app/(workspace)/*
- layout imports 경로 확인
```

주의:

```txt
한 번에 route 전체 이동은 위험하다.
먼저 public/admin route group만 적용하고 build 확인 후 system/workspace로 확장한다.
```

### 0.15.2 — AdminShell / SystemShell 책임 정리

```txt
목표:
- 고객사 관리자 shell과 시스템관리자 shell을 억지로 합치지 않는다.
- 공통 primitive만 공유한다.
- AdminShell의 raw color/background를 token class로 이동한다.
- contentMode / navigationItems prop 정리 여부 판단.
```

### 0.15.3 — Admin 공통 컴포넌트 A-TYPE variant 1차

```txt
대상:
- AdminButton
- AdminCard
- AdminStatusBadge
- AdminEmptyState
```

### 0.15.4 — Login / Invite / Error A-TYPE

```txt
대상:
- WaflLoginPage
- CompanyInvitationJoinRequestPage
- MemberInvitationJoinRequestPage
- invite error page
- pending/service-paused page
```

### 0.15.5 — 고객사 관리자 주요 화면 A-TYPE

```txt
대상:
- /admin
- /admin/members
- /admin/settings
- /admin/files
- /admin/stats
- /admin/partners
```

### 0.15.6 — 시스템관리자 주요 화면 A-TYPE

```txt
대상:
- /system
- /system/companies
- /system/storage-usage
- /system/audit-logs
- /system/settings 또는 기준정보
```

### 0.15.7 — DeviceKind / responsive foundation

```txt
목표:
- pc / tablet-landscape / tablet-portrait / mobile 판정 도입
- PC 브라우저 축소와 실제 mobile/tablet 구분
- 작업지시서 drawing orientation guard 준비
```

## 15. 최종 결정

```txt
다음 작업은 바로 화면을 예쁘게 바꾸는 것이 아니라 Router/Layout 구조 정리 1차가 맞다.
```

권장 다음 버전:

```txt
0.15.1 — Router/Layout 구조 정리 1차
```

수정 원칙:

```txt
- URL 변경 금지
- 기능 동작 변경 최소화
- route group 도입은 내부 폴더 구조 정리로만 사용
- /, /login, /admin, /system, /workspace, /worker, /invite 경로 유지
- build 후 직접 URL 접근 테스트 필수
```
