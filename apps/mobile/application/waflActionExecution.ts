export async function runWaflProcessingAction<T>(input: {
  readonly processingMessage: string;
  readonly successMessage: string;
  readonly onProcessing: (message: string | null) => void;
  readonly onSuccess: (message: string) => void;
  readonly command: () => Promise<T>;
  readonly isSuccess?: (result: T) => boolean;
}): Promise<T> {
  input.onProcessing(input.processingMessage);
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
