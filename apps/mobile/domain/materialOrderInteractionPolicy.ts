export type MaterialOrderInteractionState = {
  readonly hasDetail: boolean;
  readonly policyAllowed: boolean;
  readonly mutationInFlight: boolean;
  readonly selectedWorkOrderMatches: boolean;
};

export function canExecuteMaterialOrderInteraction(state: MaterialOrderInteractionState): boolean {
  return state.hasDetail
    && state.policyAllowed
    && !state.mutationInFlight
    && state.selectedWorkOrderMatches;
}
