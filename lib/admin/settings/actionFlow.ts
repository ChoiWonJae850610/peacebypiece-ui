import { buildCompanySettingsUpdateInput } from "@/lib/admin/settings/presentation";
import type { CompanySettings } from "@/lib/admin/settings/companyTypes";

export type AdminSettingsSaveFlowResult = {
  ok: boolean;
  settings: CompanySettings | null;
  message: string | null;
};

export async function runSaveCompanySettingsFlow(draft: CompanySettings): Promise<AdminSettingsSaveFlowResult> {
  try {
    const response = await fetch("/api/admin/companies/current", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildCompanySettingsUpdateInput(draft)),
    });
    const payload = (await response.json().catch(() => null)) as { ok?: boolean; settings?: CompanySettings; message?: string } | null;

    if (!response.ok || payload?.ok === false || !payload?.settings) {
      return {
        ok: false,
        settings: null,
        message: payload?.message || "환경설정을 저장하지 못했습니다.",
      };
    }

    return {
      ok: true,
      settings: payload.settings,
      message: null,
    };
  } catch (error) {
    return {
      ok: false,
      settings: null,
      message: error instanceof Error ? error.message : "환경설정을 저장하지 못했습니다.",
    };
  }
}
