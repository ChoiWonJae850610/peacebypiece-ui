#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "scripts/functions-environment-audit.mjs"), "utf8");
const fixture = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/functions/company-scenarios.json"), "utf8"));

assert.equal(fixture.idPrefix, "wafl-fn", "테스트 회사 prefix는 wafl-fn이어야 합니다.");
assert.match(source, /runtime ===? "production"|runtime\) && runtime !== "production"/, "production 실행 차단 검사가 필요합니다.");
assert.match(source, /비밀번호와 query는 출력하지 않습니다/, "DB secret 비출력 계약이 필요합니다.");
assert.match(source, /WAFL_FUNCTIONS_TEST_R2_PREFIX/, "R2 테스트 prefix 검사가 필요합니다.");
assert.match(source, /DB\/R2에 접속하거나 데이터를 생성·수정·삭제하지 않습니다/, "비변경 감사 계약이 필요합니다.");
assert.match(source, /DB mutation 직전에 의도적으로 중단/, "seed adapter 미연결 상태를 명시해야 합니다.");
assert.match(source, /cleanup도 실제 DB\/R2 삭제 adapter가 연결되지 않았습니다/, "cleanup adapter 미연결 상태를 명시해야 합니다.");

console.log("functions environment audit contract passed: runtime/db/r2/session/prefix/no-mutation");
