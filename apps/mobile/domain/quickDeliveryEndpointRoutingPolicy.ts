export type QuickDeliveryEndpointMode = "unset" | "partner" | "direct";
export type QuickDeliveryEndpointEntryRoute = "picker" | "direct";

export function resolveQuickDeliveryEndpointEntryRoute(
  mode: QuickDeliveryEndpointMode,
): QuickDeliveryEndpointEntryRoute {
  return mode === "direct" ? "direct" : "picker";
}
