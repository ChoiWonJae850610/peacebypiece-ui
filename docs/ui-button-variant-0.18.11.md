# UI Button Variant 0.18.11

## 목적

`AppButton`의 제품화 variant 기준을 `primary / secondary / ghost / danger / subtle / icon`으로 확장한다.
관리자 영역의 `AdminButton`은 직접 스타일을 늘리지 않고 `AppButton` variant를 그대로 위임하는 shim 역할을 유지한다.

## 적용 내용

- `AppButtonVariant`를 export해 후속 UI 래퍼가 동일한 타입을 사용할 수 있게 했다.
- `subtle` variant는 보조/추가 액션에 쓰는 낮은 강조 버튼으로 분리했다.
- `icon` variant는 아이콘 단독 버튼이나 원형 닫기/도구 버튼 후보로 분리했다.
- `AdminButtonVariant`도 `subtle / icon`을 받을 수 있게 확장했다.

## 유지한 범위

- 기존 `primary / secondary / ghost / danger` 사용처는 유지했다.
- 실제 화면의 버튼 교체는 대량으로 진행하지 않았다.
- DB/API/R2/첨부/메모/휴지통/purge 흐름은 변경하지 않았다.

## 다음 점검

- 작은 버튼의 터치 영역이 모바일에서 충분한지 확인한다.
- 닫기/도구 버튼 후보를 `icon` variant로 전환할지 화면별로 점검한다.
- 추가/보조 액션 후보를 `subtle` variant로 전환할지 점검한다.
