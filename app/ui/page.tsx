import { notFound } from "next/navigation";

import { APP_VERSION } from "@/lib/constants/version";
import {
  getWaflUiCatalogRuntimeMode,
  isWaflUiCatalogRuntimeAllowed,
  WAFL_UI_CATALOG_ALLOWED_RUNTIME_MODES,
} from "@/lib/uiCatalog/runtimeAccess";
import WaflUiCatalogPage from "./WaflUiCatalogPage";

export const dynamic = "force-dynamic";

// 현재는 모바일/운영 전 확인 편의를 위해 /ui catalog 접근 제한을 임시 해제한다.
// production 차단을 다시 적용할 때 true로 되돌린다. 조건문 자체는 유지한다.
const WAFL_UI_CATALOG_RUNTIME_GATE_ENABLED = false;

export default function UiCatalogRoutePage() {
  const runtimeMode = getWaflUiCatalogRuntimeMode();

  if (WAFL_UI_CATALOG_RUNTIME_GATE_ENABLED && !isWaflUiCatalogRuntimeAllowed()) {
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
