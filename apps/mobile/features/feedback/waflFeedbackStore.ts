import type { WaflActionConfirmationState } from "./WaflActionConfirmationCard";

export type WaflAlertTone = "success" | "warning" | "error";
export type WaflAlertState = { readonly id: number; readonly message: string; readonly tone: WaflAlertTone };
type Snapshot = { readonly decision: WaflActionConfirmationState | null; readonly alert: WaflAlertState | null };

let decisionSequence = 0;
let alertSequence = 0;
let snapshot: Snapshot = { decision: null, alert: null };
const listeners = new Set<() => void>();
function publish(next: Snapshot) { snapshot = next; listeners.forEach((listener) => listener()); }

export function subscribeWaflFeedback(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function getWaflFeedbackSnapshot() { return snapshot; }
export function requestWaflDecision(input: Omit<WaflActionConfirmationState, "onCancel"> & { readonly onCancel?: () => void }) {
  const identity = ++decisionSequence;
  publish({ ...snapshot, decision: {
    ...input,
    onCancel: () => { if (snapshot.decision && identity === decisionSequence) publish({ ...snapshot, decision: null }); input.onCancel?.(); },
    onConfirm: () => { if (snapshot.decision && identity === decisionSequence) publish({ ...snapshot, decision: null }); input.onConfirm(); },
  } });
}
export function showWaflAlert(message: string, tone: WaflAlertTone = "warning") {
  publish({ ...snapshot, alert: { id: ++alertSequence, message, tone } });
}
export function dismissWaflAlert(id: number) {
  if (snapshot.alert?.id === id) publish({ ...snapshot, alert: null });
}
