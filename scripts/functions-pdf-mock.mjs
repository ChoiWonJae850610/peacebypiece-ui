import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const fixture = JSON.parse(await readFile(new URL("../tests/fixtures/functions/pdf-policy-scenarios.json", import.meta.url), "utf8"));
const result = {
  generatedAt: new Date().toISOString(),
  mode: "mock-contract-only",
  productionOutput: false,
  documents: fixture.documents.map((document) => ({
    id: document.id,
    status: "decision-required",
    pendingDecisions: document.pendingDecisionIds,
    currentFacts: document.currentFacts,
    mapperStatus: "mock-only",
    validatorStatus: "contract-ready",
  })),
};
const reportsDir = path.resolve("reports");
await mkdir(reportsDir, { recursive: true });
const output = path.join(reportsDir, "functions-pdf-contract-latest.json");
await writeFile(output, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(`functions pdf mock contract written: ${output}`);
