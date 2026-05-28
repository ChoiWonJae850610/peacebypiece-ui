# UI Inline Select Editor 0.18.06

## 목적

작업지시서 상세의 인라인 편집 select를 WAFL 공통 UI 계층으로 분리하기 위한 1차 적용이다.
기존 native select 동작을 화면 파일에 직접 두지 않고 `AppInlineSelectEditor` 래퍼로 이동했다.

## 적용 범위

- `components/common/ui/AppInlineSelectEditor.tsx` 추가
- `components/common/ui/index.ts` export 추가
- `components/workorder/detail/shared/detailEditorShared.tsx`의 인라인 select 분기 전환

## 유지한 동작

- autoFocus 유지
- Enter 입력 시 현재 선택값 저장
- Escape 입력 시 편집 취소
- blur 시 현재 선택값 저장
- 사용 불가 옵션 선택 시 취소 처리
- 작업지시서 상세의 기존 input/date 편집 흐름은 변경하지 않음

## 다음 점검

0.18.07에서는 실제 화면에서 공정/제품구성 인라인 select의 포커스, blur 저장, Enter/Escape 흐름을 확인한 뒤 적용 범위를 넓힌다.
