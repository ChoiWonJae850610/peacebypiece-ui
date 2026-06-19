import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("app/(public)/service-paused/page.tsx", "utf8");

assert.match(source, /import \{ redirect \} from "next\/navigation";/);
assert.match(source, /accessState\.workspaceBlockedReason === null/);
assert.match(source, /redirect\("\/workspace"\)/);
assert.ok(source.indexOf('accessState.workspaceBlockedReason === null') < source.indexOf('const viewModel = buildServicePausedViewModel'), '정상 회사 redirect는 unknown view model 생성보다 먼저 실행되어야 합니다.');

console.log("PASS service-paused normal company recovery contract");
