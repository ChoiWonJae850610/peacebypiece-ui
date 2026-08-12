import { normalizeNumericCommitValue, stripDecimalTrailingZeros } from "./mobileDisplay.ts";

export type InlineEditFinalizationResult = {
  readonly shouldSave: boolean;
  readonly value: string;
};

export type InlineEditValueSemantics = "text" | "nullable-text" | "numeric";

export type InlineEditCommitDecision = {
  readonly changed: boolean;
  readonly value: string;
  readonly nullableValue: string | null;
};

export function normalizeInlineEditValue(
  value: string,
  semantics: InlineEditValueSemantics,
): string {
  if (semantics === "numeric") {
    return stripDecimalTrailingZeros(normalizeNumericCommitValue(value));
  }
  return value.trim();
}

export function decideInlineEditCommit(input: {
  readonly activationValue: string;
  readonly draftValue: string;
  readonly semantics: InlineEditValueSemantics;
}): InlineEditCommitDecision {
  const activationValue = normalizeInlineEditValue(input.activationValue, input.semantics);
  const value = normalizeInlineEditValue(input.draftValue, input.semantics);
  return {
    changed: activationValue !== value,
    value,
    nullableValue: input.semantics === "nullable-text" && value === "" ? null : value,
  };
}

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
