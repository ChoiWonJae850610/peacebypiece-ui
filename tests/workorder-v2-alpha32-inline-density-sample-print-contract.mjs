#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const inline = read("apps/mobile/components/InlineEditableFields.tsx");
const typography = read("apps/mobile/constants/compactFieldTypography.ts");
const mobile = read("apps/mobile/components/ProductionCardMock.tsx");
const mobileProcess = read("apps/mobile/utils/processInstruction.ts");
const mock = read("apps/mobile/constants/mockProductionCard.ts");
const renderer = read("components/workorder/preview/IssuedWorkOrderDocument.tsx");
const previewProcess = read("components/workorder/preview/processInstruction.ts");
const loader = read("components/workorder/preview/IssuedWorkOrderPreview.tsx");
const currentUserProvider = read("components/auth/CurrentUserProvider.tsx");
const sampleComponent = read("components/workorder/preview/SampleIssuedWorkOrderPreview.tsx");
const sample = read("lib/internal/samples/issuedWorkOrderPreviewSample.ts");
const samplePage = read("app/dev/workorder-preview-sample/page.tsx");
const css = read("components/workorder/preview/IssuedWorkOrderPreview.module.css");
const svg = read("public/dev-samples/linen-round-dress-sketch.svg");
const migration = read("db/v2/migrations/009_v2_workorder_factory_instruction_fields.sql");
const commands = read("lib/domain/work-orders/contracts/commands.ts");
const models = read("lib/domain/work-orders/contracts/read-models.ts");
const previewRepository = read("lib/domain/work-orders/read/previewRepository.ts");

const currentVersion = read("lib/constants/version.ts").match(/APP_VERSION\s*=\s*"([^"]+)"/)?.[1];
assert.ok(["2.0.0-alpha.38", "2.0.0-alpha.39"].includes(currentVersion));
assert.match(read("apps/mobile/constants/version.ts"), new RegExp(currentVersion.replaceAll(".", "\\.")));
assert.equal(JSON.parse(read("apps/mobile/app.json")).expo.version, currentVersion);

for (const name of ["COMPACT_FIELD_LABEL_TEXT", "COMPACT_FIELD_VALUE_TEXT", "COMPACT_FIELD_ROW_HEIGHT"]) {
  assert.match(typography, new RegExp(`export const ${name}`));
  assert.match(`${inline}\n${mobile}`, new RegExp(name));
}
for (const token of ["fontSize: 12", "lineHeight: 17", "letterSpacing: 0", "fontWeight: \"800\""]) assert.match(typography, new RegExp(token));
for (const label of ["사용 부위", "메모", "작업 메모"]) assert.match(mobile, new RegExp(`label=\"${label}\"`));
assert.equal((mobile.match(/label="사용 부위"/g) ?? []).length, 1);
assert.equal((mobile.match(/label="메모"/g) ?? []).length, 1);
assert.equal((mobile.match(/label="작업 메모"/g) ?? []).length, 1);
assert.doesNotMatch(mobile, /label="적용 부위"|label="적용 색상·대상"|ExpandableInlineNote/);
assert.doesNotMatch(inline, /ExpandableInlineNote|noteEditingRow|noteInput|minHeight|textAlignVertical/);
assert.doesNotMatch(inline, /multiline(?:\s|=)(?!\{false\})/);
assert.match(inline, /multiline=\{false\}/);
assert.match(inline, /numberOfLines=\{1\}/);
assert.match(inline, /height: COMPACT_FIELD_ROW_HEIGHT/);
assert.match(inline, /cancelledRef\.current = true[\s\S]*completedRef\.current = true/);
assert.match(inline, /if \(cancelledRef\.current \|\| completedRef\.current\) return/);
assert.match(inline, /if \(nextValue !== value\)/);
assert.match(inline, /props\.onCommit\?\.\(nextValue\)/);
assert.match(inline, /if \(!props\.editable\) return <ReadOnlyInlineValue/);

for (const formatter of [mobileProcess, previewProcess]) {
  assert.match(formatter, /적용 부위:/);
  assert.match(formatter, /적용 대상:/);
  assert.match(formatter, /\.join\(" \/ "\)/);
  assert.doesNotMatch(formatter, /fetch\(|POST|PATCH|PUT|DELETE|write-back/i);
}
assert.match(mobile, /value=\{formatProcessInstruction\(row\)\}/);
assert.match(mock, /applicationArea\?: string/);
assert.match(mock, /applicationColorTarget\?: string/);

const processHeader = renderer.match(/<table className=\{styles\.processTable\}[\s\S]*?<\/thead>/)?.[0] ?? "";
for (const heading of ["순서", "공정명", "업체", "수량", "납기", "작업 메모"]) assert.ok(processHeader.includes(`<th>${heading}</th>`), `process heading missing ${heading}`);
assert.equal((processHeader.match(/<th>/g) ?? []).length, 6);
assert.doesNotMatch(processHeader, /적용 부위|적용 색상|적용 대상/);
assert.match(renderer, /formatProcessInstruction\(process\)/);
assert.match(css, /\.processTable col:nth-child\(6\)/);
assert.match(css, /section\[aria-label="Notifications alt\+T"\][\s\S]*?#wafl-modal-portal-root[\s\S]*?next-route-announcer[\s\S]*?display: none !important/);
assert.match(css, /@page cover \{ size: A4 landscape/);
assert.match(css, /@page content \{ size: A4 portrait/);
assert.match(css, /thead \{ display: table-header-group/);
assert.match(css, /tr \{ break-inside: avoid/);

for (const field of ["application_area", "application_color_target"]) assert.match(migration, new RegExp(field));
for (const field of ["applicationArea", "applicationColorTarget"]) assert.match(`${commands}\n${models}`, new RegExp(field));
assert.match(previewRepository, /application_area/);
assert.match(previewRepository, /application_color_target/);
assert.doesNotMatch(`${mobileProcess}\n${previewProcess}`, /INSERT|UPDATE|mutation|repository/i);

for (const token of [
  "리넨 라운드 셔츠 원피스",
  "여성 원피스 / 여름 1차 생산",
  "WAFN-26FW-O-LNDRS-260713-001-R0",
  "2026-08-15",
  "성수 어패럴",
  "김생산",
  "동대문 패브릭랩",
  "서울 안감상사",
  "천연 자개 단추",
  "케어라벨",
  "행택끈",
  "플리백",
  "총장",
  "어깨너비",
  "가슴 단면",
  "소매길이",
  "밑단단면",
  "재단",
  "봉제",
  "워싱",
  "검품·포장",
]) assert.ok(`${sample}\n${sampleComponent}`.includes(token), `sample missing ${token}`);
for (const triplet of ["[0, 0, 8]", "[0, 1, 16]", "[0, 2, 8]", "[1, 0, 12]", "[1, 1, 24]", "[1, 2, 12]", "[2, 0, 16]", "[2, 1, 32]", "[2, 2, 16]"]) assert.ok(sample.includes(triplet));
assert.match(sample, /matrixTotal: "144"/);
assert.match(sample, /expectedTotal: "144"/);
assert.match(sample, /totalsMatch: true/);
for (const token of ["앞면", "뒷면", "IVORY", "NAVY", "BLACK", "실무형 제품 도식", "앞여밈", "허리 스트링", "소매 커프스"]) assert.ok(svg.includes(token), `sample SVG missing ${token}`);
assert.doesNotMatch(svg, /DEV SAMPLE|A4 PREVIEW SAMPLE/);
assert.doesNotMatch(svg, /(?:href|src)=["']https?:\/\//i);
assert.match(samplePage, /assertLocalOnlyRouteHost\(\)/);
assert.doesNotMatch(`${sample}\n${samplePage}\n${sampleComponent}`, /fetch\(|\/api\/v2|DATABASE_URL|storageObjectKey|tokenHash|rawToken/);
assert.doesNotMatch(loader, /issuedWorkOrderPreviewSample|sampleCoverFacts|dev-samples/);
assert.match(currentUserProvider, /CURRENT_USER_FETCH_DISABLED_PATHS = new Set\(\["\/dev\/workorder-preview-sample"\]\)/);
assert.match(currentUserProvider, /if \(currentUserFetchDisabled\)[\s\S]*?return null;/);

console.log("workorder v2 alpha.32 inline density and sample print contract: PASS");
