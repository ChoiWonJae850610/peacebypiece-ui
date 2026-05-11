# 0.10.14 시스템관리자 감사 로그 — 작업지시서/첨부파일 1차 연결

## 목적

0.10.13에서 시스템관리자 저장소 실제 삭제(`storage.purge_run`)만 감사 로그로 남기던 구조를 확장해, 고객관리자 영역의 작업지시서 및 첨부파일 주요 휴지통 액션도 `audit_logs`에 기록한다.

## 연결 대상

| 사용자 액션 | API | event_type | target_type |
|---|---|---|---|
| 작업지시서 삭제 | `DELETE /api/workorders` | `work_order.deleted` | `work_order` |
| 작업지시서 복원 | `POST /api/admin/files/workorders/restore` | `work_order.restored` | `work_order` |
| 개별 첨부파일 삭제 | `POST /api/workorders/attachments/delete` | `file.deleted` | `file` |
| 개별 첨부파일 복원 | `POST /api/admin/files/trash/restore` | `file.restored` | `file` |

## 설계 기준

- 고객관리자에서 발생한 휴지통 이동/복원 성격의 이벤트는 `actor_role = customer_admin`으로 기록한다.
- 감사 로그 쓰기 실패는 기존 업무 동작을 막지 않도록 `createSystemAuditLogSafe`를 사용한다.
- 첨부파일 삭제 로그에는 R2 key 원문을 저장하지 않고 `hasStorageKey`, `hasThumbnailKey`만 기록한다.
- 작업지시서 삭제 로그는 삭제 전 snapshot 기준으로 제목, 상태, 첨부 수, 메모 thread 수를 기록한다.
- DB schema 변경은 없다.

## 후속 작업

- 작업지시서 상태 변경 감사 로그 연결
- 발주/검수/리오더 흐름별 감사 로그 연결
- 고객사/요금제/용량 변경 감사 로그 연결
