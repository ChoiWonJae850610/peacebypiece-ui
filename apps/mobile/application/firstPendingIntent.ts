export type PendingIntent = {
  readonly key: string;
  readonly isValid: () => boolean;
  readonly run: () => void;
};

export function createFirstPendingIntentController() {
  let first: PendingIntent | null = null;
  return {
    capture(intent: PendingIntent) {
      if (first) return false;
      first = intent;
      return true;
    },
    key() { return first?.key ?? null; },
    drop() { first = null; },
    replay() {
      const intent = first;
      first = null;
      if (!intent || !intent.isValid()) return false;
      intent.run();
      return true;
    },
  } as const;
}

export type FirstPendingIntentController = ReturnType<typeof createFirstPendingIntentController>;
