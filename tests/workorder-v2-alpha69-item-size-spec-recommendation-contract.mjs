import assert from "node:assert/strict";

import {
  listWaflAllSystemSizeLabels,
  resolveWaflRecommendedSizeLabels,
  resolveWaflRecommendedSpecCodes,
  resolveWaflSizeRecommendationSections,
  resolveWaflSpecRecommendationSections,
} from "../lib/domain/work-orders/catalog/workOrderSizeSpecRecommendationPolicy.mjs";
import { workOrderDetailItemOptions } from "../lib/domain/work-orders/catalog/workOrderOverviewPickerPolicy.ts";
import { listWaflSystemSpecItems } from "../lib/domain/work-orders/catalog/systemSpecItemCatalog.ts";
import { getWaflBasicSpecTemplate, projectWaflBasicSpecValues } from "../lib/domain/work-orders/measurement/waflBasicSpecV1.ts";
import { resolveSizeChooserCatalogSections } from "../apps/mobile/domain/sizeColorStructurePolicy.ts";
import { createSpecItemCandidates, partitionSpecItemCandidatesByRecommendation } from "../apps/mobile/domain/specItemSelectionPolicy.ts";
import { diffStagedStructureSelection, structureSelectionKey } from "../apps/mobile/domain/sizeColorSelectionBatchPolicy.ts";

const DETAILS = { T: ["티셔츠", "셔츠", "블라우스", "니트", "맨투맨", "후드", "탑·나시", "폴로"], B: ["팬츠", "슬랙스", "데님", "쇼츠", "스커트", "레깅스"], O: ["재킷", "코트", "점퍼", "패딩", "가디건", "베스트"], D: ["원피스", "점프수트", "셔츠원피스", "니트원피스"] };
for (const [category, details] of Object.entries(DETAILS)) {
  assert.deepEqual(workOrderDetailItemOptions(category), details);
  for (const detail of details) {
    assert.ok(resolveWaflRecommendedSpecCodes(category, detail).length > 0, `${category}/${detail} POM coverage`);
  }
}

const allSizes = listWaflAllSystemSizeLabels();
assert.equal(new Set(allSizes).size, allSizes.length);
assert.deepEqual(allSizes.slice(-13), ["24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36"]);
assert.deepEqual(resolveWaflRecommendedSizeLabels("여성", "T"), ["44", "55", "66", "77", "2XL", "FREE"]);
assert.deepEqual(resolveWaflRecommendedSizeLabels("남성", "B"), ["28", "30", "32", "34", "36", "FREE"]);
assert.deepEqual(resolveWaflRecommendedSizeLabels("공용", "T"), []);

for (const [category, details] of Object.entries(DETAILS)) {
  const catalogCodes = new Set(listWaflSystemSpecItems(category).map((item) => item.code));
  for (const detail of details) {
    const codes = resolveWaflRecommendedSpecCodes(category, detail);
    assert.equal(new Set(codes).size, codes.length, `${category}/${detail} duplicate POM`);
    assert.deepEqual(codes.filter((code) => !catalogCodes.has(code)), [], `${category}/${detail} missing catalog POM`);
  }
}

assert.deepEqual(resolveWaflRecommendedSpecCodes("T", "티셔츠"), ["body_length", "shoulder_width", "chest_width", "hem_width", "armhole_depth", "sleeve_length", "upper_arm_width", "cuff_width", "neck_width"]);
assert.ok(resolveWaflRecommendedSpecCodes("T", "셔츠").includes("collar_width"));
assert.ok(resolveWaflRecommendedSpecCodes("T", "셔츠").includes("front_placket_width"));
assert.deepEqual(resolveWaflRecommendedSpecCodes("T", "후드").slice(-2), ["hood_height", "hood_width"]);
assert.deepEqual(resolveWaflRecommendedSpecCodes("B", "데님"), ["body_length", "waist_width", "hip_width", "front_rise", "back_rise", "thigh_width", "knee_width", "hem_width", "inseam", "waistband_height"]);
assert.deepEqual(resolveWaflRecommendedSpecCodes("B", "스커트"), ["body_length", "waist_width", "hip_width", "hem_width"]);
assert.ok(resolveWaflRecommendedSpecCodes("O", "재킷").includes("lapel_width"));
assert.ok(resolveWaflRecommendedSpecCodes("O", "재킷").includes("vent_length"));
assert.equal(resolveWaflRecommendedSpecCodes("O", "점퍼").at(-1), "zipper_length");

const denimSizeSections = resolveWaflSizeRecommendationSections("남성", "B");
assert.equal(denimSizeSections.recommended.some((label) => denimSizeSections.additional.includes(label)), false);
assert.ok(["44", "55", "66", "77", "88"].every((label) => denimSizeSections.additional.includes(label)));
const sizeChooser = resolveSizeChooserCatalogSections({ targetAudience: "남성", categoryCode: "B", currentLabels: ["26", "CUSTOM"], companyLabels: ["회사 1"] });
assert.deepEqual(sizeChooser.current, ["CUSTOM"]);
assert.ok(sizeChooser.additional.includes("44"));
const sizeDiff = diffStagedStructureSelection({
  existing: [{ id: "existing-custom", displayName: "CUSTOM", hexValue: null }],
  candidates: [...allSizes, "회사 1", "CUSTOM"].map((displayName) => ({ displayName, hexValue: null })),
  selectedKeys: [structureSelectionKey("CUSTOM"), structureSelectionKey("26")],
});
assert.deepEqual(sizeDiff.additions, [{ displayName: "26", hexValue: null }]);
assert.deepEqual(sizeDiff.deletionIds, []);

const tShirtSpecSections = resolveWaflSpecRecommendationSections("T", "티셔츠", listWaflSystemSpecItems("T"));
assert.equal(tShirtSpecSections.recommended.some((item) => tShirtSpecSections.additional.some((extra) => extra.key === item.key)), false);
const fakeCompany = { id: "00000000-0000-4000-8000-000000000001", kind: "spec_item", displayName: "회사 스펙", hexValue: null, categoryCode: "T", active: true };
const fakeCurrent = { id: "00000000-0000-4000-8000-000000000002", code: "legacy:custom", displayName: "기존 스펙", measurementType: "length", instruction: null, displayOrder: 0 };
const candidates = createSpecItemCandidates([fakeCurrent], [fakeCompany], listWaflSystemSpecItems("T"));
const candidateSections = partitionSpecItemCandidatesByRecommendation(candidates, tShirtSpecSections.recommended.map((item) => item.key));
assert.deepEqual(candidateSections.recommended.map((item) => item.systemSpecItemKey), tShirtSpecSections.recommended.map((item) => item.key));
assert.equal(candidateSections.recommended.some((item) => candidateSections.additional.some((extra) => extra.key === item.key)), false);
assert.equal(candidateSections.company.length, 1);
assert.equal(candidateSections.current.length, 1);

const denimTemplate = getWaflBasicSpecTemplate("B", "데님", "남성");
assert.equal(denimTemplate.name, "WAFL 추천 남성 하의 스펙");
assert.equal(denimTemplate.poms.some((pom) => pom.code === "waistband_height"), false);
assert.equal(Object.hasOwn(denimTemplate.valuesCm, "26"), true);
assert.equal(projectWaflBasicSpecValues(denimTemplate, ["26"])?.["26"]?.["허리단면"], 35);
assert.equal(projectWaflBasicSpecValues(denimTemplate, ["M"]).M, undefined);
for (const values of Object.values(denimTemplate.valuesCm)) {
  assert.deepEqual(Object.keys(values).filter((name) => !denimTemplate.poms.some((pom) => pom.name === name)), []);
}
assert.equal(getWaflBasicSpecTemplate("T", "티셔츠", "여성").name, "WAFL 추천 여성 상의 스펙");
assert.equal(getWaflBasicSpecTemplate("T", "후드", "여성").id, getWaflBasicSpecTemplate("T", "티셔츠", "여성").id);
assert.equal(getWaflBasicSpecTemplate("T", "unknown").name, "WAFL 기본 상의 스펙");

console.log("alpha69 item-aware POM guidance plus target-major Size/template policy: PASS");
