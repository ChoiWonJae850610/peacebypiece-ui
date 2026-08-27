export type WaflDecisionOption = "safe" | "action";

export function createWaflDecisionGuard(onCancel: () => void, onAction: () => void) {
  let committed = false;
  return Object.freeze({
    dismiss() {
      if (committed) return false;
      committed = true;
      onCancel();
      return true;
    },
    apply(selected: WaflDecisionOption) {
      if (committed) return false;
      committed = true;
      if (selected === "action") onAction();
      else onCancel();
      return selected === "action";
    },
  });
}

export function resolveWaflDecisionOpeningValue(): WaflDecisionOption {
  return "safe";
}
