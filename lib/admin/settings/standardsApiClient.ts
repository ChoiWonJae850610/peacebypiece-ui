import type { OutsourcingProcessDefinition } from "@/lib/admin/partner/types";
import type { AdminItemCategoryDefinition, AdminStandardProcessesPayload, AdminStandardsPayload, AdminUnitDefinition } from "@/lib/admin/settings/standardsTypes";

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


async function readStandardProcessesResponse(response: Response): Promise<AdminStandardProcessesPayload> {
  const payload = (await response.json()) as AdminStandardProcessesPayload;
  if (!response.ok) throw new Error(payload.error ?? "ADMIN_STANDARD_PROCESSES_API_ERROR");
  return {
    processDefinitions: Array.isArray(payload.processDefinitions) ? payload.processDefinitions : [],
    error: payload.error,
  };
}

export async function fetchAdminStandardProcessesFromApi(): Promise<AdminStandardProcessesPayload> {
  const response = await fetch("/api/admin/standards/processes", { method: "GET", cache: "no-store" });
  return readStandardProcessesResponse(response);
}

export async function saveAdminStandardProcessesToApi(
  processDefinitions: OutsourcingProcessDefinition[],
): Promise<AdminStandardProcessesPayload> {
  const response = await fetch("/api/admin/standards/processes", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ processDefinitions }),
  });
  return readStandardProcessesResponse(response);
}
