#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const dashboard = fs.readFileSync("components/signup/SignupApplicationDashboard.tsx", "utf8");
const applicationRoute = fs.readFileSync("app/api/signup/application/route.ts", "utf8");
const certificateRoute = fs.readFileSync("app/api/signup/application/certificate/route.ts", "utf8");
const certificateService = fs.readFileSync("lib/signup/signupApplicationCertificateService.ts", "utf8");
const consentRoute = fs.readFileSync("app/api/signup/application/consents/route.ts", "utf8");
const reviewRepository = fs.readFileSync("lib/system/signupReviewRepository.ts", "utf8");

assert.match(applicationRoute, /if \(!session\.applicationId\)/, "application GET must explicitly handle applicant without application");
assert.match(applicationRoute, /application:\s*null/, "applicant-without-application must return application null");
assert.match(applicationRoute, /setApplicantSessionApplicationId/, "first draft save must refresh applicationId session cookie");

assert.match(certificateRoute, /if \(!session\.applicationId\)/, "certificate GET must detect missing applicationId");
assert.match(certificateRoute, /certificate:\s*null/, "certificate GET without application must return null certificate");
assert.match(certificateRoute, /ok:\s*true/, "certificate GET without application must be a successful empty state");
assert.match(certificateService, /applicationIdRequired/, "certificate mutations must still require an applicationId");

assert.match(consentRoute, /session\.applicationId \? await listOwnedSignupConsents\(session\) : \[\]/, "consent GET must be safe before application creation");
assert.match(dashboard, /const nextApplicant = payload\.applicant \?\? null/);
assert.match(dashboard, /const nextApplication = payload\.application \?\? null/);
assert.match(dashboard, /setApplicant\(nextApplicant\)/);
assert.match(dashboard, /setApplication\(nextApplication\)/);
assert.doesNotMatch(dashboard, /catch \(nextError\)[\s\S]{0,240}setApplicant\(null\)/, "application load errors must not force applicant CTA loop");
assert.match(dashboard, /setConsentError/);
assert.match(dashboard, /setCertificateError/);
assert.match(dashboard, /applyConsentPayload\(await fetchConsents\(\)\)/);
assert.match(dashboard, /const certificatePayload = await fetchCertificate\(\)/);
assert.match(dashboard, /if \(!application\)[\s\S]{0,260}saveApplicationDraft\(\)/, "certificate upload must create the first draft automatically");
assert.match(dashboard, /uploadCertificate\(file\)/, "certificate selection must upload immediately through the guarded flow");
assert.match(dashboard, /disabled=\{isBusy \|\| !companyInfoValid\}/, "file input must wait for required company information");
assert.doesNotMatch(dashboard, /selectedCertificateFile/, "manual certificate staging state must not return");

assert.match(reviewRepository, /SIGNUP_REVIEW_DEFAULT_STATUSES[\s\S]*"submitted"[\s\S]*"reviewing"[\s\S]*"changes_requested"/, "submitted/reviewing/changes_requested must be the default system-admin queue");
assert.doesNotMatch(reviewRepository, /SIGNUP_REVIEW_DEFAULT_STATUSES[\s\S]*"draft"/, "draft must not enter the default review queue");

console.log("public signup first-draft contract: PASS");
