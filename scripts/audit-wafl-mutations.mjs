import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SOURCE_ROOTS = ["app", "components", "features", "lib"];
const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const STRICT = process.argv.includes("--strict");

const categories = [
  {
    key: "event_void_mutation",
    label: "이벤트 경계의 void 비동기 호출",
    severity: "review",
    pattern: /(?:onClick|onSubmit|onChange|onValueChange|onUpload|onDelete)\s*=\s*\{[^\n}]*\bvoid\s+[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)?\s*\(/g,
    note: "이벤트 경계에서 오류를 내부 처리하는 함수라면 허용 가능하지만, 저장 Promise가 소비되는지 확인해야 합니다.",
  },
  {
    key: "effect_void_load",
    label: "effect/초기화 경계의 void 호출",
    severity: "info",
    pattern: /\bvoid\s+[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)?\s*\(/g,
    note: "초기 조회에는 정상 패턴일 수 있습니다. mutation과 query를 구분해 검토합니다.",
  },
  {
    key: "promise_then_chain",
    label: ".then() 기반 비동기 체인",
    severity: "review",
    pattern: /\.then\s*\(/g,
    note: "사용자 저장 경로라면 await + 공통 mutation lifecycle 전환 후보입니다.",
  },
  {
    key: "direct_fetch_mutation",
    label: "직접 fetch mutation 후보",
    severity: "review",
    pattern: /fetch\s*\([^)]*\{[\s\S]{0,500}?method\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/g,
    note: "공통 API adapter, lock, toast, rollback 적용 여부를 확인합니다.",
  },
  {
    key: "full_entity_cast",
    label: "부분 응답의 전체 엔터티 캐스팅 후보",
    severity: "high",
    pattern: /\bas\s+(?:WorkOrder|MaterialOrder)(?:\[\])?\b/g,
    note: "부분 PATCH 응답을 전체 엔터티로 취급하면 데이터 소실 위험이 있습니다.",
  },
];

async function walk(relativeDir) {
  const absoluteDir = path.join(ROOT, relativeDir);
  const entries = await readdir(absoluteDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.join(relativeDir, entry.name).replaceAll(path.sep, "/");
    if (entry.isDirectory()) files.push(...await walk(relativePath));
    else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) files.push(relativePath);
  }
  return files;
}

function lineNumberAt(content, index) {
  return content.slice(0, index).split("\n").length;
}

const files = (await Promise.all(SOURCE_ROOTS.map(async (root) => {
  try { return await walk(root); } catch { return []; }
}))).flat();

const findings = [];
for (const file of files) {
  const content = await readFile(path.join(ROOT, file), "utf8");
  for (const category of categories) {
    category.pattern.lastIndex = 0;
    let match;
    while ((match = category.pattern.exec(content)) !== null) {
      findings.push({
        key: category.key,
        label: category.label,
        severity: category.severity,
        note: category.note,
        file,
        line: lineNumberAt(content, match.index),
        sample: match[0].replace(/\s+/g, " ").slice(0, 160),
      });
      if (match.index === category.pattern.lastIndex) category.pattern.lastIndex += 1;
    }
  }
}

const grouped = new Map();
for (const category of categories) grouped.set(category.key, []);
for (const finding of findings) grouped.get(finding.key)?.push(finding);

console.log(`WAFL mutation audit scanned ${files.length} source files.`);
for (const category of categories) {
  const items = grouped.get(category.key) ?? [];
  console.log(`\n[${category.severity.toUpperCase()}] ${category.label}: ${items.length}`);
  console.log(`- ${category.note}`);
  for (const item of items.slice(0, 30)) {
    console.log(`- ${item.file}:${item.line} :: ${item.sample}`);
  }
  if (items.length > 30) console.log(`- ... ${items.length - 30} more`);
}

const highRisk = findings.filter((finding) => finding.severity === "high");
if (STRICT && highRisk.length > 0) {
  console.error(`\nWAFL mutation strict audit failed: ${highRisk.length} high-risk finding(s).`);
  process.exit(1);
}

console.log(`\nWAFL mutation audit completed: ${findings.length} finding(s), ${highRisk.length} high-risk.`);
