import type { OutsourcingProcessDefinition } from "@/lib/admin/partnerMaster.types";
import type { PartnerRepositoryInfo } from "@/lib/partners/partnerRepository";
import type { Partner, PartnerDraft } from "@/types/partner";

export type PartnerMasterApiResponse = {
  partners: Partner[];
  processDefinitions?: OutsourcingProcessDefinition[];
  repository?: PartnerRepositoryInfo;
  error?: string;
};

async function parsePartnerMasterApiResponse(response: Response): Promise<PartnerMasterApiResponse> {
  const payload = (await response.json()) as PartnerMasterApiResponse;

  if (!response.ok) {
    throw new Error(payload.error ?? "PARTNER_MASTER_API_ERROR");
  }

  return {
    partners: Array.isArray(payload.partners) ? payload.partners : [],
    processDefinitions: Array.isArray(payload.processDefinitions) ? payload.processDefinitions : undefined,
    repository: payload.repository,
    error: payload.error,
  };
}

export async function fetchPartnerMasterItemsFromApi(): Promise<PartnerMasterApiResponse> {
  const response = await fetch("/api/admin/partners", {
    method: "GET",
    cache: "no-store",
  });

  return parsePartnerMasterApiResponse(response);
}

export async function savePartnerMasterItemToApi(partnerId: string | null, draft: PartnerDraft): Promise<PartnerMasterApiResponse> {
  const response = await fetch("/api/admin/partners", {
    method: partnerId ? "PATCH" : "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ partnerId, draft }),
  });

  return parsePartnerMasterApiResponse(response);
}

export async function savePartnerMasterProcessesToApi(
  processDefinitions: OutsourcingProcessDefinition[],
): Promise<PartnerMasterApiResponse> {
  const response = await fetch("/api/admin/partners", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ processDefinitions }),
  });

  return parsePartnerMasterApiResponse(response);
}
