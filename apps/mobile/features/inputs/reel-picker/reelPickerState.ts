import { defaultReelStep, type ReelStep } from "./reelPickerModel.ts";

export type ReelPickerMode = "reel" | "keypad";

export type ReelPickerState = {
  readonly phase: "closed" | "open";
  readonly field: string | null;
  readonly label: string;
  readonly initialValue: string;
  readonly initialUnit: string;
  readonly selectedValue: string;
  readonly selectedUnit: string;
  readonly step: ReelStep;
  readonly mode: ReelPickerMode;
  readonly openCount: number;
  readonly closeCount: number;
};

export type ReelPickerAction =
  | { readonly type: "open"; readonly field: string; readonly label: string; readonly value: string; readonly unit: string; readonly step?: ReelStep }
  | { readonly type: "select-value"; readonly value: string }
  | { readonly type: "select-unit"; readonly unit: string }
  | { readonly type: "select-step"; readonly step: ReelStep }
  | { readonly type: "set-mode"; readonly mode: ReelPickerMode }
  | { readonly type: "cancel" }
  | { readonly type: "apply" };

export const INITIAL_REEL_PICKER_STATE: ReelPickerState = {
  phase: "closed",
  field: null,
  label: "",
  initialValue: "0",
  initialUnit: "",
  selectedValue: "0",
  selectedUnit: "",
  step: "0.1",
  mode: "reel",
  openCount: 0,
  closeCount: 0,
};

export function reelPickerReducer(state: ReelPickerState, action: ReelPickerAction): ReelPickerState {
  switch (action.type) {
    case "open":
      if (state.phase === "open") return state;
      return {
        ...state,
        phase: "open",
        field: action.field,
        label: action.label,
        initialValue: action.value,
        initialUnit: action.unit,
        selectedValue: action.value,
        selectedUnit: action.unit,
        step: action.step ?? defaultReelStep(action.unit),
        mode: "reel",
        openCount: state.openCount + 1,
      };
    case "select-value": return state.phase === "open" ? { ...state, selectedValue: action.value } : state;
    case "select-unit": return state.phase === "open" ? { ...state, selectedUnit: action.unit } : state;
    case "select-step": return state.phase === "open" ? { ...state, step: action.step } : state;
    case "set-mode": return state.phase === "open" ? { ...state, mode: action.mode } : state;
    case "cancel":
      return state.phase === "closed" ? state : {
        ...state,
        phase: "closed",
        selectedValue: state.initialValue,
        selectedUnit: state.initialUnit,
        closeCount: state.closeCount + 1,
      };
    case "apply":
      return state.phase === "closed" ? state : { ...state, phase: "closed", closeCount: state.closeCount + 1 };
  }
}
