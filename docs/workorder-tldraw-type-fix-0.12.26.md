# 0.12.26 작업지시서 고급 그리기 tldraw 타입 오류 보정

## 목적

0.12.25에서 `tldraw`를 정식 dependency로 포함한 뒤 `npm run build` 시 발생한 `WorkOrderTldrawDrawingModal.tsx` 타입 오류를 보정한다.

## 원인

`tldraw`의 `Tldraw` component props와 PoC에서 정의한 최소 props 타입을 직접 `ComponentType`으로 변환하면서 TypeScript가 `onMount`, `editor`, `toImage`, `shapeIds` 타입 차이를 엄격하게 비교했다.

특히 다음 지점이 문제가 되었다.

- `module.Tldraw as ComponentType<OptionalTldrawComponentProps>` 직접 변환
- PoC용 `OptionalTldrawEditor`가 실제 tldraw `Editor` 타입과 다름
- `getCurrentPageShapeIds()` 결과를 `Set<string>`으로 가정
- `toImage()` 인자의 shape id 타입을 `string[]`으로 가정

## 수정 방향

`tldraw`의 내부 타입 전체를 PeaceByPiece 코드에 직접 끌어오지 않고, PoC 모달에서 필요한 최소 동작만 runtime guard로 확인한다.

- `Tldraw` component는 `unknown`을 거쳐 PoC용 최소 component 타입으로 좁힌다.
- `onMount` editor는 `unknown`으로 받은 뒤 `getCurrentPageShapeIds`와 `toImage` 함수 존재 여부만 확인한다.
- shape id는 `Iterable<unknown>`으로 다루고, 저장 시 배열로 변환한다.

## 유지한 정책

- 고급 그리기는 `NEXT_PUBLIC_APP_RUNTIME_MODE=development`와 `NEXT_PUBLIC_ENABLE_TLDRAW_POC=true`일 때만 노출한다.
- Vercel production에는 env flag를 등록하지 않으면 고급 그리기 메뉴가 보이지 않는다.
- 기본 직접 그리기 native canvas는 계속 운영 기본 기능으로 유지한다.
- DB/R2/첨부 API/휴지통/purge 흐름은 변경하지 않았다.

## 다음 단계

0.12.26 적용 후 로컬에서 아래 순서로 확인한다.

```powershell
npm install
npm run build
npm run dev
```

확인 항목:

1. build 타입 오류 해소 여부
2. development + tldraw flag 상태에서 고급 그리기 메뉴 표시 여부
3. 고급 그리기 모달 열림 여부
4. tldraw에서 도형/텍스트/펜 입력 후 PNG 저장 여부
5. env flag 제거 시 고급 그리기 메뉴 숨김 여부
