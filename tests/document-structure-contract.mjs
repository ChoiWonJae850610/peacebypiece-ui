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

assertIncludes("lib/constants/version.ts", "APP_VERSION = ");
assertIncludes("lib/internal/roadmap/index.ts", "currentWorkVersion:");
assertIncludes("lib/internal/roadmap/index.ts", "nextWorkVersion:");
assertIncludes("docs/codex-current-state.md", "Current version:");
assertIncludes("docs/productization-roadmap.md", "Active baseline:");

assertIncludes("README.md", "docs/현재기준/document-management.md");
assertIncludes("README.md", "Vercel 배포본은 고객 운영이 아니라");

assertIncludes("docs/README.md", "docs/현재기준/document-management.md");
assertIncludes("docs/README.md", "document-structure-cleanup-0.24.13.md");
assertIncludes("docs/README.md", "Codex 검색 정책");


assertIncludes("docs/audits/document-structure-cleanup-0.24.13.md", "대량 문서 이동을 하지 않는다");
assertIncludes("docs/audits/document-structure-cleanup-0.24.13.md", "0.24.14");

assertIncludes("docs/productization-roadmap.md", "0.24.14");

assertIncludes("lib/internal/roadmap/roadmap-0.24.13.ts", 'status: "verification_pending"');
assertIncludes("lib/internal/roadmap/roadmap-0.24.13.ts", "document-structure-contract");

assertNotIncludes("lib/internal/roadmap/roadmap-0.24.13.ts", '"APP_VERSION 변경"');

console.log("document-structure-contract PASS");
