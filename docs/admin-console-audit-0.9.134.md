# 관리자 콘솔 현재 기능 점검 — 0.9.134

## 목적

0.9.77 기반 복구 라인에서 `/admin` 계열 route가 실제 본 기능인지, 부분 기능인지, redirect인지, API only인지 구분한다.
이번 버전은 기능 코드를 변경하지 않고 현재 상태를 고정한다.

## 기준

- 기존 구현 UI와 action 흐름을 우선 기준으로 삼는다.
- 0.9.108 이후 추가됐던 read-only/skeleton route 대체 변경은 가져오지 않는다.
- DB schema, repository 계약, API 응답 포맷은 변경하지 않는다.
- 관리자 기능 안정화는 거래처/공장관리, 파일관리, 설정 화면 순서로 진행한다.

## Route 분류

| Route | 현재 분류 | 판단 | 다음 작업 |
| --- | --- | --- | --- |
| `/admin` | 본 기능 진입 shell | 관리자 콘솔 홈/메뉴 진입점으로 유지 | 관리자 메뉴 연결 및 요약 정보 점검 |
| `/admin/dashboard` | 부분 기능 | 대시보드 성격의 요약/점검 화면. 본 기능 대체 화면으로 쓰지 않음 | 통계/요약 중복 여부 별도 점검 |
| `/admin/files` | 본 기능 후보 | 첨부/파일 관리, 휴지통, 복구, 영구삭제 후보와 연결되는 핵심 화면 | 0.9.136에서 안정화 |
| `/admin/history` | 부분 기능 | 작업 이력/히스토리 확인용. audit log 설계와 혼동 금지 | 별도 audit DB 설계 전까지 현 상태 유지 |
| `/admin/invites` | 부분 기능 | 초대 흐름 확인 화면. 실제 이메일 발송/회원가입 고도화는 별도 | 0.9.139 초대 기능 점검 때 재확인 |
| `/admin/partners` | 본 기능 후보 | 거래처/공장/원단/부자재/외주처 관리 핵심 화면 | 0.9.135에서 안정화 |
| `/admin/settings` | 본 기능 후보 | 회사 설정, 파일 정책, 알림 정책, 기준정보 성격을 포함 | 0.9.137에서 안정화 |
| `/admin/units` | redirect/설정 하위 기능 | `/admin/settings` 또는 기준정보 영역으로 연결되는 보조 route | redirect 동작만 확인 |

## API 영역 분류

| API 영역 | 현재 판단 | 주의 |
| --- | --- | --- |
| `app/api/admin/partners/*` | 거래처/공장관리 본 기능 API | 응답 포맷 임의 변경 금지 |
| `app/api/admin/files/*` | 파일관리/휴지통/복구/영구삭제 후보 API | R2 실제 삭제와 DB metadata 삭제 분리 |
| `app/api/admin/settings/*` | 설정/사용자/정책 확인 API | 권한 시스템 변경 금지 |
| `app/api/admin/stats/*` | 통계 API | chart library 추가 없이 현 계산식 확인 |
| `app/api/admin/companies/*` | 회사 정보 보조 API | system/company 관리와 역할 혼동 금지 |

## 금지 항목

- `/admin` 계열 화면을 read-only/skeleton으로 다시 대체하지 않는다.
- 관리자 본 기능 화면을 새 디자인으로 갈아엎지 않는다.
- DB schema를 수정하지 않는다.
- package 의존성을 추가하지 않는다.
- 정상 동작 중인 작업지시서/R2/메모 흐름을 관리자 점검 작업과 섞어서 수정하지 않는다.

## 다음 진행 순서

1. 0.9.135 — 관리자 거래처/공장관리 안정화
2. 0.9.136 — 관리자 파일관리 안정화
3. 0.9.137 — 관리자 설정 화면 안정화
4. 0.9.138 — 시스템관리자 콘솔 기능 점검
5. 0.9.139 — 초대 기능 현황 점검

## 적용 후 확인

- `/admin` route 진입 시 runtime error가 없어야 한다.
- `/admin/partners`, `/admin/files`, `/admin/settings`는 본 기능 화면이 유지되어야 한다.
- `/admin/units`가 redirect라면 이동 대상이 정상이어야 한다.
- 이번 버전은 문서/버전 패치이므로 UI가 바뀌면 안 된다.
