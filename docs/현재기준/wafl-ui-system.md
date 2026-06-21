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

## 새 화면 체크리스트

- `/ui` catalog에서 같은 역할의 컴포넌트를 먼저 찾는다.
- 화면 설명용 card를 과도하게 중첩하지 않는다.
- icon이 있는 기본 action은 텍스트만 있는 임의 chip보다 기존 button/action 컴포넌트를 사용한다.
- mobile/tablet에서 버튼, 모달 footer, drawer, 목록 row가 viewport를 넘지 않는지 확인한다.
- debug outline은 필요할 때만 켜고 기본 상태는 비활성으로 둔다.

## 보류

- 과거 WAFL UI 버전별 문서는 archive 이력으로 둔다.
- `/ui` 자체가 제품 기능 화면이 아니므로 실제 업무 화면의 DB/API/R2 흐름 검증을 대체하지 않는다.
