import { readFile } from "node:fs/promises";
import process from "node:process";

import { ExternalQaConfigError, readMobileQaConfig } from "../lib/external-qa/configCore.mjs";

const requireExternalQa = process.argv.includes("--external-qa");

try {
  const config = readMobileQaConfig(process.env, { requireExternalQa });
  const packageJson = JSON.parse(await readFile(new URL("../apps/mobile/package.json", import.meta.url), "utf8"));
  const dependencies = Object.keys(packageJson.dependencies ?? {});
  if (typeof packageJson.dependencies?.["expo-dev-client"] !== "string") {
    throw new ExternalQaConfigError("DEVELOPMENT_BUILD_DEPENDENCY_REQUIRED");
  }
  const unsupportedNativeDependencies = dependencies.filter((name) => name.startsWith("@config-plugins/"));
  if (unsupportedNativeDependencies.length > 0) throw new ExternalQaConfigError("EXPO_GO_NATIVE_DEPENDENCY_REVIEW_REQUIRED");
  console.log(JSON.stringify({
    result: "WAFL_EXTERNAL_QA_CONFIG_PASS",
    externalQa: config.externalQa,
    webOriginConfigured: Boolean(config.webOrigin),
    apiOriginConfigured: Boolean(config.apiOrigin),
    developerAutoConnect: config.developerAutoConnect,
    developmentBuildStaticCompatibility: "PASS",
    expoGoOfficialQa: "EXCLUDED",
    rawOriginLogged: false,
  }));
} catch (error) {
  const code = error instanceof ExternalQaConfigError ? error.code : "EXTERNAL_QA_CONFIG_AUDIT_FAILED";
  console.error(JSON.stringify({ result: "WAFL_EXTERNAL_QA_CONFIG_FAIL", code, rawOriginLogged: false }));
  process.exitCode = 1;
}
