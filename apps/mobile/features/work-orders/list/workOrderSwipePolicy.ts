export const WORK_ORDER_SWIPE_ACTION_WIDTH = 82;
export const WORK_ORDER_SWIPE_LEADING_WIDTH = WORK_ORDER_SWIPE_ACTION_WIDTH * 2;
export const WORK_ORDER_SWIPE_TRAILING_WIDTH = WORK_ORDER_SWIPE_ACTION_WIDTH;
export const WORK_ORDER_SWIPE_INTENT_THRESHOLD = 18;
export const WORK_ORDER_SWIPE_AXIS_DOMINANCE = 1.2;

export type WorkOrderSwipeIntent = "pending" | "vertical" | "copy" | "delete";
export type WorkOrderSwipeSide = "copy" | "delete";

export function resolveWorkOrderSwipeIntent(dx: number, dy: number): WorkOrderSwipeIntent {
  const horizontal = Math.abs(dx);
  const vertical = Math.abs(dy);
  if (vertical >= WORK_ORDER_SWIPE_INTENT_THRESHOLD && vertical > horizontal) return "vertical";
  if (horizontal < WORK_ORDER_SWIPE_INTENT_THRESHOLD || horizontal <= vertical * WORK_ORDER_SWIPE_AXIS_DOMINANCE) return "pending";
  return dx > 0 ? "copy" : "delete";
}

export function resistedWorkOrderSwipeOffset(value: number) {
  const minimum = -WORK_ORDER_SWIPE_TRAILING_WIDTH;
  const maximum = WORK_ORDER_SWIPE_LEADING_WIDTH;
  if (value < minimum) return minimum + (value - minimum) * 0.16;
  if (value > maximum) return maximum + (value - maximum) * 0.16;
  return value;
}

export function settleWorkOrderSwipe(input: { readonly start: number; readonly dx: number }): WorkOrderSwipeSide | null {
  const target = input.start + input.dx;
  if (target > WORK_ORDER_SWIPE_ACTION_WIDTH * 0.72) return "copy";
  if (target < -WORK_ORDER_SWIPE_ACTION_WIDTH * 0.58) return "delete";
  return null;
}

export function workOrderSwipeSnapOffset(side: WorkOrderSwipeSide | null) {
  if (side === "copy") return WORK_ORDER_SWIPE_LEADING_WIDTH;
  if (side === "delete") return -WORK_ORDER_SWIPE_TRAILING_WIDTH;
  return 0;
}
