import "server-only";

export const SERVER_RUNTIME_MODES = {
  production: "production",
  development: "development",
  dev: "dev",
  local: "local",
  test: "test",
  demo: "demo",
} as const;

export type ServerRuntimeMode =
  (typeof SERVER_RUNTIME_MODES)[keyof typeof SERVER_RUNTIME_MODES];

const NON_PRODUCTION_MODES = new Set<ServerRuntimeMode>([
  SERVER_RUNTIME_MODES.development,
  SERVER_RUNTIME_MODES.dev,
  SERVER_RUNTIME_MODES.local,
  SERVER_RUNTIME_MODES.test,
  SERVER_RUNTIME_MODES.demo,
]);

function normalizeRuntimeValue(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

export function getServerRuntimeMode(): ServerRuntimeMode {
  const explicit = normalizeRuntimeValue(process.env.WAFL_SERVER_RUNTIME_MODE);
  if (explicit === SERVER_RUNTIME_MODES.production) return SERVER_RUNTIME_MODES.production;
  if (NON_PRODUCTION_MODES.has(explicit as ServerRuntimeMode)) {
    return explicit as ServerRuntimeMode;
  }

  const vercelEnv = normalizeRuntimeValue(process.env.VERCEL_ENV);
  if (vercelEnv === SERVER_RUNTIME_MODES.production) return SERVER_RUNTIME_MODES.production;

  const nodeEnv = normalizeRuntimeValue(process.env.NODE_ENV);
  if (nodeEnv === SERVER_RUNTIME_MODES.production) return SERVER_RUNTIME_MODES.production;
  if (NON_PRODUCTION_MODES.has(nodeEnv as ServerRuntimeMode)) {
    return nodeEnv as ServerRuntimeMode;
  }

  return SERVER_RUNTIME_MODES.production;
}

export function isServerProductionRuntime(): boolean {
  return getServerRuntimeMode() === SERVER_RUNTIME_MODES.production;
}

export function isServerDevTestRuntime(): boolean {
  return NON_PRODUCTION_MODES.has(getServerRuntimeMode());
}
