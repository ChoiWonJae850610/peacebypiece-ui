# 85. 작업지시서 serviceCode 누락 액션 1차 연결

## 버전

```txt
0.15.62
```

## 목적

0.15.61에서 점검한 작업지시서 화면 액션 중 일부 즉시 저장 경로에 serviceCode를 실제로 전달한다.

이번 단계는 검토요청/반려 안정화 이후, DB side effect 추적 기준을 작업지시서 화면 액션으로 확장하는 1차 작업이다.

## 연결한 serviceCode

```txt
WO-I001 titleImmediateSave
- 작업지시서 제목 변경

WO-I002 assigneeImmediateSave
- 담당자 변경

WO-I003 basicInfoImmediateSave
- 기본정보/분류 계열 즉시 저장 patch 후보

WO-I004 inventoryImmediateSave
- 현재 재고 변경
```

## 코드 변경 기준

```txt
lib/workorder/serviceCodeForWorkOrderPatch.ts
- patch field 기준 즉시 저장 serviceCode mapping helper 추가

lib/hooks/workorder/useWorkOrderWorkflowActions.ts
- handleUpdateSelectedWorkOrder의 즉시 저장 경로에 serviceCode 전달

lib/hooks/workorder/useWorkOrderAdminActions.ts
- 담당자 변경 저장 경로에 WO-I002 전달

lib/hooks/workorder/useWorkOrderLifecycleActions.ts
- 제목 변경 저장 경로에 WO-I001 전달

lib/repositories/*
- full save / bulk save 경로가 serviceCode option을 받을 수 있게 확장

lib/workorder/api/workOrderRouteHandlers.ts
- /api/workorders PATCH body의 serviceCode를 읽고 응답 meta에 포함
```

## 변경하지 않은 것

```txt
- DB schema 변경 없음
- R2 key 변경 없음
- 생산구성 replace allowlist 변경 없음
- 반려/취소/되돌리기 생산구성 보존 정책 변경 없음
- 메모/첨부 route 동작 변경 없음
```

## 후속 작업

```txt
0.15.63
- 발주정보 저장 / 생산구성 저장 / 검토완료 / 발주요청 / 발주취소 등 workflow 세부 action의 serviceCode 연결 보강

0.15.64
- orders 저장 방식을 spec_sheet_id 기준 replace 방식으로 정리
```
