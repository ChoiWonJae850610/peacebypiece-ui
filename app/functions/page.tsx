import { notFound } from "next/navigation";

import { APP_VERSION } from "@/lib/constants/version";
import { WAFL_FUNCTION_CATALOG } from "@/lib/functions/catalog";
import { getWaflFunctionsRuntimeMode, isWaflFunctionsRuntimeAllowed } from "@/lib/functions/runtimeAccess";
import FunctionsCatalogClient from "./FunctionsCatalogClient";

export const dynamic = "force-dynamic";

export default function FunctionsPage() {
  if (!isWaflFunctionsRuntimeAllowed()) notFound();

  return (
    <FunctionsCatalogClient
      appVersion={APP_VERSION}
      runtimeMode={getWaflFunctionsRuntimeMode()}
      catalog={WAFL_FUNCTION_CATALOG}
    />
  );
}
