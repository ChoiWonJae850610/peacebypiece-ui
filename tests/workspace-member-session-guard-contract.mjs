import assert from "node:assert/strict";
import fs from "node:fs";

const guard = fs.readFileSync("lib/auth/apiRouteGuards.ts", "utf8");
const repository = fs.readFileSync("lib/admin/members/memberRepository.ts", "utf8");
const types = fs.readFileSync("lib/admin/members/memberTypes.ts", "utf8");

assert.match(types, /getCompanyMember\(input:/, "repository contract must expose direct member lookup");
assert.match(repository, /company_members\.id = \$1[\s\S]*company_members\.company_id = \$2/, "member lookup must be tenant scoped");
assert.match(guard, /member\.userId !== session\.userId/, "member session must match the signed-in user");
assert.match(guard, /member\.status !== "approved"/, "non-approved members must be blocked");
assert.match(guard, /WORKSPACE_MEMBER_SESSION_INVALID/, "invalid member sessions need a stable API error code");
assert.doesNotMatch(guard, /limit:\s*200/, "permission lookup must not depend on a truncated company member list");

console.log("workspace member session guard contract: ok");
