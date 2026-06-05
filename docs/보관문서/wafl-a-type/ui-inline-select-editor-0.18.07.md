# UI inline select editor 0.18.07

## 목적

작업지시서 상세 인라인 select 편집의 1차 적용 후, 선택 변경과 blur 이벤트가 연속으로 발생할 때 같은 저장 흐름이 중복 호출될 수 있는 위험을 줄인다.

## 반영 내용

- AppInlineSelectEditor 내부에 commit/cancel 처리 상태를 보관한다.
- onChange, Enter, Escape 이후 발생하는 blur에서는 동일 액션을 다시 호출하지 않는다.
- 사용자가 선택값을 바꾸지 않고 바깥 영역을 클릭하면 기존처럼 blur commit을 수행한다.
- 기존 autoFocus, Enter commit, Escape cancel, onBlur commit 흐름은 유지한다.

## 영향 범위

- components/common/ui/AppInlineSelectEditor.tsx
- 작업지시서 상세의 EditableValue select 편집 분기

## 다음 확인

- 공정/제품구성 인라인 select 클릭 후 값 변경 시 저장이 1회만 동작하는지 확인한다.
- 선택값 변경 없이 포커스 아웃 시 기존값 저장 흐름이 유지되는지 확인한다.
- Escape 취소 후 blur 저장이 다시 발생하지 않는지 확인한다.
