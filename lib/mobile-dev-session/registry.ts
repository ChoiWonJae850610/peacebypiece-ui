import "server-only";

import type { WaflSessionPayload } from "@/lib/auth/session";
import { MobileDevSessionRegistry } from "@/lib/mobile-dev-session/registryCore.mjs";

const registryGlobal = globalThis as typeof globalThis & {
  __waflMobileDevSessionRegistry?: MobileDevSessionRegistry<WaflSessionPayload>;
};

export function getMobileDevSessionRegistry(): MobileDevSessionRegistry<WaflSessionPayload> {
  registryGlobal.__waflMobileDevSessionRegistry ??= new MobileDevSessionRegistry<WaflSessionPayload>();
  return registryGlobal.__waflMobileDevSessionRegistry;
}
