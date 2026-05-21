# 66. 작업지시서 생산구성 workflow action snapshot 보강

## 목적

디자이너가 공장/원단/부자재/외주공정의 수량·단가를 입력한 뒤 바로 검토요청을 실행해도, workflow action이 오래된 workOrder props를 기준으로 저장하지 않도록 한다.

## 문제

0.15.40~0.15.42에서는 생산구성 row 저장 경로와 input draft 반영을 보강했지만, workflow action 자체가 부모 상태의 selectedWorkOrder를 기준으로 실행되면 React state 반영 타이밍에 따라 숫자 필드가 이전 값으로 남을 수 있다.

대표 증상:

```txt
- 공장/자재명/단위/단가기준은 유지됨
- 원단/부자재/외주공정 row 자체도 유지됨
- 그러나 수량/단가/금액이 0으로 떨어짐
```

## 조정 기준

- WorkOrderDetailContainer는 workflow action 실행 시 detail editor의 현재 local state를 기준으로 workOrder snapshot을 만든다.
- snapshot에는 현재 활성 편집 셀의 editingValue까지 반영한다.
- 부모 state 반영을 기다리지 않고, action에 snapshot override를 전달한다.
- 기존 DB schema, API 응답 포맷, R2, 권한, 세션 흐름은 변경하지 않는다.

## 대상

```txt
- orderEntries
- materials
- outsourcing
- 현재 editingCell/editingValue
```

## 확인 시나리오

```txt
1. 디자이너로 작업지시서 생성
2. 공장 2개 이상 입력
3. 원단 2개 이상 입력
4. 부자재 2개 이상 입력
5. 외주공정 1개 이상 입력
6. 수량/단가 입력 직후 다른 곳을 클릭하지 않고 검토요청
7. 관리자 계정으로 같은 작업지시서 확인
```

## 기대 결과

```txt
- 공장 수량/공임/로스비 유지
- 원단 수량/단가/금액 유지
- 부자재 수량/단가/금액 유지
- 외주공정 수량/단가/금액 유지
```
