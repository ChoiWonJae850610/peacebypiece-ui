import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const clientPath = path.join(root, "app/functions/FunctionsCatalogClient.tsx");
const source = fs.readFileSync(clientPath, "utf8");

const required = [
  '"functions" | "scenarios" | "automation" | "tools"',
  'functions: "기능 명세"',
  'scenarios: "테스트 시나리오"',
  'automation: "자동화 현황"',
  'tools: "개발 도구"',
  '정상 항목은 배지 없이 표시합니다.',
  'function AutomationOverview',
  'function ToolSummary',
  'entry.area === "테스트 환경"',
];

for (const token of required) {
  if (!source.includes(token)) {
    throw new Error(`Functions structure token missing: ${token}`);
  }
}

if (source.includes('tone="success" size="sm"><ShieldCheck')) {
  throw new Error("Always-visible production success badge must be removed.");
}

if (!source.includes('attentionLabel(entry.automationStatus) ?? "연결됨"')) {
  throw new Error("Automation status fallback is missing.");
}

console.log("[PASS] functions catalog structure contract");
