#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const paths = {
  entry: "docs/project/app-v2/09-codex-working-rules.md",
  lifecycle: "docs/project/app-v2/09a-codex-execution-lifecycle.md",
  safety: "docs/project/app-v2/09b-codex-runtime-data-pc-safety.md",
  testing: "docs/project/app-v2/09c-codex-testing-contracts-handoff.md",
  finalization: "docs/project/app-v2/09d-codex-version-delta-finalization.md",
  template: "docs/project/app-v2/09e-codex-version-delta-template.md",
};

for (const file of Object.values(paths)) {
  assert.ok(fs.existsSync(path.join(root, file)), `missing canonical rule document: ${file}`);
}

const entry = read(paths.entry);
const lifecycle = read(paths.lifecycle);
const safety = read(paths.safety);
const testing = read(paths.testing);
const finalization = read(paths.finalization);
const template = read(paths.template);
const agents = read("AGENTS.md");
const start = read("docs/project/app-v2/00-start-here.md");
const roadmap = read("docs/project/app-v2/08-roadmap-2.0.md");
const verifySafe = read("tools/pipeline/verify-safe.ps1");

for (const token of [
  "Permanent Rules Entry Point",
  "Authority and required read order",
  "Permanent Rules responsibility map",
  "Task classification",
  "SELF-EXECUTING HANDOFF",
]) {
  assert.ok(entry.includes(token), `entry point missing semantic token: ${token}`);
}

for (const child of [
  "09a-codex-execution-lifecycle.md",
  "09b-codex-runtime-data-pc-safety.md",
  "09c-codex-testing-contracts-handoff.md",
  "09d-codex-version-delta-finalization.md",
  "09e-codex-version-delta-template.md",
]) {
  assert.ok(entry.includes(`(${child})`), `entry point missing child link: ${child}`);
  assert.ok(fs.existsSync(path.resolve(path.dirname(path.join(root, paths.entry)), child)), `broken child link: ${child}`);
}

for (const source of [agents, start]) {
  assert.ok(source.includes("09-codex-working-rules.md"), "core routing must include the Permanent Rules entry point");
  assert.match(source, /09a.*09d/s, "core routing must require the 09a through 09d read set");
}

for (const token of [
  "Start-of-work preflight",
  "Standard lifecycle",
  "Static and Canonical verification",
  "Runtime decision and QA",
  "Completion",
]) {
  assert.ok(lifecycle.includes(token), `execution lifecycle missing ${token}`);
}

for (const token of [
  "canonical runner",
  "Process ownership and safe stop",
  "Mutation baseline and effect accounting",
  "Mandatory PC Resource and Remote-Operation Audit",
  "Temperature: unavailable with approved read-only tooling",
  "PC_RESOURCE_OR_REMOTE_OPERATION_RISK_HANDOFF_REQUIRED",
]) {
  assert.ok(safety.includes(token), `runtime/data/PC safety missing ${token}`);
}

for (const token of [
  "Behavior and public contract first",
  "Historical and current contracts",
  "source-location assertion",
  "wafl-v2-current-version.mjs",
  "Node-only contracts",
  "alias-free pure module",
  "Failure Handoff",
]) {
  assert.ok(testing.includes(token), `testing/handoff owner missing ${token}`);
}
assert.doesNotMatch(testing, /current version is `?2\.0\.0-alpha\.\d+/i, "testing rules must not freeze the current alpha literal");

for (const token of [
  "Self-executing Version Delta",
  "Git delivery",
  "Product version artifacts",
  "Documentation-only maintenance",
  "do not create, replace, or overwrite an artifact with the same APP_VERSION",
]) {
  assert.ok(finalization.includes(token), `Version Delta/finalization owner missing ${token}`);
}

for (const token of [
  "SELF-EXECUTING HANDOFF",
  "Canonical rules",
  "Baseline",
  "Target",
  "Approved scope",
  "Explicit exclusions",
  "Data and effects",
  "Verification",
  "Physical-device QA",
  "Completion",
  "Current remediation, if any",
  "New failure",
]) {
  assert.ok(template.includes(token), `concise Version Delta template missing ${token}`);
}
assert.ok(template.split(/\r?\n/).length < 100, "Version Delta template must remain concise");
assert.doesNotMatch(template, /CPU 3회|StartTime\/CreationDate|Failure Handoff records:/, "template must link generic mechanics instead of copying them");

assert.ok(roadmap.includes("09e-codex-version-delta-template.md"), "roadmap must route future Deltas to the concise template");
assert.ok(roadmap.includes("SELF-EXECUTING HANDOFF"), "roadmap must declare self-executing handoff semantics");
assert.ok(
  verifySafe.includes("tests/wafl-codex-working-rules-normalization-contract.mjs"),
  "Canonical Verify must register the working-rules normalization contract",
);

console.log("WAFL Codex working rules normalization contract: PASS");
