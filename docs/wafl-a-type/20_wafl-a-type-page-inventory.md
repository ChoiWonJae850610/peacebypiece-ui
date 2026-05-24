---
title: WAFL A-TYPE Page Inventory
version: 0.5
baseline_source: peacebypiece-ui-0.14.8
status: draft-final
updated: 2026-05-20
---

# 20. Route별 화면 인벤토리

## 1. 목적

각 route의 사용자, 권한, 템플릿, 주요 API, empty/error state를 정리한다. A-TYPE UI 전환 시 이 문서를 기준으로 화면 누락과 IA 혼선을 방지한다.

## 2. 시스템관리자

| Route | 목적 | 사용자 | 템플릿 | 비고 |
|---|---|---|---|---|
| `/system` | 시스템 홈 | 시스템관리자 | Dashboard | 고객사 관리자 홈과 분리 |
| `/system/companies` | 고객사 승인/관리 | 시스템관리자 | List Page | 승인/거절/상태 관리 |
| `/system/storage-usage` | 저장소 사용량/purge | 시스템관리자 | List + Summary | 실제 R2 삭제 흐름 |
| `/system/audit-logs` | 감사로그 | 시스템관리자 | List Page | 시스템/고객사 이벤트 |
| `/system/settings` | 시스템 설정 | 시스템관리자 | Settings | 상단 설정 진입 |
| `/system/invites` | 고객사 관리자 초대 | 시스템관리자 | Invite Page | 링크 공유 우선 |

## 3. 고객사 업무공간

| Route | 목적 | 사용자 | 템플릿 | 비고 |
|---|---|---|---|---|
| `/workspace` | 고객사 업무 홈 | 고객사 관리자/승인 멤버 | Dashboard | 업무 카드 중심 진입 |
| `/workspace/members` | 멤버관리/초대/승인 | 고객사 관리자 | List + Invite | 고객사 관리자 계정은 권한 모달 대상 제외 |
| `/workspace/settings` | 고객사 설정 | 고객사 관리자 | Settings | 회사 정보 변경 요청 포함 |
| `/workspace/files` | 저장소 관리 | 고객사 관리자 | Summary + List | 휴지통/복원/삭제 요청 |
| `/workspace/stats` | 통계 | 고객사 관리자/승인 멤버 | Dashboard | companyId scope |
| `/workspace/partners` | 협력업체 관리 | 고객사 관리자/권한 멤버 | List Page | 작성성 작업은 권한 필요 |
| `/workspace/standards` | 기준정보 | 고객사 관리자/권한 멤버 | List Page | 작성성 작업은 기준정보 권한 필요 |

## 4. 일반 멤버 / 작업자

| Route | 목적 | 사용자 | 템플릿 | 비고 |
|---|---|---|---|---|
| `/workspace` | 멤버 홈 | 승인 멤버 | Dashboard | 역할별 카드 노출 |
| `/worker` | 작업지시서 업무 | 승인 멤버 | WorkOrder Workspace | PC 3열, 태블릿/모바일 분리 |
| `/workspace/partners` | 협력업체 조회/관리 | 권한 멤버 | List Page | 권한별 작성성 작업 제한 |
| `/workspace/standards` | 기준정보 조회/관리 | 권한 멤버 | List Page | 권한별 작성성 작업 제한 |

## 5. 인증 / 초대 / 상태 화면

| Route | 목적 | 사용자 | 템플릿 | 비고 |
|---|---|---|---|---|
| `/login` | 로그인 | 전체 | Auth Page | Google 로그인 |
| `/invite/company/[token]` | 고객사 관리자 등록 | 초대 대상 | Invite Page | 승인 요청 전 DB/R2 partial 저장 금지 |
| `/invite/member/[token]` | 멤버 가입 요청 | 초대 대상 | Invite Page | 승인 대기 상태 |
| `/invite/error` | 초대 오류 | 전체 | Error Page | expired/revoked/invalid |
| `/pending` | 승인 대기 | 승인 대기 사용자 | State Page | 업무 접근 차단 |
| `/service-paused` | 서비스 중지/요금제 상태 | 제한 사용자 | Error Page | trial/past_due/canceled 등 |
| `/me/settings` | 개인설정 | 로그인 사용자 | Settings | 사람 아이콘 진입 |

## 6. 화면별 공통 state

```txt
loading:
- skeleton 또는 loading label

empty:
- Icon / Title / Description / PrimaryAction

forbidden:
- 권한 없음 안내 + 홈 이동

error:
- 짧은 원인 + 다음 행동
```

## 7. QA

```txt
[ ] 각 route가 올바른 사용자 유형만 허용하는가?
[ ] 고객사 관리자와 시스템관리자 IA가 섞이지 않는가?
[ ] 모바일에서 table이 card list로 바뀌는가?
[ ] empty/error state가 공통 패턴을 따르는가?
[ ] 직접 URL 접근 시 403/로그인/상태 페이지로 이동하는가?
```
