export type CreateRecipeKeyboardFocusState = "closed" | "entrance-ready" | "entrance-consumed" | "dismissed";

export function openCreateRecipeKeyboardFocus(): CreateRecipeKeyboardFocusState {
  return "entrance-ready";
}

export function consumeCreateRecipeEntranceFocus(state: CreateRecipeKeyboardFocusState) {
  return {
    shouldFocus: state === "entrance-ready",
    state: state === "entrance-ready" ? "entrance-consumed" as const : state,
  };
}

export function dismissCreateRecipeKeyboard(): CreateRecipeKeyboardFocusState {
  return "dismissed";
}
