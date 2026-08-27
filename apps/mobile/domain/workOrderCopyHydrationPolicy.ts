import { MobileApiError } from "@/domain/mobileContract";

export const COPY_DETAIL_HYDRATION_DELAYS_MS = [0, 120, 280, 560] as const;

export function isCreatedCopyHydrationTransient(error: unknown): boolean {
  return error instanceof MobileApiError
    && (error.status === 404 || error.code === "NOT_FOUND" || error.code === "CONFLICT");
}

export async function hydrateAuthoritativeCreatedCopy<T>(
  workOrderId: string,
  read: (workOrderId: string) => Promise<T>,
  wait: (delayMs: number) => Promise<void> = (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)),
): Promise<T> {
  let lastError: unknown;
  for (const delayMs of COPY_DETAIL_HYDRATION_DELAYS_MS) {
    if (delayMs > 0) await wait(delayMs);
    try { return await read(workOrderId); }
    catch (error) {
      lastError = error;
      if (!isCreatedCopyHydrationTransient(error)) throw error;
    }
  }
  throw lastError;
}
