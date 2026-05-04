# 0.9.166 작업지시서 휴지통 복원 방어 정책

## 목적

0.9.165에서 고객관리자 저장소에 작업지시서 / 첨부파일목록 / 휴지통 3탭 구조를 반영했다. 0.9.166에서는 작업지시서 삭제 묶음과 개별 첨부 복원이 충돌하지 않도록 표시 기준과 방어 조건을 보완한다.

이번 버전은 작업지시서 복원 API를 새로 만들지 않는다. DB schema 변경, R2 직접 삭제, purge worker 변경도 하지 않는다.

## 표시 기준

### 작업지시서 탭

작업지시서 탭은 삭제 상태의 작업지시서를 read-only로 표시한다.

표시 대상:

- `spec_sheets.deleted_at IS NOT NULL`
- 또는 `spec_sheets.is_active = false`

표시 항목:

- 작업지시서명
- 상태
- 삭제일
- 활성/휴지통 첨부 수
- 활성/휴지통 메모 수
- 묶음 복원 준비 상태

### 휴지통 탭

휴지통 탭의 첨부파일은 부모 작업지시서가 삭제 상태인지 함께 계산한다.

부모 작업지시서가 삭제 상태인 항목:

```text
spec_sheets.deleted_at IS NOT NULL
또는 spec_sheets.is_active = false
```

이 경우 개별 파일 복구 버튼은 비활성 기준으로 본다.

## 복원 방어 정책

### 허용

개별 첨부 복구 허용 조건:

```text
attachment_trash_items.purge_status = 'pending'
attachment_trash_items.restored_at IS NULL
attachment_trash_items.purged_at IS NULL
부모 작업지시서가 활성 상태
```

### 차단

개별 첨부 복구 차단 조건:

```text
부모 작업지시서가 삭제 상태
purge_status != 'pending'
last_purge_error 존재
purged_at 존재
```

부모 작업지시서가 삭제 상태이면 연결 첨부만 단독 복구하지 않는다. 작업지시서 묶음 복원에서 함께 처리해야 한다.

## 서버 방어

UI에서 버튼을 비활성화하더라도 직접 API 요청이 들어올 수 있으므로 `restoreAttachmentTrashItems`의 대상 조회 조건에서 부모 작업지시서 활성 여부를 함께 확인한다.

```text
order_id가 없으면 기존 개별 파일 복구 허용
order_id가 있으면 spec_sheets가 활성 상태일 때만 복구 허용
```

이 방어는 기존 작업지시서 복원 API를 새로 만드는 것이 아니라, 기존 개별 첨부 복구가 삭제된 작업지시서 내부 파일만 단독으로 되살리는 문제를 막기 위한 최소 수정이다.

## 다음 단계

0.9.167에서 작업지시서 묶음 복원 API를 만들 때 처리할 대상:

1. `spec_sheets.is_active=true`, `deleted_at=NULL`
2. 연결 `attachments.is_active=true`, `deleted_at=NULL`
3. 연결 `memos.is_active=true`, `deleted_at=NULL`
4. 해당 `attachment_trash_items`를 `restored` 또는 목록 제외 상태로 전환
5. purge 완료 파일은 복원 제외로 표시

## 금지 기준

- 개별 첨부 복구로 삭제된 작업지시서 내부 파일만 단독 복구 금지
- R2 원본/썸네일 즉시 삭제 금지
- purge 완료 항목 복구 가능 표시 금지
- 작업지시서 복원 API를 이번 버전에서 임의 구현 금지
- DB schema 변경 금지
