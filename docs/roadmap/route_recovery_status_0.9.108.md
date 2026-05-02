# Route 원복 상태 점검표

Version: 0.9.108

## 목적

0.9.93~0.9.94에서 회귀 점검 화면으로 대체했던 관리자/시스템관리자 route를 0.9.98~0.9.107에서 순차 복원했다.  
이 문서는 현재 `/admin`, `/system`, `/worker`, `/invite/[token]` 관련 route의 원복 상태를 정리하고, 다음 복원 순서를 고정한다.

## 상태 분류 기준

| 상태 | 의미 |
|---|---|
| 실제 화면 복원됨 | 원래 목적의 화면 또는 본 화면 shell이 route에 연결됨 |
| read-only 복원됨 | 조회/표시 중심으로 복원됨. 저장/삭제/action은 아직 제외 |
| skeleton | 초대/수락 등 본 기능 전 단계의 skeleton UI가 연결됨 |
| API only | API는 있으나 전용 화면은 아직 없음 |
| 미구현 | route 또는 화면 없음 |
| redirect | 다른 route로 이동시키는 보조 route |
| 점검 필요 | 실제 빌드/런타임 확인 또는 세부 기능 검증이 필요 |

---

## /admin route 상태

| Route | 현재 상태 | 근거/연결 화면 | 남은 작업 |
|---|---|---|---|
| `/admin` | read-only 복원됨 | `AdminConsoleShell` | 고객관리자 통계 표시 안정화 후 필요 시 dashboard와 통합 |
| `/admin/dashboard` | 실제 화면 복원됨 | `AdminStatsDashboard` + `AdminShell` | `/admin`과 역할 중복 정리 필요 |
| `/admin/partners` | read-only 복원됨 | `AdminPartnersReadOnlyPage` | 생성/수정/외주공정 저장 action 복원 |
| `/admin/files` | read-only 복원됨 | `AdminFilesReadOnlyPage` | 삭제/복구/영구삭제 action 복원 검토 |
| `/admin/history` | read-only 복원됨 | `AdminHistoryReadOnlyPage` | audit log DB write 연결 전까지 조회 전용 유지 |
| `/admin/settings` | read-only 복원됨 | `AdminSettingsReadOnlyPage` | 설정 저장, 권한 변경 modal 복원 |
| `/admin/invites` | skeleton | `CompanyMemberInviteSkeleton` | 초대 수락 후 user 생성, role/permission 연결 |
| `/admin/units` | redirect | `/admin/settings`로 redirect | 실제 독립 화면 필요 여부 판단 |

### /admin 평가

`/admin` 하위 route는 대부분 회귀 점검 화면에서 벗어났지만, 저장/수정/action은 대부분 아직 복원 전이다.  
지금 상태는 “화면 원복 1차 완료, action 복원 전 단계”로 보는 것이 맞다.

---

## /system route 상태

| Route | 현재 상태 | 근거/연결 화면 | 남은 작업 |
|---|---|---|---|
| `/system` | read-only 복원됨 | `SystemConsoleShell` | 통계 표시 안정화, system dashboard 세부화 |
| `/system/category-rules` | 실제 화면 복원됨 | `CategoryRulesManager` | DB 저장 전환 여부 판단 |
| `/system/invites` | skeleton | `SystemCustomerInviteSkeleton` | 고객사 생성 자동화, 이메일 발송, 인증 연결 제외 상태 |
| `/system/billing` | read-only 복원됨 | `SystemCompanyPlanSkeleton` | 요금제 변경/용량 override 저장 action 복원 |
| `/system/companies` | 미구현 | API만 존재 가능 | 고객사 관리 read-only 화면 추가 필요 |
| `/system/permissions` | 미구현 | API만 존재 가능 | 권한 관리 read-only 화면 추가 필요 |
| `/system/storage-usage` | 미구현 | API만 존재 가능 | 저장공간 사용량 전용 화면 추가 필요 |
| `/system/stats` | 미구현 | `/system`에서 일부 표시 | 시스템 통계 상세 화면 추가 필요 |

### /system 평가

`/system` 기본 콘솔, category rules, invites, billing은 다시 화면이 연결됐다.  
하지만 고객사/권한/스토리지/통계 상세는 API 중심이고 전용 화면이 없다.  
따라서 시스템관리자 쪽은 “핵심 route 일부 복원, 관리 세부 화면 미완성” 상태다.

---

## /worker route 상태

| Route | 현재 상태 | 근거/연결 화면 | 남은 작업 |
|---|---|---|---|
| `/worker` | 실제 화면 복원됨 | `WorkOrderWorkspace` | worker 전용 권한/필터/모바일 UX 점검 필요 |

### /worker 평가

`/worker`는 작업지시서 workspace를 직접 연결한다.  
다만 worker 전용 화면인지, 일반 작업지시서와 동일 workspace를 쓰는 임시 route인지 다시 확인해야 한다.

---

## /invite/[token] route 상태

| Route | 현재 상태 | 근거/연결 화면 | 남은 작업 |
|---|---|---|---|
| `/invite/[token]` | skeleton | `InviteAcceptSkeleton` | token 조회 API, 상태 표시, 수락 action, user 생성 연결 |

### /invite 평가

초대 수락 route는 skeleton이 연결되어 있으나 아직 실제 onboarding/회원가입/user 생성까지 연결된 상태는 아니다.  
다음 기능 복원 우선순위에서 높게 잡아야 한다.

---

## API only 또는 화면 미구현 후보

| 영역 | API/기반 | 화면 상태 | 권장 작업 |
|---|---|---|---|
| 시스템 고객사 관리 | `/api/system/companies` | 전용 화면 없음 | `/system/companies` read-only 추가 |
| 시스템 권한 관리 | `/api/system/permissions` | 전용 화면 없음 | `/system/permissions` read-only 추가 |
| 시스템 저장공간 | `/api/system/storage-usage` | 전용 화면 없음 | `/system/storage-usage` read-only 추가 |
| 시스템 통계 상세 | `/api/system/stats` | `/system` 일부 표시 | `/system/stats` 상세 추가 |
| 고객관리자 통계 상세 | `/api/admin/stats` | `/admin` 일부 표시 | `/admin/stats` 상세 추가 여부 판단 |
| invitation accept | `/api/invitations/accept` | skeleton | `/invite/[token]` API 연결 |

---

## 다음 복원 순서

### 0.9.109 — `/invite/[token]` 초대 수락 화면 API 연결

목표:
- token 기준 초대 상태 조회
- ready / invalid / expired / revoked / accepted 상태 표시
- 수락 action skeleton 또는 API 연결
- 실제 회원가입/user 생성은 아직 제외

### 0.9.110 — `/system/companies` 고객사 관리 read-only 화면 추가

목표:
- `/api/system/companies` 기반 고객사 목록 표시
- 활성/비활성 상태 표시
- 요금제/용량/멤버 요약은 가능하면 read-only 표시
- 생성/수정 action 제외

### 0.9.111 — `/system/permissions` 권한 관리 read-only 화면 추가

목표:
- permission catalog
- role permissions
- company user permissions
- 변경 action 제외

### 0.9.112 — `/system/storage-usage` 저장공간 사용량 read-only 화면 추가

목표:
- `/api/system/storage-usage` 기반 저장공간 사용량 표시
- DB metadata 기준
- R2 실시간 inventory 조회 제외

### 0.9.113 — `/system/stats` 시스템 통계 상세 화면 추가

목표:
- `/api/system/stats` 상세 표시
- 고객사별 저장공간, plan별 고객 수, 초대 상태별 수
- chart library 추가 없이 HTML/Tailwind 표시

### 0.9.114 — `/admin/stats` 고객관리자 통계 상세 화면 추가 여부 판단

목표:
- `/admin` 홈에 이미 요약 통계가 있으므로 독립 상세 화면이 필요한지 판단
- 필요하면 `/admin/stats` route 추가

### 0.9.115 — admin files action 복원 검토

목표:
- 삭제/복구/영구삭제 버튼 재연결 여부 판단
- R2 실제 삭제 flow는 별도 검증 후 진행

### 0.9.116 — admin partners 저장 action 복원 검토

목표:
- 거래처 생성/수정
- 외주공정 저장
- 기존 partner repository/API 유지

### 0.9.117 — admin settings 저장 action 복원 검토

목표:
- 회사 UI 설정 저장
- 파일 정책 저장
- 알림 정책 저장
- 권한 변경은 별도

### 0.9.118 — system billing 저장 action 복원 검토

목표:
- 고객사별 plan assignment 변경
- storage/member override 저장
- 결제 자동화 제외

---

## 지금 하지 말아야 할 것

- audit log 설계
- audit log SQL
- 결제 자동화
- 이메일 발송
- 실제 인증/회원가입 연결
- AI 통계 분류
- R2 inventory 실시간 조회
- 대규모 repository 이동
- package.json 변경이 필요한 라이브러리 추가

## 판단

0.9.108 기준으로 다음 단계는 audit가 아니라 **남은 route 복원과 read-only 화면 추가**다.  
저장/action 복원은 read-only 화면이 안정화된 뒤 진행한다.
