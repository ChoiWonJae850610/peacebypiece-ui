---
title: WAFL A-TYPE Refactor Roadmap
version: 1.0
baseline_source: peacebypiece-ui-0.15.6
status: draft-final
updated: 2026-05-20
---

# 12. A-TYPE 전환 로드맵

## 1. 현재 기준

```txt
현재 기준: 0.15.6
완료:
- 고객사 초대/온보딩/승인 흐름 1차
- 멤버 초대 링크 단순화
- 권한 4개 구조 1차
- 고객사 관리자 홈 IA 일부 정리
- A-TYPE 문서 00~20 정리
- semantic token 1차
- legacy docs 정리
- route group 기반 Router/Layout 구조 1차 정리
- AdminShell/SystemShell 책임 분리 1차
- Admin 공통 컴포넌트 variant 1차
- Login / Invite / Error A-TYPE 1차
- 고객사 관리자 홈 A-TYPE 1차
- 고객사 관리자 멤버관리/환경설정 A-TYPE 1차
```

## 2. 전환 원칙

```txt
- 작은 버전 단위로 진행한다.
- URL은 변경하지 않는다.
- 기능/DB/API/R2/권한/세션 흐름은 직접 목표가 아니면 건드리지 않는다.
- UI 전환 전 router/layout/shell 책임을 먼저 정리한다.
- Admin* 공통 컴포넌트는 버리지 않고 A-TYPE 기준으로 승격한다.
- PC 기준 안정화 후 tablet/mobile로 확장한다.
```

## 3. 0.15.x — 소스 구조와 PC A-TYPE 기반

### 0.15.0 — 소스 구조 감사

```txt
- app route 구조 감사
- layout/shell 구조 감사
- route group 적용 방향 정리
- AdminShell/SystemShell 책임 분리
- UI debt 후보 집계
- 21번 감사 문서 추가
```

### 0.15.5 — 고객사 관리자 주요 화면 A-TYPE

```txt
- URL 유지
- route group 도입 가능성 반영
- public/admin/system/workspace 경계 정리
- layout 중복 최소화
- 직접 URL 접근 테스트
```

### 0.15.2 — AdminShell / SystemShell 책임 정리

```txt
- 고객사 관리자 shell과 시스템관리자 shell을 억지로 합치지 않음
- 공통 primitive만 공유
- AdminShell raw color/background token화
- SystemShell 기본 wrapper 추가
- SystemConsoleShell에 SystemShell 1차 적용
- 23번 shell 책임 분리 문서 추가
```

### 0.15.3 — Admin 공통 컴포넌트 A-TYPE variant 1차

```txt
- AdminButton size lg 추가
- AdminCard surface variant 추가
- AdminStatusBadge tone을 A-TYPE semantic token으로 매핑
- AdminEmptyState tone을 A-TYPE surface token으로 매핑
- AdminFilterBar/AdminTable class 병합 기준 정리
- adminComponentVariants.ts 추가
- 24번 Admin component variant 구현 문서 추가
```

### 0.15.4 — Login / Invite / Error A-TYPE

```txt
- ATypePublicFrame / ATypePublicCard / ATypePublicNotice 추가
- WaflLoginPage A-TYPE 문구와 semantic token 기준 정리
- CompanyInvitationJoinRequestPage A-TYPE 구조 정리
- MemberInvitationJoinRequestPage A-TYPE 구조 정리
- invite error page A-TYPE 구조 정리
- service-paused page A-TYPE public frame 적용
- 25번 Login/Invite/Error 구현 문서 추가
```

### 0.15.5 — 고객사 관리자 주요 화면 A-TYPE

```txt
- /admin
- /admin/members
- /admin/settings
- /admin/files
- /admin/stats
- /admin/partners
```

### 0.15.6 — 시스템관리자 주요 화면 A-TYPE

```txt
- /system
- /system/companies
- /system/storage-usage
- /system/audit-logs
- /system/standards
```

## 4. 0.16.x — responsive / share / drawing foundation

### 0.16.0 — DeviceKind foundation

```txt
- pc / tablet-landscape / tablet-portrait / mobile 판정
- PC 브라우저 축소와 실제 mobile/tablet 구분
- device hook 추가
```

### 0.16.1 — 고객사 관리자 mobile/tablet layout

```txt
- table → card list 전환
- mobile bottom action
- tablet portrait 1열 스택
```

### 0.16.2 — 작업지시서 기기별 layout

```txt
- PC 3열
- tablet landscape 2열
- tablet portrait/mobile 목록/상세 분리
```

### 0.16.3 — Drawing orientation guard

```txt
- tablet landscape 입력 차단
- tablet portrait 허용
- canvas draft 보존
```

### 0.16.4 — Web Share / QR / 링크 복사

```txt
- 초대 링크 공유
- QR 보기
- 공유 API 미지원 fallback
```

### 0.16.5 — 작업지시서 PDF 공유 설계

```txt
- PDF 링크 생성
- 링크 공유/복사/download
- 권한 정책 확정
```

## 5. 0.17.x — DB/R2/docs cleanup

```txt
0.17.0 DB SQL 파일 정리 2차
0.17.1 미사용 DB schema/table 후보 점검
0.17.2 R2 key/preview/download/purge 정합성 점검
0.17.3 repo cleanup
0.17.4 full reset + smoke test + build 기준 확정
```

## 6. 리스크 분리

Low risk:

```txt
문서 / token alias / static copy / empty state
```

Medium risk:

```txt
AdminShell / SystemShell / i18n key 이동 / route group / device hook
```

High risk:

```txt
WorkOrderWorkspace 구조 / R2 / 첨부·메모 / storage purge / permission/session/companyId / DB schema
```

## 7. 다음 권장 작업

```txt
0.15.5 — 고객사 관리자 주요 화면 A-TYPE
```


### 0.15.5 — 고객사 관리자 홈 A-TYPE 적용 1차

```txt
운영 대시보드와 업무 바로가기 카드 구조를 A-TYPE 기준으로 정리한다.
DB/API/R2/권한/세션 흐름은 변경하지 않는다.
```


### 0.15.6 — 고객사 관리자 주요 화면 A-TYPE 2차

```txt
- /admin/members 탭 shell을 AdminSection 기준으로 정리
- 멤버관리 SummaryCards / SegmentedTabs / AdminPanelSection 구조 유지
- /admin/settings hub에 A-TYPE eyebrow와 semantic token 기준 보정
- raw stone/rose/emerald class 일부를 semantic token으로 치환
- 27번 고객사 관리자 관리 화면 문서 추가
```

### 0.15.7 — 고객사 관리자 저장소/통계/협력업체 A-TYPE 1차

```txt
- /admin/files
- /admin/stats
- /admin/partners
- 기능 로직 변경 없이 화면 구조와 공통 컴포넌트 기준 정리
```
