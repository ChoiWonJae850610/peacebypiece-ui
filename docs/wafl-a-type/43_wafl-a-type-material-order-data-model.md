---
title: WAFL A-TYPE Material Order Data Model
version: 1.0
baseline_source: peacebypiece-ui-0.16.47
status: draft
updated: 2026-05-20
---

# 43. 원단/부자재 발주 데이터 모델 상세 설계

## 1. 목적

이 문서는 원단/부자재 발주 기능을 구현하기 전에 필요한 데이터 모델과 권한 기준을 상세화한다.

0.15.20에서는 DB schema를 실제로 추가하지 않고, 후속 구현 시 사용할 테이블 경계, 상태값, 참조 관계, full_reset 반영 범위를 문서로 확정한다.

```txt
이번 버전 포함:
- material_purchase_orders 상세 모델
- material_purchase_order_items 상세 모델
- work_order_material_rows 상세 모델
- 작업지시서와 자재 발주 연결 방식
- 권한 matrix
- 상태 전이 기준
- full_reset 반영 여부 검토

이번 버전 제외:
- 실제 DB schema 생성
- full_reset.sql 수정
- API route 구현
- 화면 구현
- PDF 생성 구현
- R2 처리 변경
```

## 2. 모델 분리 원칙

원단/부자재 발주는 작업지시서의 하위 입력값이 아니라 별도 업무 객체로 관리한다.

```txt
작업지시서:
- 제품 생산을 위한 상위 업무 문서
- 디자인/생산/검토/발주/완료 흐름의 기준

작업지시서 원단·부자재 row:
- 작업지시서에 필요한 자재 구성 요구사항
- 어떤 자재가 필요한지 정의

자재 발주서:
- 실제 공급업체에 발주하기 위한 업무 문서
- 공급업체, 발주 상태, 검토자, 발주자를 가진다.

자재 발주 품목:
- 발주서에 포함되는 실제 발주 item
- 작업지시서 원단·부자재 row와 연결된다.
```

따라서 작업지시서 상태와 자재 발주 상태를 같은 enum으로 합치지 않는다.

## 3. 권장 테이블 개요

```txt
work_order_material_rows
- 작업지시서에 필요한 원단/부자재 요구 row

material_purchase_orders
- 공급업체 단위 또는 발주 묶음 단위의 자재 발주서

material_purchase_order_items
- 자재 발주서에 포함되는 발주 품목 row

material_purchase_order_events
- 후속 후보. 검토요청/승인/발주/취소/입고 이력 기록
```

0.15.20에서는 `material_purchase_order_events`는 구현 필수 테이블이 아니라 감사로그/상태 이력 설계 후보로 둔다.

## 4. work_order_material_rows

### 4.1 역할

작업지시서 안에서 필요한 원단/부자재 요구사항을 구조화한다.

```txt
예:
- 겉감 30수 면 원단 12yd
- 안감 폴리 8yd
- 단추 15mm 120개
- 지퍼 20cm 50개
- 라벨 50개
```

### 4.2 필드 초안

```txt
id
company_id
work_order_id
material_kind
material_name
color_name
spec
placement
required_quantity
unit_code
is_required
is_order_excluded
order_exclusion_reason
memo
sort_order
created_at
updated_at
```

### 4.3 필드 기준

```txt
company_id:
- 모든 조회는 실제 로그인 세션의 companyId로 제한한다.
- fallback/mock/dev companyId를 사용하지 않는다.

work_order_id:
- 해당 row가 속한 작업지시서 id.
- 삭제/복원 정책은 작업지시서 삭제 정책과 함께 검토한다.

material_kind:
- fabric, lining, subsidiary, label, packaging 등 코드값 후보.
- 한글 표시문구로 직접 비교하지 않는다.

unit_code:
- 기준정보 단위 코드와 연결한다.
- yd, m, ea, roll 등 표시값은 i18n/presentation 계층에서 변환한다.

is_required:
- 발주 준비 완료 조건 계산에 사용한다.

is_order_excluded:
- 해당 row를 발주하지 않는 경우 true.
- 발주처를 지정하지 않아도 되는 예외를 구조적으로 표현한다.

order_exclusion_reason:
- 장기적으로는 자유문장보다 code + memo 분리를 우선 검토한다.
- 고객 표시 문구 자체를 DB 비교 기준으로 쓰지 않는다.
```

## 5. material_purchase_orders

### 5.1 역할

원단/부자재 발주 업무의 상위 객체다.  
공급업체별로 나누는 것을 기본으로 하되, 같은 작업지시서 안에서 여러 발주서를 만들 수 있다.

### 5.2 필드 초안

```txt
id
company_id
work_order_id
supplier_id
status
requested_by_user_id
requested_at
reviewed_by_user_id
reviewed_at
ordered_by_user_id
ordered_at
canceled_by_user_id
canceled_at
cancel_reason_code
cancel_memo
supplier_memo
internal_memo
created_at
updated_at
```

### 5.3 상태값 후보

```txt
draft
- 발주 초안

review_requested
- 검토 요청됨

approved
- 검토 승인됨

ordered
- 발주 완료

partially_received
- 일부 입고

received
- 입고 완료

canceled
- 취소
```

### 5.4 상태 전이 기준

```txt
draft → review_requested
- 발주 품목이 1개 이상 있다.
- 필수 수량/단위/공급업체가 입력되어 있다.
- 사용자가 materials.order.request 권한을 가진다.

draft → ordered
- 발주 품목이 1개 이상 있다.
- 사용자가 materials.order.direct 권한을 가진다.
- 검토 생략이 허용된 역할이다.

review_requested → approved
- 검토자가 materials.order.approve 권한을 가진다.

approved → ordered
- 사용자가 materials.order.direct 또는 materials.order.execute 권한을 가진다.

ordered → partially_received
- 일부 입고 수량이 기록된다.

partially_received → received
- 모든 품목 입고 수량이 발주 수량을 충족한다.

draft/review_requested/approved → canceled
- 취소 권한이 있는 사용자가 취소한다.
- 취소 사유 code 또는 memo를 남긴다.
```

상태 전이는 문자열 literal 비교가 아니라 중앙 workflow helper 또는 selector에서 처리한다.

## 6. material_purchase_order_items

### 6.1 역할

발주서 안의 실제 발주 품목 row다.

### 6.2 필드 초안

```txt
id
company_id
purchase_order_id
work_order_material_row_id
material_kind
material_name
color_name
spec
quantity
unit_code
unit_price
amount
supplier_item_code
expected_delivery_date
received_quantity
item_status
memo
sort_order
created_at
updated_at
```

### 6.3 item_status 후보

```txt
draft
ordered
partially_received
received
canceled
```

초기 구현에서는 상위 발주서 status만으로 충분하면 item_status를 보류할 수 있다.  
다만 일부 입고를 다룰 가능성이 높으므로 필드 후보로 유지한다.

### 6.4 amount 계산 기준

```txt
amount = quantity * unit_price
```

DB에 amount를 저장할지, 조회 시 계산할지는 후속 구현에서 선택한다.

권장:
- 초기에는 amount 저장 가능
- 저장 시 서버 action/API 계층에서 계산
- 클라이언트 입력값을 그대로 신뢰하지 않는다.
```

## 7. 권한 matrix

권한은 화면 노출과 서버 처리 양쪽에서 같은 기준을 사용해야 한다.

```txt
materials.order.view
- 자재 발주 목록/상세 조회

materials.order.request
- 발주 초안 생성
- 검토요청 제출

materials.order.approve
- 검토요청 승인/반려

materials.order.direct
- 검토 없이 바로 발주

materials.order.execute
- 승인된 발주서를 실제 발주 완료로 전환

materials.order.receive
- 입고 수량 입력

materials.order.cancel
- 발주 취소
```

### 7.1 역할별 기본값 후보

```txt
고객사 관리자:
- view
- request
- approve
- direct
- execute
- receive
- cancel

디자이너:
- view
- request

발주 담당:
- view
- request
- execute
- receive

검수/재고 담당:
- view
- receive

조회전용:
- view
```

기존 권한 UI가 화면 카드 중심이라면 1차 UI에는 `원단/부자재 발주 가능` 하나로 단순 표시하고, 내부 구현에서는 위 세부 권한으로 확장할 수 있게 둔다.

## 8. 작업지시서 연결 방식

### 8.1 연결 기준

```txt
work_order_material_rows.work_order_id
→ 작업지시서와 자재 요구 row 연결

material_purchase_orders.work_order_id
→ 발주서가 어떤 작업지시서에서 생성되었는지 연결

material_purchase_order_items.work_order_material_row_id
→ 실제 발주 품목이 어떤 요구 row를 충족하는지 연결
```

### 8.2 한 작업지시서에서 여러 발주서가 필요한 경우

```txt
작업지시서 1건
→ 원단 row 3개
→ 부자재 row 5개
→ 공급업체 A 발주서 1건
→ 공급업체 B 발주서 1건
→ 공급업체 C 발주서 1건
```

공급업체별로 발주서를 분리하면 PDF 출력과 발주 이력 관리가 단순해진다.

### 8.3 발주 제외 row

일부 row는 직접 구매하지 않을 수 있다.

```txt
예:
- 업체 보유 자재 사용
- 고객사 재고 사용
- 발주 불필요
- 추후 입력
```

이 경우 발주서 item을 만들지 않고 `work_order_material_rows.is_order_excluded`와 사유로 처리한다.

## 9. 발주 준비 완료 selector 기준

발주 준비 완료 여부는 화면에서 직접 계산하지 않는다.  
후속 구현 시 중앙 selector/helper에서 계산한다.

```txt
canRequestMaterialOrder(workOrder, materialRows, purchaseOrders, permissions)

true 조건 후보:
- 작업지시서가 삭제/중단 상태가 아니다.
- 작업지시서에 필수 material row가 1개 이상 있다.
- 모든 필수 row가 발주 item으로 연결되었거나 발주 제외 처리되었다.
- 발주 item의 supplier_id, quantity, unit_code가 유효하다.
- 사용자에게 materials.order.request 또는 materials.order.direct 권한이 있다.
```

바로 발주 가능 여부는 별도 selector로 둔다.

```txt
canDirectOrderMaterials(workOrder, purchaseOrder, permissions)

true 조건 후보:
- canRequestMaterialOrder 조건을 만족한다.
- purchaseOrder status가 draft 또는 approved다.
- 사용자에게 materials.order.direct 또는 materials.order.execute 권한이 있다.
```

## 10. API 설계 후보

실제 구현 시 app/api는 얇게 유지하고 검증/도메인 로직은 lib 하위로 분리한다.

```txt
app/api/material-orders/route.ts
- GET 목록 조회
- POST 발주 초안 생성

app/api/material-orders/[purchaseOrderId]/route.ts
- GET 상세 조회
- PATCH 기본 정보 수정

app/api/material-orders/[purchaseOrderId]/submit-review/route.ts
- POST 검토요청

app/api/material-orders/[purchaseOrderId]/approve/route.ts
- POST 승인

app/api/material-orders/[purchaseOrderId]/order/route.ts
- POST 발주 완료

app/api/material-orders/[purchaseOrderId]/receive/route.ts
- POST 입고 처리

app/api/material-orders/[purchaseOrderId]/cancel/route.ts
- POST 취소
```

도메인 로직 후보:

```txt
lib/material-orders/materialOrderTypes.ts
lib/material-orders/materialOrderPermissions.ts
lib/material-orders/materialOrderWorkflow.ts
lib/material-orders/materialOrderSelectors.ts
lib/material-orders/materialOrderRepository.ts
lib/material-orders/materialOrderService.ts
lib/material-orders/materialOrderPresentation.ts
```

## 11. DB schema 반영 시점

0.15.20에서는 DB schema를 추가하지 않는다.

후속 구현에서 DB를 반영한다면 다음 순서를 권장한다.

```txt
1. full_reset.sql에 신규 테이블 추가
2. foreign key와 index 추가
3. smoke test SQL에 최소 생성/조회/상태 변경 시나리오 추가
4. seed SQL에는 실제 테스트가 필요한 경우에만 최소 데이터 추가
5. API 구현 전 repository/service 계층을 먼저 정의
```

### 11.1 full_reset.sql 영향 검토

```txt
이번 0.15.20:
- full_reset.sql 수정 없음
- 신규 테이블 생성 없음
- 전체 리셋 필요 없음

후속 DB 반영 시:
- company_id 기준 index 필수
- work_order_id 기준 index 필수
- supplier_id 기준 index 권장
- status 기준 index 권장
- deleted/archived 정책을 쓸지 별도 결정 필요
```

## 12. UI 구현 순서 후보

```txt
1. route placeholder
2. read-only 목록
3. 작업지시서에서 자재 발주 준비 진입 버튼
4. material row 편집
5. 발주서 초안 생성
6. 검토요청/승인/바로 발주
7. PDF 출력
8. 입고 처리
```

작업지시서 화면의 기존 발주 flow를 바로 바꾸지 않고, 먼저 별도 자재 발주 화면을 만들어 연결하는 방식이 안전하다.

## 13. 리스크와 보류 항목

```txt
High risk:
- 기존 작업지시서 발주 상태와 충돌
- PDF 출력 시점 변경
- 권한 UI가 너무 복잡해지는 문제
- 일부 입고/부분 발주를 너무 빨리 구현하는 문제

보류:
- 입고/재고 관리 본격화
- 공급업체별 단가 이력
- 세금계산서/결제와 자재 발주 비용 연결
- R2 발주 PDF 저장/만료 정책
```

## 14. 0.15.21 결정 반영

작업지시서 발주 flow 변경 설계는 `44_wafl-a-type-workorder-order-flow.md`로 분리한다.

```txt
0.15.21 결정:
- 작업지시서 발주 버튼은 실제 발주 완료가 아니라 자재 발주 준비 진입 역할로 재정의한다.
- 작업지시서 상태와 자재 발주 상태를 같은 enum으로 합치지 않는다.
- 발주 준비 가능 여부는 selector/helper에서 계산한다.
- 검토요청과 직접발주 권한은 materials.order.request / materials.order.direct 계열로 분리한다.
- PDF는 작업지시서 PDF, 자재 발주 초안 PDF, 자재 발주 확정 PDF, 공유 PDF로 목적을 분리한다.
```

후속 구현에서는 이 문서의 데이터 모델과 44번 문서의 flow 기준을 함께 사용한다.
