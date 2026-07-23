export type MobileNavigationState = {
  readonly screen: "list" | "detail";
  readonly selectedWorkOrderId: string | null;
  readonly backgrounded: boolean;
};

export type MobileNavigationAction =
  | { readonly type: "select"; readonly workOrderId: string }
  | { readonly type: "back" }
  | { readonly type: "session-lost" }
  | { readonly type: "background" }
  | { readonly type: "foreground" };

export const INITIAL_NAVIGATION_STATE: MobileNavigationState = {
  screen: "list",
  selectedWorkOrderId: null,
  backgrounded: false,
};

export function mobileNavigationReducer(
  state: MobileNavigationState,
  action: MobileNavigationAction,
): MobileNavigationState {
  switch (action.type) {
    case "select":
      return { ...state, screen: "detail", selectedWorkOrderId: action.workOrderId };
    case "back":
    case "session-lost":
      return { ...state, screen: "list", selectedWorkOrderId: null };
    case "background":
      return { ...state, backgrounded: true };
    case "foreground":
      return { ...state, backgrounded: false };
  }
}
