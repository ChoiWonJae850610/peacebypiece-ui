#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const signupPage = fs.readFileSync("app/(public)/signup/page.tsx", "utf8");
const loginPage = fs.readFileSync("components/auth/WaflLoginPage.tsx", "utf8");
const readinessApi = fs.readFileSync("app/api/system/signup/applications/[applicationId]/payment-readiness/route.ts", "utf8");
const migration = fs.readFileSync("db/migrations/patch_0_24_33_public_signup_e2e.sql", "utf8");
const provisioning = fs.readFileSync("lib/signup/signupApplicationProvisioningRepository.ts", "utf8");
const readinessRepo = fs.readFileSync("lib/billing/signupPaymentReadinessRepository.ts", "utf8");
const roadmap = fs.readFileSync("lib/internal/roadmap/roadmap-0.24.33.ts", "utf8");
const playwright = fs.readFileSync("tests/e2e/public-signup-e2e.spec.mjs", "utf8");

assert.match(signupPage, /7일 무료로/, "public signup page must expose the canonical CTA");
assert.match(signupPage, /\/api\/auth\/google\/start\?intent=signup/, "public signup must start Google signup intent");
assert.match(signupPage, /100MB/, "public signup must show Trial storage");
assert.match(signupPage, /멤버 3명/, "public signup must show Trial member limit");
assert.match(signupPage, /\/login/, "public signup must separate existing login");
assert.match(loginPage, /href="\/signup"/, "login page must send new companies to /signup");
assert.doesNotMatch(loginPage, /intent=signup/, "login page must not bypass the public signup page");

assert.match(migration, /CREATE TABLE IF NOT EXISTS signup_payment_method_references/, "0.24.33 migration must add application-scoped readiness");
assert.match(migration, /application_id text NOT NULL REFERENCES signup_applications/, "readiness must belong to a signup application before company creation");
assert.match(migration, /fake_dev_test/, "dev/test readiness must be explicitly simulator scoped");
assert.match(migration, /no_fake_production_ready_check/, "fake readiness must not be production-ready");
assert.match(migration, /no_raw_card_check/, "raw card data must be blocked by the migration");

assert.match(readinessApi, /requireSystemAdminScope/, "readiness API must require actual system-admin");
assert.match(readinessApi, /isSameOrigin/, "readiness API mutations must require same-origin");
assert.match(readinessApi, /isServerProductionRuntime/, "fake readiness must be production-blocked");
assert.match(readinessApi, /getSignupReviewApplicationDetail/, "readiness API must reject invalid applications");
assert.doesNotMatch(readinessApi, /paymentMethodReference|providerCustomerReference/, "readiness API response must not expose raw provider references");

assert.match(provisioning, /signup_payment_method_references/, "provisioning must check application-scoped readiness");
assert.match(provisioning, /copySignupReadinessToCompanyPaymentReference/, "approval must copy safe readiness evidence to company billing");
assert.match(readinessRepo, /ON CONFLICT \(idempotency_key\)/, "readiness upsert must be idempotent");
assert.match(readinessRepo, /company_payment_method_references/, "approval copy must target company billing reference");

assert.match(roadmap, /Public Signup End-to-End UX/, "0.24.33 roadmap must define the official work");
assert.match(roadmap, /actual PG integration false/i, "0.24.33 must not connect a real PG provider");
assert.match(roadmap, /actual email delivery false/i, "0.24.33 must not send real email");
assert.match(playwright, /\/login/, "browser E2E must start from login");
assert.match(playwright, /\/signup/, "browser E2E must visit public signup");
assert.match(playwright, /7일 무료로 시작하기/, "browser E2E must click the public Trial CTA");
assert.match(playwright, /Google로 가입 신청 시작/, "browser E2E must verify the signup OAuth CTA");

console.log("public signup e2e UX contract: OK");
