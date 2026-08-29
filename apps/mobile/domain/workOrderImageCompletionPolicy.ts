export type ImageCompletionAttempt<TDetail, TResult> = {
  readonly detail: TDetail;
  readonly result: TResult;
  readonly retriedAfterConflict: boolean;
};

type Input<TDetail, TResult> = {
  readonly initialDetail: TDetail;
  readonly complete: (detail: TDetail, retry: boolean) => Promise<TResult>;
  readonly isConflict: (error: unknown) => boolean;
  readonly refresh: () => Promise<TDetail>;
  readonly canRetry: (initial: TDetail, refreshed: TDetail) => boolean;
};

export async function completeImageWithSingleConflictRebase<TDetail, TResult>(
  input: Input<TDetail, TResult>,
): Promise<ImageCompletionAttempt<TDetail, TResult>> {
  try {
    return {
      detail: input.initialDetail,
      result: await input.complete(input.initialDetail, false),
      retriedAfterConflict: false,
    };
  } catch (error) {
    if (!input.isConflict(error)) throw error;
    const refreshed = await input.refresh();
    if (!input.canRetry(input.initialDetail, refreshed)) throw error;
    return {
      detail: refreshed,
      result: await input.complete(refreshed, true),
      retriedAfterConflict: true,
    };
  }
}
