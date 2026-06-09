import { notFound } from "next/navigation";

import { APP_VERSION } from "@/lib/constants/version";
import {
  getWaflUiCatalogRuntimeMode,
  isWaflUiCatalogRuntimeAllowed,
  WAFL_UI_CATALOG_ALLOWED_RUNTIME_MODES,
} from "@/lib/uiCatalog/runtimeAccess";
import WaflUiCatalogPage from "./WaflUiCatalogPage";

export const dynamic = "force-dynamic";

export default function UiCatalogRoutePage() {
  const runtimeMode = getWaflUiCatalogRuntimeMode();

  if (!isWaflUiCatalogRuntimeAllowed()) {
    notFound();
  }

  return (
    <WaflUiCatalogPage
      appVersion={APP_VERSION}
      runtimeMode={runtimeMode}
      allowedRuntimeModes={[...WAFL_UI_CATALOG_ALLOWED_RUNTIME_MODES]}
    />
  );
}
