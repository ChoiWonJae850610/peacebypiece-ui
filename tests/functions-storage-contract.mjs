#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const fixture=JSON.parse(fs.readFileSync(path.join(root,"tests/fixtures/functions/company-scenarios.json"),"utf8"));
const percent=(used,quota)=>quota<=0?0:Math.min(100,Math.max(0,(used/quota)*100));
assert.equal(fixture.companies.length,10);
const expected=[0,5,15,30,50,70,90,99,100,100];
fixture.companies.forEach((company,index)=>{
  const storage=company.storage;
  assert.ok(storage.objectPrefix.startsWith(`wafl-functions/${company.id}/`));
  assert.equal(Math.round(percent(storage.usedBytes,storage.quotaBytes)),expected[index]);
  assert.equal(storage.expectedClampedPercent,expected[index]);
});
assert.equal(new Set(fixture.companies.map(c=>c.storage.objectPrefix)).size,10);
console.log(`functions storage contract passed: companies=${fixture.companies.length} range=0..100 clamp=verified tenant-prefix=isolated`);
