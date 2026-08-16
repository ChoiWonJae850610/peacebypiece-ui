export type WaflNestedSheetFocusIntent<Endpoint extends string, Target extends string> = {
  readonly endpoint: Endpoint;
  readonly generation: number;
  readonly target: Target;
};

export function canPresentWaflNestedSheet(input: {
  readonly currentVisible: boolean;
  readonly hasPendingRoute: boolean;
  readonly hasQueuedPresentation: boolean;
}) {
  return !input.currentVisible && !input.hasPendingRoute && !input.hasQueuedPresentation;
}

export function canTransitionWaflNestedSheet(input: {
  readonly currentVisible: boolean;
  readonly hasPendingRoute: boolean;
}) {
  return input.currentVisible && !input.hasPendingRoute;
}

export function nextWaflNestedSheetPresentationGeneration(current: number) {
  return current + 1;
}

export function matchesWaflNestedSheetFocusIntent<Endpoint extends string, Target extends string>(
  intent: WaflNestedSheetFocusIntent<Endpoint, Target> | null,
  input: { readonly endpoint: Endpoint; readonly generation: number; readonly target: Target },
) {
  return intent !== null
    && intent.endpoint === input.endpoint
    && intent.generation === input.generation
    && intent.target === input.target;
}
