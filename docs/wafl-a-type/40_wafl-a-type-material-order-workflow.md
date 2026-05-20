---
title: WAFL A-TYPE Material Order Workflow
version: 1.0
baseline_source: peacebypiece-ui-0.15.20
status: planned
updated: 2026-05-20
---

# 40. 원단/부자재 발주 업무 흐름

## 1. 목적

원단/부자재 발주는 작업지시서 안의 단순 PDF 모달이 아니라 별도 업무 화면으로 분리한다.

0.15.18에서는 작업지시서, 원단/부자재 row, 협력업체, 발주 상태, 권한, PDF 출력 시점을 연결하는 설계 기준을 정리했다. 0.15.20에서는 상세 데이터 모델을 `43_wafl-a-type-material-order-data-model.md`로 분리해 확장한다.

```txt
적용 성격:
- 업무 IA 문서화
- 권한/상태/데이터 모델 초안
- route 후보 정리

이번 버전 제외:
- 화면 구현
- DB schema 생성
- API 구현
- PDF 생성 구현
- R2 처리 변경
```

## 2. 핵심 방향

```txt
- 원단/부자재 발주는 별도 업무 화면으로 분리한다.
- 고객사 관리자와 권한 있는 디자이너가 접근할 수 있다.
- 검토요청만 가능한 사용자와 직접 발주 가능한 사용자를 구분한다.
- 작업지시서의 원단/부자재 구성 row와 발주 row를 연결한다.
- 모든 필수 row가 발주 준비되었을 때 발주요청 또는 바로 발주가 가능하다.
- PDF는 발주 내용이 구조화된 뒤 출력한다.
```

## 3. 추천 route

```txt
고객사 관리자:
- /admin/material-orders
- /admin/material-orders/[purchaseOrderId]

일반 멤버/디자이너:
- /workspace/material-orders
- /workspace/material-orders/[purchaseOrderId]

작업지시서 연결:
- /workspace/workorders/[workOrderId]
- /admin/workorders/[workOrderId]
```

URL은 후보이며, 실제 구현 시 현재 작업지시서 route 구조와 충돌 여부를 먼저 확인한다.

## 4. 홈 카드 배치 후보

### 4.1 고객사 관리자 홈

```txt
- 작업지시서 업무 화면
- 원단/부자재 발주
- 협력업체 관리
- 저장소 관리
- 통계정보
- 멤버 관리
```

### 4.2 디자이너 workspace 홈

```txt
- 내 작업지시서
- 원단/부자재 발주
- 협력업체 조회
- 기준정보 조회
```

디자이너에게 협력업체 관리 권한을 주지 않더라도, 발주 업무를 위해 협력업체 조회는 필요할 수 있다.

## 5. 권한 후보

```txt
workorders.write
- 작업지시서 작성/수정

workorders.order
- 작업지시서 발주 요청 또는 직접 발주

materials.order
- 원단/부자재 발주 생성/검토요청/발주

partners.manage
- 협력업체 생성/수정/비활성화

standards.manage
- 기준정보 관리
```

추천 기준:

```txt
- 원단/부자재 발주는 materials.order로 별도 분리한다.
- 초기 단순화가 필요하면 workorders.order와 묶을 수 있다.
- 장기적으로는 별도 권한이 안전하다.
```

## 6. 작업지시서 발주 flow 변경

### 6.1 기존 flow

```txt
1. 작업지시서에서 발주처리
2. 요약정보 모달 확인
3. PDF 출력
```

### 6.2 변경 flow

```txt
1. 작업지시서에서 발주요청 또는 자재 발주 준비를 클릭한다.
2. 작업지시서 상태를 자재 발주 대기 또는 발주 준비 중으로 변경한다.
3. 원단/부자재 발주 화면으로 이동하거나 발주 모달을 연다.
4. 작업지시서의 원단/부자재 row와 발주 row를 연결한다.
5. 등록된 원단/부자재 업체를 선택한다.
6. 수량/단가/메모를 입력한다.
7. 필요한 row가 모두 연결되면 발주요청 버튼을 활성화한다.
8. 권한에 따라 검토요청 또는 바로 발주를 실행한다.
9. 발주 확정 뒤 PDF를 출력한다.
```

## 7. 상태 후보

### 7.1 자재 발주 상태

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

### 7.2 작업지시서 상태 후보

```txt
작성 중
검토 요청
검토 완료
자재 발주 대기
발주 준비 완료
발주 완료
생산 진행
완료
```

작업지시서 상태와 자재 발주 상태는 같은 enum으로 합치지 않는다. 작업지시서는 생산 업무의 상위 상태이고, 자재 발주는 그 안에 연결되는 별도 업무 상태다.

## 8. 데이터 모델 초안

실제 DB schema는 후속 버전에서 full_reset.sql 영향까지 확인한 뒤 반영한다. 0.15.20 기준 상세 모델은 `43_wafl-a-type-material-order-data-model.md`를 기준으로 한다.

### 8.1 material_purchase_orders

```txt
id
company_id
work_order_id
supplier_id
status
requested_by
reviewed_by
ordered_by
ordered_at
memo
created_at
updated_at
```

### 8.2 material_purchase_order_items

```txt
id
purchase_order_id
work_order_material_row_id
material_type
material_name
color
spec
quantity
unit
unit_price
amount
supplier_item_code
memo
```

### 8.3 work_order_material_rows

```txt
id
work_order_id
material_type
material_name
required_quantity
unit
color
placement
memo
```

## 9. 발주 버튼 활성화 조건 후보

```txt
발주요청 가능:
- 작업지시서가 삭제/중단 상태가 아니다.
- 작업지시서에 원단/부자재 row가 1개 이상 있다.
- 각 필수 row에 발주처 또는 발주 제외 사유가 있다.
- 필수 수량과 단위가 있다.
- 사용자에게 materials.order 또는 workorders.order 계열 권한이 있다.

바로 발주 가능:
- 발주요청 가능 조건을 만족한다.
- 사용자에게 직접 발주 권한이 있다.
- 검토 생략이 허용된 역할이다.
```

문자열 literal 비교 대신 중앙 permission helper 또는 workflow selector를 통해 판단한다.

## 10. PDF 출력 시점

```txt
초안 PDF:
- draft 또는 review_requested 상태에서 내부 검토용으로 출력 가능

발주 PDF:
- approved 또는 ordered 상태에서 출력
- supplier_id, item, quantity, unit, memo가 확정된 뒤 출력

공유 PDF:
- 권한/만료 정책이 정의된 뒤 0.18.x에서 링크 공유와 연결
```

## 11. 구현 리스크

```txt
Low risk:
- IA 문서
- 준비 중 카드
- route placeholder

Medium risk:
- 권한 helper 확장
- 작업지시서 상태 표시 추가
- 발주 화면 read-only 목록

High risk:
- DB schema 추가
- 기존 작업지시서 발주 flow 변경
- PDF 생성/공유
- R2 저장/만료 정책 연결
```

## 12. 상세 데이터 모델 참조

```txt
상세 설계 기준:
- 43_wafl-a-type-material-order-data-model.md

0.15.20 결정:
- DB schema는 아직 추가하지 않는다.
- full_reset.sql은 아직 수정하지 않는다.
- work_order_material_rows / material_purchase_orders / material_purchase_order_items 3계층 모델을 후속 구현 기준으로 둔다.
```

## 13. QA 체크리스트

```txt
[ ] 작업지시서 상태와 자재 발주 상태가 분리되어 있는가?
[ ] 원단/부자재 row와 발주 item 연결 방식이 명확한가?
[ ] 검토요청과 바로 발주 권한이 분리되어 있는가?
[ ] 디자이너가 협력업체를 관리하지 않고도 발주에 필요한 조회를 할 수 있는가?
[ ] PDF 출력 시점이 초안/발주/공유로 구분되어 있는가?
[ ] DB/API/R2 구현 전 문서 수준 설계로만 제한되어 있는가?
```
