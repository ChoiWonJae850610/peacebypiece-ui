#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const docs = Array.from({ length: 12 }, (_, index) => {
  const number = String(index + 12).padStart(2, "0");
  const match = fs.readdirSync(path.join(root, "docs/project/app-v2")).find((name) => name.startsWith(`${number}-`) && name.endsWith(".md"));
  assert.ok(match, `missing app-v2 document ${number}`);
  return path.join(root, "docs/project/app-v2", match);
});

for (const file of docs) {
  const source = fs.readFileSync(file, "utf8");
  const mermaidFences = source.match(/```mermaid\s*[\s\S]*?```/g) ?? [];
  const openingFences = source.match(/```mermaid/g) ?? [];
  assert.equal(mermaidFences.length, openingFences.length, `${path.basename(file)} has an unclosed Mermaid fence`);
  for (const block of mermaidFences) {
    assert.match(block, /\b(erDiagram|flowchart|sequenceDiagram|stateDiagram|classDiagram|graph)\b/, `${path.basename(file)} has an unsupported or empty Mermaid block`);
  }

  for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const rawTarget = match[1].trim().replace(/^<|>$/g, "");
    if (!rawTarget || rawTarget.startsWith("#") || /^(https?:|mailto:)/i.test(rawTarget)) continue;
    const filePart = decodeURIComponent(rawTarget.split("#", 1)[0]);
    const resolved = path.resolve(path.dirname(file), filePart);
    assert.ok(fs.existsSync(resolved), `${path.basename(file)} has a broken local link: ${rawTarget}`);
  }
}

for (const [file, token] of [
  ["AGENTS.md", "20-workorder-list-read-api-evidence.md"],
  ["AGENTS.md", "21-workorder-detail-lazy-read-api-evidence.md"],
  ["AGENTS.md", "22-workorder-create-basic-update-command-evidence.md"],
  ["AGENTS.md", "23-workorder-material-order-command-evidence.md"],
  ["docs/project/app-v2/00-start-here.md", "20-workorder-list-read-api-evidence.md"],
  ["docs/project/app-v2/00-start-here.md", "21-workorder-detail-lazy-read-api-evidence.md"],
  ["docs/project/app-v2/00-start-here.md", "22-workorder-create-basic-update-command-evidence.md"],
  ["docs/project/app-v2/00-start-here.md", "23-workorder-material-order-command-evidence.md"],
  ["docs/project/app-v2/08-roadmap-2.0.md", "2.0.0-alpha.23"],
  ["docs/codex-current-state.md", "# 2.0.0-alpha.23"],
  ["docs/codex-current-state.md", "# 2.0.0-alpha.24"],
  ["docs/codex-current-state.md", "# 2.0.0-alpha.26"],
]) {
  assert.ok(fs.readFileSync(path.join(root, file), "utf8").includes(token), `${file} missing ${token}`);
}

console.log("app-v2 document links and Mermaid contract: PASS");
