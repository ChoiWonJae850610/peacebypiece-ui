# WAFL UI System

- 기준 앱 버전: `0.24.11`
- 목적: WAFL 공통 UI 카탈로그, 컴포넌트 선택 기준, 기기별 shape/density 기준을 현재 상태로 정리한다.

## 위치

- UI catalog route: `/ui`
- Catalog page source: `app/ui/WaflUiCatalogPage.tsx`
- Runtime access guard: `lib/uiCatalog/runtimeAccess.ts`
- Common UI components: `components/common/ui/`
- Admin common components: `components/admin/common/`

## 접근 정책

`/ui`는 내부 확인용 카탈로그다. runtime access guard는 production에서 노출되지 않아야 하며, dev/test/local/demo 같은 허용 runtime에서만 사용한다. 운영 전에는 임시 debug/access flag가 열려 있지 않은지 확인한다.

## 컴포넌트 선택 기준

- Button/action: `WaflButton`, `WaflActionButton`, `WaflActionMenu`
- Surface/panel/card: `WaflSurface`, `WaflCard`, `WaflSection`, `WaflPanelContentShell`
- Select/input/form: `WaflSelect`, `WaflNumberInput`, `WaflForm`
- Empty/loading/error: `WaflState`, `WaflInlineEmptyState`, `WaflWorkspaceStatePanel`
- Workspace layout: `WaflResponsiveFrame`, `WaflTwoPanelWorkspace`, `WaflThreePanelWorkspace`
- Modal/sheet: `WaflModal`, `WaflSheet`, shared modal primitives

화면별로 `rounded`, `border`, `bg`, `shadow`, spacing class를 직접 조합하기 전에 기존 공통 컴포넌트와 token class를 우선 사용한다.

## Shape And Density

| Device | 기준 |
| --- | --- |
| PC | 3패널, modal, table shell은 surface 계열을 우선 사용한다. |
| Tablet | PC와 같은 shape family를 유지하고 density만 낮춘다. |
| Mobile | row가 card처럼 보여도 control shape를 유지하고 padding/height만 낮춘다. |
| State | selected/current/danger/disabled는 shape 변경보다 tone, border, background로 구분한다. |

예외적으로 dot, spinner, avatar, progress, chart primitive, color swatch, calendar range, layout-only class는 의미가 있을 때 특수 shape를 유지할 수 있다.

## Responsive Layout Policy

작업공간 레이아웃 전환은 기기 모델명보다 실제 CSS viewport, 방향, 짧은 변, 패널 최소 너비를 기준으로 한다.

| Mode | 기준 |
| --- | --- |
| `drawer` | 모바일, 태블릿 세로, 좁은 분할 화면. 목록은 drawer로 열고 본문은 단일 상세 중심으로 유지한다. |
| `tabletTwoPanel` | compact tablet landscape. 목록은 drawer로 열고 상세와 보조 패널은 2패널로 유지한다. |
| `threePanel` | 대형 태블릿 landscape와 desktop. 좌측 목록, 중앙 상세, 우측 보조 패널을 상시 표시한다. |

Workspace layout breakpoint와 component-only breakpoint는 분리한다. `responsiveLayoutPolicy.ts`와 `useWorkspaceLayoutMode.ts`가 작업지시서와 발주서의 layout mode를 결정하며, summary grid, toast width, modal animation, table 내부 배치 같은 값은 component-only breakpoint로 취급한다.

현재 대표 기준은 다음과 같다.

- compact tablet short side: 600px
- narrow tablet two-panel width: 820px
- desktop/three-panel width: 1280px
- three-panel minimum widths: list 300px / detail 420px / side 286px / gap 12px
- tablet list drawer width: max 420px and 82% viewport

화면이 3패널 최소 너비보다 좁으면 구조를 억지로 접기보다 drawer 또는 two-panel 정책을 우선한다. Topbar, action row, tablet drawer 폭/높이 같은 workspace chrome은 공통 frame 정책을 재사용한다.

## Mobile Interaction Policy

모바일 업무 화면은 PC 3패널을 축소하지 않는다. 현재 상세 화면을 유지한 채 목록은 drawer로 열고, 관련 정보나 보조 도구는 bottom sheet 또는 FAB 진입으로 연다.

- 목록 전환: 상세 화면을 유지하고 left drawer에서 항목을 바꾼다.
- 주요 보조 정보: 첨부, 디자인, 메모, 발주 도구는 sheet/FAB 패턴을 우선한다.
- 하단 고정 영역: safe-area 여백을 공통 shell에서 처리한다.
- 복잡한 입력 또는 파일 preview: 필요 시 full-screen modal을 사용한다.

모바일/태블릿 반응형 변경은 저장, API, DB, 권한 로직과 분리해서 검증한다. 레이아웃 변경이 저장 흐름을 건드리는 경우에는 관련 contract 또는 E2E 보강 여부를 별도로 판단한다.

## 새 화면 체크리스트

- `/ui` catalog에서 같은 역할의 컴포넌트를 먼저 찾는다.
- 화면 설명용 card를 과도하게 중첩하지 않는다.
- icon이 있는 기본 action은 텍스트만 있는 임의 chip보다 기존 button/action 컴포넌트를 사용한다.
- mobile/tablet에서 버튼, 모달 footer, drawer, 목록 row가 viewport를 넘지 않는지 확인한다.
- debug outline은 필요할 때만 켜고 기본 상태는 비활성으로 둔다.

## 보류

- 과거 WAFL UI 버전별 문서는 archive 이력으로 둔다.
- `/ui` 자체가 제품 기능 화면이 아니므로 실제 업무 화면의 DB/API/R2 흐름 검증을 대체하지 않는다.
