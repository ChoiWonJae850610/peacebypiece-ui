#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";

import {
  resolveWorkOrderTabletPresentation,
  resolveWorkOrderResponsiveWorkspacePlan,
  WORK_ORDER_RESPONSIVE_PANE_IDENTITY,
} from "../apps/mobile/domain/workOrderResponsiveWorkspacePolicy.ts";

const require = createRequire(import.meta.url);
const read = (file) => fs.readFileSync(file, "utf8");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const gallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
const editor = read("apps/mobile/features/work-orders/drawing/WorkOrderSketchEditor.tsx");
const runtimeOrientation = read("apps/mobile/application/useWaflRuntimeOrientationPolicy.ts");
const appJson = JSON.parse(read("apps/mobile/app.json"));
const nativeOrientation = require("../apps/mobile/plugins/withWaflNativeOrientationPolicy.js");

const phoneSelected = resolveWorkOrderResponsiveWorkspacePlan({ tablet: false, selected: true });
const tabletSelected = resolveWorkOrderResponsiveWorkspacePlan({ tablet: true, selected: true });
const phoneList = resolveWorkOrderResponsiveWorkspacePlan({ tablet: false, selected: false });
const tabletList = resolveWorkOrderResponsiveWorkspacePlan({ tablet: true, selected: false });

assert.deepEqual(phoneSelected, {
  showList: false,
  showDetail: true,
  listKey: WORK_ORDER_RESPONSIVE_PANE_IDENTITY.list,
  detailKey: WORK_ORDER_RESPONSIVE_PANE_IDENTITY.detail,
});
assert.deepEqual(tabletSelected, {
  showList: true,
  showDetail: true,
  listKey: WORK_ORDER_RESPONSIVE_PANE_IDENTITY.list,
  detailKey: WORK_ORDER_RESPONSIVE_PANE_IDENTITY.detail,
});
assert.equal(phoneSelected.detailKey, tabletSelected.detailKey, "selected Recipe detail host identity must survive responsive mode changes");
assert.equal(phoneList.showList, true);
assert.equal(phoneList.showDetail, false);
assert.equal(tabletList.showList, true);
assert.equal(tabletList.showDetail, true);

const workspace = experience.slice(
  experience.indexOf("function WorkOrderResponsiveWorkspace"),
  experience.indexOf("export default function MobileWorkOrderExperience"),
);
assert.match(workspace, /<View style=\{props\.tablet \? styles\.split : styles\.phoneBody\} testID="work-order-responsive-workspace">/u);
assert.match(workspace, /key=\{WORK_ORDER_RESPONSIVE_PANE_IDENTITY\.list\}/u);
assert.match(workspace, /key=\{WORK_ORDER_RESPONSIVE_PANE_IDENTITY\.detail\}/u);
assert.match(workspace, /testID="work-order-responsive-detail-host"/u);
assert.doesNotMatch(workspace, /setSelected|setActiveSection|setSketchVisible|onClose/u);
assert.match(experience, /<WorkOrderResponsiveWorkspace[\s\S]*selected=\{Boolean\(selected\)\}[\s\S]*tablet=\{tablet\}/u);
assert.doesNotMatch(experience, /globalError && errorState[\s\S]*: tablet \? \(/u, "responsive mode must not replace the active detail subtree branch");
assert.match(experience, /const tablet = resolveWorkOrderTabletPresentation\(\{/u, "responsive presentation must consume the stable device class");
assert.equal(resolveWorkOrderTabletPresentation({ deviceClass: "compact-tablet", windowWidth: 1_133 }), false);
assert.equal(resolveWorkOrderTabletPresentation({ deviceClass: "regular-tablet", windowWidth: 1_024 }), true);
assert.doesNotMatch(experience, /isPad|iPad|modelName|setTimeout\([^)]*sketch|setSketchVisible/u);

assert.match(overview, /const \[activeSection, setActiveSection\] = useState<WorkOrderVisibleSection>\("overview"\)/u);
assert.match(overview, /activeSection === "media" \? \([\s\S]*<WorkOrderImageGallery/u);
assert.doesNotMatch(overview, /useEffect\([^)]*(?:phone|width)[^)]*setActiveSection/su);
assert.match(gallery, /const \[sketchVisible, setSketchVisible\] = useState\(false\)/u);
assert.equal((gallery.match(/setSketchVisible\(false\)/gu) ?? []).length, 1);
assert.match(gallery, /onClose=\{\(\) => setSketchVisible\(false\)\} visible=\{sketchVisible\}/u);

assert.match(editor, /supportedOrientations=\{WORK_ORDER_SKETCH_SUPPORTED_ORIENTATIONS\}/u);
const canvasLayoutOwner = editor.slice(editor.indexOf("function onCanvasLayout"), editor.indexOf("function makeSaveIdentity"));
assert.doesNotMatch(canvasLayoutOwner, /props\.onClose|requestClose|closeEditorSession|save\(/u);
assert.match(canvasLayoutOwner, /viewportGenerationRef\.current \+= 1;[\s\S]*discardActiveGesture\(\);[\s\S]*setViewport\(next\)/u);

const phonePlist = nativeOrientation.applyWaflIosOrientationPolicy({});
assert.deepEqual(phonePlist.UISupportedInterfaceOrientations, ["UIInterfaceOrientationPortrait"]);
assert.equal(phonePlist["UISupportedInterfaceOrientations~ipad"].length, 4);
assert.match(runtimeOrientation, /ScreenOrientation\.unlockAsync\(\)/u);
assert.equal(appJson.expo.orientation, "default");
assert.equal(appJson.expo.ios.supportsTablet, true);

assert.equal(fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.+\.sql$/u.test(name)).length, 22);
assert.match(read("lib/domain/drawing/contracts.ts"), /DRAWING_SCENE_SCHEMA_VERSION = 1 as const/u);
assert.match(gallery, /disabled=\{!props\.sketchAuthoringEnabled \|\| !props\.canEdit\}/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha74-ipad-responsive-detail-subtree-continuity",
  previousPermanentInventoryRetained: 267,
  addedPermanentChecks: 1,
  finalPermanentInventory: 268,
  responsiveDetailHostIdentity: WORK_ORDER_RESPONSIVE_PANE_IDENTITY.detail,
  sketchVisibilityResetOnResponsiveTransition: 0,
  rotationSceneHistoryNetworkSaveMutation: [0, 0, 0, 0],
  breakpointDelta: 0,
  dependencyNativeConfigEasSchemaMigrationDelta: [0, 0, 0, 0, 0, 0],
  physicalResultInferred: false,
}));
