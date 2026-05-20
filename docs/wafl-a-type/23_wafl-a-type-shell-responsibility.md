---
title: WAFL A-TYPE Shell Responsibility
version: 0.1
baseline_source: peacebypiece-ui-0.15.1
status: draft-final
updated: 2026-05-20
---

# 23. Shell 책임 분리 기준

## 1. 목적

0.15.1에서 route group을 도입한 뒤, 0.15.2부터는 화면을 A-TYPE으로 바꾸기 전에 shell 책임을 고정한다.

이 문서는 고객사 관리자 shell, 시스템관리자 shell, 일반 멤버 workspace shell의 책임을 분리해 이후 UI 전환 중 화면 구조가 섞이지 않게 하는 기준이다.

## 2. 공통 원칙

```txt
- URL은 유지한다.
- route group 이름은 URL에 노출하지 않는다.
- layout은 접근권한/서비스 상태/gate를 담당한다.
- shell은 화면 프레임, topbar, sidebar, content container를 담당한다.
- page는 데이터 조회와 domain component 조립을 담당한다.
- primitive component는 admin/system/workspace가 공유할 수 있다.
- 도메인별 shell을 억지로 하나로 합치지 않는다.
```

## 3. AdminShell

대상:

```txt
/admin
/admin/members
/admin/settings
/admin/files
/admin/stats
/admin/partners
```

책임:

```txt
- 고객사 관리자 및 승인 멤버의 업무 프레임
- AdminThemeScope 적용
- 고객사명, 앱 버전, 페이지 제목 표시
- 홈 버튼: /admin
- 사람 아이콘: 개인설정 modal
- 톱니바퀴: /admin/settings, company_admin만 표시
- 로그아웃
- 콘텐츠 scroll/fixed mode 관리
```

금지:

```txt
- 시스템관리자 전용 navigation을 넣지 않는다.
- 고객사 onboarding/access gate를 shell 내부로 넣지 않는다. 해당 처리는 /admin layout에서 한다.
- 화면별 business logic을 shell에 넣지 않는다.
```

## 4. SystemShell

대상:

```txt
/system
/system/companies
/system/storage-usage
/system/audit-logs
/system/standards
/system/billing
```

책임:

```txt
- 시스템관리자 전용 화면의 공통 page background
- page width/container 관리
- system semantic token 사용 기준 제공
- 시스템관리자 화면이 AdminShell에 의존하지 않도록 분리
```

현재 0.15.2에서는 `SystemShell`을 추가하고 `/system` 홈부터 적용한다.
기존 시스템관리자 하위 화면은 후속 패치에서 순차 적용한다.

금지:

```txt
- 고객사 관리자 테마 설정을 system shell에 직접 연결하지 않는다.
- 고객사 회사명/개인설정/고객사 환경설정 topbar를 system shell에 섞지 않는다.
- system page의 데이터 조회 로직을 shell에 넣지 않는다.
```

## 5. Workspace / Worker Shell

대상:

```txt
/workspace
/worker
```

책임:

```txt
- 일반 멤버의 업무 진입 화면
- 작업지시서 중심 업무 화면
- PC/태블릿/모바일 대응 확장 지점
```

후속 작업:

```txt
0.16.x에서 DeviceKind 도입 후 별도 정리한다.
```

## 6. Route layout과 shell 책임 구분

```txt
app/(admin)/admin/layout.tsx
- requireWaflSessionForArea("admin")
- company access state 조회
- AdminCompanyAccessGate
- AdminCompanyOnboardingGate

components/admin/layout/AdminShell.tsx
- AdminThemeScope
- AdminTopbar
- content frame

app/(system)/system/layout.tsx
- requireWaflSessionForArea("system")

components/system/layout/SystemShell.tsx
- system page background
- system content container
```

## 7. A-TYPE 적용 순서

```txt
1. shell 책임 분리
2. Admin common component variant 정리
3. Login / Invite / Error 화면 적용
4. 고객사 관리자 주요 화면 적용
5. 시스템관리자 주요 화면 적용
6. DeviceKind 도입
7. 모바일/태블릿 전용 구조 확장
```
