# 68. 생산구성 숫자 필드 mapping 통합

## 목표

작업지시서 생산구성의 공장, 원단, 부자재, 외주공정 row에서 수량/단가 계열 숫자값이 검토요청 이후 0으로 떨어지는 문제를 줄이기 위해 숫자 필드 mapping을 한 곳으로 모았다.

## 문제 판단

0.15.40~0.15.44에서 저장 경로, 활성 입력값 flush, workflow snapshot, 확정 저장 조건을 보강했지만 동일 문제가 반복되었다. 따라서 원인은 단순 input timing이 아니라 다음 구간의 필드명 불일치 가능성이 높다.

- 화면 draft
- workflow snapshot
- state patch
- API payload
- repository sync
- DB 상세 테이블
- 조회 후 view model 복원

## 적용 기준

`lib/workorder/productionCompositionSnapshot.ts`를 추가해 생산구성 숫자 필드의 alias를 중앙에서 처리한다.

### Material

- quantity
- requiredQuantity
- required_quantity
- qty

단가:

- unitCost
- unitPrice
- unit_cost
- unit_price
- price
- cost

합계:

- totalCost
- amount
- total_cost
- total_amount

### Outsourcing

Material과 같은 숫자 alias 기준을 사용한다.

### Factory order

수량:

- quantity
- orderQuantity
- order_quantity
- qty

공임:

- laborCost
- labor_cost
- unitLaborCost
- unit_labor_cost

로스비:

- lossCost
- loss_cost
- wasteCost
- waste_cost

## 반영 위치

- detail editor patch 생성
- workflow action snapshot 생성
- state patch 저장 직전 normalize
- DB 상세 테이블 sync 직전 normalize
- WorkOrder collection normalize 과정

## 변경하지 않은 것

- DB schema
- API 응답 포맷
- R2 흐름
- 권한 흐름
- 세션 흐름

## 후속 확인

이 패치 후에도 수량/단가가 0으로 떨어지면 다음은 실제 DB row를 조회해 저장 전 payload와 저장 후 row를 비교해야 한다.

