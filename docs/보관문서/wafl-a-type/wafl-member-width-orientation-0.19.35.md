# WAFL member width and orientation recalculation 0.19.35

## 목적

0.19.35는 멤버관리 화면만 우측 border가 짧게 보이는 폭 차이를 보정하고,
갤럭시탭 등 Android 태블릿에서 가로/세로 전환 후 responsive 판정이 원상 복귀하지 않는 문제를 줄입니다.

## 변경 기준

- 멤버관리 화면 전용 wrapper의 추가 right padding을 제거합니다.
- `useElementSize`가 `ResizeObserver`만 의존하지 않고 `resize`와 `orientationchange`도 함께 감지합니다.
- orientation 전환 시 `requestAnimationFrame`으로 한 프레임 뒤 실제 element 크기를 다시 측정합니다.
- WAFL 공통 컴포넌트와 theme token 구조는 유지합니다.

## 비변경

- 멤버 검색/필터/권한 저장 로직
- 협력업체/저장소/통계 데이터 로직
- DB/API/R2 흐름
- package.json / package-lock.json
