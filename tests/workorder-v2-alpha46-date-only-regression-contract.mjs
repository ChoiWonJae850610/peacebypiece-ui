import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

import { isIsoCalendarDate, serializePostgresDateOnly } from "../lib/domain/work-orders/dateOnly.mjs";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

for (const value of ["2026-09-30", "2028-02-29", "2026-12-31", "2027-01-01"]) {
  assert.equal(isIsoCalendarDate(value), true, value);
  assert.equal(serializePostgresDateOnly(value), value);
}
for (const value of ["2026-02-29", "2026-09-31", "2026-13-01", "0000-01-01", "2026-9-30", "not-a-date"]) {
  assert.equal(isIsoCalendarDate(value), false, value);
  assert.throws(() => serializePostgresDateOnly(value), /WORK_ORDER_INVALID_DATE_ONLY/);
}
assert.equal(serializePostgresDateOnly(null), null);
assert.throws(() => serializePostgresDateOnly(new Date("2026-09-30T00:00:00.000Z")), /WORK_ORDER_INVALID_DATE_ONLY/);

const helperUrl = pathToFileURL(path.join(root, "lib/domain/work-orders/dateOnly.mjs")).href;
for (const timezone of ["UTC", "Asia/Seoul"]) {
  const child = spawnSync(process.execPath, ["--input-type=module", "-e",
    `import { serializePostgresDateOnly } from ${JSON.stringify(helperUrl)}; process.stdout.write(serializePostgresDateOnly("2026-09-30"));`,
  ], { encoding: "utf8", env: { ...process.env, TZ: timezone } });
  assert.equal(child.status, 0, child.stderr);
  assert.equal(child.stdout, "2026-09-30", timezone);
}

const list = read("lib/domain/work-orders/read/listRepository.ts");
const detail = read("lib/domain/work-orders/read/detailRepository.ts");
const command = read("lib/domain/work-orders/command/commandRepository.ts");
const issue = read("lib/domain/work-orders/command/issueRepository.ts");
const preview = read("lib/domain/work-orders/read/previewRepository.ts");
const validation = read("lib/domain/work-orders/command/validation.ts");
const mobile = read("apps/mobile/components/MobileWorkOrderApp.tsx");

assert.match(list, /w\.due_date::text AS due_date/);
assert.match(detail, /w\.due_date::text AS due_date/);
assert.match(detail, /p\.due_date::text AS due_date/);
assert.match(command, /w\.due_date::text AS due_date/);
assert.match(command, /due_date_snapshot::text AS due_date/);
assert.match(issue, /w\.due_date::text AS due_date/);
assert.match(issue, /::date::text AS business_date/);
assert.match(preview, /due_date_snapshot::text AS due_date_snapshot/);
assert.match(preview, /due_date::text AS due_date/);

for (const [name, source] of Object.entries({ list, detail, command, issue, preview, validation, mobile })) {
  assert.doesNotMatch(source, /toISOString\(\)\.slice\(0,\s*10\)/, name);
}
assert.match(detail, /new Date\(String\(value\)\)\.toISOString\(\)/, "timestamp mapper remains ISO datetime");
assert.match(mobile, /patch\.dueDate = dueDate/);
assert.match(mobile, /dueDate: refreshed\.header\.dueDate/);

console.log("workorder v2 alpha.46 date-only regression contract: PASS");
