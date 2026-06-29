import assert from "node:assert/strict";
import fs from "node:fs";

const session = fs.readFileSync("lib/signup/signupApplicantSession.ts", "utf8");
const dashboard = fs.readFileSync("components/signup/SignupApplicationDashboard.tsx", "utf8");
const service = fs.readFileSync("lib/signup/signupApplicationApiService.ts", "utf8");
const apiRoute = fs.readFileSync("app/api/signup/application/route.ts", "utf8");
const currentSession = fs.readFileSync("lib/signup/currentSignupApplicantSession.ts", "utf8");

assert.ok(session.includes("onboardingState"), "cookie may retain onboardingState only as a display hint");
assert.ok(dashboard.includes("const status = application?.status ?? \"verified_identity\""), "UI must derive status from DB application result first");
assert.ok(apiRoute.includes("getOwnedSignupApplication(session)"), "status must come from repository ownership check");
assert.ok(service.includes("findApplicantOwnedApplication"), "service must re-check applicant ownership");
assert.ok(currentSession.includes("googleSub: session.googleSub"));
assert.ok(currentSession.includes("emailNormalized: session.emailNormalized"));
assert.doesNotMatch(dashboard, /onboardingState/);
assert.doesNotMatch(service, /session\.onboardingState.*status|status.*session\.onboardingState/);
assert.doesNotMatch(apiRoute, /payload\.status|payload\.googleSub|payload\.emailVerified|payload\.applicationId/);

console.log("signup applicant state source contract: OK");
