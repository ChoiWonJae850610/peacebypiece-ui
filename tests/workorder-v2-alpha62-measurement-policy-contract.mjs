#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  composeInchMeasurement,
  decomposeInchMeasurement,
  formatMeasurementFromCm,
  inchEighthOptions,
  isMeasurementSnapshotModified,
  normalizeCentimeterDraft,
  parseMeasurementToCm,
} from "../apps/mobile/domain/measurementPolicy.ts";

const sharedSource = fs.readFileSync("apps/mobile/domain/measurementPolicy.ts", "utf8");
const serverBridge = fs.readFileSync("lib/domain/work-orders/measurement/measurementPolicy.ts", "utf8");
for (const token of ["parseMeasurementToCm", "formatMeasurementFromCm", "CM_PER_INCH", "INCH_EIGHTH_FRACTIONS", "centimeters"]) assert.match(sharedSource, new RegExp(token));
assert.match(serverBridge, /from "@\/apps\/mobile\/domain\/measurementPolicy"/);
for (const token of ["parseMeasurementToCm", "formatMeasurementFromCm", "isMeasurementSnapshotModified", "normalizeCentimeterDraft"]) assert.ok(serverBridge.includes(token), `server bridge missing ${token}`);
assert.equal(normalizeCentimeterDraft("-40,125abc.9"), "40.1259");
assert.equal(parseMeasurementToCm("40.125", "cm")?.centimeters, 40.125);
assert.equal(parseMeasurementToCm("40.1250", "cm")?.centimeters, 40.125);
assert.equal(parseMeasurementToCm("-1", "cm"), null);
assert.equal(parseMeasurementToCm("1e3", "cm"), null);
assert.equal(parseMeasurementToCm("1000.0001", "cm"), null);
assert.equal(formatMeasurementFromCm(40.125, "cm"), "40.125");
assert.equal(composeInchMeasurement("40", "1/8"), "40 1/8");
assert.deepEqual(decomposeInchMeasurement("40 1/8"), { integerPart: "40", fractionPart: "1/8" });
assert.deepEqual(inchEighthOptions().map((option) => option.label), ["없음", "1/8", "1/4", "3/8", "1/2", "5/8", "3/4", "7/8"]);
assert.equal(isMeasurementSnapshotModified({ sourceTemplateId: "t", sourceTemplateVersion: 2, sourceApplyEntityVersion: 10, latestContentEntityVersion: 10 }), false);
assert.equal(isMeasurementSnapshotModified({ sourceTemplateId: "t", sourceTemplateVersion: 2, sourceApplyEntityVersion: 10, latestContentEntityVersion: 11 }), true);
console.log("workorder v2 alpha.62 measurement pure shared policy contract: PASS");
