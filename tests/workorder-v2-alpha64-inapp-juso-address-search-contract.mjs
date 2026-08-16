import assert from "node:assert/strict";
import fs from "node:fs";

import {
  isMakerQaCapabilityEnabled,
  MAKER_QA_APPROVAL,
  MAKER_QA_CAPABILITY,
} from "../lib/external-qa/makerQaCapabilities.mjs";
import { isExternalQaPathAllowed, isTailscaleServePathAllowed } from "../lib/external-qa/configCore.mjs";

const read = (path) => fs.readFileSync(path, "utf8");
const service = read("lib/address/jusoAddressSearch.ts");
const route = read("app/api/v2/address-search/route.ts");
const api = read("apps/mobile/lib/api/addressSearchApi.ts");
const sheet = read("apps/mobile/features/work-orders/documents/QuickDeliveryAddressSearchSheet.tsx");
const quick = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");
const gate = read("lib/external-qa/configCore.mjs");
const repositoryFiles = [service, route, api, sheet, quick, gate].join("\n");
const current = {
  WAFL_SERVER_RUNTIME_MODE: "dev",
  WAFL_EXTERNAL_QA_ALPHA64_DOCUMENT_R0_MUTATION_ENABLED: "true",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: MAKER_QA_APPROVAL.ALPHA64_CURRENT,
  WAFL_V2_DOCUMENT_VIEWER_ENABLED: "1",
  WAFL_V2_DOCUMENT_VIEWER_MUTATION_APPROVED: MAKER_QA_APPROVAL.ALPHA64_CURRENT,
};

assert.equal(isMakerQaCapabilityEnabled(current, MAKER_QA_CAPABILITY.ADDRESS_SEARCH), true);
assert.equal(isTailscaleServePathAllowed("/api/v2/address-search", "GET", current), true);
assert.equal(isExternalQaPathAllowed("/api/v2/address-search", "GET", current), true);
for (const method of ["POST", "PATCH", "DELETE"]) {
  assert.equal(isTailscaleServePathAllowed("/api/v2/address-search", method, current), false);
  assert.equal(isExternalQaPathAllowed("/api/v2/address-search", method, current), false);
}

assert.match(service, /import "server-only"/);
assert.match(service, /JUSO_ADDRESS_SEARCH_ENV = "JUSO_API_KEY"/);
assert.match(service, /https:\/\/business\.juso\.go\.kr\/addrlink\/addrLinkApi\.do/);
for (const token of ["confmKey", "currentPage", "countPerPage", "keyword", "resultType", "AbortController", "JUSO_MAX_RESPONSE_BYTES", "no-store"]) assert.ok(service.includes(token), token);
assert.match(service, /\[%=><\\\[\\\]\]/);
assert.match(service, /SELECT\|INSERT\|DELETE\|UPDATE\|CREATE\|DROP\|EXEC\|UNION/);
assert.match(route, /requireWorkspaceApiGuard\(\{ permissionCode: "workorder\.read" \}\)/);
assert.match(route, /Cache-Control": "no-store"/);
for (const field of ["id", "roadAddress", "jibunAddress", "postalCode", "buildingName", "page", "totalCount", "hasMore"]) assert.ok(`${service}\n${api}`.includes(field), field);
assert.match(sheet, /SEARCH_DEBOUNCE_MS/);
assert.match(sheet, /generationRef\.current !== generation/);
assert.match(sheet, /주소 검색을 사용할 수 없습니다\. 직접 입력해주세요\./);
assert.match(sheet, /주소 검색에 실패했습니다\. 다시 시도해주세요\./);
assert.match(quick, /visible=\{nested\.visible && nested\.route === "direct"\}/);
assert.match(quick, /useWaflNestedSheetHandoff<QuickNestedRoute>[\s\S]*onAfterClose=\{finishNestedClose\}/);
assert.doesNotMatch(repositoryFiles, /NEXT_PUBLIC_.*JUSO|EXPO_PUBLIC_.*JUSO|console\.(?:log|info|warn|error)[\s\S]{0,100}keyword/);

assert.equal(fs.existsSync("app/dev/quick-delivery-address/route.ts"), false);
assert.equal(fs.existsSync("apps/mobile/features/work-orders/documents/quickDeliveryAddressSearch.ts"), false);
assert.doesNotMatch(repositoryFiles, /postcode\.v2\.js|wafl:\/\/quick-delivery\/address-result|Linking\.getInitialURL|Linking\.addEventListener/);
console.log("KAKAO_BROWSER_ADDRESS_FLOW_REMOVED");
console.log("workorder-v2-alpha64-inapp-juso-address-search-contract: PASS");
