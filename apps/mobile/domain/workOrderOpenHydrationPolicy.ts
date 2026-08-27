export type WorkOrderChildProjection = "images" | "partners" | "history";

type VersionedProjection = { readonly entityVersion: number };

export type WorkOrderOpenHydrationResult<Detail, Images, Partners, History> = {
  readonly detail: Detail;
  readonly images: Images | null;
  readonly partners: Partners | null;
  readonly history: History | null;
  readonly unavailable: readonly WorkOrderChildProjection[];
  readonly attempts: 1 | 2;
  readonly versionReconciled: boolean;
};

type WorkOrderOpenHydrationInput<
  Detail,
  Images extends VersionedProjection,
  Partners extends VersionedProjection,
  History,
> = {
  readonly initialDetail: Detail;
  readonly workOrderId: string;
  readonly detailVersion: (detail: Detail) => number;
  readonly isSample: (detail: Detail) => boolean;
  readonly loadDetail: (workOrderId: string) => Promise<Detail>;
  readonly loadImages: (workOrderId: string) => Promise<Images>;
  readonly loadPartners: (workOrderId: string) => Promise<Partners>;
  readonly loadHistory: (workOrderId: string) => Promise<History>;
  readonly waitBeforeRetry?: () => Promise<void>;
};

type SettledChildren<Images, Partners, History> = {
  readonly images: PromiseSettledResult<Images>;
  readonly partners: PromiseSettledResult<Partners>;
  readonly history: PromiseSettledResult<History | null>;
};

async function settleChildren<Images, Partners, History>(input: {
  readonly workOrderId: string;
  readonly sample: boolean;
  readonly loadImages: (workOrderId: string) => Promise<Images>;
  readonly loadPartners: (workOrderId: string) => Promise<Partners>;
  readonly loadHistory: (workOrderId: string) => Promise<History>;
}): Promise<SettledChildren<Images, Partners, History>> {
  const [images, partners, history] = await Promise.allSettled([
    input.loadImages(input.workOrderId),
    input.loadPartners(input.workOrderId),
    input.sample ? Promise.resolve(null) : input.loadHistory(input.workOrderId),
  ]);
  return { images, partners, history };
}

function unavailableChildren<Images extends VersionedProjection, Partners extends VersionedProjection, History>(
  children: SettledChildren<Images, Partners, History>,
  expectedVersion: number,
  sample: boolean,
) {
  const unavailable: WorkOrderChildProjection[] = [];
  if (children.images.status === "rejected" || children.images.value.entityVersion !== expectedVersion) unavailable.push("images");
  if (children.partners.status === "rejected" || children.partners.value.entityVersion !== expectedVersion) unavailable.push("partners");
  if (!sample && children.history.status === "rejected") unavailable.push("history");
  return unavailable;
}

/**
 * Core detail is deliberately supplied by the caller so navigation can become
 * usable before optional projections finish. Child reads receive one bounded
 * reconcile attempt; a projection failure is returned explicitly and never
 * invalidates the already-authoritative core WorkOrder.
 */
export async function hydrateWorkOrderOpenChildren<
  Detail,
  Images extends VersionedProjection,
  Partners extends VersionedProjection,
  History,
>(input: WorkOrderOpenHydrationInput<Detail, Images, Partners, History>): Promise<WorkOrderOpenHydrationResult<Detail, Images, Partners, History>> {
  let detail = input.initialDetail;
  let children = await settleChildren({
    workOrderId: input.workOrderId,
    sample: input.isSample(detail),
    loadImages: input.loadImages,
    loadPartners: input.loadPartners,
    loadHistory: input.loadHistory,
  });
  let expectedVersion = input.detailVersion(detail);
  let unavailable = unavailableChildren(children, expectedVersion, input.isSample(detail));
  if (unavailable.length === 0) {
    return {
      detail,
      images: children.images.status === "fulfilled" ? children.images.value : null,
      partners: children.partners.status === "fulfilled" ? children.partners.value : null,
      history: children.history.status === "fulfilled" ? children.history.value : null,
      unavailable,
      attempts: 1,
      versionReconciled: false,
    };
  }

  await (input.waitBeforeRetry?.() ?? new Promise<void>((resolve) => setTimeout(resolve, 120)));
  const versionMismatch = (children.images.status === "fulfilled" && children.images.value.entityVersion !== expectedVersion)
    || (children.partners.status === "fulfilled" && children.partners.value.entityVersion !== expectedVersion);
  if (versionMismatch) {
    try {
      detail = await input.loadDetail(input.workOrderId);
      expectedVersion = input.detailVersion(detail);
    } catch {
      // The initial core remains authoritative and usable. The second child
      // attempt below can still recover a projection that was briefly stale.
    }
  }
  children = await settleChildren({
    workOrderId: input.workOrderId,
    sample: input.isSample(detail),
    loadImages: input.loadImages,
    loadPartners: input.loadPartners,
    loadHistory: input.loadHistory,
  });
  unavailable = unavailableChildren(children, expectedVersion, input.isSample(detail));
  return {
    detail,
    images: children.images.status === "fulfilled" && children.images.value.entityVersion === expectedVersion ? children.images.value : null,
    partners: children.partners.status === "fulfilled" && children.partners.value.entityVersion === expectedVersion ? children.partners.value : null,
    history: children.history.status === "fulfilled" ? children.history.value : null,
    unavailable,
    attempts: 2,
    versionReconciled: versionMismatch && input.detailVersion(detail) === expectedVersion,
  };
}
