export type WorkOrderDraftSection = "overview" | "sizes" | "materials" | "production" | "finished-spec";
export type DraftBatchFlushReason = "tab-change" | "detail-exit" | "app-background" | "confirm" | "explicit";
export type DraftBatchSaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

export type DraftBatchFlushResult = {
  readonly section: WorkOrderDraftSection;
  readonly generation: number;
  readonly committed: boolean;
};

type FlushOwner = (input: {
  readonly generation: number;
  readonly reason: DraftBatchFlushReason;
  readonly payload: unknown;
}) => Promise<boolean>;

type SectionState = {
  generation: number;
  committedGeneration: number;
  status: DraftBatchSaveStatus;
  flushOwner: FlushOwner | null;
  payload: unknown;
  inFlight: Promise<DraftBatchFlushResult> | null;
};

function createSectionState(): SectionState {
  return { generation: 0, committedGeneration: 0, status: "idle", flushOwner: null, payload: undefined, inFlight: null };
}

export function createWorkOrderDraftBatchCoordinator(input?: {
  readonly onStatus?: (section: WorkOrderDraftSection, status: DraftBatchSaveStatus) => void;
}) {
  const sections: Record<WorkOrderDraftSection, SectionState> = {
    overview: createSectionState(),
    sizes: createSectionState(),
    materials: createSectionState(),
    production: createSectionState(),
    "finished-spec": createSectionState(),
  };
  function publish(section: WorkOrderDraftSection, status: DraftBatchSaveStatus) {
    sections[section].status = status;
    input?.onStatus?.(section, status);
  }

  async function flushSection(section: WorkOrderDraftSection, reason: DraftBatchFlushReason): Promise<DraftBatchFlushResult> {
    const state = sections[section];
    if (state.inFlight) await state.inFlight;
    const generation = state.generation;
    if (generation <= state.committedGeneration || !state.flushOwner) {
      return { section, generation, committed: true };
    }
    const owner = state.flushOwner;
    const payload = state.payload;
    const task = (async (): Promise<DraftBatchFlushResult> => {
      publish(section, "saving");
      try {
        const committed = await owner({ generation, reason, payload });
        if (!committed) {
          publish(section, "error");
          return { section, generation, committed: false };
        }
        state.committedGeneration = Math.max(state.committedGeneration, generation);
        publish(section, state.generation === generation ? "saved" : "dirty");
        return { section, generation, committed: true };
      } catch {
        publish(section, "error");
        return { section, generation, committed: false };
      }
    })();
    state.inFlight = task;
    try { return await task; }
    finally { if (state.inFlight === task) state.inFlight = null; }
  }

  return {
    register(section: WorkOrderDraftSection, owner: FlushOwner) {
      sections[section].flushOwner = owner;
      return () => {
        const state = sections[section];
        if (state.flushOwner === owner) state.flushOwner = null;
      };
    },
    stage(section: WorkOrderDraftSection, payload?: unknown) {
      const state = sections[section];
      state.generation += 1;
      state.payload = payload;
      publish(section, "dirty");
      return state.generation;
    },
    status(section: WorkOrderDraftSection) { return sections[section].status; },
    isDirty(section?: WorkOrderDraftSection) {
      const targets = section ? [section] : Object.keys(sections) as WorkOrderDraftSection[];
      return targets.some((key) => sections[key].generation > sections[key].committedGeneration);
    },
    flushSection,
    discardSection(section: WorkOrderDraftSection) {
      const state = sections[section];
      if (state.inFlight) return false;
      state.generation = 0;
      state.committedGeneration = 0;
      state.payload = undefined;
      publish(section, "idle");
      return true;
    },
    async flushAll(reason: DraftBatchFlushReason) {
      const results: DraftBatchFlushResult[] = [];
      for (const section of Object.keys(sections) as WorkOrderDraftSection[]) {
        results.push(await flushSection(section, reason));
      }
      return results.every((result) => result.committed);
    },
    reset() {
      for (const state of Object.values(sections)) {
        state.generation = 0;
        state.committedGeneration = 0;
        state.status = "idle";
        state.payload = undefined;
        state.inFlight = null;
      }
    },
  } as const;
}

export type WorkOrderDraftBatchCoordinator = ReturnType<typeof createWorkOrderDraftBatchCoordinator>;
