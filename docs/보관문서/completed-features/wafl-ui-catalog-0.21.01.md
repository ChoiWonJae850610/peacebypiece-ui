# WAFL UI Catalog 0.21.01

## 목적

0.21.01은 `/ui` 내부 카탈로그에서 Surface 계열 공통 컴포넌트의 용도와 시각 문법을 확인할 수 있게 확장한 버전이다. 실제 업무 화면 로직은 변경하지 않고, 카탈로그 페이지의 문서성/샘플성만 보강한다.

## 적용 범위

- `WaflSurface`
- `WaflSurfaceButton`
- `WaflInfoBox`
- `WaflInfoRow`
- `WaflEmptyCard`
- `WaflSelectableCard`
- Surface 목적별 구분: card / panel / row / info / selected / empty

## Surface 사용 기준

- `card`는 독립된 정보 묶음에 사용한다.
- `panel`은 화면의 큰 구획에 사용하며, 제목·설명·액션이 있는 영역은 `WaflSectionPanel`을 우선한다.
- `row`는 label/value, 상태, 메타 정보를 한 줄로 정렬할 때 사용한다.
- `info`는 안내문·주의·요약을 낮은 depth로 표시할 때 사용한다.
- `selected` 상태는 selected token을 사용하고, shadow나 임의 색상으로 강조하지 않는다.
- `empty` 상태는 dashed border와 empty-state surface를 사용해 실제 데이터 card와 구분한다.

## 금지 기준

- 화면별로 `rounded`, `border`, `bg`, `shadow` 조합을 직접 반복하지 않는다.
- 선택 상태를 border 색상만 바꾸거나 shadow로 강조하지 않는다.
- 카드 안 카드가 과도하게 중첩되는 구조를 만들지 않는다.
- 빈 상태를 단순 텍스트 한 줄로 방치하지 않는다.
- 안내문을 임의 배경색 박스로 새로 만들지 않는다.

## 테스트 포인트

- `/ui`의 Surface 섹션에서 Surface, SurfaceButton, InfoBox, InfoRow, EmptyCard, SelectableCard 샘플이 보이는지 확인한다.
- Surface 목적별 구분 표가 표시되는지 확인한다.
- Spec table에 Surface 계열 컴포넌트 항목이 추가되었는지 확인한다.
- 기존 작업지시서, 저장소, 통계, 멤버관리 화면 동작이 변하지 않는지 확인한다.
- `NEXT_PUBLIC_APP_RUNTIME_MODE=production`에서 `/ui` 접근 차단이 유지되는지 확인한다.
