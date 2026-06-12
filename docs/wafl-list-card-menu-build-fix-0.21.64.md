# WAFL list card menu build fix 0.21.64

## 목적

0.21.63 적용 후 발생한 `WaflSelectableCard` 중복 export 타입 오류와 작업지시서/발주서 목록 카드의 더보기 버튼 위치 문제를 수정한다.

## 수정 기준

- `components/common/ui/index.ts`는 `WaflSelectableCard`를 `./WaflSelectableCard`에서만 export한다.
- `./WaflForm`에서는 input/textarea/info box 관련 export만 명시적으로 re-export한다.
- 작업지시서 목록 카드와 발주서 목록 카드의 더보기 버튼은 카드 우측 상단에 absolute 배치한다.
- 선택 영역은 카드 내부에서 우측 액션 영역과 겹치지 않도록 `pr-11` 여백을 둔다.

## 확인 필요

- `npm run build` 재실행
- 작업지시서 목록 카드 더보기 버튼 위치 확인
- 발주서 목록 카드 더보기 버튼 위치 확인
- 더보기 메뉴 열림 위치 확인
