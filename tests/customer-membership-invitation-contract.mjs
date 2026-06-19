import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const invitationPage = read("app/(workspace)/workspace/invites/page.tsx");
const policy = read("lib/invitations/invitationPolicy.ts");
const repository = read("lib/invitations/invitationRepository.ts");
const route = read("lib/invitations/api/invitationRouteHandlers.ts");
const dashboard = read("components/admin/members/AdminMemberManagementDashboard.tsx");

assert.match(invitationPage, /redirect\("\/workspace\/members\?section=invitations"\)/);
assert.doesNotMatch(invitationPage, /CompanyMemberInviteSkeleton/);
assert.match(policy, /"viewer"/);
assert.match(repository, /INVITATION_ACTIVE_DUPLICATE/);
assert.match(repository, /expires_at > now\(\)/);
assert.match(repository, /lower\(recipient_email\) = lower\(\$2\)/);
assert.match(route, /status: 409/);
assert.match(dashboard, /기존 초대를 취소하거나 만료된 뒤 다시 생성/);

console.log("customer membership invitation contract: ok");
