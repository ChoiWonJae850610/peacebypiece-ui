# 82. 작업지시서 검토요청 생산구성 serviceCode 전달 보강

## 버전

0.15.59

## 목적

0.15.58에서 반려 workflow의 생산구성 repository sync를 차단하면서, 검토요청처럼 생산구성을 확정 저장해야 하는 forward workflow까지 차단되는 문제를 보정한다.

## 원인

클라이언트 state patch payload에는 `serviceCode`가 포함되어 있었지만, 서버 PATCH route가 `updateDbWorkOrderStatePatch()`를 호출할 때 repository payload에 `serviceCode`를 다시 넘기지 않았다.

그 결과 repository 계층에서는 `patch.serviceCode`가 `undefined`로 평가되었고, production composition sync gate가 `orders`, `spec_sheet_materials`, `spec_sheet_outsourcing_lines` 저장을 차단했다.

## 수정 기준

- 서버 PATCH route에서 검증된 `serviceCode`를 repository state patch payload에 포함한다.
- `WO-F001` 검토요청은 생산구성 replace 저장을 허용한다.
- `WO-B001` 반려는 생산구성 replace 저장을 계속 금지한다.
- serviceCode guard는 side effect matrix의 `allowsProductionCompositionReplace`와 `replace` operation을 기준으로 판정한다.

## 기대 결과

- 검토요청 시 `orders` row가 생성/갱신된다.
- 검토요청 시 `spec_sheet_materials`, `spec_sheet_outsourcing_lines` row가 생성/갱신된다.
- 반려 시 기존 생산구성 row는 삭제/비활성화되지 않는다.

## 후속 점검

- 검토요청 후 `orders` row 존재 여부 확인
- 검토요청 후 원단/부자재/외주공정 row 존재 여부 확인
- 반려 후 `orders.is_active`, `deleted_at` 변화 여부 확인
- 반려 후 원단/부자재/외주공정 row 유지 여부 확인
