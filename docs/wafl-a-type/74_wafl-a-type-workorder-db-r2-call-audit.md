---
title: 작업지시서 DB/R2 호출 위치 전수조사
version: 1.0
baseline_source: peacebypiece-ui-0.15.50
status: draft
updated: 2026-05-21
---

# 74. 작업지시서 DB/R2 호출 위치 전수조사

## 1. 목적

0.15.50의 서비스 액션 맵은 “어떤 액션이 어떤 테이블/R2를 건드려도 되는지”를 정책으로 정리했다. 이 문서는 현재 코드에서 실제로 DB/R2를 변경하는 위치를 조사해 서비스 코드와 연결한다.

현재까지 확인된 반복 문제는 다음과 같다.

```txt
- 검토요청 후 생산구성 숫자가 0으로 표시됨
- DB 저장은 정상인데 조회 numeric mapping이 문자열을 0 fallback 처리함
- spec_sheet_materials / spec_sheet_outsourcing_lines에 비활성 row가 누적됨
- replace 저장 전환 후 반려/취소성 workflow에서 생산구성이 삭제되는 경로가 생김
```

따라서 후속 리팩토링은 query 한 줄 수정이 아니라, 아래 기준으로 진행한다.

```txt
1. 모든 DB/R2 변경 경로에 service code를 부여한다.
2. service code별 허용 테이블과 금지 테이블을 코드 allowlist로 옮긴다.
3. forward workflow와 backward workflow의 저장 side effect를 분리한다.
4. 생산구성 현재값 테이블은 확정 저장 액션에서만 replace한다.
5. R2 delete는 purge 계열에서만 허용한다.
```

## 2. 조사 기준

조사 대상은 작업지시서 화면에서 직접 또는 간접으로 호출되는 DB/R2 변경 흐름이다.

```txt
대상 파일 범위:
- app/api/workorders/**
- lib/workorder/**
- lib/hooks/workorder/**
- lib/storage/r2/**
- lib/admin/adminFiles.*
- lib/system/storagePurgeCandidates.ts
```

분류 기준:

```txt
DB write:
- INSERT
- UPDATE
- DELETE
- replace: DELETE + INSERT
- soft delete: is_active=false / deleted_at set

R2 write:
- upload URL 생성
- upload complete DB finalize
- file proxy URL 생성
- object delete / purge
```

## 3. 실제 API / service code 매핑

| Service Code | 현재 API / client | 주요 handler / repository | DB/R2 영향 | 판단 |
|---|---|---|---|---|
| WO-Q001 | `GET /api/workorders` | `handleGetWorkOrders` → `findAllDbWorkOrders` | `spec_sheets`, detail rows read | read only |
| WO-Q002 | `GET /api/workorders/[workOrderId]` | `handleGetWorkOrderDetail` → `findDbWorkOrderById` | `spec_sheets`, `orders`, `spec_sheet_materials`, `spec_sheet_outsourcing_lines`, attachments/memos read | read only |
| WO-I001~I004 | `PATCH /api/workorders` | `handlePatchWorkOrders` → `saveDbWorkOrder` / `saveDbWorkOrders` | `spec_sheets` update, 경우에 따라 상세 row sync | 즉시 저장/전체 저장 혼재 후보 |
| WO-F001~F005 | `PATCH /api/workorders/[workOrderId]` | `handlePatchWorkOrderState` → `updateDbWorkOrderStatePatch` | `spec_sheets` workflow update, history insert, 생산구성 replace 가능 | forward만 생산구성 저장 허용 |
| WO-B001~B003 | `PATCH /api/workorders/[workOrderId]` | `handlePatchWorkOrderState` → `updateDbWorkOrderStatePatch` | `spec_sheets` workflow update, history insert | 생산구성 replace 금지 |
| WO-M001 | `POST /api/workorders/memos` | `createMemoThread` / `createMemoReply` | `memos` insert | 즉시 저장 |
| WO-M002 | `PATCH /api/workorders/memos` | `updateMemo` | `memos` update | 즉시 저장 |
| WO-M003 | `DELETE /api/workorders/memos` | `softDeleteMemoThread` / `softDeleteMemoReply` | `memos` soft delete | 생산구성 영향 금지 |
| WO-A001~A002 | `POST /api/workorders/attachments/upload` | `createR2WorkerUploadUrl` / `createR2PresignedPutUrl` | R2 upload target 생성, DB count read | R2 object 생성 준비 |
| WO-A003 | `POST /api/workorders/attachments/upload/complete` | `createAttachment` | `attachments` insert/finalize | 업로드 완료 DB 저장 |
| WO-A004 | `POST /api/workorders/attachments/delete` | `softDeleteAttachment` | `attachments` soft delete, trash 후보 | R2 delete 금지 |
| WO-A005 | `POST /api/workorders/attachments/primary` | `setPrimaryDesignAttachment` | `attachments` primary update | 즉시 저장 |
| WO-S001 | `DELETE /api/workorders` | `deleteDbWorkOrder` | `spec_sheets` soft delete, attachments/memos bundle trash | R2 delete 금지 |
| WO-S002~S003 | admin files restore APIs | `adminFiles.serverActions` | `spec_sheets`/attachments/memos restore | 복원 전용 |
| WO-S004 | system/admin purge APIs | `storagePurgeCandidates`, `adminFiles.purgeWorker` | DB purge + R2 delete | 실제 R2 delete 허용 |
| WO-R001 | 작업지시서 리오더 생성 흐름 | `createDbWorkOrder` / reorder helpers | 새 `spec_sheets` row 생성, 원본 참조 | 별도 상세 추적 필요 |

## 4. 생산구성 현재값 테이블 호출 위치

### 4.1 `orders`

현재 repository:

```txt
lib/workorder/repository/dbFactoryOrderRepository.ts
```

주요 역할:

```txt
- `orders` table schema 검사
- factory partner name/id resolve
- 작업지시서의 공장 발주 row 저장/조회
```

현재 판단:

```txt
- 아직 `spec_sheet_materials`, `spec_sheet_outsourcing_lines`와 같은 replace 저장 정책으로 완전히 통일되지 않았다.
- 0.15.52 이후 `spec_sheet_id` 기준 replace 저장 여부를 별도 확인해야 한다.
- `factory_name`, `company_name`, `is_active`, `deleted_at`, `created_at`, `updated_at`은 schema 정리 후보로 남긴다.
```

서비스 코드 허용:

```txt
허용:
- WO-P001 발주정보 저장
- WO-F001 검토요청
- WO-F002 검토완료
- WO-F003 발주요청

금지:
- WO-B001 반려
- WO-B002 발주취소
- WO-B003 상태 되돌리기
- WO-Mxxx 메모
- WO-Axxx 첨부
- WO-Sxxx 삭제/복원/purge
```

### 4.2 `spec_sheet_materials`

현재 repository:

```txt
lib/workorder/repository/dbSpecSheetMaterialRepository.ts
```

주요 역할:

```txt
- 원단/부자재 현재 row 저장
- 0.15.48부터 `spec_sheet_id` 기준 DELETE 후 INSERT 방식으로 전환
- `quantity`, `unit_cost`, `total_cost` numeric 저장/조회
```

서비스 코드 허용:

```txt
허용:
- WO-P002 생산구성 저장
- WO-F001 검토요청
- WO-F002 검토완료
- WO-F003 발주요청

금지:
- WO-B001 반려
- WO-B002 발주취소
- WO-B003 상태 되돌리기
- WO-Mxxx 메모
- WO-Axxx 첨부
- WO-Sxxx 삭제/복원/purge
```

주의:

```txt
- 반려/취소성 workflow에서 빈 materials patch가 전달되면 현재 row가 삭제될 수 있으므로 호출 전 차단이 필수다.
- repository 내부 replace는 명확하지만, service code allowlist가 없으면 잘못된 workflow에서 호출될 수 있다.
```

### 4.3 `spec_sheet_outsourcing_lines`

현재 repository:

```txt
lib/workorder/repository/dbSpecSheetOutsourcingRepository.ts
```

주요 역할:

```txt
- 외주공정 현재 row 저장
- 0.15.48부터 `spec_sheet_id` 기준 DELETE 후 INSERT 방식으로 전환
- `process`, `vendor`, `quantity`, `unit_cost`, `total_cost` 저장/조회
```

서비스 코드 허용/금지 기준은 `spec_sheet_materials`와 동일하다.

## 5. workflow state patch 위험 지점

현재 주요 경로:

```txt
WorkOrder UI
→ lib/hooks/workorder/workorderRepositoryMutations.ts
→ repository.saveWorkOrderStatePatchAsync()
→ PATCH /api/workorders/[workOrderId]
→ handlePatchWorkOrderState()
→ updateDbWorkOrderStatePatch()
→ syncDbFactoryOrdersForSpecSheet()
→ syncDbSpecSheetMaterialsForSpecSheet()
→ syncDbSpecSheetOutsourcingForSpecSheet()
```

위 경로의 위험은 `patch`에 생산구성 필드가 포함되었는지에 따라 현재값 테이블 replace가 실행된다는 점이다.

```txt
위험 조건:
- orderEntries가 빈 배열로 포함됨
- materials가 빈 배열로 포함됨
- outsourcing이 빈 배열로 포함됨
- backward workflow인데 생산구성 field가 patch에 포함됨
```

따라서 다음 단계의 코드 기준은 아래처럼 가야 한다.

```txt
1. serviceCode를 state patch payload 또는 mutation context에 포함한다.
2. production replace allowlist에 포함된 serviceCode에서만 생산구성 field를 patch에 포함한다.
3. API route에서도 serviceCode를 검증한다.
4. repository는 serviceCode 없는 생산구성 replace를 거부하거나 무시한다.
```

## 6. 메모 호출 위치

현재 API:

```txt
app/api/workorders/memos/route.ts
```

현재 repository:

```txt
lib/workorder/persistence/dbAttachmentMemoRepository.ts
```

작업:

```txt
GET    listSnapshotByWorkOrderId         memos read
POST   createMemoThread/createMemoReply  memos insert
PATCH  updateMemo                        memos update
DELETE softDeleteMemoThread/Reply        memos soft delete
```

정책:

```txt
- 메모는 즉시 저장이 맞다.
- 메모 저장/수정/삭제는 생산구성 replace를 절대 호출하지 않는다.
- 작업지시서 삭제 시 bundle trash 처리에는 포함될 수 있다.
- R2와 직접 관계 없음.
```

## 7. 첨부 / R2 호출 위치

현재 API:

```txt
app/api/workorders/attachments/upload/route.ts
app/api/workorders/attachments/upload/complete/route.ts
app/api/workorders/attachments/delete/route.ts
app/api/workorders/attachments/primary/route.ts
app/api/workorders/attachments/file/route.ts
```

현재 R2 helpers:

```txt
lib/storage/r2/r2Client.ts
lib/storage/r2/r2Keys.ts
lib/storage/r2/r2ThumbnailKeys.ts
lib/storage/r2/r2WorkerUpload.ts
```

작업:

```txt
upload/route.ts
- R2 Worker 또는 presigned PUT URL 생성
- attachments DB insert는 하지 않음

upload/complete/route.ts
- upload target 검증
- attachments DB row create
- file proxy URL 생성

delete/route.ts
- attachments soft delete
- R2 object delete 없음

primary/route.ts
- 대표 디자인 attachment update

file/route.ts
- R2 file proxy URL / redirect 계열 read
```

정책:

```txt
- 첨부는 유실 방지를 위해 즉시 저장 계층이다.
- 첨부 삭제는 soft delete만 수행한다.
- R2 실제 삭제는 WO-S004 purge 계열에서만 수행한다.
- 첨부/R2 액션은 생산구성 replace와 분리한다.
```

## 8. 작업지시서 삭제 / 저장소 / purge 호출 위치

작업지시서 삭제:

```txt
app/api/workorders/route.ts DELETE
→ handleDeleteWorkOrders()
→ deleteDbWorkOrder()
→ softDeleteAttachmentMemoBundleForWorkOrder()
```

영향:

```txt
- spec_sheets soft delete
- attachments soft delete
- attachment_trash_items insert
- memos trash 상태 update
- R2 object delete 없음
```

실제 R2 purge:

```txt
lib/system/storagePurgeCandidates.ts
lib/admin/adminFiles.purgeWorker.ts
```

영향:

```txt
- deleteR2ObjectViaWorker()
- deleteCachedR2UrlsByKey()
- purge 성공/실패 상태 DB 반영
```

정책:

```txt
- 일반 삭제/반려/메모/첨부 삭제는 R2 object를 직접 삭제하지 않는다.
- R2 delete는 시스템관리자 purge 경로에만 둔다.
```

## 9. 현재 위험 항목

| 위험 | 위치 | 설명 | 후속 조치 |
|---|---|---|---|
| 생산구성 replace가 workflow patch 포함 여부에 의존 | `workorderRepositoryMutations.ts`, `updateDbWorkOrderStatePatch` | backward workflow에서 빈 배열이 포함되면 현재 row 삭제 위험 | serviceCode allowlist 도입 |
| `orders` 저장 정책 미정 | `dbFactoryOrderRepository.ts` | materials/outsourcing과 replace 정책이 다를 수 있음 | 0.15.52 이후 통일 |
| 현재값 테이블과 이력 테이블 역할 혼재 | `orders`, `spec_sheet_materials`, `spec_sheet_outsourcing_lines` | `is_active`, `deleted_at` 등 현재값 테이블에 과함 | full_reset schema 정리 |
| 이름 중복 저장 | `company_name`, `factory_name`, `vendor` | 조인 회피로 컬럼 증가 | partner/company 조인 기준으로 축소 |
| R2 delete 경로 오사용 가능성 | purge helpers | purge 외 경로에서 직접 delete 호출이 생기면 위험 | R2 delete service code 제한 |

## 10. 후속 코드 도입안

다음 단계에서는 문서 기준을 코드로 옮긴다.

```txt
lib/constants/workorderServiceCodes.ts
- WORKORDER_SERVICE_CODE
- WORKORDER_SERVICE_DIRECTION
- PRODUCTION_REPLACE_ALLOWED_SERVICE_CODES
- R2_DELETE_ALLOWED_SERVICE_CODES
```

예상 정책 helper:

```ts
export function canReplaceProductionComposition(serviceCode: WorkOrderServiceCode): boolean;
export function canDeleteR2Object(serviceCode: WorkOrderServiceCode): boolean;
export function shouldPreserveProductionComposition(serviceCode: WorkOrderServiceCode): boolean;
```

적용 우선순위:

```txt
1. workflow state patch에 serviceCode 전달
2. production replace allowlist 적용
3. API route에서 serviceCode 검증
4. repository sync 호출 전 allowlist 체크
5. orders replace 저장 정책 통일
6. full_reset.sql schema 정리
```

## 11. 결론

현재 문제는 개별 필드 하나의 문제가 아니라, DB/R2 side effect가 service code 단위로 통제되지 않은 문제다. 특히 workflow state patch와 생산구성 replace 저장이 같은 경로에 섞여 있어 반려/취소성 이벤트에서도 현재값 테이블이 비워질 위험이 있다.

따라서 다음 작업은 query 수정이 아니라 service code constants와 allowlist를 도입해, 어떤 액션이 어떤 저장소를 건드릴 수 있는지 코드 레벨에서 차단하는 것이다.
