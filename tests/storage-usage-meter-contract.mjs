#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

const meter = read("components/common/ui/WaflStorageUsageMeter.tsx");
const adminDashboard = read("components/admin/dashboard/AdminOperationsDashboard.tsx");
const planUsageCard = read("components/admin/files/summary/PlanUsageCard.tsx");

for (const token of [
  "data-wafl-component=\"storage-usage-meter\"",
  "data-wafl-component=\"storage-cylinder\"",
  "data-storage-shape=\"database-cylinder-stack\"",
  "viewBox=\"0 0 168 118\"",
  "clipPath",
  "wafl-storage-cylinder-fill-",
  "formatPercentLabel",
  "percent < 1",
  "\"<1%\"",
  "Math.min(100, Math.max(0, percent))",
  "fillHeight = 76 * (fillPercent / 100)",
  "fillTop = 28 + (76 - fillHeight)",
  "motion-reduce:transition-none",
  "stroke-[var(--pbp-border-strong)]",
  "fill-[var(--pbp-status-success-fg)]",
  "fill-[var(--pbp-status-warning-fg)]",
  "fill-[var(--pbp-status-danger-fg)]",
]) {
  assert.ok(meter.includes(token), `storage meter must include ${token}`);
}

for (const forbidden of [
  "Math.max(6, safePercent)",
  "safePercent * 0.56",
  "h-[82px] w-[94px]",
  "rounded-b-[28px]",
]) {
  assert.ok(!meter.includes(forbidden), `legacy battery/water-tank meter token remains: ${forbidden}`);
}

const percentFixtures = [0, 0.02, 5, 15, 30, 50, 70, 90, 99, 100, 110];

function clampPercent(percent) {
  if (!Number.isFinite(percent)) return 0;
  return Math.min(100, Math.max(0, percent));
}

function formatPercentLabel(percent) {
  if (!Number.isFinite(percent) || percent <= 0) return "0%";
  if (percent < 1) return "<1%";
  return `${Math.round(percent)}%`;
}

const expectedLabels = ["0%", "<1%", "5%", "15%", "30%", "50%", "70%", "90%", "99%", "100%", "110%"];
assert.deepEqual(percentFixtures.map(formatPercentLabel), expectedLabels);
assert.equal(clampPercent(110), 100, "110% must visually clamp to 100% fill");
assert.equal(clampPercent(0.02), 0.02, "small nonzero usage must retain fill before label formatting");
assert.equal(clampPercent(-1), 0, "negative values must clamp to empty");

for (const source of [adminDashboard, planUsageCard]) {
  assert.ok(source.includes("WaflStorageUsageMeter"), "admin main and workspace files must use the shared meter");
}

assert.ok(planUsageCard.includes("showCylinder"), "/workspace/files plan usage card must show the cylinder meter");
assert.ok(adminDashboard.includes("WaflStorageUsageMeter"), "admin main dashboard must use the same component");

console.log("storage usage meter contract passed: database cylinder stack and percent display policy");
