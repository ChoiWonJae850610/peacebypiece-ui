export type WaflApiSuccess<T> = {
  ok: true;
  data: T;
};

export type WaflApiFailure = {
  ok: false;
  code: string;
  message: string;
};

export type WaflApiEnvelope<T> = WaflApiSuccess<T> | WaflApiFailure;

export class WaflApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(input: { message: string; code?: string; status?: number }) {
    super(input.message);
    this.name = "WaflApiError";
    this.code = input.code?.trim() || "WAF_API_ERROR";
    this.status = input.status ?? 500;
  }
}
