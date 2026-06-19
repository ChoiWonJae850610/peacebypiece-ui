import assert from "node:assert/strict";
import fs from "node:fs";

const seed = fs.readFileSync("tools/simulator/commands/db-data.mjs", "utf8");
const schema = fs.readFileSync("db/schema/full_reset.sql", "utf8");

assert.ok(schema.includes("phone_source IN ('google', 'user', 'invitation')"));
assert.ok(seed.includes("VALUES ($1,$2,$3,$4,$5,'user',$6,$7)"));
assert.ok(!seed.includes("'simulator_seed'"));

console.log("PASS Simulator user phone source contract");
