# Material Order Responsive View Separation — 0.23.19

## 목적

`MaterialOrderDraftEditor`가 데이터 조합, 모달, 모바일 도구, 태블릿 드로어, 데스크톱 패널 렌더링을 한 파일에서 모두 담당하던 구조를 정리한다.

## 변경 내용

- 발주서 모바일 화면을 `MaterialOrderMobileWorkspaceView`로 분리했다.
- 발주서 태블릿 2패널 화면을 `MaterialOrderTabletWorkspaceView`로 분리했다.
- 발주서 데스크톱 및 대형 태블릿 3패널 화면을 `MaterialOrderDesktopWorkspaceView`로 분리했다.
- 상위 editor는 데이터·행동 조합과 layout mode 선택만 담당한다.
- 목록, 상세, 할당 패널의 실제 기능 컴포넌트와 API 호출 구조는 변경하지 않았다.
- 모바일 PDF·납기 placeholder와 발주 대상 도구 렌더링 책임을 모바일 View로 이동했다.

## 기대 효과

- 작업지시서와 유사한 반응형 View 분리 구조를 확보한다.
- 기기별 UI 수정 시 다른 layout mode에 영향을 주는 위험을 줄인다.
- 후속 Topbar, Drawer, breakpoint 정책 공통화 작업의 기준을 마련한다.

## DB Migration

없음.
