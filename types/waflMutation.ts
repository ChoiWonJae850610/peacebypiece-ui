export type WaflPatchResult<TPatch extends object> = {
  resourceId: string;
  patch: TPatch;
  updatedAt: string;
  revision?: number;
};

export type WaflCollectionPatchResult<
  TPatch extends object,
  TCollectionPatch extends object,
> = WaflPatchResult<TPatch & TCollectionPatch>;
