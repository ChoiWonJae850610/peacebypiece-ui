# 시스템관리자 콘솔 기능 점검 0.9.138

## 목적

`0.9.77` 복구 라인을 기준으로 `/system` 계열 화면과 API의 현재 상태를 분류한다. 이 문서는 시스템관리자 기능을 바로 확장하기 전에 본 기능, 부분 기능, skeleton, API only, 후순위 기능을 구분하고, 향후 파일 보관 정책과 R2 purge 후보 관리 화면의 위치를 고정하기 위한 기준이다.

## 점검 기준

| 구분 | 의미 | 처리 방향 |
| --- | --- | --- |
| 본 기능 | 화면과 action이 실제 repository/API와 연결되어 운영 가능 | 정상 동작을 유지하고 최소 안정화만 진행 |
| 부분 기능 | 화면 일부 또는 API 일부가 연결되어 있으나 저장/실행 범위가 제한됨 | 기능별로 작은 버전에서 확장 |
| skeleton | 화면 구조는 있으나 입력/저장 action이 준비 상태 | 본 기능처럼 오인되지 않게 문서화 |
| API only | API route는 있으나 화면 연결이 없거나 console에서 code path만 노출 | 화면 연결 전 응답 포맷을 먼저 고정 |
| 후순위 | audit, 자동 purge, 결제 자동화처럼 위험도가 높음 | 설계 문서 후 별도 버전에서 진행 |

## Route 상태

| route | 현재 판단 | 근거 | 다음 처리 |
| --- | --- | --- | --- |
| `/system` | 부분 기능 shell | `SystemConsoleShell`이 quick link, API link, legacy storage purge button을 제공 | 0.9.139에서 storage purge 설계와 연결 위치를 구체화 |
| `/system/billing` | skeleton | `SystemCompanyPlanSkeleton`이 요금제/용량 override 입력을 read-only 준비 영역으로 표시 | 실제 저장 action은 아직 연결하지 않음 |
| `/system/category-rules` | 본 기능 유지 대상 | 카테고리 규칙 관리 화면이 client component와 local/runtime rule manager를 사용 | read-only/skeleton으로 대체 금지 |
| `/system/invites` | skeleton | `SystemCustomerInviteSkeleton`이 고객사 관리자 초대 흐름과 QR preview를 준비 영역으로 표시 | 실제 이메일 발송/회원가입 연결은 보류 |
| `/system/storage-usage` | route 없음 | 현재 app route는 없고 `/api/system/storage-usage`만 존재 | purge 후보 화면 후보지는 `/system/storage-usage` 또는 `/system/files` 중 0.9.139에서 결정 |
| `/system/files` | route 없음 | 전체 고객사 파일 휴지통/purge 관리 화면이 없음 | 0.9.140 이후 신규 화면 후보 |

## API 상태

| API | 현재 판단 | 설명 | 주의 |
| --- | --- | --- | --- |
| `GET /api/system/companies` | API only/부분 기능 | 고객사 목록 조회 handler 존재 | 화면 연결 시 company status와 plan/storage 정보를 섞지 않음 |
| `POST /api/system/companies` | API only/위험 | 고객사 생성 handler 존재 | 시스템관리자 고객사 생성 화면 전까지 직접 확장 금지 |
| `GET /api/system/stats` | API only | 시스템 통계 handler 존재 | chart library 추가 없이 응답 포맷 먼저 확인 |
| `GET /api/system/storage-usage` | API only | 고객사별 storage usage 조회 handler 존재 | 원본 + 썸네일 용량 산정 정책 확인 필요 |
| `POST /api/system/storage-usage` | API only/주의 | storage usage snapshot 생성 handler 존재 | 자동 snapshot/cron 연결 전 수동 검증 필요 |

## R2 purge 기능 위치 판단

현재 시스템관리자 콘솔에는 `SystemStoragePurgeButton`이 있으며, 내부적으로 `runPurgeWorkerFlow`를 호출한다. 다만 이 버튼은 전체 고객사 휴지통 후보를 목록으로 확인하고 선택 삭제하는 본 기능 화면은 아니다. 따라서 다음과 같이 분리한다.

1. `/admin/files`
   - 고객사 관리자 범위의 파일 목록, 휴지통, 복구, 영구삭제 요청 관리.
   - 고객사 단위 복구 가능 상태를 유지한다.

2. `/system/storage-usage` 또는 `/system/files`
   - 전체 고객사 기준 purge 후보 목록.
   - 삭제 예정일이 도래한 파일만 필터링.
   - 원본 `storage_key`와 `thumbnail_key`를 함께 표시.
   - 시스템관리자가 후보를 확인한 뒤 선택 삭제 또는 전체 도래 항목 삭제.

3. Worker
   - R2 객체 삭제만 담당한다.
   - DB 직접 접근은 피한다.
   - Vercel/Next API가 DB 후보 조회와 purge 상태 반영을 담당한다.

## 파일 보관 정책과 purge 후보 계산

향후 고객사별 설정에는 아래 개념이 필요하다. 단, 0.9.138에서는 DB schema를 변경하지 않는다.

| 정책 값 | 의미 | 초기 처리 |
| --- | --- | --- |
| `file_trash_retention_days` | 휴지통 보관 기간 | `/admin/settings` 파일 정책 위치에서 관리 후보 |
| `auto_purge_enabled` | 자동 R2 삭제 사용 여부 | 초기에는 OFF 권장 |
| `purge_requires_system_approval` | 시스템관리자 승인 필요 여부 | 초기에는 ON 권장 |
| `purge_due_at` | R2 실제 삭제 가능 시각 | 삭제일 + 보관 기간으로 계산 후보 |
| `purge_status` | pending/ready/processing/completed/failed | 실제 schema 검토 전 문서 기준만 유지 |

## 0.9.139 권장 작업

`0.9.139`에서는 파일 보관 정책 및 R2 purge 설계를 문서화한다.

- 고객사별 휴지통 보관 기간 기준.
- 삭제 예정일 도래 조건.
- 원본 + 썸네일 삭제 범위.
- `/system/storage-usage`와 `/system/files` 중 화면 위치 결정.
- 수동 purge와 자동 purge 단계 분리.
- 자동 purge는 즉시 구현하지 않고, 시스템관리자 수동 확인/실행을 먼저 설계.

## 금지 사항

- 0.9.108 이후 read-only/skeleton route 변경을 자동 병합하지 않는다.
- `/system/category-rules` 기존 기능을 skeleton으로 대체하지 않는다.
- R2 직접 SDK 삭제 방식으로 되돌리지 않는다.
- purge 기능을 만들기 전에 DB schema를 임의 변경하지 않는다.
- Vercel cron 또는 Cloudflare scheduled trigger를 바로 연결하지 않는다.
- 실제 이메일 발송, 결제 자동화, audit log schema 추가는 아직 진행하지 않는다.
