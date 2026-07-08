import { notFound, redirect } from "next/navigation";

import { getCurrentWaflAuthSession } from "@/lib/auth/currentSession";
import { isActiveSystemAdminSession } from "@/lib/auth/systemAdminAccess";
import { APP_VERSION } from "@/lib/constants/version";
import { assertLocalOnlyRouteHost } from "@/lib/internal/localOnlyRouteGuard";
import { canViewUICatalog } from "@/lib/runtime/runtimePolicy";
import {
  getWaflUiCatalogRuntimeMode,
  isWaflUiCatalogRuntimeAllowed,
  WAFL_UI_CATALOG_ALLOWED_RUNTIME_MODES,
} from "@/lib/uiCatalog/runtimeAccess";
import WaflUiCatalogPage from "./WaflUiCatalogPage";

export const dynamic = "force-dynamic";

export default async function UiCatalogRoutePage() {
  await assertLocalOnlyRouteHost();

  const runtimeMode = getWaflUiCatalogRuntimeMode();

  const actualSession = await getCurrentWaflAuthSession();
  if (!actualSession) redirect("/?error=SESSION_REQUIRED");
  const isSystemAdmin = await isActiveSystemAdminSession(actualSession);
  if (!canViewUICatalog({ isSystemAdmin })) notFound();

  return (
    <WaflUiCatalogPage
      appVersion={APP_VERSION}
      runtimeMode={runtimeMode}
      isRuntimeAllowed={isWaflUiCatalogRuntimeAllowed()}
      allowedRuntimeModes={[...WAFL_UI_CATALOG_ALLOWED_RUNTIME_MODES]}
    />
  );
}
