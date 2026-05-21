# 86. 작업지시서 workflow/save serviceCode 연결 보강

## 버전

```txt
0.15.63
```

## 목적

0.15.62에서 즉시 저장 계열 serviceCode를 1차 연결한 뒤 발생한 TypeScript 빌드 오류를 수정하고, 발주정보 저장/생산구성 저장/검토완료/발주요청/되돌리기 계열의 serviceCode 기준을 코드 상수로 더 명확히 고정한다.

이번 단계는 serviceCode 기준을 보강하는 작업이며 DB schema, R2 key, 권한/세션 흐름은 변경하지 않는다.

---

## 빌드 오류 수정

### 원인

`lib/workorder/serviceCodeForWorkOrderPatch.ts`에서 `ASSIGNEE_FIELDS`와 `BASIC_INFO_FIELDS`를 `keyof WorkOrder`로 제한하면서 실제 `WorkOrder` 타입에 없는 필드를 포함했다.

문제 필드:

```txt
managerRole
orderType
```

### 수정

```txt
managerRole 제거
orderType 제거
```

현재 즉시 저장 patch 판정은 실제 `WorkOrder` 타입에 존재하는 필드만 대상으로 한다.

```txt
담당자 변경: manager, managerId
기본정보/분류: category1/2/3, category1Id/2Id/3Id, season, priority, workOrderKind, dueDate, vendor
```

---

## workflow serviceCode 기준 보강

0.15.63에서는 workflow action type과 serviceCode 연결을 switch문 내부 판단에만 두지 않고, 명시적인 map으로 고정했다.

```txt
request_review          -> WO-F001 requestReview
approve_review          -> WO-F002 approveReview
request_order           -> WO-F003 requestOrder
complete_inspection     -> WO-F004 completeInspection
reject_review           -> WO-B001 rejectReview
cancel_review_request   -> WO-B003 revertWorkflow
cancel_review_approval  -> WO-B003 revertWorkflow
request_reinspection    -> WO-B003 revertWorkflow
```

주의:

```txt
WO-B002 cancelOrder는 실제 발주취소 action type이 생길 때 연결한다.
현재 cancel_review_approval은 발주취소가 아니라 검토완료 취소/되돌리기 성격이므로 WO-B003으로 유지한다.
```

---

## 명시 저장 serviceCode 기준 보강

발주정보 저장과 생산구성 저장은 workflow action이 아니라 사용자가 명시적으로 저장하는 성격이므로 별도 explicit save scope로 기준을 잡았다.

```txt
order_info              -> WO-P001 orderInfoSave
production_composition  -> WO-P002 productionCompositionSave
```

후속 실제 버튼 연결 시 이 scope 기준을 사용한다.

```txt
발주정보 저장 버튼 -> getWorkOrderExplicitSaveServiceCode(order_info)
생산구성 저장 버튼 -> getWorkOrderExplicitSaveServiceCode(production_composition)
```

---

## 현재 유지 기준

```txt
WO-F001 검토요청:
- orders/materials/outsourcing replace 허용

WO-F002 검토완료:
- production replace 허용 후보 유지

WO-F003 발주요청:
- production replace 허용 후보 유지

WO-B001 반려:
- production replace 금지

WO-B003 되돌리기/취소/재검토:
- production replace 금지
```

---

## 변경하지 않은 것

```txt
- orders replace 저장 방식은 아직 전환하지 않음
- full_reset.sql 변경 없음
- 생산구성 3개 테이블 schema 변경 없음
- 메모/첨부/R2 route 동작 변경 없음
- 반려/검토요청 회귀 기준 변경 없음
```

---

## 후속 작업

```txt
0.15.64
- orders 저장 방식을 spec_sheet_id 기준 replace 방식으로 정리
- is_active=false / deleted_at 누적 방식 제거 방향 적용

0.15.65
- orders / spec_sheet_materials / spec_sheet_outsourcing_lines 컬럼 정리 SQL 설계
- full_reset.sql 반영 범위 점검
```
