import assert from "node:assert/strict";
import fs from "node:fs";

import { resolveQuickDeliveryEndpointEntryRoute } from "../apps/mobile/domain/quickDeliveryEndpointRoutingPolicy.ts";
import {
  resolveWaflAdaptiveInitialHeight,
  resolveWaflSheetMeasurementIdentity,
} from "../apps/mobile/domain/waflSheetDetentPolicy.ts";

const read = (path) => fs.readFileSync(path, "utf8");
const quick = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const nested = read("apps/mobile/features/inputs/useWaflNestedSheetHandoff.ts");
const docs = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");
const runtimeRunner = read("tools/dev/start-wafl-external-qa.ps1");
const runtimeCommon = read("tools/dev/wafl-external-qa-common.ps1");

assert.equal(resolveQuickDeliveryEndpointEntryRoute("direct"), "direct");
assert.equal(resolveQuickDeliveryEndpointEntryRoute("partner"), "picker");
assert.equal(resolveQuickDeliveryEndpointEntryRoute("unset"), "picker");

for (const generation of [1, 2, 3]) {
  const current = resolveWaflSheetMeasurementIdentity({
    hasActions: true,
    presentationGeneration: generation,
    sizing: "adaptiveExpandable",
    title: "퀵 전달 요청 미리보기",
  });
  const previous = resolveWaflSheetMeasurementIdentity({
    hasActions: true,
    presentationGeneration: generation - 1,
    sizing: "adaptiveExpandable",
    title: "퀵 전달 요청 미리보기",
  });
  assert.notEqual(current, previous, `cycle ${generation} must reject stale measurement identity`);
}

const fallbackHeight = resolveWaflAdaptiveInitialHeight({
  bodyHeight: 0,
  footerHeight: 72,
  headerHeight: 88,
  maxRatio: 0.68,
  minHeight: 220,
  safeBottom: 24,
  verticalChrome: 16,
  windowHeight: 844,
});
const measuredHeight = resolveWaflAdaptiveInitialHeight({
  bodyHeight: 320,
  footerHeight: 72,
  headerHeight: 88,
  maxRatio: 0.68,
  minHeight: 220,
  safeBottom: 24,
  verticalChrome: 16,
  windowHeight: 844,
});
assert.ok(fallbackHeight >= 220);
assert.ok(measuredHeight > fallbackHeight, "current-generation body measurement must grow the usable target");

assert.match(quick, /type QuickNestedRoute = "picker" \| "direct" \| "address" \| "preview"/);
assert.doesNotMatch(quick, /previewOpen|setPreviewOpen/);
assert.match(quick, /resolveQuickDeliveryEndpointEntryRoute\(current\.mode\)/);
assert.match(quick, /onPress=\{\(\) => openEndpoint\("origin"\)\}/);
assert.match(quick, /onPress=\{\(\) => openEndpoint\("destination"\)\}/);
assert.match(quick, /setDirectDraft\(current\)/);
assert.match(quick, /nested\.present\("preview"\)/);
assert.match(quick, /nested\.visible && nested\.route === "preview"/);
assert.match(quick, /title="퀵 전달 요청 미리보기"[\s\S]*?sizing="adaptiveExpandable"|sizing="adaptiveExpandable"[\s\S]*?title="퀵 전달 요청 미리보기"/);
assert.match(quick, /presentationGeneration=\{nested\.presentationGeneration\}/);
assert.match(quick, /onAfterClose=\{finishNestedClose\}/);

assert.match(sheet, /resolveWaflSheetMeasurementIdentity/);
assert.match(sheet, /entranceFrameRef\.current = requestAnimationFrame/);
assert.match(sheet, /generation !== openGenerationRef\.current/);
assert.match(sheet, /setOpenReady\(true\)/);
assert.match(sheet, /const adaptiveSizing = sizing === "adaptiveExpandable" \|\| sizing === "reelAdaptive"[\s\S]*!adaptiveSizing[\s\S]*?!openReady/);
assert.match(nested, /setPresentationGeneration\(nextWaflNestedSheetPresentationGeneration\)/);

assert.match(docs, /DIRECT.*direct editor|direct mode.*direct editor/i);
assert.match(docs, /current-generation|generation-safe/i);
assert.doesNotMatch(quick, /fetch\(|saveQuick|persistQuick|quick-delivery.*api/i);
assert.match(runtimeRunner, /\$advertisedReadyDeadline = \[DateTime\]::UtcNow\.AddSeconds\(90\)/);
assert.match(runtimeRunner, /while \(\[DateTime\]::UtcNow -lt \$advertisedReadyDeadline -and -not \$advertisedReady\)/);
assert.match(runtimeRunner, /\$launchUri\.Host -ne \$state\.tailscaleIpv4/);
assert.match(runtimeRunner, /\$developerClientMetroUri\.Host -ne \$state\.tailscaleIpv4/);
assert.match(runtimeRunner, /Get-WaflQaRedirectResponse/);
assert.match(runtimeCommon, /function Get-WaflQaRedirectResponse/);
assert.match(runtimeCommon, /AllowAutoRedirect = \$false/);

console.log("WAFL v2 alpha.64 Quick preview state-aware routing contract PASS");
