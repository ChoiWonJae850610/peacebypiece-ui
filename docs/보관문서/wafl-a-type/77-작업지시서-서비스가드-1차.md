# WAFL A-TYPE — 작업지시서 serviceCode guard 1차 적용

## 목적

0.15.52~0.15.53에서 정의한 작업지시서 serviceCode와 side effect matrix를 실제 state patch 생성 단계에 연결한다.

이번 단계의 핵심은 “허용되지 않은 serviceCode가 생산구성 replace payload를 들고 와도 저장 직전에 제거한다”는 방어선이다.

## 배경

작업지시서 화면에는 즉시 저장, workflow 상태 변경, 메모, 첨부, 삭제/복원 등 서로 다른 DB/R2 side effect가 섞여 있다.

특히 생산구성은 다음 테이블에 replace 저장된다.

- `orders`
- `spec_sheet_materials`
- `spec_sheet_outsourcing_lines`

따라서 반려, 취소, 되돌리기, 메모, 첨부, 삭제/복원 같은 액션에서 생산구성 replace payload가 섞이면 현재 row가 삭제될 수 있다.

## 추가된 guard

### `lib/workorder/serviceCodeGuards.ts`

추가한 책임:

- serviceCode가 생산구성 replace를 허용하는지 판단
- patch 안에 생산구성 필드가 포함되어 있는지 판단
- 허용되지 않은 serviceCode의 생산구성 patch 제거

생산구성 patch 필드:

- `factoryOrderRequest`
- `orderEntries`
- `materials`
- `outsourcing`

## 판단 기준

생산구성 replace 허용 여부는 단순 workflow state가 아니라 side effect matrix를 기준으로 판단한다.

필수 조건:

1. serviceCode가 `replace` operation을 허용해야 한다.
2. serviceCode가 아래 resource를 모두 touch 가능해야 한다.
   - `orders`
   - `spec_sheet_materials`
   - `spec_sheet_outsourcing_lines`

## 적용 위치

### `lib/workorder/productionCompositionPolicy.ts`

기존 serviceCode allowlist 직접 판단을 serviceCode guard 기준으로 위임했다.

### `lib/hooks/workorder/workorderRepositoryMutations.ts`

`buildWorkOrderStatePatch()`가 state patch를 만든 뒤, 저장 전 마지막 단계에서 `guardProductionCompositionPatchByServiceCode()`를 거친다.

이로써 호출부에서 실수로 생산구성 필드가 포함되어도 serviceCode가 허용하지 않으면 repository에 전달되지 않는다.

## 허용되는 흐름

생산구성 replace 저장 가능:

- 명시 저장
- 검토요청
- 검토완료
- 발주요청
- 검수완료
- 완료처리

## 금지되는 흐름

생산구성 replace 저장 금지:

- 반려
- 발주취소
- 되돌리기
- 메모 추가/수정/삭제
- 첨부 준비/업로드 완료/삭제 요청
- 대표 디자인 지정
- 작업지시서 삭제/복원
- 휴지통 purge
- 조회

## 이번 단계에서 하지 않은 것

- DB schema 변경 없음
- R2 동작 변경 없음
- API route 구조 변경 없음
- `orders` replace 저장 방식 변경 없음
- full_reset.sql 변경 없음

## 다음 단계

다음 단계에서는 메모, 첨부, 삭제/복원, purge API route에도 serviceCode를 점진적으로 붙이고, serviceCode side effect matrix 기준 guard를 확장한다.
