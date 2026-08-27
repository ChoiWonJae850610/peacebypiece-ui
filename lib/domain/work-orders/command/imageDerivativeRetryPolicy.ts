export const WORK_ORDER_IMAGE_DERIVATIVE_RETRY_DELAYS_MS = [0, 350, 900] as const;

export async function createImageDerivativesWithBoundedRetry<T>(input: {
  readonly create: () => Promise<T>;
  readonly isRetryable: (error: unknown) => boolean;
  readonly wait?: (milliseconds: number) => Promise<void>;
}): Promise<T> {
  const wait = input.wait ?? ((milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));
  let lastError: unknown;
  for (const delay of WORK_ORDER_IMAGE_DERIVATIVE_RETRY_DELAYS_MS) {
    if (delay > 0) await wait(delay);
    try {
      return await input.create();
    } catch (error) {
      lastError = error;
      if (!input.isRetryable(error)) throw error;
    }
  }
  throw lastError;
}
