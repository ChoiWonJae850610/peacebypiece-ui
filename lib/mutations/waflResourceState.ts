export type WaflIdentifiedResource = {
  id: string;
};

export function applyWaflResourcePatch<TResource extends WaflIdentifiedResource>(
  resources: readonly TResource[],
  resourceId: string,
  patch: Partial<TResource>,
): TResource[] {
  return resources.map((resource) => (
    resource.id === resourceId
      ? { ...resource, ...patch, id: resource.id }
      : resource
  ));
}

export function pickWaflResourcePatch<TResource extends object>(
  source: TResource,
  keys: readonly (keyof TResource)[],
): Partial<TResource> {
  return keys.reduce<Partial<TResource>>((patch, key) => {
    patch[key] = source[key];
    return patch;
  }, {});
}
