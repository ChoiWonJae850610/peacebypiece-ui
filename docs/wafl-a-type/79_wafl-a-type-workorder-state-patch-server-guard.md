# 79. 작업지시서 state patch server guard 기준

## 목적

0.15.52~0.15.55에서 작업지시서 serviceCode와 side effect guard를 클라이언트/route 단위로 확장했지만, workflow state patch는 서버에서도 같은 기준으로 한 번 더 방어해야 한다.

이번 기준은 클라이언트가 잘못된 생산구성 patch를 보내더라도 서버 route에서 serviceCode를 확인하고, 허용되지 않은 생산구성 replace payload를 제거하는 것이다.

## 적용 범위

- `/api/workorders/[workOrderId]` PATCH
- `WorkOrderStatePatch.serviceCode`
- `guardProductionCompositionPatchByServiceCode()`
- system audit source metadata

## 원칙

```txt
클라이언트 guard는 UX/상태 보호용이다.
서버 guard는 DB 보호용이다.
```

따라서 생산구성 replace 가능 여부는 클라이언트만 믿지 않는다.

## 처리 방식

1. 클라이언트는 state patch에 `serviceCode`를 포함한다.
2. 서버는 body 또는 patch의 `serviceCode`를 읽는다.
3. serviceCode가 잘못된 값이면 `INVALID_PAYLOAD`로 차단한다.
4. serviceCode가 생산구성 replace를 허용하지 않으면 다음 필드를 서버에서 제거한다.
   - `factoryOrderRequest`
   - `orderEntries`
   - `materials`
   - `outsourcing`
5. 서버는 guard 처리된 patch만 repository에 전달한다.

## 기대 효과

- 반려/취소/되돌리기 계열에서 원단/부자재/외주공정 row가 삭제되는 사고를 서버에서 한 번 더 차단한다.
- serviceCode가 audit source에 포함되어 어떤 액션으로 state patch가 발생했는지 추적 가능해진다.
- 생산구성 replace 정책이 클라이언트 상태 타이밍에만 의존하지 않는다.

## 변경하지 않는 것

- DB schema 변경 없음
- R2 key 구조 변경 없음
- 권한/세션 흐름 변경 없음
- 기존 메모/첨부 route 동작 변경 없음
