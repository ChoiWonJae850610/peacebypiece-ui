import { notFound, redirect } from "next/navigation";

import { getCurrentWaflAuthSession } from "@/lib/auth/currentSession";
import { isActiveSystemAdminSession } from "@/lib/auth/systemAdminAccess";
import { APP_VERSION } from "@/lib/constants/version";
import { WAFL_FUNCTION_CATALOG } from "@/lib/functions/catalog";
import { getWaflFunctionsRuntimeMode, isWaflFunctionsRuntimeAllowed } from "@/lib/functions/runtimeAccess";
import FunctionsCatalogClient from "./FunctionsCatalogClient";

export const dynamic = "force-dynamic";

export default async function FunctionsPage() {
  if (!isWaflFunctionsRuntimeAllowed()) notFound();

  const actualSession = await getCurrentWaflAuthSession();
  if (!actualSession) redirect("/?error=SESSION_REQUIRED");
  if (!(await isActiveSystemAdminSession(actualSession))) notFound();

  return (
    <FunctionsCatalogClient
      appVersion={APP_VERSION}
      runtimeMode={getWaflFunctionsRuntimeMode()}
      catalog={WAFL_FUNCTION_CATALOG}
    />
  );
}
