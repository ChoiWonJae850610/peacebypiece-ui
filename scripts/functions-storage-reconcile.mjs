#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const fixture=JSON.parse(fs.readFileSync(path.join(root,"tests/fixtures/functions/company-scenarios.json"),"utf8"));
const runtime=String(process.env.NEXT_PUBLIC_APP_RUNTIME_MODE??process.env.NODE_ENV??"").toLowerCase();
const allowed=new Set(fixture.runtime);
const execute=process.argv.includes("--execute");
if(execute && (!allowed.has(runtime)||runtime==="production")) throw new Error(`execution blocked: runtime=${runtime||"unset"}`);
console.log(`WAFL storage reconcile mode=${execute?"execute":"dry-run"} runtime=${runtime||"unset"}`);
for(const company of fixture.companies){
  console.log(JSON.stringify({companyId:company.id,prefix:company.storage.objectPrefix,dbUsedBytes:company.storage.usedBytes,quotaBytes:company.storage.quotaBytes,action:execute?"adapter-required-no-mutation":"compare-r2-sum-with-db"}));
}
console.log("No R2 or DB changes were executed. Actual adapter remains environment-restricted.");
