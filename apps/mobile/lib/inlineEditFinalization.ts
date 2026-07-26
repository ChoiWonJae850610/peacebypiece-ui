export type InlineEditFinalizationResult = {
  readonly shouldSave: boolean;
  readonly value: string;
};

export type InlineEditFinalizationController = {
  readonly observe: (value: string) => void;
  readonly requestSave: () => boolean;
  readonly finalize: (value: string) => InlineEditFinalizationResult;
  readonly cancel: () => void;
  readonly reset: (value: string) => void;
};

export function createInlineEditFinalizationController(
  initialValue = "",
): InlineEditFinalizationController {
  let latestValue = initialValue;
  let pendingSave = false;
  let submitted = false;

  return {
    observe(value) {
      latestValue = value;
    },
    requestSave() {
      if (pendingSave || submitted) return false;
      pendingSave = true;
      return true;
    },
    finalize(value) {
      latestValue = value;
      if (!pendingSave || submitted) {
        return { shouldSave: false, value: latestValue };
      }
      pendingSave = false;
      submitted = true;
      return { shouldSave: true, value: latestValue };
    },
    cancel() {
      pendingSave = false;
      submitted = true;
    },
    reset(value) {
      latestValue = value;
      pendingSave = false;
      submitted = false;
    },
  };
}
