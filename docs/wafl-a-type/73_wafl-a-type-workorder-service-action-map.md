---
title: 작업지시서 서비스 액션 맵
version: 1.0
baseline_source: peacebypiece-ui-0.15.49
status: draft
updated: 2026-05-21
---

# 73. 작업지시서 서비스 액션 맵

## 1. 목적

작업지시서 화면에서 DB 또는 R2를 변경하는 모든 동작을 서비스 코드 기준으로 식별한다. 이 문서는 버튼/화면 동작이 어떤 테이블, 어떤 저장 방식, 어떤 R2 동작을 수행해도 되는지 먼저 정의하기 위한 기준이다.

최근 생산구성 저장 안정화 과정에서 다음 문제가 반복됐다.

```txt
- 검토요청 후 생산구성 숫자가 0으로 표시됨
- DB에는 저장됐지만 조회 mapper에서 숫자를 복원하지 못함
- spec_sheet_materials / spec_sheet_outsourcing_lines에 is_active=false row가 계속 누적됨
- replace 저장 적용 후 반려/취소성 workflow에서 생산구성이 사라지는 경로가 생김
```

원인은 개별 query 한 줄이 아니라, 작업지시서 화면의 DB/R2 side effect가 서비스 단위로 통제되지 않은 데 있다. 따라서 후속 패치에서는 아래 서비스 코드표를 기준으로 DB/R2 저장 허용 범위와 금지 범위를 먼저 확인한다.

## 2. 서비스 코드 체계

```txt
WO-Ixxx  Immediate save          즉시 저장
WO-Pxxx  Production/order save   발주정보/생산구성 명시 저장
WO-Fxxx  Forward workflow        앞으로 진행되는 workflow
WO-Bxxx  Backward workflow       반려/취소/되돌리기 workflow
WO-Mxxx  Memo                    메모
WO-Axxx  Attachment              첨부/R2
WO-Sxxx  Storage/trash           삭제/복원/휴지통/purge
WO-Rxxx  Reorder                 리오더
WO-Qxxx  Read/query              조회/요약/통계
```

공통 규칙:

```txt
1. DB/R2를 변경하는 동작은 반드시 서비스 코드를 가진다.
2. 서비스 코드별 허용 테이블과 금지 테이블을 문서화한다.
3. forward workflow만 생산구성 replace 저장을 수행할 수 있다.
4. backward workflow는 기존 생산구성 row를 삭제하거나 replace하지 않는다.
5. R2 delete는 purge 계열 서비스 코드에서만 허용한다.
6. 메모/첨부는 유실 방지를 위해 즉시 저장 계층으로 둔다.
7. 생산구성은 검토요청/발주요청/명시 저장 같은 확정 이벤트에서만 현재값 테이블에 저장한다.
```

## 3. 현재 확인한 주요 API / repository 위치

### 작업지시서 본체

```txt
app/api/workorders/route.ts
- GET    handleGetWorkOrders
- POST   handlePostWorkOrders
- PATCH  handlePatchWorkOrders
- DELETE handleDeleteWorkOrders

app/api/workorders/[workOrderId]/route.ts
- GET    handleGetWorkOrderDetail
- PATCH  handlePatchWorkOrderState

lib/workorder/api/workOrderRouteHandlers.ts
lib/workorder/repository/dbWorkOrderRepository.ts
lib/hooks/workorder/workorderRepositoryMutations.ts
```

### 생산구성 현재값 테이블

```txt
lib/workorder/repository/dbFactoryOrderRepository.ts
- orders 저장/조회 후보

lib/workorder/repository/dbSpecSheetMaterialRepository.ts
- spec_sheet_materials 저장/조회

lib/workorder/repository/dbSpecSheetOutsourcingRepository.ts
- spec_sheet_outsourcing_lines 저장/조회
```

### 메모

```txt
app/api/workorders/memos/route.ts
lib/workorder/persistence/attachmentMemoAdapter.ts
lib/workorder/persistence/attachmentMemoRepository.ts
```

### 첨부 / R2

```txt
app/api/workorders/attachments/upload/route.ts
app/api/workorders/attachments/upload/direct/route.ts
app/api/workorders/attachments/upload/complete/route.ts
app/api/workorders/attachments/delete/route.ts
app/api/workorders/attachments/primary/route.ts
app/api/workorders/attachments/file/route.ts

lib/storage/r2/r2Client.ts
lib/storage/r2/r2Keys.ts
lib/storage/r2/r2WorkerUpload.ts
lib/workorder/persistence/attachmentMemoAdapter.ts
```

### 저장소 / 휴지통 / purge

```txt
app/api/admin/files/snapshot/route.ts
app/api/admin/files/trash/restore/route.ts
app/api/admin/files/trash/purge/route.ts
app/api/admin/files/trash/purge-worker/route.ts
app/api/admin/files/workorders/restore/route.ts
app/api/admin/files/workorders/purge/route.ts
app/api/system/storage-usage/route.ts
app/api/system/storage-usage/purge/route.ts

lib/admin/adminFiles.serverActions.ts
lib/admin/adminFiles.purgeWorker.ts
lib/admin/adminFiles.actionFlow.ts
```

## 4. 작업지시서 서비스 코드 목록

| Code | 화면/영역 | 액션 | Direction | 저장 정책 |
|---|---|---|---|---|
| WO-I001 | 작업지시서 상세 | 제목 변경 | neutral | 즉시 DB update |
| WO-I002 | 작업지시서 상세 | 담당자 변경 | neutral | 즉시 DB update |
| WO-I003 | 작업지시서 상세 | 분류/기본정보 변경 | neutral | 즉시 DB update 또는 명시 저장 후보 |
| WO-I004 | 작업지시서 상세 | 현재 재고 변경 | neutral | 즉시 DB update 후보 |
| WO-P001 | 작업지시서 상세 | 발주정보 저장 | neutral/forward | orders 현재값 저장 |
| WO-P002 | 작업지시서 상세 | 생산구성 저장 | neutral/forward | materials/outsourcing 현재값 저장 |
| WO-F001 | 작업지시서 상세 | 검토요청 | forward | workflow + 생산구성 확정 저장 가능 |
| WO-F002 | 관리자 검토 | 검토완료 | forward | workflow + 생산구성 확정 저장 가능 |
| WO-F003 | 작업지시서 상세 | 발주요청 | forward | workflow + 발주/생산구성 확정 저장 가능 |
| WO-F004 | 작업지시서 상세 | 검수완료 | forward | workflow/status/history 저장 |
| WO-F005 | 작업지시서 상세 | 완료처리 | forward | workflow/status/history 저장 |
| WO-B001 | 관리자 검토 | 반려 | backward | workflow/history/reason만 저장 |
| WO-B002 | 작업지시서 상세 | 발주취소 | backward | workflow/history/reason만 저장 |
| WO-B003 | 작업지시서 상세 | 상태 되돌리기 | backward | workflow/history만 저장 |
| WO-M001 | 메모 | 메모 추가 | neutral | 즉시 DB insert |
| WO-M002 | 메모 | 메모 수정 | neutral | 즉시 DB update |
| WO-M003 | 메모 | 메모 삭제 | neutral | soft delete 후보 |
| WO-A001 | 첨부 | 디자인 첨부 업로드 준비 | neutral | R2 upload target 생성 + DB 준비 후보 |
| WO-A002 | 첨부 | 일반 첨부 업로드 준비 | neutral | R2 upload target 생성 + DB 준비 후보 |
| WO-A003 | 첨부 | 업로드 완료 | neutral | attachments DB insert/finalize |
| WO-A004 | 첨부 | 첨부 삭제 요청 | neutral | attachments soft delete + trash row |
| WO-A005 | 첨부 | 대표 디자인 지정 | neutral | attachments is_primary update |
| WO-S001 | 작업지시서 | 작업지시서 삭제 | neutral | spec_sheets soft delete + 연결 첨부/메모 trash 처리 |
| WO-S002 | 저장소 | 작업지시서 복원 | neutral | spec_sheets/attachments/memos restore |
| WO-S003 | 저장소 | 첨부/메모 복원 | neutral | attachments/memos restore |
| WO-S004 | 저장소 | 휴지통 purge | destructive | DB purge + R2 delete |
| WO-R001 | 작업지시서 | 리오더 생성 | forward | 새 spec_sheets row 생성 + 원본 참조 |
| WO-Q001 | 작업지시서 | 목록 조회 | read | DB read only |
| WO-Q002 | 작업지시서 | 상세 조회 | read | DB read only |
| WO-Q003 | 작업지시서 | 요약 조회 | read | DB read only |

## 5. 서비스 코드별 DB/R2 영향표

### WO-F001 검토요청

```txt
허용:
- spec_sheets workflow_state/status update
- workorder_history insert
- orders replace 저장 가능
- spec_sheet_materials replace 저장 가능
- spec_sheet_outsourcing_lines replace 저장 가능

금지:
- attachments 삭제
- memos 삭제
- R2 object 삭제
- attachment_trash_items 생성

주의:
- 생산구성 snapshot이 비어 있으면 replace 저장 금지 또는 이전 현재값 유지 정책 필요
- 검토요청은 forward workflow이므로 생산구성 확정 저장 가능
```

### WO-F002 검토완료

```txt
허용:
- spec_sheets workflow_state/status update
- workorder_history insert
- 생산구성 확정 저장 가능

금지:
- 첨부/R2 삭제
- 메모 삭제

주의:
- 검토완료 시 생산구성을 새로 확정할지, 검토요청 당시 확정값을 유지할지 정책 확정 필요
```

### WO-B001 반려

```txt
허용:
- spec_sheets workflow_state/status update
- rejection reason 저장 후보
- workorder_history insert

금지:
- orders replace
- spec_sheet_materials replace
- spec_sheet_outsourcing_lines replace
- attachments 삭제
- memos 삭제
- R2 object 삭제

주의:
- 반려는 backward workflow다.
- 반려는 생산구성을 확정 저장하는 이벤트가 아니다.
- 빈 production patch가 전달되어도 현재 생산구성 row를 삭제하면 안 된다.
```

### WO-F003 발주요청

```txt
허용:
- spec_sheets workflow_state/status update
- workorder_history insert
- orders replace 저장 가능
- spec_sheet_materials replace 저장 가능
- spec_sheet_outsourcing_lines replace 저장 가능

금지:
- 첨부/R2 삭제
- 메모 삭제

주의:
- 발주요청은 forward workflow다.
- 현재 생산구성을 발주 기준값으로 확정할 수 있다.
```

### WO-P001 발주정보 저장

```txt
허용:
- orders replace 또는 upsert
- workorder_history insert 후보

금지:
- spec_sheet_materials replace
- spec_sheet_outsourcing_lines replace
- workflow_state 변경
- R2 object 변경

주의:
- 발주정보 저장은 workflow 변경과 분리한다.
```

### WO-P002 생산구성 저장

```txt
허용:
- spec_sheet_materials replace
- spec_sheet_outsourcing_lines replace
- workorder_history insert 후보

금지:
- workflow_state 변경
- orders replace 단, 같은 버튼에서 발주정보까지 포함한다면 명시 필요
- attachments/memos/R2 변경

주의:
- 생산구성 저장은 명시 버튼 또는 forward workflow에서만 수행한다.
```

### WO-M001 / WO-M002 / WO-M003 메모

```txt
허용:
- memos insert/update/soft delete
- memo replies insert/update/soft delete
- workorder_history insert 후보

금지:
- orders/materials/outsourcing replace
- workflow_state 변경
- R2 object delete

주의:
- 메모는 유실 방지를 위해 즉시 저장한다.
```

### WO-A001~WO-A005 첨부/R2

```txt
허용:
- R2 put/upload prepare
- attachments insert/finalize
- attachments soft delete
- attachment_trash_items insert
- 대표 디자인 지정 update
- R2 preview/read URL 발급

금지:
- 생산구성 replace
- workflow_state 변경
- R2 delete, 단 purge 서비스 제외

주의:
- 일반 삭제는 R2 object를 즉시 삭제하지 않는다.
- R2 delete는 purge 계열에서만 수행한다.
```

### WO-S004 purge

```txt
허용:
- attachment_trash_items purge mark/update/delete
- attachments hard delete 후보
- R2 object delete
- system/admin audit insert

금지:
- 생산구성 replace
- workflow_state 임의 변경

주의:
- purge는 destructive action이다.
- 삭제 대상 key와 DB row를 audit 가능한 방식으로 처리해야 한다.
```

## 6. 테이블별 역할 초안

| Table | 역할 | 현재값/이력 | 정리 방향 |
|---|---|---|---|
| spec_sheets | 작업지시서 본체 | 현재값 + workflow 상태 | 유지 |
| orders | 공장별 발주 현재 구성 | 현재값 | spec_sheet_id 기준 replace |
| spec_sheet_materials | 원단/부자재 현재 구성 | 현재값 | spec_sheet_id 기준 replace |
| spec_sheet_outsourcing_lines | 외주공정 현재 구성 | 현재값 | spec_sheet_id 기준 replace |
| attachments | 작업지시서 첨부 메타 | 현재값 + soft delete | 유지 |
| attachment_trash_items | 첨부 휴지통 | 이력/복원 대기 | 유지 |
| memos | 작업지시서 메모 | 현재값 + soft delete | 유지 |
| workorder_history | 작업지시서 업무 이력 | 이력 | 유지 |
| workorder_production_snapshots | 생산구성 이벤트 snapshot | 이력 후보 | 후속 설계 |

## 7. 생산구성 저장 허용/금지 기준

### 저장 허용

```txt
WO-P001 발주정보 저장
WO-P002 생산구성 저장
WO-F001 검토요청
WO-F002 검토완료
WO-F003 발주요청
```

### 저장 금지

```txt
WO-B001 반려
WO-B002 발주취소
WO-B003 상태 되돌리기
WO-M001/002/003 메모
WO-A001/002/003/004/005 첨부
WO-S001/002/003/004 삭제/복원/purge
WO-I001/002/003/004 즉시 필드 저장
```

## 8. 후속 코드 반영 기준

서비스 코드 문서화 후 실제 코드는 다음 순서로 정리한다.

```txt
1. service code constants 추가
2. workflow action에 serviceCode를 명시
3. repository mutation이 serviceCode 기준으로 허용 저장 범위를 판단
4. production replace 저장은 serviceCode allowlist에서만 수행
5. R2 delete는 purge serviceCode allowlist에서만 수행
6. query/repository 문서와 실제 코드 경로를 맞춘다
```

## 9. 0.15.51 이후 전수조사 후보

```txt
- app/api/workorders/** route 전체
- lib/workorder/api/workOrderRouteHandlers.ts
- lib/hooks/workorder/workorderRepositoryMutations.ts
- lib/workorder/repository/**
- lib/workorder/persistence/**
- app/api/workorders/attachments/**
- app/api/workorders/memos/route.ts
- lib/admin/adminFiles.serverActions.ts
- lib/admin/adminFiles.purgeWorker.ts
```

## 10. 결정 필요 사항

```txt
1. 검토완료 시 생산구성을 다시 확정 저장할지, 검토요청 당시 값을 유지할지
2. 명시적인 “생산구성 저장” 버튼을 유지할지, forward workflow에서만 저장할지
3. orders도 0.15.48의 material/outsourcing과 같은 replace 저장으로 통일할지
4. 생산구성 snapshot/history 테이블을 언제 도입할지
5. 현재값 테이블의 created_at/updated_at/is_active/deleted_at 제거를 full_reset.sql에 언제 반영할지
```
