export type WaflInputCommitResult<T> =
  | { readonly accepted: false }
  | { readonly accepted: true; readonly value: T };

export function createWaflInputCommitGuard() {
  let active = false;

  return {
    isActive() {
      return active;
    },
    async submit<T>(action: () => Promise<T> | T): Promise<WaflInputCommitResult<T>> {
      if (active) return { accepted: false };
      active = true;
      try {
        return { accepted: true, value: await action() };
      } finally {
        active = false;
      }
    },
  };
}
