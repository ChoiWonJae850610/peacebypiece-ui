---
title: WAFL A-TYPE Workorder Order Flow Design
version: 1.0
baseline_source: peacebypiece-ui-0.16.47
status: draft
updated: 2026-05-20
---

# 44. 작업지시서 발주 flow 변경 설계

## 1. 목적

이 문서는 기존 작업지시서 발주요청/PDF 흐름을 원단/부자재 발주 업무와 충돌하지 않도록 재정의한다.

0.15.21에서는 기능 구현이나 DB schema 변경을 하지 않고, 작업지시서 상태, 자재 발주 상태, 발주 버튼, PDF 출력 시점, 권한 분기를 문서 기준으로 확정한다.

```txt
이번 버전 포함:
- 기존 발주요청/PDF flow 문제점 정리
- 작업지시서 상태와 자재 발주 상태 분리 기준
- 발주요청 버튼과 자재 발주 준비 버튼의 역할 정의
- 버튼 활성화 selector 후보
- 검토요청/직접발주 권한 분기
- PDF 출력 시점과 위치
- 후속 구현 순서

이번 버전 제외:
- 작업지시서 화면 코드 수정
- DB schema 추가
- API route 구현
- PDF 생성 구현
- R2 저장/만료 정책 변경
```

## 2. 기존 flow의 문제

기존 작업지시서 발주 흐름은 작업지시서 안에서 바로 발주처리와 PDF 출력을 연결하는 방식이었다.

```txt
기존:
1. 작업지시서에서 발주처리
2. 요약정보 모달 확인
3. PDF 출력
```

이 방식은 단순하지만 원단/부자재 발주 업무가 추가되면 다음 문제가 생긴다.

```txt
문제:
- 작업지시서 발주 상태와 자재 발주 상태가 한 화면에서 섞인다.
- 어떤 원단/부자재 row가 실제 발주 대상인지 확인하기 어렵다.
- 공급업체별 발주서가 여러 개로 나뉘는 상황을 표현하기 어렵다.
- 검토요청과 직접발주 권한을 UI에서 구분하기 어렵다.
- PDF가 초안인지, 발주 확정본인지, 외부 공유본인지 불명확하다.
```

따라서 작업지시서의 발주 버튼은 실제 발주 완료를 의미하기보다 자재 발주 업무로 진입하는 관문으로 재정의한다.

## 3. 상태 분리 원칙

작업지시서 상태와 자재 발주 상태는 같은 enum으로 합치지 않는다.

```txt
작업지시서 상태:
- 제품 생산 문서의 상위 업무 상태
- 디자인/검토/발주 준비/생산/완료 흐름을 표현한다.

자재 발주 상태:
- 공급업체에 대한 실제 원단/부자재 발주 업무 상태
- 초안/검토요청/승인/발주완료/입고/취소 흐름을 표현한다.
```

작업지시서 상태는 자재 발주의 요약 결과를 표시할 수 있지만, 자재 발주 상태 자체를 그대로 복사하지 않는다.

## 4. 작업지시서 상태 후보

0.15.21 기준으로 작업지시서 발주 관련 상태는 다음 후보를 사용한다.

```txt
draft
- 작성 중

review_requested
- 작업지시서 검토 요청

review_completed
- 작업지시서 검토 완료

material_order_waiting
- 자재 발주 대기
- 작업지시서 검토가 끝났거나 발주 준비가 시작됐지만 자재 발주서가 아직 준비되지 않은 상태

material_order_preparing
- 자재 발주 준비 중
- 원단/부자재 row와 공급업체/수량/단가를 연결하는 상태

material_order_ready
- 자재 발주 준비 완료
- 필수 자재 row가 발주서 item으로 연결되었거나 발주 제외 사유가 입력된 상태

ordered
- 발주 완료
- 필요한 자재 발주가 완료되어 생산 진행으로 넘어갈 수 있는 상태

production_in_progress
- 생산 진행

completed
- 완료

canceled
- 취소
```

표시 문구는 i18n/presentation 계층에서 변환한다. 상태 계산이나 버튼 조건에서 한글 문구를 직접 비교하지 않는다.

## 5. 자재 발주 상태 후보

자재 발주 상태는 `43_wafl-a-type-material-order-data-model.md` 기준을 따른다.

```txt
draft
review_requested
approved
ordered
partially_received
received
canceled
```

작업지시서 하나에 여러 자재 발주서가 연결될 수 있으므로, 작업지시서 상태는 연결된 발주서들의 집계 결과로 계산한다.

## 6. 버튼 역할 재정의

### 6.1 작업지시서 화면의 기본 버튼

기존 “발주요청” 버튼은 바로 PDF 발주 완료로 이어지지 않는다.  
후속 구현에서는 다음 두 단계 중 하나로 표현한다.

```txt
1안:
- 버튼명: 자재 발주 준비
- 역할: 원단/부자재 발주 화면으로 이동하거나 준비 모달을 연다.

2안:
- 버튼명: 발주 준비
- 역할: 작업지시서 검토 완료 후 자재 발주 준비 단계로 진입한다.
```

추천은 1안이다. “발주요청”은 실제 외부 발주 또는 관리자 검토요청으로 오해될 수 있으므로, 작업지시서 화면에서는 “자재 발주 준비”가 더 명확하다.

### 6.2 자재 발주 화면의 버튼

```txt
발주서 초안 저장:
- draft 상태 유지
- 필수 항목이 부족해도 저장 가능

검토 요청:
- review_requested 상태로 전환
- materials.order.request 권한 필요

검토 승인:
- approved 상태로 전환
- materials.order.review 또는 관리자급 권한 필요

바로 발주:
- ordered 상태로 전환
- materials.order.direct 또는 materials.order.execute 권한 필요

발주 취소:
- canceled 상태로 전환
- 상태와 권한에 따라 제한
```

## 7. 권한 분기

권한은 화면 문구가 아니라 코드 기반 capability로 판단한다.

```txt
materials.order.view
- 자재 발주 목록/상세 조회

materials.order.prepare
- 작업지시서에서 자재 발주 준비 진입
- 자재 발주 초안 생성/수정

materials.order.request
- 자재 발주 검토요청

materials.order.review
- 자재 발주 검토 승인/반려

materials.order.direct
- 검토 없이 바로 발주

materials.order.execute
- 최종 발주 완료 처리

materials.order.cancel
- 발주 취소
```

초기 구현에서 권한을 단순화해야 하면 다음처럼 묶는다.

```txt
작성 가능 역할:
- materials.order.prepare
- materials.order.request

관리자급 발주 가능 역할:
- materials.order.prepare
- materials.order.request
- materials.order.review
- materials.order.direct
- materials.order.execute
- materials.order.cancel
```

단, 장기적으로는 검토요청과 직접발주를 분리한다.

## 8. selector 후보

TSX 화면에서 상태를 직접 계산하지 않고 selector/helper를 둔다.

```txt
canPrepareMaterialOrder(workOrder, permissions)

true 조건 후보:
- workOrder가 삭제/취소 상태가 아니다.
- workOrder가 작성 중 또는 검토 가능 상태다.
- 사용자가 materials.order.prepare 또는 workorders.order 계열 권한을 가진다.
```

```txt
canRequestMaterialOrder(workOrder, materialRows, purchaseOrders, permissions)

true 조건 후보:
- 자재 발주 초안이 1개 이상 있다.
- 필수 material row가 발주 item으로 연결되어 있거나 발주 제외 처리되어 있다.
- 각 발주 item에 공급업체, 수량, 단위가 있다.
- 사용자가 materials.order.request 권한을 가진다.
```

```txt
canDirectOrderMaterials(workOrder, purchaseOrder, permissions)

true 조건 후보:
- canRequestMaterialOrder 조건을 만족한다.
- purchaseOrder status가 draft 또는 approved다.
- 사용자가 materials.order.direct 또는 materials.order.execute 권한을 가진다.
```

```txt
getWorkOrderMaterialOrderSummary(workOrder, materialRows, purchaseOrders)

반환 후보:
- requiredRowCount
- linkedRowCount
- excludedRowCount
- draftPurchaseOrderCount
- reviewRequestedCount
- orderedCount
- missingRequiredRowCount
- isReadyForReview
- isReadyForDirectOrder
```

## 9. 발주 준비 미완료 안내

발주 준비가 끝나지 않았을 때는 고객에게 기술 사유를 그대로 보여주지 않는다.  
화면에서는 사람이 이해할 수 있는 요약 메시지를 표시하고, 상세 원인은 checklist로 제공한다.

```txt
대표 메시지 후보:
- 아직 발주 준비가 완료되지 않았습니다.
- 필수 원단/부자재의 발주처 또는 발주 제외 사유를 확인해 주세요.
```

checklist 후보:

```txt
[ ] 필수 원단/부자재 row가 모두 확인되었는가?
[ ] 발주할 row에 공급업체가 선택되었는가?
[ ] 수량과 단위가 입력되었는가?
[ ] 발주하지 않는 row에 제외 사유가 입력되었는가?
[ ] 사용자 권한이 검토요청 또는 직접발주를 허용하는가?
```

i18n key 후보:

```txt
admin.materialOrders.readiness.notReadyTitle
admin.materialOrders.readiness.notReadyDescription
admin.materialOrders.readiness.missingSupplier
admin.materialOrders.readiness.missingQuantity
admin.materialOrders.readiness.missingUnit
admin.materialOrders.readiness.missingExclusionReason
```

## 10. PDF 출력 시점

PDF는 하나로 보지 않고 목적별로 분리한다.

```txt
작업지시서 PDF:
- 제품 생산 정보 요약
- 디자인/사이즈/생산 구성 중심
- 자재 발주 확정 전에도 내부 검토용으로 출력 가능

자재 발주 초안 PDF:
- draft 또는 review_requested 상태
- 내부 검토용
- 외부 공급업체 발송용으로 사용하지 않는다.

자재 발주 확정 PDF:
- approved 또는 ordered 상태
- 공급업체 발송 가능
- supplier_id, 발주 item, 수량, 단위, 메모가 확정된 뒤 출력

공유 PDF:
- 만료/권한/공유 링크 정책이 정의된 뒤 0.18.x에서 별도 설계
```

PDF 저장이 필요해질 경우 R2 key 정책은 기존 Worker 기반 흐름을 유지한다. 이번 문서에서는 R2 변경을 하지 않는다.

## 11. 화면 진입 구조

### 11.1 작업지시서 상세에서 진입

```txt
작업지시서 상세
→ 자재 발주 준비 버튼
→ /admin/material-orders?workOrderId={id}
또는 /workspace/material-orders?workOrderId={id}
```

실제 route는 후속 구현에서 현재 작업지시서 route 구조와 충돌 여부를 확인한 뒤 확정한다.

### 11.2 자재 발주 목록에서 진입

```txt
고객사 관리자 홈
→ 원단/부자재 발주
→ 자재 발주 목록
→ 발주서 상세
```

```txt
디자이너 workspace 홈
→ 원단/부자재 발주
→ 본인이 접근 가능한 발주 목록
→ 발주서 상세
```

## 12. 후속 구현 순서

```txt
1. route placeholder
2. read-only 자재 발주 목록
3. 작업지시서 상세에서 자재 발주 준비 버튼 노출
4. 작업지시서 material row read-only 연결
5. 자재 발주 초안 생성
6. 발주 item 편집
7. 검토요청
8. 승인/반려
9. 바로 발주
10. PDF 출력
11. 입고 처리
```

기존 작업지시서 발주 flow를 한 번에 제거하지 않는다.  
먼저 자재 발주 준비 route를 붙이고, 기존 발주/PDF 버튼은 사용 범위를 좁히는 방식으로 전환한다.

## 13. DB/API/R2 영향

```txt
이번 0.15.21:
- DB schema 변경 없음
- full_reset.sql 수정 없음
- API route 구현 없음
- R2 처리 변경 없음
- package.json 수정 없음

후속 구현 시:
- DB schema 추가는 full_reset.sql과 smoke test를 함께 검토한다.
- app/api는 thin하게 유지한다.
- 실제 workflow 판단은 lib/material-orders 하위 selector/service에 둔다.
- PDF/R2 저장은 0.18.x 공유 정책과 충돌하지 않게 분리한다.
```

## 14. 0.15.22로 넘길 결정

다음 버전은 A-TYPE visual QA와 raw color/hardcoded text 점검이다.

```txt
0.15.22에서 확인할 것:
- 0.15.x visual pass 이후 관리자 PC 화면의 raw color class 잔여
- hardcoded Korean text 잔여
- text-stone / border-stone / bg-white 남용
- 시안과 가장 다른 화면 목록
- 0.16.0 DeviceKind 진입 전 보정 후보
```
