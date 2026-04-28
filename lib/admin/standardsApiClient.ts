import type { AdminItemCategoryDefinition, AdminStandardsPayload, AdminUnitDefinition } from "@/lib/admin/standards.types";

async function readStandardsResponse(response: Response): Promise<AdminStandardsPayload> {
  const payload = (await response.json()) as AdminStandardsPayload;
  if (!response.ok) throw new Error(payload.error ?? "ADMIN_STANDARDS_API_ERROR");
  return payload;
}

export async function fetchAdminStandardsFromApi(): Promise<AdminStandardsPayload> {
  const response = await fetch("/api/admin/standards", { method: "GET", cache: "no-store" });
  return readStandardsResponse(response);
}

export async function saveAdminUnitsToApi(units: AdminUnitDefinition[]): Promise<AdminStandardsPayload> {
  const response = await fetch("/api/admin/standards", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ units }),
  });
  return readStandardsResponse(response);
}

export async function saveAdminItemCategoriesToApi(itemCategories: AdminItemCategoryDefinition[]): Promise<AdminStandardsPayload> {
  const response = await fetch("/api/admin/standards", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemCategories }),
  });
  return readStandardsResponse(response);
}
