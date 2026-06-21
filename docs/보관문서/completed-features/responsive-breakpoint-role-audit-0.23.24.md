# Responsive breakpoint role audit — 0.23.24

## 목적

작업공간 레이아웃을 결정하는 breakpoint와 개별 컴포넌트의 밀도·애니메이션·표시 방식만 바꾸는 breakpoint를 구분한다. 기기 모델명 감지 대신 실제 viewport, 방향, 짧은 변, 패널 최소 너비를 기준으로 한다.

## Workspace layout breakpoint

다음 값만 작업지시서·발주서의 `drawer / tabletTwoPanel / threePanel` 모드를 결정한다.

- compact tablet short side: 600px
- narrow tablet two-panel width: 820px
- desktop/three-panel width: 1280px
- three-panel minimum widths: list 300px / detail 420px / side 286px / gap 12px

이 값들은 `responsiveLayoutPolicy.ts`와 `useWorkspaceLayoutMode.ts`에서 관리한다.

## Component-only breakpoint

다음 값은 workspace layout mode를 바꾸지 않는다.

- 600px: summary grid 1열/2열 전환, compact-tablet modal animation
- 640px: compact toast width, 일부 테이블 내부 배치
- 768px: 콘텐츠 전환 애니메이션 및 일반 tablet content styling
- 1024px 미만: coarse-pointer 보조 modal focus policy
- 1536px: 멤버 테이블 action density

TypeScript에서 사용되는 component-only 값은 `RESPONSIVE_COMPONENT_BREAKPOINTS`와 `RESPONSIVE_STYLE_CLASSES`로 명명해 역할을 드러낸다. CSS media query에는 workspace layout 경계가 아니라는 주석을 추가했다.

## 이번 변경에서 하지 않은 것

- breakpoint 수치 자체의 추가 변경
- 모달 크기 또는 drawer 구조 변경
- 작업지시서·발주서 저장/API 변경
- PDF 출력 레이아웃 변경

## 다음 단계

실기기 및 브라우저 viewport에서 Topbar 높이, 패널 간격, drawer/modal 폭, 회전·분할 화면을 비교한 뒤 반응형 정비 종료 여부를 판단한다.
