export type InlineEditTransitionPlan = {
  readonly activateNextImmediately: true;
  readonly commitCurrent: boolean;
};

/** Canonical field-to-field focus policy shared by equivalent inline editors. */
export function planInlineEditTransition<T extends string>(input: {
  readonly currentField: T | null;
  readonly nextField: T;
  readonly currentDirty: boolean;
}): InlineEditTransitionPlan {
  return {
    activateNextImmediately: true,
    commitCurrent: input.currentField !== null
      && input.currentField !== input.nextField
      && input.currentDirty,
  };
}
