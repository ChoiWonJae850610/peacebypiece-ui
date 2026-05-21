# WAFL A-TYPE — 작업지시서 side effect route guard 1차

## 기준 버전

- Version : 0.15.55
- 기준 원본 : 0.15.54

## 목적

작업지시서 관련 DB/R2 변경 API route에 `serviceCode` 기반 side effect guard를 1차로 연결한다.

0.15.54까지는 생산구성 state patch 저장 직전 guard가 중심이었다. 이번 단계는 메모, 첨부, R2 upload prepare/complete, 휴지통 복원/삭제 요청, purge worker 같은 API route가 자신이 수행하는 resource/operation을 serviceCode matrix 기준으로 통과하는지 확인하는 기준을 추가한다.

## 추가 기준

### 공통 guard

`lib/workorder/serviceCodeGuards.ts`에 다음 helper를 추가한다.

- `canServiceUseSideEffect`
- `assertServiceCanUseSideEffect`
- `assertServiceCanPurgeR2Objects`

이 helper는 다음 조합을 검증한다.

```txt
serviceCode + resource + operation
```

예:

```txt
WO-M001 + memos + insert
WO-A001 + attachments + insert
WO-A001 + r2_objects + r2_put
WO-S004 + r2_objects + r2_purge
```

## API route 1차 연결 범위

### 메모

- `app/api/workorders/memos/route.ts`

| Method | serviceCode | resource | operation |
| --- | --- | --- | --- |
| POST | WO-M001 memoCreate | memos | insert |
| PATCH | WO-M002 memoUpdate | memos | update |
| DELETE | WO-M003 memoDelete | memos | soft_delete |

### 첨부/R2

- `app/api/workorders/attachments/upload/route.ts`
- `app/api/workorders/attachments/upload/complete/route.ts`
- `app/api/workorders/attachments/delete/route.ts`
- `app/api/workorders/attachments/primary/route.ts`

| Route | serviceCode | resource | operation |
| --- | --- | --- | --- |
| upload prepare | WO-A001/WO-A002 | attachments | insert |
| upload prepare | WO-A001/WO-A002 | r2_objects | r2_put |
| upload complete | WO-A003 | attachments | insert |
| attachment delete request | WO-A004 | attachments | soft_delete |
| primary design set | WO-A005 | attachments | update |

### 저장소/휴지통/R2 purge

- `app/api/admin/files/trash/restore/route.ts`
- `app/api/admin/files/workorders/restore/route.ts`
- `app/api/admin/files/trash/purge/route.ts`
- `app/api/admin/files/workorders/purge/route.ts`
- `app/api/admin/files/trash/purge-worker/route.ts`
- `app/api/system/storage-usage/purge/route.ts`

| Route | serviceCode | resource | operation |
| --- | --- | --- | --- |
| attachment/memo restore | WO-S003 | attachments | restore |
| workorder restore | WO-S002 | spec_sheets | restore |
| trash purge request | WO-S004 | attachments | delete |
| workorder purge request | WO-S004 | spec_sheets | delete |
| admin purge worker | WO-S004 | r2_objects | r2_purge |
| system storage purge | WO-S004 | r2_objects | r2_purge |

## 비변경 범위

이번 버전은 guard 연결이다. 다음은 변경하지 않는다.

- DB schema
- R2 key 구조
- purge worker 실제 삭제 알고리즘
- attachment/memo repository 구현
- production composition replace 저장 정책
- 권한/세션 흐름

## 후속 작업

다음 단계에서는 route마다 `serviceCode`를 audit metadata 또는 history metadata에 남길지 결정한다. 또한 storage/purge 세부 serviceCode를 더 분리할지 검토한다.
