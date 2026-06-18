#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/functions/company-scenarios.json"), "utf8"));
const samples = Number(process.env.WAFL_PERFORMANCE_SAMPLES ?? 25);
const report = [];

function percentile(values, p) {
  const sorted = [...values].sort((a,b)=>a-b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;
}
for (const company of fixture.companies) {
  const timings=[];
  for (let i=0;i<samples;i++) {
    const started=performance.now();
    const rows=Array.from({length:company.workorders},(_,index)=>({id:`${company.id}-wo-${index}`,name:`작업지시서 ${index}`,status:index%4}));
    rows.filter((row)=>row.name.includes("9")).sort((a,b)=>a.id.localeCompare(b.id));
    timings.push(performance.now()-started);
  }
  report.push({companyId:company.id,scale:company.scale,rows:company.workorders,p50Ms:+percentile(timings,.5).toFixed(3),p95Ms:+percentile(timings,.95).toFixed(3),samples});
}
const output={schemaVersion:"1.0",measuredAt:new Date().toISOString(),kind:"fixture-processing-baseline",note:"브라우저/API 실측이 아닌 fixture 생성·검색·정렬 로컬 기준선",report};
const outPath=path.join(root,"artifacts/test-reports/functions/performance-latest.json");
fs.mkdirSync(path.dirname(outPath),{recursive:true});
fs.writeFileSync(outPath,JSON.stringify(output,null,2)+"\n");
console.log(JSON.stringify(output,null,2));
