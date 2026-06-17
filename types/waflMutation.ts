export type WaflPatchResult<TPatch extends object> = {
  resourceId: string;
  patch: TPatch;
  updatedAt: string;
  revision?: number;
};
