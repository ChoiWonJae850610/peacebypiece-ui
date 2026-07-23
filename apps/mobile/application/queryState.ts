export type QueryState<T> =
  | { readonly status: "idle"; readonly data: null; readonly error: null }
  | { readonly status: "loading"; readonly data: T | null; readonly error: null }
  | { readonly status: "ready"; readonly data: T; readonly error: null }
  | { readonly status: "empty"; readonly data: T; readonly error: null }
  | { readonly status: "error"; readonly data: T | null; readonly error: unknown };

export function initialQueryState<T>(): QueryState<T> {
  return { status: "idle", data: null, error: null };
}

export function loadingQueryState<T>(current: QueryState<T>): QueryState<T> {
  return { status: "loading", data: current.data, error: null };
}

export function resolvedQueryState<T>(data: T, empty: boolean): QueryState<T> {
  return { status: empty ? "empty" : "ready", data, error: null };
}

export function failedQueryState<T>(current: QueryState<T>, error: unknown): QueryState<T> {
  return { status: "error", data: current.data, error };
}
