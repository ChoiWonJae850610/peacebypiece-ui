import { beginWaflPresentationFirstOperation } from "./waflPresentationBoundary.ts";

export async function runWaflProcessingAction<T>(input: {
  readonly processingMessage: string;
  readonly successMessage: string;
  readonly onProcessing: (message: string | null) => void;
  readonly onSuccess: (message: string) => void;
  readonly command: () => Promise<T>;
  readonly isSuccess?: (result: T) => boolean;
  readonly present?: () => Promise<void>;
}): Promise<T> {
  await beginWaflPresentationFirstOperation({
    enterPending: () => input.onProcessing(input.processingMessage),
    present: input.present,
  });
  let processingCleared = false;
  try {
    const result = await input.command();
    input.onProcessing(null);
    processingCleared = true;
    if (input.isSuccess?.(result) ?? true) input.onSuccess(input.successMessage);
    return result;
  } finally {
    if (!processingCleared) input.onProcessing(null);
  }
}
