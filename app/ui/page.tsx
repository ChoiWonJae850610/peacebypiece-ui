import { notFound, redirect } from "next/navigation";

import { getCurrentWaflAuthSession } from "@/lib/auth/currentSession";
import { isActiveSystemAdminSession } from "@/lib/auth/systemAdminAccess";
import { APP_VERSION } from "@/lib/constants/version";
import {
  getWaflUiCatalogRuntimeMode,
  isWaflUiCatalogRuntimeAllowed,
  WAFL_UI_CATALOG_ALLOWED_RUNTIME_MODES,
} from "@/lib/uiCatalog/runtimeAccess";
import WaflUiCatalogPage from "./WaflUiCatalogPage";

export const dynamic = "force-dynamic";

export default async function UiCatalogRoutePage() {
  const runtimeMode = getWaflUiCatalogRuntimeMode();
  if (!isWaflUiCatalogRuntimeAllowed()) notFound();

  const actualSession = await getCurrentWaflAuthSession();
  if (!actualSession) redirect("/?error=SESSION_REQUIRED");
  if (!(await isActiveSystemAdminSession(actualSession))) notFound();

  return (
    <WaflUiCatalogPage
      appVersion={APP_VERSION}
      runtimeMode={runtimeMode}
      allowedRuntimeModes={[...WAFL_UI_CATALOG_ALLOWED_RUNTIME_MODES]}
    />
  );
}
