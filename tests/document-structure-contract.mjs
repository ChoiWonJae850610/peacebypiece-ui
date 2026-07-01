#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assertIncludes(file, needle) {
  const text = read(file);
  if (!text.includes(needle)) {
    throw new Error(`${file} must include ${needle}`);
  }
}

function assertNotIncludes(file, needle) {
  const text = read(file);
  if (text.includes(needle)) {
    throw new Error(`${file} must not include ${needle}`);
  }
}

assertIncludes("lib/constants/version.ts", 'APP_VERSION = "0.24.30"');
assertIncludes("lib/internal/roadmap/index.ts", 'currentWorkVersion: "0.24.30"');
assertIncludes("lib/internal/roadmap/index.ts", 'nextWorkVersion: "0.24.31"');
assertIncludes("docs/codex-current-state.md", "Current version: `0.24.30`");
assertIncludes("docs/productization-roadmap.md", "Active baseline: `0.24.30`");

assertIncludes("README.md", "docs/qa/0.24.29-integrated-productization-checkpoint.md");
assertIncludes("README.md", "Vercel 배포본은 고객 운영 환경일 수 있으므로");
assertIncludes("docs/README.md", "docs/qa/0.24.29-integrated-productization-checkpoint.md");
assertIncludes("docs/README.md", "최종 정책 기준");
assertIncludes("docs/qa/0.24.29-integrated-productization-checkpoint.md", "PENDING_USER_QA");

assertIncludes("docs/audits/document-structure-cleanup-0.24.13.md", "0.24.14");
assertIncludes("lib/internal/roadmap/roadmap-0.24.30.ts", "Storage Capacity Profiles");

for (const file of ["README.md", "docs/README.md", "docs/codex-current-state.md", "docs/productization-roadmap.md"]) {
  assertNotIncludes(file, "?袁⑹삺");
  assertNotIncludes(file, "筌ㅼ뮇伊");
  assertNotIncludes(file, "甕곌쑴");
}

console.log("document-structure-contract PASS");
