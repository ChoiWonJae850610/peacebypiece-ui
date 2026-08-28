export async function runWorkOrderListReorderFlow<TSource, TResult>(input: {
  readonly onProcessing: (processing: boolean) => void;
  readonly loadSourceCore: () => Promise<TSource>;
  readonly validateSource: (source: TSource) => boolean;
  readonly createAndOpenAuthoritativeResult: (source: TSource) => Promise<TResult>;
  readonly present?: () => Promise<void>;
}): Promise<TResult> {
  input.onProcessing(true);
  try {
    await input.present?.();
    const source = await input.loadSourceCore();
    if (!input.validateSource(source)) throw new Error("WORK_ORDER_REORDER_SOURCE_INELIGIBLE");
    return await input.createAndOpenAuthoritativeResult(source);
  } finally {
    input.onProcessing(false);
  }
}
