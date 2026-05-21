# WAFL A-Type — 작업지시서 serviceCode side effect matrix

## 목적

0.15.50~0.15.52에서 정의한 작업지시서 service code를 DB/R2 side effect 기준으로 다시 정리한다.

이번 문서는 기능 동작을 바꾸는 문서가 아니라, 다음 리팩토링에서 각 액션이 어떤 resource와 operation을 사용할 수 있는지 코드와 문서의 기준을 맞추기 위한 기준이다.

## 원칙

```txt
1. DB/R2를 변경하는 작업지시서 액션은 serviceCode를 가진다.
2. serviceCode는 direction, resource, operation, R2 delete 허용 여부를 가진다.
3. 생산구성 replace 저장은 명시 저장/forward workflow에서만 허용한다.
4. 반려/취소/되돌리기 계열은 workflow/history만 저장하고 생산구성을 replace하지 않는다.
5. 메모/첨부/R2/삭제/복원/purge는 생산구성 replace 저장과 분리한다.
6. R2 delete/purge는 purge service code에서만 허용한다.
```

## side effect resource

```txt
spec_sheets
orders
spec_sheet_materials
spec_sheet_outsourcing_lines
memos
attachments
workorder_history
r2_objects
```

## side effect operation

```txt
select
insert
update
delete
replace
soft_delete
restore
r2_put
r2_delete
r2_purge
```

## serviceCode별 기준

| Code | 방향 | 주요 resource | 주요 operation | 생산구성 replace | R2 delete |
|---|---|---|---|---:|---:|
| WO-I001 | immediate | spec_sheets, workorder_history | update, insert | N | N |
| WO-I002 | immediate | spec_sheets, workorder_history | update, insert | N | N |
| WO-I003 | immediate | spec_sheets, workorder_history | update, insert | N | N |
| WO-I004 | immediate | spec_sheets, workorder_history | update, insert | N | N |
| WO-P001 | explicit_save | spec_sheets, orders, workorder_history | update, replace, insert | Y | N |
| WO-P002 | explicit_save | spec_sheets, orders, spec_sheet_materials, spec_sheet_outsourcing_lines, workorder_history | update, replace, insert | Y | N |
| WO-F001 | forward_workflow | spec_sheets, orders, spec_sheet_materials, spec_sheet_outsourcing_lines, workorder_history | update, replace, insert | Y | N |
| WO-F002 | forward_workflow | spec_sheets, orders, spec_sheet_materials, spec_sheet_outsourcing_lines, workorder_history | update, replace, insert | Y | N |
| WO-F003 | forward_workflow | spec_sheets, orders, spec_sheet_materials, spec_sheet_outsourcing_lines, workorder_history | update, replace, insert | Y | N |
| WO-F004 | forward_workflow | spec_sheets, workorder_history | update, insert | Y | N |
| WO-F005 | forward_workflow | spec_sheets, workorder_history | update, insert | Y | N |
| WO-B001 | backward_workflow | spec_sheets, workorder_history | update, insert | N | N |
| WO-B002 | backward_workflow | spec_sheets, workorder_history | update, insert | N | N |
| WO-B003 | backward_workflow | spec_sheets, workorder_history | update, insert | N | N |
| WO-M001 | memo | memos, workorder_history | insert | N | N |
| WO-M002 | memo | memos, workorder_history | update, insert | N | N |
| WO-M003 | memo | memos, workorder_history | soft_delete, insert | N | N |
| WO-A001 | attachment | attachments, r2_objects | insert, r2_put | N | N |
| WO-A002 | attachment | attachments, r2_objects | insert, r2_put | N | N |
| WO-A003 | attachment | attachments, workorder_history | update, insert | N | N |
| WO-A004 | attachment | attachments, workorder_history | soft_delete, insert | N | N |
| WO-A005 | attachment | attachments, workorder_history | update, insert | N | N |
| WO-S001 | storage | spec_sheets, attachments, memos, workorder_history | soft_delete, insert | N | N |
| WO-S002 | storage | spec_sheets, attachments, memos, workorder_history | restore, insert | N | N |
| WO-S003 | storage | attachments, memos, workorder_history | restore, insert | N | N |
| WO-S004 | storage | spec_sheets, attachments, memos, r2_objects | delete, r2_purge | N | Y |
| WO-R001 | reorder | spec_sheets, workorder_history | insert | N | N |
| WO-Q001 | query | spec_sheets | select | N | N |
| WO-Q002 | query | spec_sheets, orders, spec_sheet_materials, spec_sheet_outsourcing_lines, attachments, memos, workorder_history | select | N | N |
| WO-Q003 | query | spec_sheets | select | N | N |

## 코드 기준

이번 버전에서 추가한 코드 기준:

```txt
lib/workorder/serviceCodeSideEffects.ts
```

이 파일은 다음 정보를 제공한다.

```txt
WORKORDER_SERVICE_DIRECTION
WORKORDER_SERVICE_RESOURCE
WORKORDER_SERVICE_OPERATION
WORKORDER_SERVICE_SIDE_EFFECTS
getWorkOrderServiceSideEffect()
getWorkOrderServiceResources()
getWorkOrderServiceOperations()
canWorkOrderServiceTouchResource()
canWorkOrderServiceUseOperation()
canWorkOrderServiceDeleteR2Object()
```

## 후속 작업 기준

0.15.54 이후 실제 mutation/API route를 serviceCode 기준으로 점진적으로 묶는다.

우선순위:

```txt
1. 반려/취소/되돌리기 계열에서 production replace가 절대 실행되지 않도록 repository mutation guard 보강
2. 첨부/R2 경로에서 R2 delete가 purge service code 없이 실행되지 않도록 guard 보강
3. 메모 저장과 production replace 저장을 호출 레벨에서 분리
4. 삭제/복원/purge 경로의 DB/R2 영향 범위를 serviceCode 기준으로 문서와 맞춤
```

## 이번 버전에서 하지 않은 것

```txt
- DB schema 변경 없음
- API route 동작 변경 없음
- R2 upload/delete 동작 변경 없음
- workorder repository 저장 동작 변경 없음
- full_reset.sql 변경 없음
```
