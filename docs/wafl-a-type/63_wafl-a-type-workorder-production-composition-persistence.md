---
title: 작업지시서 생산구성 저장 흐름 보강
version: 0.15.40
status: applied
updated: 2026-05-21
---

# 63. 작업지시서 생산구성 저장 흐름 보강

## 목적

디자이너가 작업지시서 상세 화면에서 입력한 공장, 원단, 부자재, 외주공정 정보가 검토 요청 같은 workflow 상태 변경 후에도 관리자 화면에서 누락되지 않도록 저장 흐름을 보강한다.

## 문제 판단

기존 상태 변경 저장 흐름은 `workflowState`, `inventory`, `factoryOrderRequest`, `orderEntries` 중심으로 PATCH를 구성했다.

따라서 사용자가 상세 화면에서 원단/부자재/외주공정을 입력한 직후 별도 전체 저장 없이 검토 요청을 누르면, 화면 state에는 값이 남아 있어도 DB의 `spec_sheet_materials`, `spec_sheet_outsourcing_lines`에 동기화되지 않을 수 있었다.

관리자 계정에서 다시 조회하면 DB에서 상세 row를 다시 읽기 때문에 공장 row만 보이고 원단/부자재/외주공정 row가 누락되는 현상이 발생할 수 있다.

## 적용 기준

### state patch payload

`WorkOrderStatePatch`에 아래 생산구성 항목을 포함할 수 있게 한다.

```txt
orderEntries
materials
outsourcing
factoryOrderRequest
```

단, 리스트 화면의 요약 데이터만 가진 상태에서 빈 배열을 보내 기존 상세 row를 지우지 않도록, 클라이언트는 다음 조건에서만 `materials`와 `outsourcing`을 state patch에 포함한다.

```txt
- workOrder.hasDetailSnapshot === true
- 또는 materials가 1개 이상 있음
- 또는 outsourcing이 1개 이상 있음
```

### 서버 저장 흐름

`updateDbWorkOrderStatePatch`는 patch에 포함된 항목만 해당 DB 상세 테이블에 동기화한다.

```txt
orderEntries/factoryOrderRequest 포함 시:
- orders 동기화

materials 포함 시:
- spec_sheet_materials 동기화

outsourcing 포함 시:
- spec_sheet_outsourcing_lines 동기화
```

patch에 포함되지 않은 항목은 기존 DB 값을 유지한다.

## 기대 결과

```txt
디자이너 입력:
- 공장 여러 개
- 원단 여러 개
- 부자재 여러 개
- 외주공정 여러 개

동작:
- 검토 요청 클릭
- 관리자 계정으로 로그인
- 같은 작업지시서 상세 확인

기대:
- 공장 row 유지
- 원단 row 유지
- 부자재 row 유지
- 외주공정 row 유지
```

## 변경 범위

```txt
types/workorder.ts
lib/hooks/workorder/workorderRepositoryMutations.ts
lib/workorder/api/workOrderRouteHandlers.ts
lib/workorder/repository/dbWorkOrderRepository.ts
```

## 변경하지 않은 것

```txt
- DB schema
- API route 경로
- R2 파일 흐름
- 권한/세션 흐름
- 작업지시서 상태값
- 원단/부자재 발주 신규 기능
```

## 테스트 포인트

```txt
1. 디자이너 계정으로 작업지시서 생성
2. 공장 2개 이상 입력
3. 원단 2개 이상 입력
4. 부자재 2개 이상 입력
5. 외주공정 1개 이상 입력
6. 별도 저장 버튼 없이 검토 요청
7. 관리자 계정으로 같은 작업지시서 확인
8. 공장/원단/부자재/외주공정 row가 모두 유지되는지 확인
```
