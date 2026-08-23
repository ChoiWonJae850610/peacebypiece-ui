#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const json = (path) => JSON.parse(read(path));

const viewer = read("apps/mobile/features/work-orders/documents/WaflAuthenticatedPdfViewer.tsx");
const workbench = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const transport = read("apps/mobile/features/work-orders/documents/authenticatedPdfTransport.ts");
const app = json("apps/mobile/app.json");
const pkg = json("apps/mobile/package.json");
const lock = json("apps/mobile/package-lock.json");
const eas = json("apps/mobile/eas.json");

assert.equal(pkg.dependencies["react-native-pdf"], "7.0.4");
assert.equal(pkg.dependencies["react-native-blob-util"], "0.24.7");
assert.equal(pkg.dependencies["react-native-webview"], undefined);
assert.equal(pkg.devDependencies["@config-plugins/react-native-pdf"], "13.0.0");
assert.equal(pkg.devDependencies["@config-plugins/react-native-blob-util"], "13.0.0");
assert.equal(lock.packages["node_modules/react-native-pdf"].version, "7.0.4");
assert.equal(lock.packages["node_modules/react-native-blob-util"].version, "0.24.7");
assert.ok(app.expo.plugins.includes("@config-plugins/react-native-blob-util"));
assert.ok(app.expo.plugins.includes("@config-plugins/react-native-pdf"));
assert.equal(eas.build.development.developmentClient, true);
assert.equal(eas.build.development.distribution, "internal");

assert.match(viewer, /from "react-native-pdf"/u);
assert.match(viewer, /SafeAreaView/u);
assert.match(viewer, /presentationStyle="fullScreen"/u);
assert.match(viewer, /onRequestClose=\{handleReturnToDocument\}/u);
assert.match(viewer, /returnToWorkOrderDocument\(onClose\)/u);
assert.match(viewer, /horizontal=\{false\}/u);
assert.match(viewer, /enableDoubleTapZoom/u);
assert.match(viewer, /maxScale=\{3\}/u);
assert.match(viewer, /onPageChanged/u);
assert.match(viewer, /accessibilityLabel="작업지시서 보기 닫기"/u);
assert.match(viewer, /WaflPrimaryActionButton/u);
assert.match(viewer, /authenticated-pdf-viewer-footer/u);
assert.doesNotMatch(viewer, /PdfRef|pdfRef\.current|\.setPage\(|accessibilityLabel="이전 페이지"|accessibilityLabel="다음 페이지"/u);
assert.match(viewer, /\$\{page\} \/ \$\{pageCount\}/u);
assert.match(viewer, /authenticated-pdf-viewer-retry/u);
assert.match(viewer, /file:\/\/\$\{state\.file\.path\}/u);
assert.doesNotMatch(viewer, /Linking|WebView|viewer-target|createDocumentShare|access-token/u);

assert.match(transport, /downloadAuthenticatedDocumentPdf/u);
assert.match(transport, /\/api\/v2\/work-orders\/documents\/\$\{encodeURIComponent\(input\.documentId\)\}\/file\?disposition=inline/u);
assert.match(transport, /Accept: "application\/pdf"/u);
assert.match(transport, /"Cache-Control": "no-store"/u);
assert.match(transport, /contentType\.includes\("application\/pdf"\)/u);
assert.match(transport, /stat\.size < 5/u);
assert.match(transport, /startsWith\("JVBERi0"\)/u);
assert.match(transport, /response\?\.flush\(\)/u);
assert.doesNotMatch(transport, /raw R2|storage_object_key|workspace[_-]?secret|[?&](?:token|secret)=/iu);

const openFunction = workbench.match(/function openInAppDocumentViewer\(\) \{[\s\S]*?\n  \}/u)?.[0] ?? "";
assert.match(openFunction, /setDocumentViewerOpen\(true\)/u);
assert.doesNotMatch(openFunction, /createDocumentShare|getDocumentViewerTarget|Linking\.openURL/u);
assert.match(workbench, /<WaflAuthenticatedPdfViewer/u);
assert.match(workbench, /generated\.inlineUrl/u);
assert.match(workbench, /label="공유"/u);
assert.match(workbench, /label="저장"/u);
assert.match(workbench, /prepareAuthenticatedDocumentPdfForSave/u);
assert.match(workbench, /url: `file:\/\/\$\{saveFile\.path\}`/u);
assert.doesNotMatch(workbench, /Linking\.openURL/u);
assert.match(workbench, /createDocumentShare/u, "Share keeps public /v token creation");

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha67-native-inapp-pdf-viewer",
  rendererOwner: "react-native-pdf",
  authenticatedTransport: "workspace-internal-file",
  safariFallback: false,
  publicTokenForView: false,
  previousPermanentInventoryRetained: 168,
  addedPermanentChecks: 1,
  finalPermanentInventory: 169,
  physicalResultInferred: false,
}));
