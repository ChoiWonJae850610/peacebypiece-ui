export type WaflInputSheetKeyboardPresentation = {
  readonly instanceId: number;
  readonly keyboardCapable: boolean;
  readonly openGeneration: number;
  readonly preparedFocusReady: boolean;
  readonly presented: boolean;
};

type RegisteredPresentation = WaflInputSheetKeyboardPresentation & {
  readonly presentationOrder: number;
};

export type WaflInputSheetKeyboardOwnership = {
  readonly foreignMutationSuppressed: boolean;
  readonly ownerInstanceId: number | null;
  readonly thisSheetOwnsKeyboardEvent: boolean;
};

/**
 * Process-local presentation registry for the global React Native keyboard stream.
 * Presentation order, not feature names or focus timing, selects the one Sheet
 * allowed to author keyboard-derived geometry.
 */
export function createWaflInputSheetKeyboardOwnerRegistry() {
  const presentations = new Map<number, RegisteredPresentation>();
  let presentationSequence = 0;

  function register(instanceId: number) {
    if (presentations.has(instanceId)) return;
    presentations.set(instanceId, {
      instanceId,
      keyboardCapable: false,
      openGeneration: 0,
      preparedFocusReady: false,
      presentationOrder: 0,
      presented: false,
    });
  }

  function update(input: WaflInputSheetKeyboardPresentation) {
    const previous = presentations.get(input.instanceId);
    const beginsPresentation = input.presented && (
      previous === undefined
      || !previous.presented
      || previous.openGeneration !== input.openGeneration
    );
    presentations.set(input.instanceId, {
      ...input,
      presentationOrder: beginsPresentation
        ? ++presentationSequence
        : previous?.presentationOrder ?? 0,
    });
  }

  function unregister(instanceId: number) {
    presentations.delete(instanceId);
  }

  function resolve(instanceId: number): WaflInputSheetKeyboardOwnership {
    let owner: RegisteredPresentation | null = null;
    for (const presentation of presentations.values()) {
      if (!presentation.presented || !presentation.keyboardCapable) continue;
      if (owner === null || presentation.presentationOrder > owner.presentationOrder) owner = presentation;
    }
    const ownerInstanceId = owner?.instanceId ?? null;
    const thisSheetOwnsKeyboardEvent = ownerInstanceId === instanceId;
    return {
      foreignMutationSuppressed: ownerInstanceId !== null && !thisSheetOwnsKeyboardEvent,
      ownerInstanceId,
      thisSheetOwnsKeyboardEvent,
    };
  }

  return { register, resolve, unregister, update } as const;
}

export const waflInputSheetKeyboardOwnerRegistry = createWaflInputSheetKeyboardOwnerRegistry();
