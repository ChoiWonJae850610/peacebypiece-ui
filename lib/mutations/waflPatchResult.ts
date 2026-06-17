import type { WaflPatchResult } from "@/types/waflMutation";

type ApplyWaflPatchResultOptions<TResource extends object> = {
  allowedKeys?: readonly (keyof TResource)[];
  updatedAtKey?: keyof TResource;
};

export function applyWaflPatchResult<TResource extends object>(
  current: TResource,
  result: WaflPatchResult<Partial<TResource>>,
  options: ApplyWaflPatchResultOptions<TResource> = {},
): TResource {
  const allowedKeySet = options.allowedKeys
    ? new Set<keyof TResource>(options.allowedKeys)
    : null;
  const safePatch = Object.fromEntries(
    Object.entries(result.patch).filter(([key]) =>
      allowedKeySet ? allowedKeySet.has(key as keyof TResource) : true,
    ),
  ) as Partial<TResource>;

  return {
    ...current,
    ...safePatch,
    ...(options.updatedAtKey
      ? { [options.updatedAtKey]: result.updatedAt }
      : {}),
  } as TResource;
}
