# 0.10.15 시스템관리자 감사 로그 — 작업지시서 상태 변경 연결

## 목표

작업지시서 `workflowState` 변경을 시스템관리자 감사 로그 원장인 `audit_logs`에 기록한다.

## 연결 이벤트

- `work_order.status_changed`

## 기록 대상

- 일반 작업지시서 저장 중 `workflowState`가 변경된 경우
- 여러 작업지시서 저장 중 `workflowState`가 변경된 경우
- 작업지시서 상태 패치 API로 `workflowState`가 변경된 경우

## 유지한 기존 동작

- 고객관리자 업무 이력용 `history_logs` 상태 변경 기록은 유지한다.
- 감사 로그 쓰기 실패가 작업지시서 저장/상태 변경 성공 여부에 영향을 주지 않도록 `createSystemAuditLogSafe`를 사용한다.
- DB schema 변경은 없다.
- 기존 작업지시서 삭제/복원, 첨부파일 삭제/복원, 저장소 purge 흐름은 변경하지 않는다.

## metadata 구조

```json
{
  "workOrderId": "...",
  "title": "...",
  "fromWorkflowState": "draft",
  "toWorkflowState": "production",
  "managerName": "...",
  "source": "state-patch"
}
```

## 테스트

1. 작업지시서 생성
2. 작업지시서 상태 변경
3. `/system/audit-logs`에서 `work_order.status_changed` 확인
4. `/api/system/audit-logs?targetType=work_order` 확인
5. 동일 상태로 저장할 때 중복 로그가 생기지 않는지 확인
